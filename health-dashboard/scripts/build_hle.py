# -*- coding: utf-8 -*-
"""
건강수명(주관적 건강 기반) 산출 → data/hle.json

방법 (docs/건강수명_산출법_v1.md):
  전국  : 통계청 공식값 인용(DT_1B46 주관적 건강평가·유병기간 제외 기대여명, DT_1B41 기대수명) + WHO HALE·HP2030 참고값
  연령별 불건강 곡선 π_i : 통계청 주관적 건강평가 기대여명(연령별) × 전국 간이생명표(L_i, l_i)에서 역산
                         → 전국 값은 공식 통계와 정확히 일치(보정 기준)
  시도  : 통계청 시도별 간이생명표(DT_1B44, 정지인구·생존자) + π_i 를 지역사회건강조사 주관적 건강인지율(표준화율, 3년 평균)
          비율(불건강 오즈비)로 높이 보정 → Sullivan
  시군구: 사망원인통계 시군구·성·연령별 사망자(DT_1B80A18, 3년 합산) + 주민등록연앙인구(DT_1B040M5, 3년 합산)
          → Chiang 간이생명표(0-4, 5-9, …, 85+) → 같은 방식으로 π_i 보정 → Sullivan
사용법: python scripts/kosis_fetch_hle.py data 후  python scripts/build_hle.py
"""
import json, re, sys, collections, datetime
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from lifetable import chiang_lifetable, sullivan, implied_unhealthy, scale_pattern, regroup

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "data" / "raw_hle"
DS = json.loads((ROOT / "data" / "dataset.json").read_text(encoding="utf-8"))
REC = json.loads((ROOT / "data" / "raw" / "DT_HEALTH_RECOG.json").read_text(encoding="utf-8"))

def load(name):
    f = RAW / name
    return json.loads(f.read_text(encoding="utf-8")) if f.exists() else []

def num(s):
    try: return float(str(s).replace(",", ""))
    except: return None

def cls(r):
    """행의 분류 {OBJ_NM: (code, name)} — C1/C2/C3 위치에 의존하지 않도록."""
    out = {}
    for k in range(1, 5):
        if f"C{k}_OBJ_NM" in r: out[r[f"C{k}_OBJ_NM"]] = (r[f"C{k}"], r[f"C{k}_NM"])
    return out

def load_years(prefix, y0, y1):
    rows = []
    for y in range(y0, y1 + 1):
        for f in RAW.glob(f"{prefix}_{y}_{y}*.json"): rows += json.loads(f.read_text(encoding="utf-8"))
    return rows

# ── 1. 전국: DT_1B41 생명표(연령별 l, L), DT_1B46 건강수준별 기대여명(연령별) ─────────────
AGES_NAT = [0, 1] + list(range(5, 105, 5))          # 0,1,5,…,100+  (DT_1B41 B 코드)
B41 = collections.defaultdict(dict)                 # (year, itm) -> {age: val}
for r in load("DT_1B41_2005_2024.json"):
    c = cls(r)["연령별"]
    if c[1] == "계": continue
    B41[(int(r["PRD_DE"]), r["ITM_ID"])][int(c[1].rstrip("+"))] = num(r["DT"])
B46 = collections.defaultdict(dict)                 # (year, itm, sex) -> {age: val}
for r in load("DT_1B46_2012_2024.json"):
    c = cls(r)
    if c["연령별"][1] == "계": continue
    B46[(int(r["PRD_DE"]), r["ITM_ID"], c["성별"][1])][int(c["연령별"][1].rstrip("+"))] = num(r["DT"])
NAT_YEARS = sorted({y for (y, i) in B41 if i == "T3"})
B46_YEARS = sorted({y for (y, i, s) in B46 if i == "T2" and s == "남녀전체"})
print("전국 생명표 연도", NAT_YEARS[0], "~", NAT_YEARS[-1], "| 건강수준별 기대여명 연도", B46_YEARS)

def nat_lt(year):
    L = [B41[(year, "T3")].get(a) for a in AGES_NAT]; l = [B41[(year, "T2")].get(a) for a in AGES_NAT]
    return L, l

AGES_46 = [0, 1] + list(range(5, 90, 5))     # DT_1B46 연령 구간(85+ 열린 구간)

def agg(vals_by_age, ages_from, ages_to, how):
    """세분 구간 값 → 굵은 구간. how='sum'(L) 또는 'first'(l: 구간 시작 생존자)."""
    out = []
    for j, a0 in enumerate(ages_to):
        a1 = ages_to[j + 1] if j + 1 < len(ages_to) else 10**9
        idx = [k for k, a in enumerate(ages_from) if a0 <= a < a1]
        out.append(sum(vals_by_age[k] for k in idx) if how == "sum" else vals_by_age[idx[0]])
    return out

def anchor(L, l, pi, target):
    """오즈 스케일 r 을 이분탐색해 Sullivan 값이 공식값(target)과 일치하도록 보정."""
    lo, hi = 0.2, 5.0
    for _ in range(60):
        mid = (lo + hi) / 2
        if sullivan(L, l, scale_pattern(pi, mid)) > target: lo = mid
        else: hi = mid
    return scale_pattern(pi, (lo + hi) / 2)

_PAT_CACHE = {}
def nat_pattern(year, ages):
    """해당 연도(없으면 가장 가까운 짝수 연도)의 전국 π_i (구간 = ages). 공식 주관적 건강평가 기대수명에 앵커링."""
    y46 = min(B46_YEARS, key=lambda y: (abs(y - year), -y))
    yl = year if year in NAT_YEARS else max(y for y in NAT_YEARS if y <= year)
    key = (y46, yl, tuple(ages))
    if key in _PAT_CACHE: return _PAT_CACHE[key]
    Lf, lf = nat_lt(yl)
    L46, l46 = agg(Lf, AGES_NAT, AGES_46, "sum"), agg(lf, AGES_NAT, AGES_46, "first")
    h = [B46[(y46, "T2", "남녀전체")].get(a) for a in AGES_46]
    pi46 = anchor(L46, l46, implied_unhealthy(L46, l46, h), h[0])
    # 목표 구간(ages)으로 L 가중 평균
    out = []
    for j, a0 in enumerate(ages):
        a1 = ages[j + 1] if j + 1 < len(ages) else 10**9
        idx = [k for k, a in enumerate(AGES_46) if a0 <= a < a1]
        if not idx: idx = [max(k for k, a in enumerate(AGES_46) if a <= a0)]
        w = sum(L46[k] for k in idx); out.append(sum(L46[k] * pi46[k] for k in idx) / w if w else pi46[idx[0]])
    _PAT_CACHE[key] = (out, y46, yl)
    return _PAT_CACHE[key]

# ── 2. 지역사회건강조사 주관적 건강인지율(표준화율) 3년 평균 → 불건강 오즈비 ───────────────
REG_BY_CODE = {r["c"]: r for r in DS["regions"]}
RECOG = collections.defaultdict(dict)   # code -> {year: std rate}
for r in REC:
    if r["ITM_NM"] == "표준화율" and num(r["DT"]) is not None:
        RECOG[r["C1"]][int(r["PRD_DE"])] = num(r["DT"])

def recog3(code, year):
    ys = [y for y in (year - 1, year, year + 1) if y in RECOG.get(code, {})]
    if not ys: ys = [y for y in RECOG.get(code, {}) if abs(y - year) <= 2]
    return sum(RECOG[code][y] for y in ys) / len(ys) if ys else None

# 전국 기준 = 시도 표준화율의 인구 가중 평균 (시도 인구: 연앙인구 표)
def sido_pop_weights(year):
    P = POP_SIDO.get(year) or POP_SIDO[max(POP_SIDO)]
    return P

# ── 3. 시도: DT_1B44 (시도별 간이생명표) ───────────────────────────────────────
AGES_SIDO = [0, 1] + list(range(5, 105, 5))
B44 = collections.defaultdict(dict)  # (year, sido_nm, itm) -> {age: val}
for r in [x for f in RAW.glob("DT_1B44_*.json") for x in json.loads(f.read_text(encoding="utf-8"))]:
    c = cls(r)
    B44[(int(r["PRD_DE"]), c["시도별"][1], r["ITM_ID"])][int(c["연령별"][1].rstrip("+"))] = num(r["DT"])
SIDO_YEARS = sorted({y for (y, s, i) in B44 if i == "B44T3"})
SIDO_ALIAS = {"강원도": "강원특별자치도", "전라북도": "전북특별자치도", "제주도": "제주특별자치도"}
def sido_code(nm):
    nm = SIDO_ALIAS.get(nm, nm)
    for r in DS["regions"]:
        if r["l"] == "sido" and r["n"] == nm: return r["c"]
    return None

# ── 4. 시군구: 사망자(DT_1B80A18) + 연앙인구(DT_1B040M5) ───────────────────────
AGES_SGG = [0] + list(range(5, 90, 5))      # 0-4, 5-9, …, 85+
D_AGE = {"520": 0, "040": 1, "050": 5, "070": 10, "100": 15, "120": 20, "130": 25, "150": 30, "160": 35, "180": 40, "190": 45,
         "210": 50, "230": 55, "260": 60, "280": 65, "310": 70, "330": 75, "360": 80, "380": 85, "390": 90}
P_AGE = {"020": 0, "050": 5, "070": 10, "100": 15, "120": 20, "130": 25, "150": 30, "160": 35, "180": 40, "190": 45, "210": 50,
         "230": 55, "260": 60, "280": 65, "310": 70, "330": 75, "360": 80, "380": 85, "410": 90, "430": 95, "440": 100}
DEATH = collections.defaultdict(lambda: collections.defaultdict(float))   # (year, stat_code) -> {age0: deaths}
DEATH_UNK = collections.defaultdict(float)
NAMES = {}
for y in range(2016, 2025):
    for r in load_years("DT_1B80A18", y, y):
        c = cls(r)
        if r["ITM_ID"] != "T2" or c["성별"][1] != "계": continue   # 성별 계, 사망자 수
        code, nm = c["시군구별"]; NAMES[code] = nm; v = num(r["DT"]) or 0.0
        age = c["연령(5세)별"][0]
        if age == "990": DEATH_UNK[(y, code)] += v; continue
        if age not in D_AGE: continue                               # 계, 80세이상(합계) 제외
        DEATH[(y, code)][D_AGE[age]] += v
POP = collections.defaultdict(lambda: collections.defaultdict(float))
POP_SIDO = collections.defaultdict(dict)
for y in range(2016, 2025):
    rows = load_years("DT_1B040M5", y, y) or load_years("DT_1B040M5_1", y, y)
    for r in rows:
        c = cls(r)
        if c["성별"][1] != "계": continue
        age = c["연령별"][0]
        if age not in P_AGE: continue
        code, nm = c["행정구역(시군구)별"]; NAMES.setdefault(code, nm); v = num(r["DT"]) or 0.0
        POP[(y, code)][P_AGE[age]] += v
        if len(code) == 2: POP_SIDO[y][code] = POP_SIDO[y].get(code, 0) + v

def pooled(codes, yc):
    """yc 중심 3년 합산 사망자·인구 (AGES_SGG 구간). codes = 같은 지역을 가리키는 통계청 코드 집합
    (사망자 표와 인구 표의 군 코드가 다름: 예 기장군 21510 vs 21310). 3개 연도 모두 있어야 함."""
    D = [0.0] * len(AGES_SGG); P = [0.0] * len(AGES_SGG); ok = 0
    for y in (yc - 1, yc, yc + 1):
        d = next((DEATH[(y, c)] for c in codes if (y, c) in DEATH), None)
        p = next((POP[(y, c)] for c in codes if (y, c) in POP), None)
        if not d or not p: continue
        ok += 1
        da = sorted(d); Dy = regroup(da, [d[k] for k in da], AGES_SGG)
        unk = sum(DEATH_UNK.get((y, c), 0.0) for c in codes); tot = sum(d.values())   # 연령미상 사망 비례 배분
        if unk and tot: Dy = [x * (1 + unk / tot) for x in Dy]
        D = [a + b for a, b in zip(D, Dy)]
        pa = sorted(p); P = [a + b for a, b in zip(P, regroup(pa, [p[k] for k in pa], AGES_SGG))]
    return (D, P, ok) if ok == 3 else None

STAT_SIDO = {"11": "서울", "21": "부산", "22": "대구", "23": "인천", "24": "광주", "25": "대전", "26": "울산", "29": "세종", "31": "경기",
             "32": "강원", "33": "충북", "34": "충남", "35": "전북", "36": "전남", "37": "경북", "38": "경남", "39": "제주"}
def norm(s): return re.sub(r"\(.*?\)", "", s).strip()
DS_BY = collections.defaultdict(list)
for r in DS["regions"]:
    if r["l"] in ("sgg", "sub"): DS_BY[(r["s"], norm(r["n"]))].append(r)
SGG_FIX = {("제주", "제주시"): "01600A", ("제주", "서귀포시"): "01600", ("세종", "세종시"): "00711"}
def map_stat(code):
    """통계청 행정구역 코드 → 대시보드 지역 코드 (시군구 우선, 없으면 세부 단위)."""
    if len(code) != 5: return None
    s = STAT_SIDO.get(code[:2]); nm = norm(NAMES.get(code, ""))
    if not s or not nm or "변동전" in NAMES.get(code, ""): return None
    if (s, nm) in SGG_FIX: return SGG_FIX[(s, nm)]
    cands = DS_BY.get((s, nm)) or DS_BY.get((s, nm.replace("시", "")))
    if not cands: return None
    sgg = [c for c in cands if c["l"] == "sgg"]
    return (sgg or cands)[0]["c"]

# ── 5. 산출 ──────────────────────────────────────────────────────────────────
out = {"generated": datetime.date.today().isoformat(), "national": {"refs": [], "series": {}, "computed": {}},
       "regions": {}, "periods": {"sido": [], "sgg": []}, "method": {}}

# 전국 공식 시계열
le_series = {y: B41[(y, "T6")].get(0) for y in NAT_YEARS if B41[(y, "T6")].get(0)}
out["national"]["series"] = {
    "le": le_series,
    "subj": {y: B46[(y, "T2", "남녀전체")].get(0) for y in B46_YEARS},
    "morb": {y: B46[(y, "T1", "남녀전체")].get(0) for y in B46_YEARS},
}
yl = max(le_series); y46 = max(B46_YEARS)
def sx(itm, sex): return B46[(y46, itm, sex)].get(0)
out["national"]["refs"] = [
    {"id": "le", "label": "기대수명", "org": f"통계청 {yl}년 생명표", "year": yl, "t": le_series[yl], "m": B41[(yl, "T16")].get(0), "f": B41[(yl, "T26")].get(0)},
    {"id": "subj", "label": "주관적 건강평가 기대수명", "org": "통계청 생명표 부가지표(사회조사)", "year": y46, "t": sx("T2", "남녀전체"), "m": sx("T2", "남자"), "f": sx("T2", "여자")},
    {"id": "morb", "label": "유병기간 제외 기대수명", "org": "통계청 생명표 부가지표(사회조사)", "year": y46, "t": sx("T1", "남녀전체"), "m": sx("T1", "남자"), "f": sx("T1", "여자")},
    {"id": "who", "label": "WHO 건강수명(HALE)", "org": "WHO GHE (KOSIS DT_2WH23001)", "year": 2021, "t": 72.5, "m": None, "f": None},
    {"id": "hp2030", "label": "HP2030 건강수명(청구자료 YLD)", "org": "보건복지부·KHEPI", "year": 2018, "t": 70.4, "m": 68.3, "f": 72.4, "note": "2030년 목표 73.3세"},
]

# 전국 보정 검증: 역산 π 로 Sullivan 재계산 → 공식값과 일치해야 함
for y in B46_YEARS:
    yl_ = y if y in NAT_YEARS else max(t for t in NAT_YEARS if t <= y)
    pi, _, _ = nat_pattern(y, AGES_46)
    Lf, lf = nat_lt(yl_); L, l = agg(Lf, AGES_NAT, AGES_46, "sum"), agg(lf, AGES_NAT, AGES_46, "first")
    out["national"]["computed"][str(y)] = {"le": B41[(yl_, "T6")].get(0), "hle": round(sullivan(L, l, pi), 2), "pr": round(100 * sum(L[i] * pi[i] for i in range(len(L))) / sum(L), 1)}
print("전국 역산 검증:", {k: (v["hle"], out["national"]["series"]["subj"][int(k)]) for k, v in out["national"]["computed"].items()})

# 전국 CHS 기준율(시도 인구가중) — 연도별
def chs_nat(year):
    P = POP_SIDO.get(year) or (POP_SIDO[max(POP_SIDO)] if POP_SIDO else {sc: 1.0 for sc in STAT_SIDO})   # 인구 자료 없으면 단순 평균
    acc = w = 0.0
    for sc, nm in STAT_SIDO.items():
        code = next((r["c"] for r in DS["regions"] if r["l"] == "sido" and r["s"] == nm), None)
        v = recog3(code, year) if code else None
        if v is None or sc not in P: continue
        acc += v * P[sc]; w += P[sc]
    return acc / w if w else None

def odds_ratio(code, year):
    v = recog3(code, year); n = chs_nat(year)
    if v is None or n is None: return None
    pu, nu = (100 - v) / 100, (100 - n) / 100
    return (pu / (1 - pu)) / (nu / (1 - nu))

# 시도
for y in SIDO_YEARS:
    if y < 2012: continue
    for (yy, snm, itm) in list(B44):
        if yy != y or itm != "B44T3": continue
        code = sido_code(snm)
        if not code: print("시도 미매핑", snm); continue
        L = [B44[(y, snm, "B44T3")].get(a) for a in AGES_SIDO]; l = [B44[(y, snm, "B44T2")].get(a) for a in AGES_SIDO]
        if None in L[:-1] or None in l[:-1]: continue
        L = [v or 0 for v in L]; l = [v or 0 for v in l]
        pat, y46u, _ = nat_pattern(y, AGES_SIDO); r = odds_ratio(code, y)
        if r is None: continue
        pi = scale_pattern(pat, r)
        hle = sullivan(L, l, pi); le = B44[(y, snm, "B44T6")].get(0) or sum(L) / l[0]
        pr = 100 * sum(a * b for a, b in zip(L, pi)) / sum(L)
        out["regions"].setdefault(code, {"y": {}})["y"][str(y)] = {"le": round(le, 2), "hle": round(hle, 2), "pr": round(pr, 1), "good": round(recog3(code, y), 1), "or": round(r, 3), "pat": y46u}
        out["periods"]["sido"].append(y) if y not in out["periods"]["sido"] else None

# 시군구 (3년 합산, 중심연도)
unmapped = collections.Counter(); n_ok = 0
DST2CODES = collections.defaultdict(set)
for code in {c for (y, c) in list(DEATH) + list(POP) if len(c) == 5}:
    dst = map_stat(code)
    if dst: DST2CODES[dst].add(code)
    else: unmapped[(code, NAMES.get(code))] += 1
# 시도별 보정계수 k: 사망자·인구로 만든 시도 생명표 e0 가 통계청 시도 생명표 e0 와 같아지도록 연령별 사망률을 k배 (raking)
def sido_official_le(code, yc):
    ys = [y for y in SIDO_YEARS if code in out["regions"] and str(y) in out["regions"][code]["y"]]
    if not ys: return None
    y = min(ys, key=lambda t: (abs(t - yc), -t))
    return out["regions"][code]["y"][str(y)]["le"]
KFAC = {}
for sc, snm in STAT_SIDO.items():
    code = next((r["c"] for r in DS["regions"] if r["l"] == "sido" and r["s"] == snm), None)
    for yc in range(2017, 2024):
        pl = pooled({sc}, yc); off = sido_official_le(code, yc) if code else None
        if not pl or not off: continue
        D, P, _ = pl; lo, hi = 0.7, 1.4
        for _ in range(50):
            mid = (lo + hi) / 2
            if chiang_lifetable(AGES_SGG, [d * mid for d in D], P)["e"][0] > off: lo = mid
            else: hi = mid
        KFAC[(sc, yc)] = (lo + hi) / 2
print("시도 보정계수 k 범위", round(min(KFAC.values()), 3), "~", round(max(KFAC.values()), 3))
out["method"]["kfac"] = {f"{STAT_SIDO[sc]}_{yc}": round(k, 4) for (sc, yc), k in KFAC.items()}

for yc in range(2017, 2024):
    for dst, codes in DST2CODES.items():
        pl = pooled(codes, yc)
        if not pl: continue
        D, P, _ = pl
        if sum(D) < 150: continue                                  # 3년 사망자 150명 미만은 불안정 → 제외
        k = KFAC.get((next(iter(codes))[:2], yc), 1.0)
        lt = chiang_lifetable(AGES_SGG, [d * k for d in D], P)
        pat, y46u, _ = nat_pattern(yc, AGES_SGG); r = odds_ratio(dst, yc)
        if r is None: continue
        pi = scale_pattern(pat, r)
        hle = sullivan(lt["L"], lt["l"], pi)
        pr = 100 * sum(a * b for a, b in zip(lt["L"], pi)) / sum(lt["L"])
        # 표본오차 근사: 3년 사망자 수 기반 기대수명 표준오차(Chiang 근사) — 간단히 1/sqrt(D) 스케일
        se = round(1.96 * 4.5 / (sum(D) ** 0.5) * 3, 2)             # 경험식(≈±0.3~1.0세) — 참고용
        out["regions"].setdefault(dst, {"y": {}})["y"][str(yc)] = {"le": round(lt["e"][0], 2), "hle": round(hle, 2), "pr": round(pr, 1), "good": round(recog3(dst, yc), 1), "or": round(r, 3), "d3": int(sum(D)), "ci": se, "pat": y46u, "k": round(k, 3)}
        n_ok += 1
        if yc not in out["periods"]["sgg"]: out["periods"]["sgg"].append(yc)
print("시군구 산출", n_ok, "건 | 미매핑", len(unmapped), list(unmapped)[:15])

out["method"] = {
    "summary": "건강수명 = Sullivan 방식. 전국 연령별 불건강 비율은 통계청 주관적 건강평가 기대여명(사회조사)에서 역산해 공식값과 일치시키고, 지역 차이는 지역사회건강조사 주관적 건강인지율(표준화율 3년 평균)의 불건강 오즈비로 보정. 시도 생명표는 통계청, 시군구 생명표는 사망원인통계·주민등록연앙인구 3년 합산으로 직접 작성(Chiang). 공식 통계가 아닌 연구용 추정치.",
    "notes": ["시군구 값은 3년 합산 사망자 150명 이상 지역만 산출", "일반구가 있는 시는 시 전체 행 기준", "불건강 = '건강하다(매우 좋음·좋음)'에 해당하지 않는 상태"],
}
(ROOT / "data" / "hle.json").write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
print("저장 data/hle.json | 시도", len([c for c in out["regions"] if len(c) == 3 or c == "0071"]), "시군구", len([c for c in out["regions"] if len(c) >= 5]))
