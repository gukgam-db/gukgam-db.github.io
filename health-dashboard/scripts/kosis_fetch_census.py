# -*- coding: utf-8 -*-
"""
지역박탈지수 산출용 2020 인구주택총조사 시군구 집계표 수집 (KOSIS, 재개 가능)
표: DT_1PM2001 교육정도(6세+) · DT_1PM2002 혼인상태(15세+) · DT_1PE2013 가구주 성별·세대구성 · DT_1PC2012 직업별 취업인구 · DT_1PE2002 거처종류·점유형태
행수 제한(약 4만) 때문에 분류 일부를 '계' 또는 필요한 코드 목록으로 고정(objL 값에 '+' 로 복수 코드).
사용법: python scripts/kosis_fetch_census.py [연도]
"""
import sys, re, json
sys.path.insert(0, str(__import__("pathlib").Path(__file__).resolve().parent))
import kosis_fetch_hle as K
YEAR = sys.argv[1] if len(sys.argv) > 1 else "2020"
# 연도별 표 ID (2020 = DT_1P?20xx, 2015 = DT_1P?15xx)
TABLES = {"2020": {"edu": "DT_1PM2001", "mar": "DT_1PM2002", "hh": "DT_1PE2013", "job": "DT_1PC2012", "dw": "DT_1PE2002"},
          "2015": {"edu": "DT_1PM1501", "mar": "DT_1PM1503", "hh": "DT_1PE1513", "job": "DT_1PC1512", "dw": "DT_1PE1502"}}[YEAR]
for t in TABLES.values(): K.PRDSE[t] = "F"   # 총조사 5년 주기 표

def codes(tbl, obj_nm_pat, name_pat=None, first=False):
    """ITM 메타에서 분류(OBJ_NM 정규식)의 코드 목록. name_pat 로 항목명 필터, first=True 면 첫 코드('계'). 분류가 없으면 None."""
    j = K.meta(tbl, "ITM")
    rows = [r for r in j if r["OBJ_ID"] != "ITEM" and re.search(obj_nm_pat, r["OBJ_NM"])]
    if not rows: print(f"  {tbl}: 분류 {obj_nm_pat} 없음(항목일 수 있음) → {sorted({r['OBJ_NM'] for r in j})}", flush=True); return None, None
    obj_id = rows[0]["OBJ_ID"]
    if first: return obj_id, rows[0]["ITM_ID"]
    sel = [r["ITM_ID"] for r in rows if (name_pat is None or re.search(name_pat, r["ITM_NM"]))]
    return obj_id, "+".join(sel)

def items(tbl, name_pat):
    j = K.meta(tbl, "ITM")
    return "+".join(r["ITM_ID"] for r in j if r["OBJ_ID"] == "ITEM" and re.search(name_pat, r["ITM_NM"]))

PLAN = {
 # 역할: (분류 고정 {OBJ_NM 정규식: (name_pat or None, first)}, 항목 선택 정규식 or None=ALL)
 "edu": ({"^성별": (None, True), "연령": (r"^(30|35|40|45|50|55|60)\s*[-~∼]", False)}, r"^내국인|^초등학교-계|^중학교-계|^고등학교-(재학|중퇴)|^받지"),
 "mar": ({"연령": (None, True)}, r"^내국인"),                       # 연령 합계 × 내국인 계·미혼·배우자·사별·이혼
 "hh": ({"세대구성": (r"^(일반가구|1인가구)$", False)}, r"^일반가구$"),   # 성별 계·남·여 × (전체, 1인가구)
 "job": ({"근무지|현거주지": (None, True)}, None),
 "dw": ({}, None),
}
for role, (fixes, itm_pat) in PLAN.items():
    tbl = TABLES[role]
    fix = {}
    for pat, (name_pat, first) in fixes.items():
        oid, val = codes(tbl, pat, name_pat, first)
        if oid: fix[oid] = val
    itm = items(tbl, itm_pat) if itm_pat else "ALL"
    print(tbl, "fix", {k: (v[:40] + "…" if len(v) > 40 else v) for k, v in fix.items()}, "itm", itm[:60], flush=True)
    K.data(tbl, int(YEAR), int(YEAR), itm=itm, fix=fix)
if YEAR == "2015": K.data("DT_1B040M5", 2015, 2015, fix={"SBB": "0"})   # 연앙인구 2015
print("ALL-DONE")
