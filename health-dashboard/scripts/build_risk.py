# -*- coding: utf-8 -*-
"""
감염병 대응 고위험군 규모 추정 → data/risk.json  (docs/감염병_고위험군_v1.md)

자료: 주민등록연앙인구 5세별(통계청, data/raw_hle) · 지역사회건강조사(dataset.json 조율) ·
      지역사회건강조사 DB(질병관리청 자료실, data/kdh/values_<연도>.csv)
원칙: 실측 인원(DB)과 추정 인원(유병률×해당 연령 인구)을 구분해 표기. 집단끼리 겹치므로 합산하지 않음.
사용법: python scripts/build_risk.py
"""
import csv, json, re, collections, datetime
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
DS = json.loads((ROOT / "data" / "dataset.json").read_text(encoding="utf-8"))
RIDX = {r["c"]: i for i, r in enumerate(DS["regions"])}
IND = {i["id"]: i for i in DS["indicators"]}
def val(iid, item, y, code):
    ind = IND[iid]
    if y not in ind["years"] or code not in RIDX: return None
    v = DS["values"][iid][item][ind["years"].index(y)][RIDX[code]]
    return None if v is None else v / 10
def latest(iid, item, code, maxy=2025):
    for y in sorted(IND[iid]["years"], reverse=True):
        if y > maxy: continue
        v = val(iid, item, y, code)
        if v is not None: return v, y
    return None, None

# ── 지역 매핑(통계청 코드·DB 지명 → 대시보드 코드) ──
SIDO = {"서울특별시": "서울", "부산광역시": "부산", "대구광역시": "대구", "인천광역시": "인천", "광주광역시": "광주", "대전광역시": "대전", "울산광역시": "울산", "세종특별자치시": "세종", "경기도": "경기", "강원도": "강원", "강원특별자치도": "강원", "충청북도": "충북", "충청남도": "충남", "전라북도": "전북", "전북특별자치도": "전북", "전라남도": "전남", "경상북도": "경북", "경상남도": "경남", "제주특별자치도": "제주", "제주도": "제주"}
STAT_SIDO = {"11": "서울", "21": "부산", "22": "대구", "23": "인천", "24": "광주", "25": "대전", "26": "울산", "29": "세종", "31": "경기", "32": "강원", "33": "충북", "34": "충남", "35": "전북", "36": "전남", "37": "경북", "38": "경남", "39": "제주"}
SGG = {(r["s"], r["n"]): r["c"] for r in DS["regions"] if r["l"] == "sgg"}
SUB = {(r["s"], r["n"]): r["c"] for r in DS["regions"] if r["l"] == "sub"}
SIDOC = {r["s"]: r["c"] for r in DS["regions"] if r["l"] == "sido"}
ALIAS = {"남구": {"인천": "미추홀구"}, "통합창원시": {"경남": "창원시"}, "통합청주시": {"충북": "청주시"}, "여주군": {"경기": "여주시"}, "당진군": {"충남": "당진시"}, "군위군": {"경북": "군위군", "대구": "군위군"}}
SUBFIX = {"마산합포구": "마산", "마산회원구": "마산", "진해구": "진해", "의창구": "창원", "성산구": "창원"}
def region_code(sido_nm, g):
    s = SIDO.get(str(sido_nm).strip()); g = str(g).strip()
    if not s: return None
    if g == str(sido_nm).strip() or g in SIDO: return SIDOC[s]
    g = ALIAS.get(g, {}).get(s, g); g = re.sub(r"^통합창원시", "", g)
    if s == "제주": g = re.sub(r"^(제주시|서귀포시).*$", r"\1", g)
    if s == "세종": return "00711"
    if s == "제주" and g == "제주시": return "01600A"
    if s == "제주" and g == "서귀포시": return "01600"
    if (s, g) in SGG: return SGG[(s, g)]
    tail = g.split()[-1] if " " in g else g; tail = SUBFIX.get(tail, tail)
    return SUB.get((s, tail))

# ── 1. 연령별 인구 (2024 연앙인구, 5세) ──
P_AGE = {"020": 0, "050": 5, "070": 10, "100": 15, "120": 20, "130": 25, "150": 30, "160": 35, "180": 40, "190": 45, "210": 50, "230": 55, "260": 60, "280": 65, "310": 70, "330": 75, "360": 80, "380": 85, "410": 90, "430": 95, "440": 100}
POP_YEAR = 2024
rows = json.loads((ROOT / "data" / "raw_hle" / f"DT_1B040M5_1_{POP_YEAR}_{POP_YEAR}_ALL_SBB0.json").read_text(encoding="utf-8"))
POP = collections.defaultdict(lambda: collections.defaultdict(float))     # dash code -> {age0: n}
NAMES = {}
def cls(r): return {r[f"C{k}_OBJ_NM"]: (r[f"C{k}"], r[f"C{k}_NM"]) for k in range(1, 5) if f"C{k}_OBJ_NM" in r}
for r in rows:
    c = cls(r)
    if c["성별"][1] != "계" or c["연령별"][0] not in P_AGE: continue
    code, nm = c["행정구역(시군구)별"]
    if len(code) == 2: dst = SIDOC.get(STAT_SIDO.get(code))
    elif len(code) == 5:
        s = STAT_SIDO.get(code[:2]); nm2 = re.sub(r"\(.*?\)", "", nm).strip()
        dst = region_code({v: k for k, v in SIDO.items()}.get(s, s), nm2) if s else None
        if dst and DS["regions"][RIDX[dst]]["l"] == "sub": dst = None       # 세부 단위는 시 전체 행으로 대신
    else: dst = None
    if not dst: continue
    v = float(str(r["DT"]).replace(",", "") or 0)
    POP[dst][P_AGE[c["연령별"][0]]] += v
def agesum(code, a0, a1=200): return sum(v for a, v in POP.get(code, {}).items() if a0 <= a < a1)
print("인구 매핑 지역", len(POP))

# ── 2. DB 실측 인원 (최신 연도) ──
KDH = ROOT / "data" / "kdh"
def norm(s): return re.sub(r"[\s,·]", "", str(s)).lower()
DBF = {  # 정규화 이름: (id)
 "노인인구수": "db_eld", "총인구수": "db_pop", "요양기관수_요양병원": "ltc_hosp", "노인장기요양_시설_기관수": "ltc_fac_n", "노인장기요양_시설_정원": "ltc_fac_cap",
 "노인장기요양_재가_정원": "ltc_home_cap", "독거노인가구비율": "alone_rate", "1인가구수_65세이상": "alone_n", "국민기초생활보장수급자": "bls", "기초연금수급자수": "bpen",
 "인구천명당외국인수": "foreign_rate", "모자보건등록관리_임산부수": "preg", "전체출생아수": "births", "고혈압_진료실인원": "htn_tx", "당뇨병_진료실인원": "dm_tx",
 "정신질환_진료실인원": "mental_tx", "위암_진료실인원": "ca1", "간암_진료실인원": "ca2", "폐암_진료실인원": "ca3", "대장암_진료실인원": "ca4", "유방암_진료실인원": "ca5",
 "유치원원아수": "kinder", "등록장애인수_합계": "disab", "등록장애인수합계": "disab", "의사수": "doc", "간호사수": "nurse", "결핵신고신환자현황": "tb",
}
DB = collections.defaultdict(dict)   # code -> id -> (value, year)
for y in (2018, 2020, 2021, 2022, 2023, 2024):
    f = KDH / f"values_{y}.csv"
    if not f.exists(): continue
    with open(f, encoding="utf-8-sig") as fh:
        rd = csv.reader(fh); next(rd)
        for code, sido, sgg, region, name, v in rd:
            k = DBF.get(norm(name))
            if not k: continue
            rc = region_code(sido, sgg)
            if not rc: continue
            try: fv = float(str(v).replace(",", ""))
            except: continue
            if rc not in DB or k not in DB[rc] or DB[rc][k][1] < y: DB[rc][k] = (fv, y)
def db(code, k): return DB.get(code, {}).get(k, (None, None))

# ── 3. 집단 정의 ──
GROUPS = [
 # id, 이름, 범주, 산출, 출처, 추정 여부
 ("age65", "65세 이상", "연령", "주민등록연앙인구(5세별) 직접 합산", "통계청", False),
 ("age75", "75세 이상", "연령", "위와 같음(인플루엔자 우선접종·중증 위험)", "통계청", False),
 ("age85", "85세 이상", "연령", "위와 같음", "통계청", False),
 ("age0_4", "0~4세 영유아", "연령", "위와 같음", "통계청", False),
 ("age0_14", "0~14세 어린이", "연령", "위와 같음(인플루엔자 국가접종 6개월~13세 근사)", "통계청", False),
 ("htn_est", "고혈압 진단경험자(30세 이상, 추정)", "기저질환", "지역사회건강조사 고혈압 진단경험률(30세 이상, 조율) × 30세 이상 인구", "질병관리청·통계청", True),
 ("dm_est", "당뇨병 진단경험자(30세 이상, 추정)", "기저질환", "당뇨병 진단경험률(30세 이상, 조율) × 30세 이상 인구", "질병관리청·통계청", True),
 ("htn_tx", "고혈압 진료실인원(실측)", "기저질환", "건강보험 진료실인원", "DB(국민건강보험공단)", False),
 ("dm_tx", "당뇨병 진료실인원(실측)", "기저질환", "건강보험 진료실인원", "DB(국민건강보험공단)", False),
 ("cancer_tx", "암 진료실인원 5종 합(면역저하 대용)", "기저질환", "위·간·폐·대장·유방암 진료실인원 합", "DB(국민건강보험공단)", False),
 ("obese_est", "비만(19세 이상, 추정)", "기저질환", "비만율(자가보고, 조율) × 19세 이상 인구", "질병관리청·통계청", True),
 ("smoke_est", "현재흡연자(19세 이상, 추정)", "기저질환", "현재흡연율(조율) × 19세 이상 인구", "질병관리청·통계청", True),
 ("depress_est", "우울증상 유병자(19세 이상, 추정)", "기저질환", "우울증상 유병률(조율) × 19세 이상 인구", "질병관리청·통계청", True),
 ("mental_tx", "정신질환 진료실인원(실측)", "기저질환", "건강보험 진료실인원", "DB(국민건강보험공단)", False),
 ("preg", "모자보건 등록 임산부", "임신부·영유아", "보건소 모자보건 등록 임산부수", "DB(보건복지부)", False),
 ("births", "연간 출생아", "임신부·영유아", "출생통계", "DB(통계청)", False),
 ("kinder", "유치원 원아", "임신부·영유아", "유치원 원아수(집단시설)", "DB(교육부)", False),
 ("ltc_fac_cap", "장기요양 시설 정원", "감염취약시설", "노인장기요양 시설급여 기관 정원", "DB(국민건강보험공단)", False),
 ("ltc_fac_n", "장기요양 시설 기관 수", "감염취약시설", "노인장기요양 시설급여 기관 수", "DB(국민건강보험공단)", False),
 ("ltc_home_cap", "장기요양 재가 정원", "감염취약시설", "재가급여 기관 정원(주야간보호 등 포함)", "DB(국민건강보험공단)", False),
 ("ltc_hosp", "요양병원 수", "감염취약시설", "요양기관 현황", "DB(건강보험심사평가원)", False),
 ("alone_n", "독거노인(65세 이상 1인가구)", "사회적 취약", "65세 이상 1인가구 수", "DB(통계청)", False),
 ("bls", "국민기초생활보장 수급자", "사회적 취약", "수급자 수", "DB(보건복지부)", False),
 ("bpen", "기초연금 수급자", "사회적 취약", "수급자 수", "DB(보건복지부)", False),
 ("foreign_est", "외국인 주민(추정)", "사회적 취약", "인구 천명당 외국인 수 × 인구", "DB(행정안전부)·통계청", True),
 ("disab", "등록장애인", "사회적 취약", "등록장애인 수(DB 최신 연도)", "DB(보건복지부)", False),
 ("unvac_est", "인플루엔자 미접종 성인(추정)", "예방접종", "(100 − 연간 인플루엔자 예방접종률, 조율) × 19세 이상 인구 — 성인 전체 기준, 65세 이상만의 값 아님", "질병관리청·통계청", True),
 ("tb", "결핵 신고 신환자", "감염병", "연간 신환자 수", "DB(질병관리청)", False),
 ("doc", "의사 수(대응 인력)", "대응 자원", "의료기관 종사 의사", "DB(보건복지부)", False),
 ("nurse", "간호사 수(대응 인력)", "대응 자원", "의료기관 종사 간호사", "DB(보건복지부)", False),
]
CHS_Y = 2025
out = {"generated": datetime.date.today().isoformat(), "pop_year": POP_YEAR, "chs_year": CHS_Y,
       "groups": [{"id": g[0], "name": g[1], "cat": g[2], "method": g[3], "src": g[4], "est": g[5]} for g in GROUPS], "regions": {}}
def put(reg, gid, v, y, est=False):
    if v is None: return
    reg[gid] = {"v": round(v), "y": y}
for r in DS["regions"]:
    code = r["c"]
    if r["l"] == "sub": continue
    tot = agesum(code, 0)
    if tot <= 0: continue
    reg = {"pop": round(tot)}
    put(reg, "age65", agesum(code, 65), POP_YEAR); put(reg, "age75", agesum(code, 75), POP_YEAR); put(reg, "age85", agesum(code, 85), POP_YEAR)
    put(reg, "age0_4", agesum(code, 0, 5), POP_YEAR); put(reg, "age0_14", agesum(code, 0, 15), POP_YEAR)
    p30 = agesum(code, 30); p19 = agesum(code, 20) + agesum(code, 15, 20) * 0.2   # 19세 근사(15~19 중 1/5)
    for gid, iid, base in [("htn_est", "DT_HYPER_DOCTOR", p30), ("dm_est", "DT_DIA_DOCTOR", p30), ("obese_est", "DT_H_OBE_OBE", p19), ("smoke_est", "DT_H_SM", p19), ("depress_est", "DT_117075_H_MENTAL_DEPRESS_SYM", p19)]:
        v, y = latest(iid, "crude", code, CHS_Y)
        if v is not None: put(reg, gid, base * v / 100, y)
    v, y = latest("DT_INFLUENZA", "crude", code, CHS_Y)
    if v is not None: put(reg, "unvac_est", p19 * (100 - v) / 100, y)
    for gid in ["htn_tx", "dm_tx", "mental_tx", "preg", "births", "kinder", "ltc_fac_cap", "ltc_fac_n", "ltc_home_cap", "ltc_hosp", "alone_n", "bls", "bpen", "disab", "tb", "doc", "nurse"]:
        v, y = db(code, gid); put(reg, gid, v, y)
    ca = [db(code, k) for k in ("ca1", "ca2", "ca3", "ca4", "ca5")]
    if all(x[0] is not None for x in ca): put(reg, "cancer_tx", sum(x[0] for x in ca), max(x[1] for x in ca))
    v, y = db(code, "foreign_rate")
    if v is not None: put(reg, "foreign_est", tot * v / 1000, y)
    if "alone_n" not in reg:
        v, y = db(code, "alone_rate"); e, _ = db(code, "db_eld")
        if v is not None and e: put(reg, "alone_n", e * v / 100, y)
    out["regions"][code] = reg
# 시도 값이 DB에 없는 항목은 시군구 합으로 보완
for s in [r for r in DS["regions"] if r["l"] == "sido"]:
    reg = out["regions"].get(s["c"]); kids = [out["regions"][r["c"]] for r in DS["regions"] if r["l"] == "sgg" and r["p"] == s["c"] and r["c"] in out["regions"]]
    if not reg or not kids: continue
    for g in GROUPS:
        gid = g[0]
        if gid not in reg and gid not in ("age65",):
            vals = [k[gid] for k in kids if gid in k]
            if len(vals) >= len(kids) * 0.8: reg[gid] = {"v": round(sum(x["v"] for x in vals)), "y": max(x["y"] for x in vals), "sum": True}
cov = collections.Counter(gid for reg in out["regions"].values() for gid in reg if gid != "pop")
print("지역", len(out["regions"]), "| 집단별 커버리지:", dict(cov))
(ROOT / "data" / "risk.json").write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
print("저장 data/risk.json", (ROOT / "data" / "risk.json").stat().st_size // 1024, "KB")
print("마포구", out["regions"].get("00113"))
