#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
국정감사 자료 DB — 질병관리청 이슈 연대기 데이터 생성
- kdca-qa.json(질의 1,100여 건)을 연도×이슈로 집계하고, 질의 위원의 정당을
  '그 해의 여당'과 대조해 여/야 질의 수로 나눕니다.
- 여당 판정: 대통령 소속 정당 계열 기준 (2020~2021 민주당계, 2022~2024 국민의힘계, 2025~ 민주당계).
  위성정당은 모정당 계열로 봅니다. 그 외(정의당·조국혁신당·무소속 등)는 야당으로 집계.
- 위원 정당은 국회의원 통합 API(보건복지위 소속 이력자 전체)에서 조회합니다.

실행: ASSEMBLY_API_KEY=키 python3 scripts/gukgam/build_timeline.py            # 질병청(기본)
      GUKGAM_TL_AGENCY=mohw ASSEMBLY_API_KEY=키 python3 scripts/gukgam/build_timeline.py  # 복지부
      GUKGAM_TL_AGENCY=mfds ASSEMBLY_API_KEY=키 python3 scripts/gukgam/build_timeline.py  # 식약처
출력: data/gukgam/kdca-timeline.json / mohw-timeline.json / mfds-timeline.json
"""
import os, json, time, datetime
import urllib.request, urllib.parse

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA = os.path.join(ROOT, "data", "gukgam")
AGENCY = os.environ.get("GUKGAM_TL_AGENCY", "kdca")
OUT = os.path.join(DATA, f"{AGENCY}-timeline.json")
KEY = os.environ.get("ASSEMBLY_API_KEY", "").strip()
UA = {"User-Agent": "Mozilla/5.0 (gukgam-db collector)"}

DEM = ("더불어민주당", "더불어민주연합", "민주통합당", "열린민주당")
PPP = ("국민의힘", "국민의미래", "미래통합당", "새누리당", "자유한국당")


def ruling_side(year):
    return "dem" if (year <= 2021 or year >= 2025) else "ppp"


def party_side(party):
    if any(p in party for p in DEM):
        return "dem"
    if any(p in party for p in PPP):
        return "ppp"
    return "etc"


def fetch_parties():
    """보건복지위 소속 이력 의원 전체(약 250명)의 이름→최근 정당 맵."""
    m, page = {}, 1
    while page <= 5:
        q = {"Type": "json", "pIndex": page, "pSize": 100, "BLNG_CMIT_NM": "보건복지위원회"}
        if KEY:
            q["KEY"] = KEY
        url = "https://open.assembly.go.kr/portal/openapi/ALLNAMEMBER?" + urllib.parse.urlencode(q)
        body = None
        for attempt in range(4):
            try:
                with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30) as r:
                    body = json.loads(r.read().decode("utf-8")).get("ALLNAMEMBER")
                break
            except Exception:
                time.sleep(2 * (attempt + 1))
        rows = body[1].get("row", []) if body else []
        if not rows:
            break
        for r in rows:
            name = r.get("NAAS_NM") or ""
            parts = [p.strip() for p in (r.get("PLPT_NM") or "").split("/") if p.strip()]
            if name and parts:
                m[name] = parts[-1]
        total = body[0]["head"][0]["list_total_count"]
        if page * 100 >= total:
            break
        page += 1
        time.sleep(0.6)
    return m


def fetch_party_by_name(name):
    """위원회 필터에 안 잡힌 의원(과거 소속) 개별 조회. 21·22대 당선자를 우선 채택."""
    q = {"Type": "json", "pIndex": 1, "pSize": 10, "NAAS_NM": name}
    if KEY:
        q["KEY"] = KEY
    url = "https://open.assembly.go.kr/portal/openapi/ALLNAMEMBER?" + urllib.parse.urlencode(q)
    for attempt in range(4):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30) as r:
                body = json.loads(r.read().decode("utf-8")).get("ALLNAMEMBER")
            rows = body[1].get("row", []) if body else []
            rows.sort(key=lambda x: ("제21대" in (x.get("GTELT_ERACO") or "")) +
                                    ("제22대" in (x.get("GTELT_ERACO") or "")), reverse=True)
            for row in rows:
                parts = [p.strip() for p in (row.get("PLPT_NM") or "").split("/") if p.strip()]
                if parts:
                    return parts[-1]
            return None
        except Exception:
            time.sleep(2 * (attempt + 1))
    return None


def load_qa():
    if AGENCY in ("kdca", "mfds"):
        with open(os.path.join(DATA, f"{AGENCY}-qa.json"), encoding="utf-8") as f:
            return json.load(f)["items"]
    # mohw: 연도별 샤드 병합
    import glob
    items = []
    for p in sorted(glob.glob(os.path.join(DATA, "mohw-qa-2*.json"))):
        with open(p, encoding="utf-8") as f:
            items += json.load(f)["items"]
    return items


def main():
    qa = load_qa()
    parties = fetch_parties()
    print(f"정당 맵 {len(parties)}명 확보")
    for name in sorted({i["member"] for i in qa} - set(parties)):
        p = fetch_party_by_name(name)
        if p:
            parties[name] = p
        time.sleep(0.5)
    print(f"개별 조회 후 {len(parties)}명")

    # 이슈(질의에 달린 모든 주제 태그) × 연도 × 여야 집계
    agg, totals, unknown = {}, {}, set()
    for item in qa:
        year = item["year"]
        party = parties.get(item["member"])
        if not party:
            unknown.add(item["member"])
            continue
        side = party_side(party)
        who = "ruling" if (side != "etc" and side == ruling_side(year)) else "opp"
        for topic in (item.get("topics") or []):
            cell = agg.setdefault(topic, {}).setdefault(year, {"ruling": 0, "opp": 0})
            cell[who] += 1
            totals[topic] = totals.get(topic, 0) + 1

    top = [t for t, _ in sorted(totals.items(), key=lambda x: -x[1])[:6]]
    years = sorted({i["year"] for i in qa})
    out = {
        "updated": datetime.date.today().isoformat(),
        "note": "여당=그 해 대통령 소속 정당 계열(위성정당 포함). 그 외 정당·무소속 질의는 야당으로 집계.",
        "years": years,
        "ruling": {str(y): ("민주당계" if ruling_side(y) == "dem" else "국민의힘계") for y in years},
        "issues": [{"name": t, "total": totals[t],
                    "cells": {str(y): agg[t].get(y, {"ruling": 0, "opp": 0}) for y in years}}
                   for t in top],
    }
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
    if unknown:
        print(f"정당 미확인 위원 {len(unknown)}명 제외: {sorted(unknown)[:8]}…")
    print(f"완료: 이슈 {len(top)}개 × 연도 {len(years)}개 집계")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
