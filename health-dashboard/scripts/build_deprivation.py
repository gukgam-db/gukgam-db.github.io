# -*- coding: utf-8 -*-
"""
지역박탈지수(근사) → data/deprivation.json   (docs/지역박탈지수_산출_v1.md)

김동진 외(한국보건사회연구원 2013) 방식을 2020 인구주택총조사 시군구 집계표로 재현:
  각 변수의 시군구 비율 → 전국 시군구 기준 z점수 → 단순합 (높을수록 박탈 큼) → 5분위.
변수(원안 9개 중 집계표로 얻을 수 있는 것):
  edu   30~64세 고졸 미만 비율            DT_1PM2001 (받지않았음+초등 계+중학 계+고등학교 재학·중퇴) / 내국인
  aged  65세 이상 인구 비율               주민등록연앙인구 2020(data/raw_hle)
  cls   낮은 사회계급 근사: 취업자 중 단순노무·농림어업·서비스·판매 종사자 비율   DT_1PC2012
  one   1인가구 비율                       DT_1PE2013 (세대구성)
  apt   아파트 비거주 가구 비율            DT_1PE2002 (거처의 종류)
  fem   여성가구주 가구 비율               DT_1PE2013 (가구주 성)
  div   15세 이상 이혼·사별 비율           DT_1PM2002
  (제외) 자동차 미소유(2020 조사항목 없음), 낙후 주거시설(시군구 표 미확인)
사용법: python scripts/build_deprivation.py
"""
import json, re, glob, datetime, collections, statistics
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "data" / "raw_hle"
DS = json.loads((ROOT / "data" / "dataset.json").read_text(encoding="utf-8"))
TABLES = {2020: {"edu": "DT_1PM2001", "mar": "DT_1PM2002", "hh": "DT_1PE2013", "job": "DT_1PC2012", "dw": "DT_1PE2002"},
          2015: {"edu": "DT_1PM1501", "mar": "DT_1PM1503", "hh": "DT_1PE1513", "job": "DT_1PC1512", "dw": "DT_1PE1502"}}
YEAR = 2020

# ── 지역 매핑(통계청 시군구 코드 → 대시보드 코드) : build_hle 와 동일 규칙 ──
STAT_SIDO = {"11": "서울", "21": "부산", "22": "대구", "23": "인천", "24": "광주", "25": "대전", "26": "울산", "29": "세종", "31": "경기", "32": "강원", "33": "충북", "34": "충남", "35": "전북", "36": "전남", "37": "경북", "38": "경남", "39": "제주"}
SGG = collections.defaultdict(list)
for r in DS["regions"]:
    if r["l"] in ("sgg", "sub"): SGG[(r["s"], re.sub(r"\(.*?\)", "", r["n"]).strip())].append(r)
SIDOC = {r["s"]: r["c"] for r in DS["regions"] if r["l"] == "sido"}
FIX = {("제주", "제주시"): "01600A", ("제주", "서귀포시"): "01600", ("세종", "세종시"): "00711", ("세종", "세종특별자치시"): "00711"}
def map_code(code, nm):
    if len(code) == 2: return SIDOC.get(STAT_SIDO.get(code))
    if len(code) != 5: return None
    s = STAT_SIDO.get(code[:2]); nm = re.sub(r"\(.*?\)", "", nm).strip()
    if not s: return None
    if (s, nm) in FIX: return FIX[(s, nm)]
    c = SGG.get((s, nm)) or SGG.get((s, nm.replace("시", "")))
    if not c: return None
    sgg = [x for x in c if x["l"] == "sgg"]
    return (sgg or c)[0]["c"]

def load(role):
    prefix = TABLES[YEAR][role]
    fs = sorted(RAW.glob(f"{prefix}_{YEAR}_{YEAR}*.json"))
    if not fs: raise SystemExit(f"{prefix} 자료 없음 — scripts/kosis_fetch_census.py {YEAR} 먼저 실행")
    return json.loads(fs[0].read_text(encoding="utf-8"))
def cls(r): return {r[f"C{k}_OBJ_NM"]: (r[f"C{k}"], r[f"C{k}_NM"]) for k in range(1, 5) if f"C{k}_OBJ_NM" in r}
def num(v):
    try: return float(str(v).replace(",", ""))
    except: return 0.0

def compute(year):
    global YEAR
    YEAR = year
    V = collections.defaultdict(dict)      # code -> var -> value(비율 %)
    NAMES = {}
    def acc(table, keyfn, into):           # into: code -> {key: n}
        for r in table:
            c = cls(r); code, nm = next(v for k, v in c.items() if "행정구역" in k)
            dst = map_code(code, nm)
            if not dst: continue
            NAMES[dst] = nm
            k = keyfn(r, c)
            if k is None: continue
            into[dst][k] = into[dst].get(k, 0.0) + num(r["DT"])

    # 1) 교육: 30~64세 고졸 미만
    edu = collections.defaultdict(dict)
    acc(load("edu"), lambda r, c: ("tot" if r["ITM_ID"] == "T10" else "low"), edu)
    for code, d in edu.items():
        if d.get("tot"): V[code]["edu"] = 100 * d.get("low", 0) / d["tot"]

    # 2) 65세 이상 비율: 연앙인구 2020
    P_AGE = {"020": 0, "050": 5, "070": 10, "100": 15, "120": 20, "130": 25, "150": 30, "160": 35, "180": 40, "190": 45, "210": 50, "230": 55, "260": 60, "280": 65, "310": 70, "330": 75, "360": 80, "380": 85, "410": 90, "430": 95, "440": 100}
    pop = collections.defaultdict(dict)
    for r in json.loads(next(RAW.glob(f"DT_1B040M5_{YEAR}_{YEAR}*.json")).read_text(encoding="utf-8")):
        c = cls(r)
        if c["성별"][1] != "계" or c["연령별"][0] not in P_AGE: continue
        code, nm = c["행정구역(시군구)별"]; dst = map_code(code, nm)
        if not dst: continue
        a = P_AGE[c["연령별"][0]]; pop[dst]["tot"] = pop[dst].get("tot", 0) + num(r["DT"])
        if a >= 65: pop[dst]["old"] = pop[dst].get("old", 0) + num(r["DT"])
    for code, d in pop.items():
        if d.get("tot"): V[code]["aged"] = 100 * d.get("old", 0) / d["tot"]

    # 3) 사회계급 근사: 직업별 취업인구
    LOW_JOB = re.compile(r"단순노무|농림어업|서비스|판매")
    def job_key(r, c):
        if r["ITM_ID"] != "T00": return None                       # 취업인구-현거주지(성 전체)
        jobnm = next((v[1] for k, v in c.items() if "직업" in k), "계")
        if jobnm == "계": return "tot"
        return "low" if LOW_JOB.search(jobnm) else None
    job = collections.defaultdict(dict)
    acc(load("job"), job_key, job)
    for code, d in job.items():
        if d.get("tot"): V[code]["cls"] = 100 * d.get("low", 0) / d["tot"]

    # 4) 1인가구·여성가구주: DT_1PE2013 (가구주 성별 × 세대구성)
    hh = collections.defaultdict(dict)
    def hh_key(r, c):
        if r["ITM_ID"] != "T10": return None                       # 일반가구 수
        sex = next((v[1] for k, v in c.items() if k.startswith("성")), "계"); gen = next((v[1] for k, v in c.items() if "세대" in k), "일반가구")
        tot_gen = gen in ("계", "일반가구")
        if sex == "계" and tot_gen: return "tot"
        if sex == "계" and re.search(r"^1인", gen): return "one"
        if sex == "여자" and tot_gen: return "fem"
        return None
    acc(load("hh"), hh_key, hh)
    for code, d in hh.items():
        if d.get("tot"):
            V[code]["one"] = 100 * d.get("one", 0) / d["tot"]; V[code]["fem"] = 100 * d.get("fem", 0) / d["tot"]

    # 5) 아파트 비거주: DT_1PE2002 (거처의 종류 × 점유형태)
    dw = collections.defaultdict(dict)
    def dw_key(r, c):
        if r["ITM_NM"] != "일반가구": return None                     # 점유형태 합계 항목만
        kind = next((v[1] for k, v in c.items() if "거처" in k), "계")
        return "tot" if kind == "계" else ("apt" if kind == "아파트" else None)
    acc(load("dw"), dw_key, dw)
    for code, d in dw.items():
        if d.get("tot"): V[code]["apt"] = 100 * (1 - d.get("apt", 0) / d["tot"])

    # 6) 이혼·사별: DT_1PM2002 (연령 × 혼인상태 항목)
    mar = collections.defaultdict(dict)
    def mar_key(r, c):
        age = next((v[1] for k, v in c.items() if "연령" in k), "합계")
        if age not in ("계", "합계"): return None
        if r["ITM_ID"] == "T10": return "tot"                      # 내국인(15세이상)-계
        return "ds" if r["ITM_ID"] in ("T13", "T14") else None     # 사별·이혼
    acc(load("mar"), mar_key, mar)
    for code, d in mar.items():
        if d.get("tot"): V[code]["div"] = 100 * d.get("ds", 0) / d["tot"]

    return V, pop

VARS = ["edu", "aged", "cls", "one", "apt", "fem", "div"]
LABEL = {"edu": "30~64세 고졸 미만(%)", "aged": "65세 이상(%)", "cls": "하위 직업 취업자(단순노무·농림어업·서비스·판매, %)", "one": "1인가구(%)", "apt": "아파트 비거주 가구(%)", "fem": "여성가구주 가구(%)", "div": "15세 이상 이혼·사별(%)"}
def score(V, pop, year):
    codes = [r["c"] for r in DS["regions"] if r["l"] == "sgg" and all(v in V.get(r["c"], {}) for v in VARS)]
    mu = {v: statistics.mean(V[c][v] for c in codes) for v in VARS}; sd = {v: statistics.pstdev(V[c][v] for c in codes) for v in VARS}
    rows = []
    for c in codes:
        z = {v: (V[c][v] - mu[v]) / sd[v] for v in VARS}; rows.append((c, sum(z.values()), z))
    rows.sort(key=lambda x: -x[1]); n = len(rows); res = {}
    for i, (c, idx, z) in enumerate(rows):
        res[c] = {"idx": round(idx, 2), "q": 5 - min(4, int(i / n * 5)), "rank": i + 1, "n": n, "z": {v: round(z[v], 2) for v in VARS}, "v": {v: round(V[c][v], 1) for v in VARS}}
    print(year, "전 변수 확보 시군구", n, "| 커버리지", {v: sum(1 for c in V if v in V[c]) for v in VARS}, "| SD", round(statistics.pstdev([i for _, i, _ in rows]), 2))
    return res, mu, sd, pop

R20, mu, sd, pop20 = score(*compute(2020), 2020)
R15, _, _, _ = score(*compute(2015), 2015)
out = {"generated": datetime.date.today().isoformat(), "year": 2020, "years": [2015, 2020],
       "vars": [{"id": v, "label": LABEL[v], "mean": round(mu[v], 2), "sd": round(sd[v], 2)} for v in VARS],
       "method": "김동진 외(2013) 지역박탈지수 방식 재현: 변수별 전국 시군구 z점수 단순합(높을수록 박탈), 인구주택총조사 집계표(20% 표본·등록센서스) 기반 근사. 자동차 미소유·낙후 주거시설은 자료가 없어 제외(7개 변수). 2015년은 같은 방식으로 소급(연도별로 각각 표준화).",
       "regions": {}}
for c, r in R20.items():
    r = dict(r); p = R15.get(c)
    if p: r["prev"] = {"year": 2015, "idx": p["idx"], "q": p["q"], "rank": p["rank"]}
    out["regions"][c] = r
for s_ in [r for r in DS["regions"] if r["l"] == "sido"]:
    kids = [(r["c"], pop20.get(r["c"], {}).get("tot", 0)) for r in DS["regions"] if r["l"] == "sgg" and r["p"] == s_["c"] and r["c"] in R20]
    if kids and sum(p for _, p in kids):
        out["regions"][s_["c"]] = {"idx": round(sum(R20[c]["idx"] * p for c, p in kids) / sum(p for _, p in kids), 2), "q": None, "rank": None, "n": len(R20), "sido_avg": True}
(ROOT / "data" / "deprivation.json").write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
name = {r["c"]: r["s"] + " " + r["n"] for r in DS["regions"]}
top = sorted(R20.items(), key=lambda kv: -kv[1]["idx"])
print("2020 상위:", [(name[c], v["idx"]) for c, v in top[:5]]); print("2020 하위:", [(name[c], v["idx"]) for c, v in top[-5:]])
both = [(c, R20[c]["idx"] - R15[c]["idx"]) for c in R20 if c in R15]
import math
r = statistics.correlation([R15[c]["idx"] for c, _ in both], [R20[c]["idx"] for c, _ in both]); print("2015↔2020 상관", round(r, 3), "| 개선(하락) 상위:", [(name[c], round(d, 1)) for c, d in sorted(both, key=lambda x: x[1])[:5]], "| 악화 상위:", [(name[c], round(d, 1)) for c, d in sorted(both, key=lambda x: -x[1])[:5]])
print("저장 data/deprivation.json")
