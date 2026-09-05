#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
국정감사 자료 DB — 특정 연도 전 상임위 국감 회의록 훑기 (1회성 조사용)

보건복지위 밖에서 한 발언(예: 2019년 조경태 의원의 SFTS 백신·치료제 질의)을 찾기 위해,
그 해 모든 상임위 국감 회의록을 내려받아 (1) 지정 위원의 발언 전부, (2) 지정 키워드가 든 발언 전부를 추린다.
결과는 data/gukgam/scan-{연도}.json (화면에는 안 붙고 조사 기록용) + 실행 로그.

실행: GUKGAM_SCAN_YEAR=2019 GUKGAM_SCAN_MEMBERS=조경태 GUKGAM_SCAN_KEYS='SFTS,중증열성,진드기' python3 scripts/gukgam/scan_year.py
"""
import os, io, re, json, sys, time, datetime

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA = os.path.join(ROOT, "data", "gukgam")
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build_kdca_qa as K
import build_remarks as R

YEAR = os.environ.get("GUKGAM_SCAN_YEAR", "").strip()
MEMBERS = [m.strip() for m in os.environ.get("GUKGAM_SCAN_MEMBERS", "").split(",") if m.strip()]
KEYS = [k.strip() for k in os.environ.get("GUKGAM_SCAN_KEYS", "SFTS,중증열성,진드기").split(",") if k.strip()]


def main():
    if not YEAR:
        print("GUKGAM_SCAN_YEAR 필요"); return 0
    pat = re.compile("|".join(r"\s*".join(map(re.escape, k)) for k in KEYS), re.I)   # 공백 무시 매칭
    minutes = [x for x in K.load("minutes.json")["items"] if (x.get("date") or "").startswith(YEAR) and x.get("url")]
    minutes.sort(key=lambda x: (x["committee"], x["date"]))
    print("%s년 국감 회의록 %d건 (전 상임위) 훑기 — 위원 %s · 키워드 %s" % (YEAR, len(minutes), MEMBERS or "지정 없음", KEYS))
    hits, by_member, failed, streak = [], [], 0, 0
    for i, mt in enumerate(minutes, 1):
        t0 = time.time()
        try:
            got = R.extract(K.pdf_text(mt["url"]), mt["date"])
        except Exception as e:
            failed += 1; streak += 1
            print("  %s %s 실패: %s" % (mt["committee"], mt["date"], e))
            if streak >= 5:
                print("연속 5건 실패 → 중단"); break
            continue
        streak = 0
        n_m = n_k = 0
        for g in got:
            g["committee"] = mt["committee"]; g["minutes_url"] = mt["url"]
            if g["member"] in MEMBERS:
                by_member.append(g); n_m += 1
            if pat.search(g["text"]):
                hits.append(g); n_k += 1
        print("  [%d/%d] %s %s: 발언 %d · 지정 위원 %d · 키워드 %d (%.0f초)" % (i, len(minutes), mt["committee"], mt["date"], len(got), n_m, n_k, time.time() - t0))
        time.sleep(1)
    out = {"updated": datetime.date.today().isoformat(), "year": int(YEAR), "members": MEMBERS, "keys": KEYS,
           "minutes": len(minutes), "failed": failed, "member_remarks": by_member, "keyword_hits": hits}
    with io.open(os.path.join(DATA, "scan-%s.json" % YEAR), "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=0)
    print("완료: 지정 위원 발언 %d건 · 키워드 발언 %d건 · 실패 %d건" % (len(by_member), len(hits), failed))
    for g in hits[:40]:
        m = pat.search(g["text"]); s = g["text"][max(0, m.start() - 60):m.start() + 100].replace("\n", " ")
        print("  ▶ %s %s %s %s | %s" % (g["date"], g["committee"], g["member"], g["role"], s))
    for g in by_member:
        if pat.search(g["text"]):
            print("  ★ 지정 위원 + 키워드: %s %s | %s" % (g["date"], g["committee"], g["text"][:200].replace("\n", " ")))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
