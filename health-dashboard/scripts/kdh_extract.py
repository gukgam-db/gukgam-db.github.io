# -*- coding: utf-8 -*-
"""
김동현 교수(한림대) 「지역사회 건강결과 및 건강 결정요인 DB 1.7v.xlsx」 → 정리본 (공개 저장소에 원본·산출물 커밋 금지)

사용법: KDH_XLSX=/경로/DB1.7v.xlsx python scripts/kdh_extract.py
산출: data/kdh/catalog.csv            지표 카탈로그(2,507개: 대/중/소분류·정의·단위·기관·통계명·지역수준)
      data/kdh/values_<연도>.csv       연도 시트 long 형식 (code, 시도, 시군구, 지표, 값)
      data/kdh/summary.json           연도별 행·열·채움 현황
"""
import os, sys, csv, json, collections
from pathlib import Path
import openpyxl

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "data" / "kdh"; OUT.mkdir(parents=True, exist_ok=True)
SRC = os.environ.get("KDH_XLSX")
if not SRC or not Path(SRC).exists(): sys.exit("KDH_XLSX 환경변수로 엑셀 경로를 지정하세요")
wb = openpyxl.load_workbook(SRC, read_only=True, data_only=True)

# 카탈로그
ws = wb["DATA설명"]; rows = list(ws.iter_rows(values_only=True)); H = rows[0]
idx = {h: i for i, h in enumerate(H) if h}
cur = {}; cat = []
for r in rows[2:]:
    for k in ("대분류(재분류)", "중분류(재분류)", "소분류"):
        if r[idx[k]]: cur[k] = r[idx[k]]
    if not r[idx["지표명"]]: continue
    cat.append({"대분류": cur.get("대분류(재분류)"), "중분류": cur.get("중분류(재분류)"), "소분류": cur.get("소분류"), "지표명": r[idx["지표명"]],
                "정의": r[idx["정의"]], "단위": r[idx["단위"]], "자료생산기관": r[idx["자료생산기관"]], "통계명": r[idx["통계명"]],
                "승인통계": r[idx["승인통계여부"]], "지표유형": r[idx["지표유형"]], "전국": bool(r[12]), "시도": bool(r[13]), "시군구": bool(r[14]),
                "연도": "".join("O" if r[15 + k] else "-" for k in range(17))})
with open(OUT / "catalog.csv", "w", newline="", encoding="utf-8-sig") as f:
    w = csv.DictWriter(f, fieldnames=list(cat[0].keys())); w.writeheader(); w.writerows(cat)
print("카탈로그", len(cat))

def sheet_rows(y):
    it = wb[str(y)].iter_rows(values_only=True); first = next(it)
    hdr = first if first[0] == "번호" else next(it)
    if hdr[0] != "번호": hdr = next(it)
    hdr = [str(h).strip() if h is not None else "" for h in hdr]
    return hdr, [r for r in it if r and r[0] is not None]

summary = {}
for y in range(2008, 2025):
    hdr, data = sheet_rows(y)
    n = 0
    with open(OUT / f"values_{y}.csv", "w", newline="", encoding="utf-8-sig") as f:
        w = csv.writer(f); w.writerow(["code", "시도", "시군구", "지역", "지표", "값"])
        for r in data:
            for i in range(6, len(hdr)):
                if hdr[i] and r[i] not in (None, "", "   "):
                    w.writerow([str(r[1]).strip(), r[2], r[3], r[4], hdr[i], r[i]]); n += 1
    summary[y] = {"rows": len(data), "cols": len(hdr), "values": n}
    print(y, summary[y])
json.dump(summary, open(OUT / "summary.json", "w"), ensure_ascii=False, indent=1)
