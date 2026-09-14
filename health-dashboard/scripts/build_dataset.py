# -*- coding: utf-8 -*-
"""
v3 데이터셋 빌드: data/raw/*.json (KOSIS 원본) → data/dataset.json (앱 내장용)

구성:
  regions   : KOSIS 지역 계층 (시도 17 · 시군구 230 · 보건소 세부단위 44)
  indicators: 큐레이션된 41개 지표 (영역, 방향, 수록연도)
  values    : 지표별 {crude: 조율, std: 표준화율} — [연도][지역] 정수(×10), 결측 null
  geo       : 시군구 TopoJSON(2018 통계청 경계) + 폴리곤→KOSIS 지역코드 매핑

사용법: python scripts/build_dataset.py
"""
import json, sys, time, re
from pathlib import Path
from collections import defaultdict

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
RAW = DATA / "raw"
GEO = DATA / "geo"

# (표ID, 표시명, 영역, 방향)  방향: True=낮을수록 양호, False=높을수록 양호, None=중립
INDICATORS = [
    ("DT_H_SM",                      "현재흡연율",                     "흡연",       True),
    ("DT_H_SM_MALE",                 "남자 현재흡연율",                "흡연",       True),
    ("DT_TOBACCO_PRODUCT",           "담배제품 현재사용률",            "흡연",       True),
    ("DT_SM_TRY_V2",                 "금연시도율",                     "흡연",       False),
    ("DT_117075_SM_IND_WORK_V2",     "직장실내 간접흡연 노출률",       "흡연",       True),
    ("DT_H_DR_MONTH",                "월간음주율",                     "음주",       True),
    ("DT_117075_H_DR_HIGH_WH",       "고위험음주율",                   "음주",       True),
    ("DT_H_DR_HIGH",                 "연간음주자의 고위험음주율",      "음주",       True),
    ("DT_117075_H_DR_DRIV",          "연간 음주운전 경험률",           "음주",       True),
    ("DT_H_EX_WALK",                 "걷기 실천율",                    "신체활동",   False),
    ("DT_H_EX_PHY",                  "중강도 이상 신체활동 실천율",    "신체활동",   False),
    ("DT_117075_H_HEALTHY",          "건강생활실천율",                 "신체활동",   False),
    ("DT_H_OBE_OBE",                 "비만율(자가보고)",               "식생활·비만", True),
    ("DT_H_OBE_CONTROL",             "연간 체중조절 시도율",           "식생활·비만", False),
    ("DT_117075_DIE_BF02",           "아침식사 실천율",                "식생활·비만", False),
    ("DT_11775_NUT_LABEL_UTIL",      "영양표시 활용률",                "식생활·비만", False),
    ("DT_H_MENTAL_STRESS",           "스트레스 인지율",                "정신건강",   True),
    ("DT_H_MENTAL_DEPRESS",          "연간 우울감 경험률",             "정신건강",   True),
    ("DT_117075_H_MENTAL_DEPRESS_SYM", "우울증상 유병률",              "정신건강",   True),
    ("DT_H_OR_BRUSH",                "점심식사 후 칫솔질 실천율",      "구강건강",   False),
    ("DT_H_OR_INCONV",               "저작불편호소율(65세 이상)",      "구강건강",   True),
    ("DT_HYPER_DOCTOR",              "고혈압 진단 경험률(30세 이상)",  "만성질환",   True),
    ("DT_HYPER_DOCTOR_DRUG",         "고혈압 진단 경험자의 치료율",    "만성질환",   False),
    ("DT_DIA_DOCTOR",                "당뇨병 진단 경험률(30세 이상)",  "만성질환",   True),
    ("DT_DIA_TREAT",                 "당뇨병 진단 경험자의 치료율",    "만성질환",   False),
    ("DT_DIA_EYE",                   "당뇨병 안저검사 수진율",         "만성질환",   False),
    ("DT_DIA_KIDNEY",                "당뇨병 미세단백뇨검사 수진율",   "만성질환",   False),
    ("DT_117075_HYPER_AWAR",         "혈압수치 인지율",                "만성질환",   False),
    ("DT_117075_DIA_AWAR",           "혈당수치 인지율",                "만성질환",   False),
    ("DT_117075_STR_EARLY_SYM",      "뇌졸중 조기증상 인지율",         "만성질환",   False),
    ("DT_117075_MYO_EARLY_SYM",      "심근경색증 조기증상 인지율",     "만성질환",   False),
    ("DT_INFLUENZA",                 "인플루엔자 예방접종률",          "예방·안전",  False),
    ("DT_CPR_EDU",                   "심폐소생술 교육경험률",          "예방·안전",  False),
    ("DT_CPR_AWAR",                  "심폐소생술 인지율",              "예방·안전",  False),
    ("DT_H_BELT",                    "운전자석 안전벨트 착용률",       "예방·안전",  False),
    ("DT_117075_H_BELT_BACK",        "뒷좌석 안전벨트 착용률",         "예방·안전",  False),
    ("DT_H_HAND_WASH",               "외출 후 손 씻기 실천율",         "예방·안전",  False),
    ("DT_H_SOAP_USE",                "비누·손세정제 사용률",           "예방·안전",  False),
    ("DT_117075_NECE_NTR02",         "연간 미충족의료율",              "의료이용",   True),
    ("DT_NECE_CLINIC",               "연간 보건기관 이용률",           "의료이용",   None),
    ("DT_HEALTH_RECOG",              "주관적 건강인지율",              "의료이용",   False),
]
DOMAIN_ORDER = ["흡연", "음주", "신체활동", "식생활·비만", "정신건강", "구강건강",
                "만성질환", "예방·안전", "의료이용"]

# TopoJSON 코드 앞 2자리 → KOSIS 시도 코드
TOPO_SIDO = {"11": "001", "21": "002", "22": "003", "23": "004", "24": "005", "25": "006",
             "26": "007", "29": "0071", "31": "008", "32": "009", "33": "010", "34": "011",
             "35": "012", "36": "013", "37": "014", "38": "015", "39": "016"}
SIDO_SHORT = {"서울특별시": "서울", "부산광역시": "부산", "대구광역시": "대구", "인천광역시": "인천",
              "광주광역시": "광주", "대전광역시": "대전", "울산광역시": "울산", "세종특별자치시": "세종",
              "경기도": "경기", "강원특별자치도": "강원", "강원도": "강원", "충청북도": "충북",
              "충청남도": "충남", "전북특별자치도": "전북", "전라북도": "전북", "전라남도": "전남",
              "경상북도": "경북", "경상남도": "경남", "제주특별자치도": "제주"}
# 폴리곤 이름 → KOSIS 세부단위 이름 (창원시는 보건소가 마산/진해/창원 3개)
POLY_SPECIAL = {"창원시마산합포구": ("창원시", "마산"), "창원시마산회원구": ("창원시", "마산"),
                "창원시진해구": ("창원시", "진해"), "창원시의창구": ("창원시", "창원"),
                "창원시성산구": ("창원시", "창원")}
MULTI = re.compile(r"^(.+?시)(.+구)$")


def level_of(code):
    return "sido" if len(code) <= 4 else ("sub" if len(code) == 7 else "sgg")


def parent_of(code):
    if len(code) <= 4:
        return None
    return code[:5] if len(code) == 7 else (code[:3] if not code.startswith("0071") else "0071")


def sido_of(code):
    return "0071" if code.startswith("0071") else code[:3]


def to_int(v):
    try:
        return int(round(float(v) * 10))
    except (TypeError, ValueError):
        return None


def main():
    # ---------- 1. 원본 적재 · 지역 사전 ----------
    regions = {}
    per_ind = {}
    for tbl, name, domain, bad in INDICATORS:
        f = RAW / f"{tbl}.json"
        if not f.exists():
            print(f"  [누락] raw/{tbl}.json — 건너뜀")
            continue
        rows = json.loads(f.read_text(encoding="utf-8"))
        for r in rows:
            regions.setdefault(r["C1"], r["C1_NM"].strip())
        per_ind[tbl] = rows
    if not per_ind:
        sys.exit("raw 데이터가 없습니다 — scripts/kosis_fetch_all.py 먼저 실행")

    codes = sorted(regions, key=lambda c: (sido_of(c), len(c), c))
    idx = {c: i for i, c in enumerate(codes)}
    sido_name = {c: regions[c] for c in codes if level_of(c) == "sido"}
    region_list = [{"c": c, "n": regions[c], "l": level_of(c), "p": parent_of(c),
                    "s": SIDO_SHORT.get(sido_name.get(sido_of(c), ""), "")} for c in codes]
    print(f"지역 {len(codes)}개: 시도 {sum(1 for r in region_list if r['l']=='sido')} · "
          f"시군구 {sum(1 for r in region_list if r['l']=='sgg')} · 세부 {sum(1 for r in region_list if r['l']=='sub')}")

    # ---------- 2. 지표별 값 행렬 ----------
    years_all = sorted({r["PRD_DE"][:4] for rows in per_ind.values() for r in rows})
    ind_meta, values = [], {}
    for tbl, name, domain, bad in INDICATORS:
        rows = per_ind.get(tbl)
        if not rows:
            continue
        yrs = sorted({r["PRD_DE"][:4] for r in rows})
        mats = {}
        for key, item in (("crude", "조율"), ("std", "표준화율")):
            m = [[None] * len(codes) for _ in yrs]
            yi = {y: i for i, y in enumerate(yrs)}
            for r in rows:
                if r["ITM_NM"] != item:
                    continue
                m[yi[r["PRD_DE"][:4]]][idx[r["C1"]]] = to_int(r["DT"])
            mats[key] = m
        unit = next((r["UNIT_NM"] for r in rows if r.get("UNIT_NM")), "%")
        filled = sum(1 for row in mats["crude"] for v in row if v is not None)
        ind_meta.append({"id": tbl, "name": name, "domain": domain, "bad": bad,
                         "unit": unit, "years": [int(y) for y in yrs],
                         "src": rows[0].get("TBL_NM", "")})
        values[tbl] = mats
        print(f"  {name}: {yrs[0]}–{yrs[-1]} 셀 {filled}")

    # ---------- 3. 지도 매핑 ----------
    topo = json.loads((GEO / "sigungu_2018_topo.json").read_text(encoding="utf-8"))
    geoms = list(topo["objects"].values())[0]["geometries"]
    by_sido_sgg = defaultdict(dict)   # sido → {이름: code}
    subs = defaultdict(dict)          # sgg code → {세부이름: code}
    for r in region_list:
        if r["l"] == "sgg":
            by_sido_sgg[sido_of(r["c"])][r["n"]] = r["c"]
        elif r["l"] == "sub":
            subs[r["p"]][r["n"]] = r["c"]
    name_global = defaultdict(list)
    for r in region_list:
        if r["l"] == "sgg":
            name_global[r["n"]].append(r["c"])

    # 최신 연도에 값이 있는 코드를 앞세우기 위한 가용성 점수 (행정구역 변경 대응)
    avail = defaultdict(int)
    for tbl, mats in values.items():
        for i, v in enumerate(mats["crude"][-1]):
            if v is not None:
                avail[codes[i]] += 1

    # 폴리곤 이름 → 후보 KOSIS 코드 목록. 앱은 해당 연도에 값이 있는 첫 후보를 사용
    RENAME = {("004", "남구"): "미추홀구"}      # 인천 남구 → 미추홀구(2018)
    ALT = {"세종시": ["00711", "0071"], "제주시": ["01600A", "01603"], "서귀포시": ["01600", "01601"]}
    geo_map, unmapped = {}, []
    for g in geoms:
        code, pname = g["properties"]["code"], g["properties"]["name"]
        sido = TOPO_SIDO[code[:2]]
        pname = RENAME.get((sido, pname), pname)
        cands = []
        if pname in ALT:
            cands = [c for c in ALT[pname] if c in idx]
        elif pname in POLY_SPECIAL:
            city, sub = POLY_SPECIAL[pname]
            city_code = by_sido_sgg[sido].get(city)
            cands = [c for c in (subs.get(city_code, {}).get(sub), city_code) if c]
        elif pname in by_sido_sgg[sido]:
            cands = [by_sido_sgg[sido][pname]]
        else:
            m = MULTI.match(pname)
            if m and m.group(1) in by_sido_sgg[sido]:
                city_code = by_sido_sgg[sido][m.group(1)]
                cands = [c for c in (subs.get(city_code, {}).get(m.group(2)), city_code) if c]
        # 같은 이름이 다른 시도에도 있으면(군위군: 경북→대구 이관) 후보에 추가
        for c in name_global.get(pname, []):
            if c not in cands:
                cands.append(c)
        cands.sort(key=lambda c: -avail[c])
        if cands:
            geo_map[code] = cands
            g["properties"] = {"code": code, "name": pname}   # 불필요 속성 제거
        else:
            unmapped.append((code, pname))
    print(f"지도 폴리곤 {len(geoms)}개 중 매핑 {len(geo_map)}개, 미매핑 {unmapped}")

    # 폴리곤이 없는 시군구(=지도에 못 그리는 지역) 점검
    mapped_targets = {c for cs in geo_map.values() for c in cs}
    no_poly = [r for r in region_list if r["l"] == "sgg" and r["c"] not in mapped_targets
               and not any(s in mapped_targets for s in subs.get(r["c"], {}).values())]
    print(f"폴리곤 없는 시군구 {len(no_poly)}개: {[r['s']+' '+r['n'] for r in no_poly][:20]}")

    out = {
        "generated": time.strftime("%Y-%m-%d"),
        "years": [int(y) for y in years_all],
        "domains": DOMAIN_ORDER,
        "regions": region_list,
        "indicators": ind_meta,
        "values": values,
        "geo": {"topo": topo, "map": geo_map},
    }
    p = DATA / "dataset.json"
    p.write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"→ {p} ({p.stat().st_size/1e6:.2f} MB)")


if __name__ == "__main__":
    main()
