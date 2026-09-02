#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
국정감사 자료 DB — 보건복지위원회 위원 프로필 수집기
- 열린국회정보 '국회의원 정보 통합 API'(ALLNAMEMBER)에서 보건복지위 소속 이력이 있는
  의원 중 현재 대수(기본 제22대) 당선자를 추려 사진·약력·정당·선수 등을 수집합니다.
- 답변 대비: 질의할 위원들의 프로필(사진·이력)을 한 화면에서 보기 위한 데이터입니다.

실행: ASSEMBLY_API_KEY=키 python3 scripts/gukgam/fetch_members.py
출력: data/gukgam/members.json
"""
import os, json, time, datetime
import urllib.request, urllib.parse

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, "data", "gukgam", "members.json")
KEY = os.environ.get("ASSEMBLY_API_KEY", "").strip()
ERA = os.environ.get("GUKGAM_ERA", "제22대")
COMMITTEE = os.environ.get("GUKGAM_COMMITTEE", "보건복지위원회")
UA = {"User-Agent": "Mozilla/5.0 (gukgam-db collector)"}


def call(page):
    q = {"Type": "json", "pIndex": page, "pSize": 100, "BLNG_CMIT_NM": COMMITTEE}
    if KEY:
        q["KEY"] = KEY
    url = "https://open.assembly.go.kr/portal/openapi/ALLNAMEMBER?" + urllib.parse.urlencode(q)
    req = urllib.request.Request(url, headers=UA)
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                d = json.loads(r.read().decode("utf-8"))
            body = d.get("ALLNAMEMBER")
            if not body:
                return [], 0
            return body[1].get("row", []), body[0]["head"][0]["list_total_count"]
        except Exception as e:
            if attempt < 2:
                time.sleep(3)
            else:
                print(f"page {page} 실패: {e}")
    return [], 0


def split_names(s):
    """'김도근, 김혜규' → ['김도근','김혜규']"""
    return [x.strip() for x in (s or "").replace("/", ",").split(",") if x.strip()]


def last(s):  # "정당A/정당B/정당C" → 최신값
    parts = [p.strip() for p in (s or "").split("/") if p.strip()]
    return parts[-1] if parts else ""


def main():
    if not KEY:
        print("※ ASSEMBLY_API_KEY 미설정 → 샘플(일부)만 수집될 수 있음")
    rows, page = [], 1
    while True:
        r, total = call(page)
        rows += r
        if not r or len(rows) >= total or page > 10:
            break
        page += 1
        time.sleep(0.6)
    cur = [r for r in rows if ERA in (r.get("GTELT_ERACO") or "")]
    items = []
    for r in cur:
        items.append({
            "name": r.get("NAAS_NM") or "",
            "hanja": r.get("NAAS_CH_NM") or "",
            "party": last(r.get("PLPT_NM")),
            "elecd": last(r.get("ELECD_NM")),
            "rlct": r.get("RLCT_DIV_NM") or "",
            "eras": r.get("GTELT_ERACO") or "",
            "duty": r.get("DTY_NM") or "",
            "photo": r.get("NAAS_PIC") or "",
            "brf": (r.get("BRF_HST") or "").strip(),
            "homepage": r.get("NAAS_HP_URL") or "",
            # 의원실 구성 — 국회 공식 홈페이지 의원 프로필에 실명 공개되는 항목
            "office": {
                "room": (r.get("OFFM_RNUM_NO") or "").strip(),
                "tel": (r.get("NAAS_TEL_NO") or "").strip(),
                "email": (r.get("NAAS_EMAIL_ADDR") or "").strip(),
                "aide": split_names(r.get("AIDE_NM")),
                "chief_secretary": split_names(r.get("CHF_SCRT_NM")),
                "secretary": split_names(r.get("SCRT_NM")),
            },
        })
    items.sort(key=lambda x: x["name"])
    out = {"updated": datetime.date.today().isoformat(), "era": ERA, "committee": COMMITTEE,
           "note": f"{ERA} 당선자 중 {COMMITTEE} 소속(이력 포함) — 열린국회정보 ALLNAMEMBER 기준. 임기 중 사보임은 반영이 늦을 수 있음.",
           "items": items}
    # 수집 실패로 급감 시 기존 유지
    if os.path.exists(OUT):
        try:
            with open(OUT, encoding="utf-8") as f:
                old = len(json.load(f).get("items", []))
            if old and len(items) < old * 0.5:
                print(f"수집 {len(items)}명 < 기존 {old}명의 절반 → 기존 파일 유지 (경고, 뒷단계는 계속)")
                return 0
        except Exception:
            pass
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
    print(f"완료: {ERA} {COMMITTEE} 위원 {len(items)}명 저장 (전체 조회 {len(rows)}명)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
