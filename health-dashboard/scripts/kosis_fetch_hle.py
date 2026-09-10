# -*- coding: utf-8 -*-
"""
건강수명 산출용 KOSIS 원본 수집 (재개 가능, 호출 간격 5초 + 백오프)

수집 표(모두 통계청 orgId 101):
  DT_1B41    간이생명표(5세별) 전국            2005~
  DT_1B44    시도별 간이생명표(5세별)          2005~
  DT_1B46    건강수준별 기대여명(유병기간 제외·주관적 건강평가) 2012~
  DT_1B80A18 시군구/성/연령(5세)별 사망자수·사망률  1997~
  DT_1B040M5 시군구/성/연령(5세)별 주민등록연앙인구
  DT_1B040M5_1 (2023~ 행정구역 기준)
산출: data/raw_hle/<TBL>_<y0>_<y1>.json, 메타는 data/raw_hle/meta_<TBL>_<TYPE>.json
사용법: python scripts/kosis_fetch_hle.py [meta|data|search <검색어>...]
"""
import os, sys, json, time
from pathlib import Path
import requests

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "data" / "raw_hle"; OUT.mkdir(parents=True, exist_ok=True)
for line in (ROOT / ".env").read_text(encoding="utf-8").splitlines():
    if "=" in line and not line.strip().startswith("#"):
        k, v = line.split("=", 1); os.environ.setdefault(k.strip(), v.strip())
KEY = os.environ["KOSIS_API_KEY"]
S = requests.Session(); PACE = 5.0
PRDSE = {"DT_1B44": "F", "DT_1B46": "F"}

def call(url, params, tries=8):
    last = None
    for i in range(tries):
        try:
            r = S.get(url, params=params, timeout=180); j = r.json(); time.sleep(PACE); return j
        except Exception as e:
            last = e; w = min(300, 20 * (2 ** i)); print(f"  retry {i} {type(e).__name__} wait {w}s", flush=True); time.sleep(w)
    raise RuntimeError(f"소진: {last}")

def meta(tbl, typ):
    f = OUT / f"meta_{tbl}_{typ}.json"
    if f.exists() and f.stat().st_size > 10: return json.loads(f.read_text(encoding="utf-8"))
    j = call("https://kosis.kr/openapi/statisticsData.do", {"method": "getMeta", "apiKey": KEY, "format": "json", "jsonVD": "Y", "orgId": "101", "tblId": tbl, "type": typ})
    if isinstance(j, list): f.write_text(json.dumps(j, ensure_ascii=False), encoding="utf-8")
    print("meta", tbl, typ, "rows" if isinstance(j, list) else j, len(j) if isinstance(j, list) else "", flush=True)
    return j

def objs(tbl):
    """분류 차원 목록(objL 순서): ITM 메타에 항목(ITEM)과 분류(OBJ_ID≠ITEM)가 함께 오고 OBJ_ID_SN 이 순서 (type=OBJ 는 err 30)."""
    j = meta(tbl, "ITM")
    seen = {}
    for r in j:
        if r["OBJ_ID"] != "ITEM": seen.setdefault(r["OBJ_ID"], int(r.get("OBJ_ID_SN", len(seen) + 1)))
    return [k for k, _ in sorted(seen.items(), key=lambda x: x[1])]

def objs_sn(tbl):
    """(OBJ_ID, OBJ_ID_SN) 목록 — objL 번호는 OBJ_ID_SN 을 그대로 써야 하는 표가 있음(중간 번호가 비는 경우)."""
    j = meta(tbl, "ITM"); seen = {}
    for r in j:
        if r["OBJ_ID"] != "ITEM": seen.setdefault(r["OBJ_ID"], int(r.get("OBJ_ID_SN", len(seen) + 1)))
    return sorted(seen.items(), key=lambda x: x[1])

def data(tbl, y0, y1, itm="ALL", fix=None):
    """fix: {OBJ_ID: 코드} 로 특정 분류를 고정(예: 성별 계). 행수 제한(약 4만) 때문에 큰 표는 연도별로 부른다."""
    tag = "" if not fix and itm == "ALL" else "_" + "_".join([itm] + [f"{k}{v}" for k, v in (fix or {}).items()])
    f = OUT / f"{tbl}_{y0}_{y1}{tag}.json"
    if f.exists(): return json.loads(f.read_text(encoding="utf-8"))
    # 주기가 '2년'·'3년'인 표(DT_1B44·DT_1B46)는 prdSe=F 로 불러야 함(Y 는 err 30)
    p = {"method": "getList", "apiKey": KEY, "format": "json", "jsonVD": "Y", "orgId": "101", "tblId": tbl,
         "itmId": itm, "prdSe": PRDSE.get(tbl, "Y"), "startPrdDe": str(y0), "endPrdDe": str(y1)}
    for oid, sn in objs_sn(tbl): p[f"objL{sn}"] = (fix or {}).get(oid, "ALL")
    j = call("https://kosis.kr/openapi/Param/statisticsParameterData.do", p)
    if isinstance(j, list):
        f.write_text(json.dumps(j, ensure_ascii=False), encoding="utf-8"); print("data", tbl, y0, y1, len(j), "rows", flush=True)
    else:
        print("data", tbl, y0, y1, "ERR", j, flush=True)
    return j

TABLES = ["DT_1B41", "DT_1B44", "DT_1B46", "DT_1B80A18", "DT_1B040M5", "DT_1B040M5_1"]
if __name__ == "__main__":
    mode = sys.argv[1] if len(sys.argv) > 1 else "meta"
    if mode == "search":
        for q in sys.argv[2:]:
            j = call("https://kosis.kr/openapi/statisticsSearch.do", {"method": "getList", "apiKey": KEY, "format": "json", "jsonVD": "Y", "searchNm": q, "startCount": 1, "resultCount": 40})
            print("##", q)
            for r in (j if isinstance(j, list) else []): print(" ", r.get("ORG_ID"), r.get("TBL_ID"), r.get("TBL_NM"), "|", r.get("STAT_NM"))
            if not isinstance(j, list): print(" ", j)
    elif mode == "meta":
        for t in TABLES:
            for typ in ("ITM", "PRD"): meta(t, typ)
    elif mode == "data":
        data("DT_1B41", 2005, 2024); data("DT_1B46", 2012, 2024)
        data("DT_1B44", 2012, 2018); data("DT_1B44", 2019, 2024)
        for y in range(2016, 2025): data("DT_1B80A18", y, y, itm="T2", fix={"SBB": "0"})
        for y in range(2016, 2025): data("DT_1B040M5", y, y, fix={"SBB": "0"})
        for y in range(2023, 2025): data("DT_1B040M5_1", y, y, fix={"SBB": "0"})
