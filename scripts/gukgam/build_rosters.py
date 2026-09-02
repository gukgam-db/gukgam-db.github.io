#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
국정감사 자료 DB — 역대 보건복지위원회 위원 명단 (국감 연도별)

공식 '대수별 위원 명단' API는 없다. 열린국회정보 ALLNAMEMBER는 '보건복지위 소속 이력이 있는 의원'을
주되 어느 대수에 소속이었는지는 주지 않는다. 그래서 국감 회의록에 발언이 기록된 위원을 연도별로 세고,
ALLNAMEMBER(members-all.json)로 정당·지역구·사진을 붙인다. 국감에서 한 번도 발언하지 않은 위원은 빠질 수 있다
(화면에 그렇게 적는다). 제22대 현재 명단은 members.json(공식)이 따로 있다.

입력: remarks-{연도}.json, members.json, members-all.json(있으면)
출력: data/gukgam/rosters.json
"""
import os, io, re, json, glob, datetime, collections

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA = os.path.join(ROOT, "data", "gukgam")
OUT = os.path.join(DATA, "rosters.json")
JUNK = {"대리", "직무대리", "출석전문", "위원장", "위원"}   # 마커 오인식


SATELLITE = {  # 비례대표용 위성정당 — 합당 후 정당으로 표기 (괄호에 원 정당 남김)
    "더불어민주연합": "더불어민주당", "더불어시민당": "더불어민주당", "열린민주당": "더불어민주당",
    "국민의미래": "국민의힘", "미래한국당": "국민의힘", "미래통합당": "국민의힘",
}


def norm_party(p):
    p = (p or "").strip()
    return (SATELLITE[p] + "(" + p + ")") if p in SATELLITE else p


def era_of(year):
    y = int(year)
    if y >= 2024: return "제22대"
    if y >= 2020: return "제21대"
    if y >= 2016: return "제20대"
    if y >= 2012: return "제19대"
    return ""


def load(name, default):
    p = os.path.join(DATA, name)
    if not os.path.exists(p):
        return default
    with open(p, encoding="utf-8") as f:
        return json.load(f)


def main():
    cur = load("members.json", {}).get("items", [])
    allm = load("members-all.json", {}).get("items", [])
    # 이름 → 후보 목록 (동명이인은 대수로 가른다)
    by_name = collections.defaultdict(list)
    for m in allm + cur:
        by_name[m["name"]].append(m)

    def profile(name, era):
        cands = by_name.get(name, [])
        hit = [c for c in cands if era in (c.get("eras") or "")] or cands
        return hit[0] if hit else {}

    years = []
    for p in sorted(glob.glob(os.path.join(DATA, "remarks-20*.json")), reverse=True):
        d = load(os.path.basename(p), {})
        items = d.get("items", [])
        if not items:
            continue
        year = str(d.get("year") or os.path.basename(p)[8:12])
        era = era_of(year)
        agg = {}
        dates = set()
        for it in items:
            n = (it.get("member") or "").strip()
            if len(n) < 2 or n in JUNK or n.startswith(("대리", "참고인", "증인", "진술인", "출석")):   # 마커 오인식('◯위원장대리 ○○○', '◯참고인○○○')
                continue
            dates.add(it["date"])
            a = agg.setdefault(n, {"name": n, "turns": 0, "days": set(), "chair": 0, "acting": 0})
            a["turns"] += 1
            a["days"].add(it["date"])
            if it.get("role") == "위원장":
                a["chair"] += 1
            elif it.get("role") == "위원장대리":
                a["acting"] += 1
        members = []
        for n, a in agg.items():
            pr = profile(n, era)
            members.append({
                "name": n,
                "party": norm_party(pr.get("party")),
                "elecd": pr.get("elecd") or "",
                "rlct": pr.get("rlct") or "",
                "photo": pr.get("photo") or "",
                "turns": a["turns"],
                "days": len(a["days"]),
                "chair": a["chair"] >= 3,          # 위원장 마커로 3회 이상 발언 → 그해 위원장
                "acting": a["acting"] >= 3,        # 위원장 직무대리로 사회를 본 위원
            })
        members.sort(key=lambda x: (not x["chair"], -x["turns"], x["name"]))
        known = sum(1 for m in members if m["party"])
        years.append({"year": int(year), "era": era, "dates": sorted(dates), "count": len(members),
                      "party_known": known, "members": members})
        print(f"{year} ({era}): 위원 {len(members)}명 · 정당 확인 {known}명 · 국감 {len(dates)}일"
              + (f" · 위원장 {', '.join(m['name'] for m in members if m['chair'])}" if any(m['chair'] for m in members) else ""))

    out = {"updated": datetime.date.today().isoformat(),
           "note": "국정감사 회의록에 발언이 기록된 위원 기준. 국감에서 발언하지 않은 위원은 빠질 수 있음. 정당·지역구는 열린국회정보 ALLNAMEMBER(최근 소속) 기준. 위성정당은 합당 후 정당으로 표기.",
           "source_all": bool(allm), "years": years}
    with io.open(OUT, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
    print(f"완료: 국감 연도 {len(years)}개 → rosters.json" + ("" if allm else " (members-all.json 없음 — 정당은 제22대 현재 위원만 채움)"))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
