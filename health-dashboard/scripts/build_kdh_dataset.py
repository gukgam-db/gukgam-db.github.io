# -*- coding: utf-8 -*-
"""
지역사회건강조사 DB(질병관리청 자료실 배포, 한림대 김동현 교수 구축 v1.7) → 대시보드 보조 데이터셋 data/kdh_dataset.json

출처 표기: 질병관리청 지역사회건강조사 자료실 https://chs.kdca.go.kr/chs/recsRoom/dataBaseMain.do
선별: 화이트리스트(약 110개). 연도별 헤더 표기가 달라(띄어쓰기·쉼표) 정규화 이름으로 매칭.
변환: 인원·건수는 인구 10만(또는 천) 명당, 검진 판정은 수검인원 대비 %.
사용법: python scripts/kdh_extract.py 후  python scripts/build_kdh_dataset.py
"""
import csv, json, re, sys, collections, datetime
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
KDH = ROOT / "data" / "kdh"
DS = json.loads((ROOT / "data" / "dataset.json").read_text(encoding="utf-8"))
YEARS = list(range(2008, 2025))
SRC = "지역사회건강조사 DB(질병관리청 자료실·한림대 김동현 교수 구축 v1.7)"

def norm(s): return re.sub(r"[\s,·]", "", str(s)).replace("（", "(").replace("）", ")").lower()

# (id, 이름, 영역, bad, 정규화 이름 정규식, 변환, 단위)  변환: None | per100k | per1k | percap | ratio:<분모 정규식>
D1, D2, D3, D4, D5, D6 = "사망률(표준화)", "감염병 발생률", "의료이용·검진", "보건의료자원", "인구·사회·경제", "환경·안전"
SPEC = [
 ("K_MORT_ALL", "총사망 표준화사망률", D1, True, r"^총사망률_표준화사망률_전체$", None, "명/10만명"),
 ("K_MORT_CA", "악성신생물(암) 표준화사망률", D1, True, r"^악성신생물_표준화사망률_전체$", None, "명/10만명"),
 ("K_MORT_STO", "위암 표준화사망률", D1, True, r"^위의?악성신생물_표준화사망률_전체$|^위암_표준화사망률_전체$", None, "명/10만명"),
 ("K_MORT_LIV", "간암 표준화사망률", D1, True, r"^간및간내담관의?악성신[생행]물_표준화사망률_전체$", None, "명/10만명"),
 ("K_MORT_LUNG", "폐암 표준화사망률", D1, True, r"^기관(기관지)?및폐의?악성신생물_표준화사망률_전체$|^폐암_표준화사망률_전체$", None, "명/10만명"),
 ("K_MORT_COL", "대장암 표준화사망률", D1, True, r"^결장직장및항문.*악성신생물_표준화사망률_전체$|^결장,?직장및항문의?악성신생물_표준화사망률_전체$", None, "명/10만명"),
 ("K_MORT_HEART", "심장질환 표준화사망률", D1, True, r"^심장질환_표준화사망률_전체$", None, "명/10만명"),
 ("K_MORT_IHD", "허혈성심장질환 표준화사망률", D1, True, r"^허혈성심장질환_표준화사망률_전체$", None, "명/10만명"),
 ("K_MORT_CVA", "뇌혈관질환 표준화사망률", D1, True, r"^뇌혈관질환_표준화사망률_전체$", None, "명/10만명"),
 ("K_MORT_PNEU", "폐렴 표준화사망률", D1, True, r"^폐렴_표준화사망률_전체$", None, "명/10만명"),
 ("K_MORT_DM", "당뇨병 표준화사망률", D1, True, r"^당뇨병_표준화사망률_전체$", None, "명/10만명"),
 ("K_MORT_ALZ", "알츠하이머병 표준화사망률", D1, True, r"^알츠하이머병_표준화사망률_전체$", None, "명/10만명"),
 ("K_MORT_HTN", "고혈압성질환 표준화사망률", D1, True, r"^고혈압성질환_표준화사망률_전체$", None, "명/10만명"),
 ("K_MORT_LIVD", "간질환 표준화사망률", D1, True, r"^간질환_표준화사망률_전체$", None, "명/10만명"),
 ("K_MORT_COPD", "만성하기도질환 표준화사망률", D1, True, r"^만성하기도질환_표준화사망률_전체$", None, "명/10만명"),
 ("K_MORT_SUI", "고의적 자해(자살) 표준화사망률", D1, True, r"^고의적자해(\(자살\))?_표준화사망률_전체$", None, "명/10만명"),
 ("K_MORT_TRA", "운수사고 표준화사망률", D1, True, r"^운수사고_표준화사망률_전체$", None, "명/10만명"),
 ("K_MORT_FALL", "추락(낙상) 표준화사망률", D1, True, r"^낙상추락_표준화사망률_전체$|^추락_표준화사망률_전체$", None, "명/10만명"),
 ("K_MORT_SEP", "패혈증 표준화사망률", D1, True, r"^패혈증_표준화사망률_전체$", None, "명/10만명"),
 ("K_MORT_TB", "호흡기결핵 표준화사망률", D1, True, r"^호흡기결핵_표준화사망률_전체$", None, "명/10만명"),
 ("K_MORT_HOM", "가해(타살) 표준화사망률", D1, True, r"^가해(\(타살\))?_표준화사망률_전체$", None, "명/10만명"),
 ("K_MORT_INF", "영아사망률", D1, True, r"^영아사망률", None, "명/출생천명"),
 ("K_INF_VAR", "수두 발생률", D2, True, r"^수두_발생률$", None, "명/10만명"),
 ("K_INF_MUMPS", "유행성이하선염 발생률", D2, True, r"^유행성이하선염_발생률$", None, "명/10만명"),
 ("K_INF_HAV", "A형간염 발생률", D2, True, r"^a형간염_발생률$", None, "명/10만명"),
 ("K_INF_TSU", "쯔쯔가무시증 발생률", D2, True, r"^쯔쯔가무시증_발생률$", None, "명/10만명"),
 ("K_INF_MAL", "말라리아 발생률", D2, True, r"^말라리아_발생률$", None, "명/10만명"),
 ("K_INF_SCA", "성홍열 발생률", D2, True, r"^성홍[열렬]_발생률$", None, "명/10만명"),
 ("K_INF_PER", "백일해 발생률", D2, True, r"^백일해_발생률$", None, "명/10만명"),
 ("K_INF_HFRS", "신증후군출혈열 발생률", D2, True, r"^신증후군출혈열_발생률$", None, "명/10만명"),
 ("K_INF_LEG", "레지오넬라증 발생률", D2, True, r"^레지오넬라증_발생률$", None, "명/10만명"),
 ("K_INF_SYP", "매독(1기) 발생률", D2, True, r"^매독1기_발생률$", None, "명/10만명"),
 ("K_INF_TYP", "장티푸스 발생률", D2, True, r"^장티푸스_발생률$", None, "명/10만명"),
 ("K_INF_TBN", "결핵 신환자 신고율", D2, True, r"^결핵신고신환자현황$|^결핵신환자", "per100k", "명/10만명"),
 ("K_USE_PT", "의료기관 진료실인원(인구 천명당)", D3, True, r"^의료기관진료실인원_전체$", "per1k", "명/천명"),
 ("K_USE_COST", "1인당 의료기관 진료비", D3, True, r"^의료기관진료비_전체$", "percap", "원"),
 ("K_USE_HTN", "고혈압 진료실인원(천명당)", D3, True, r"^고혈압_진료실인원$", "per1k", "명/천명"),
 ("K_USE_DM", "당뇨병 진료실인원(천명당)", D3, True, r"^당뇨병_진료실인원$", "per1k", "명/천명"),
 ("K_USE_MENT", "정신질환 진료실인원(천명당)", D3, True, r"^정신질환_진료실인원$", "per1k", "명/천명"),
 ("K_USE_ARTH", "관절염 진료실인원(천명당)", D3, True, r"^관절염_진료실인원$", "per1k", "명/천명"),
 ("K_USE_PERIO", "치주질환 진료실인원(천명당)", D3, True, r"^치주질환_진료실인원$", "per1k", "명/천명"),
 ("K_USE_LIV", "간질환 진료실인원(천명당)", D3, True, r"^간질환_진료실인원$", "per1k", "명/천명"),
 ("K_USE_STO", "위암 진료실인원(10만명당)", D3, True, r"^위암_진료실인원$", "per100k", "명/10만명"),
 ("K_USE_LUNG", "폐암 진료실인원(10만명당)", D3, True, r"^폐암_진료실인원$", "per100k", "명/10만명"),
 ("K_USE_COL", "대장암 진료실인원(10만명당)", D3, True, r"^대장암_진료실인원$", "per100k", "명/10만명"),
 ("K_USE_BRE", "유방암 진료실인원(10만명당)", D3, True, r"^유방암_진료실인원$", "per100k", "명/10만명"),
 ("K_CHK_RATE", "일반건강검진(1차) 수검률", D3, False, r"^1차검진수검인원_전체$", "ratio:^1차검진대상인원_전체$", "%"),
 ("K_CHK_NORMA", "검진 판정 정상A 비율", D3, False, r"^정상a$", "ratio:^1차검진수검인원_전체$", "%"),
 ("K_CHK_DIS", "검진 판정 유질환자 비율", D3, True, r"^유질환자$", "ratio:^1차검진수검인원_전체$", "%"),
 ("K_CHK_HTN", "검진 고혈압 판정 비율", D3, True, r"^고혈압_고혈압$", "ratio:^1차검진수검인원_전체$", "%"),
 ("K_CHK_DM", "검진 당뇨병 판정 비율", D3, True, r"^당뇨병_당뇨병$", "ratio:^1차검진수검인원_전체$", "%"),
 ("K_RES_DOC", "의사 수(10만명당)", D4, False, r"^의사수$", "per100k", "명/10만명"),
 ("K_RES_DENT", "치과의사 수(10만명당)", D4, False, r"^치과의사수$", "per100k", "명/10만명"),
 ("K_RES_KM", "한의사 수(10만명당)", D4, False, r"^한의사수$", "per100k", "명/10만명"),
 ("K_RES_PHARM", "약사 수(10만명당)", D4, False, r"^약사수$", "per100k", "명/10만명"),
 ("K_RES_NURSE", "간호사 수(10만명당)", D4, False, r"^간호사수?$", "per100k", "명/10만명"),
 ("K_RES_BED", "병상 수(천명당)", D4, False, r"^병상수_계$", "per1k", "병상/천명"),
 ("K_RES_CLINIC", "의원 수(10만명당)", D4, False, r"^의원_합계$", "per100k", "개/10만명"),
 ("K_RES_EM", "응급의학과 전문의(10만명당)", D4, False, r"^응급의학과전문의$", "per100k", "명/10만명"),
 ("K_RES_IM", "내과 전문의(10만명당)", D4, False, r"^내과전문의$", "per100k", "명/10만명"),
 ("K_RES_PSY", "정신건강의학과 전문의(10만명당)", D4, False, r"^정신건강의학과전문의$", "per100k", "명/10만명"),
 ("K_RES_OB", "산부인과 전문의(10만명당)", D4, False, r"^산부인과전문의$", "per100k", "명/10만명"),
 ("K_RES_PED", "소아청소년과 전문의(10만명당)", D4, False, r"^소아청소년과전문의$|^소아과전문의$", "per100k", "명/10만명"),
 ("K_RES_PHCDOC", "보건소 의사 인력(10만명당)", D4, False, r"^보건소인력_의사$", "per100k", "명/10만명"),
 ("K_RES_WELF", "노인천명당 노인여가복지시설 수", D4, False, r"^노인천명당노인여가복지시설수$", None, "개/천명"),
 ("K_RES_CULT", "인구 10만명당 문화기반시설 수", D4, False, r"^인구십만명당문화기반시설수$|^인구10만명당문화기반시설수$", None, "개/10만명"),
 ("K_RES_SOC", "인구 10만명당 사회복지시설 수", D4, False, r"^인구십만명당사회복지시설수$|^인구10만명당사회복지시설수$", None, "개/10만명"),
 ("K_POP_AGED", "고령인구비율(65세 이상)", D5, None, r"^고령인구비율$", None, "%"),
 ("K_POP_GROW", "인구증가율", D5, None, r"^인구증가율$", None, "%"),
 ("K_POP_TFR", "합계출산율", D5, False, r"^합계출산율$", None, "명"),
 ("K_POP_CBR", "조출생률", D5, False, r"^조출생률$", None, "명/천명"),
 ("K_POP_EXT", "지방소멸위험지수", D5, False, r"^소멸위험지수$", None, "지수"),
 ("K_POP_DENS", "인구밀도", D5, None, r"^인구밀도$", None, "명/km²"),
 ("K_POP_AGE", "평균연령", D5, None, r"^평균연령_전체$", None, "세"),
 ("K_POP_URB", "도시지역인구비율", D5, None, r"^도시지역인구비율$", None, "%"),
 ("K_POP_DIS", "등록장애인 비율(천명당)", D5, None, r"^등록장애인수_합계$", "per1k", "명/천명"),
 ("K_POP_BLS", "국민기초생활보장수급자 비율(천명당)", D5, True, r"^국민기초생활보장수급자$", "per1k", "명/천명"),
 ("K_POP_ONE", "1인가구 비율", D5, None, r"^1인가구율_전체$", None, "%"),
 ("K_ECO_FIN", "재정자립도", D5, False, r"^재정자립도$", None, "%"),
 ("K_ECO_FIN2", "재정자주도", D5, False, r"^재정자주도$", None, "%"),
 ("K_ECO_UNEMP", "실업률", D5, True, r"^실업률$", None, "%"),
 ("K_ECO_EMP", "고용률", D5, False, r"^고용률$", None, "%"),
 ("K_ECO_YEMP", "청년고용률", D5, False, r"^청년고용률$", None, "%"),
 ("K_ECO_LFP", "경제활동참가율", D5, False, r"^경제활동참가율$", None, "%"),
 ("K_ECO_BIZ", "인구 천명당 사업체 수", D5, False, r"^인구천명당사업체수$", None, "개/천명"),
 ("K_ECO_HOME", "주택소유율", D5, False, r"^주택소유율$", None, "%"),
 ("K_ENV_WATER", "상수도보급률", D6, False, r"^상수도보급률$", None, "%"),
 ("K_ENV_SEWER", "하수도보급률", D6, False, r"^하수도보급률$", None, "%"),
 ("K_ENV_ROAD", "도로포장률", D6, False, r"^도로포장률$", None, "%"),
 ("K_ENV_PARKN", "인구 천명당 공원 수", D6, False, r"^인구천명당공원개수$", None, "개/천명"),
 ("K_ENV_PARKA", "인구 천명당 도시공원 조성면적", D6, False, r"^인구천명당도시공원조성면적$", None, "㎡/천명"),
 ("K_ENV_SPORT", "인구 천명당 체육시설 수", D6, False, r"^인구천명당체육시설수$", None, "개/천명"),
 ("K_ENV_FOREST", "산림면적비율", D6, None, r"^산림면적비율$", None, "%"),
 ("K_ENV_EMPTY", "빈집비율", D6, True, r"^빈집비율$", None, "%"),
 ("K_ENV_OLD", "노후주택비율", D6, True, r"^노후주택비율$", None, "%"),
 ("K_ENV_PM10", "미세먼지(PM10) 연평균 농도", D6, True, r"^미세먼지\(?p?pm-?10\)?대기오염도변화(추이)?$", None, "㎍/㎥"),
 ("K_ENV_PM25", "초미세먼지(PM2.5) 연평균 농도", D6, True, r"^미세먼지\(?pm-?2\.?5\)?대기오염도변화(추이)?$", None, "㎍/㎥"),
 ("K_ENV_TEMP", "연평균 기온", D6, None, r"^평균기온$", None, "℃"),
 ("K_ENV_RAIN", "연 강수량", D6, None, r"^합계강수량$", None, "mm"),
 ("K_SAF_TCI", "교통문화지수", D6, False, r"^교통문화지수$", None, "점"),
 ("K_SAF_TSI", "교통안전지수", D6, False, r"^교통안전지수$", None, "점"),
 ("K_SAF_G_FIRE", "지역안전등급 화재(1=최상)", D6, True, r"^지역안전등급_화재$", None, "등급"),
 ("K_SAF_G_TRAF", "지역안전등급 교통사고(1=최상)", D6, True, r"^지역안전등급_교통(사고)?$", None, "등급"),
 ("K_SAF_G_CRIME", "지역안전등급 범죄(1=최상)", D6, True, r"^지역안전등급_범죄$", None, "등급"),
 ("K_SAF_G_ACC", "지역안전등급 생활안전(1=최상)", D6, True, r"^지역안전등급_(안전사고|생활안전)$", None, "등급"),
 ("K_SAF_G_SUI", "지역안전등급 자살(1=최상)", D6, True, r"^지역안전등급_자살$", None, "등급"),
 ("K_SAF_G_INF", "지역안전등급 감염병(1=최상)", D6, True, r"^지역안전등급_감염병$", None, "등급"),
 ("K_SAF_TA", "인구 10만명당 교통사고 건수", D6, True, r"^인구10만명당교통사고_사고건수$", None, "건/10만명"),
 ("K_SAF_TADEATH", "교통사고 사망자(10만명당)", D6, True, r"^교통사고_사망사고_사망자수$", "per100k", "명/10만명"),
 ("K_SAF_PED", "보행 교통사고 사망자(10만명당)", D6, True, r"^보행교통사고_사망자수$", "per100k", "명/10만명"),
 ("K_SAF_ELD", "노인 교통사고 사망자(10만명당)", D6, True, r"^노인교통사고_사망자수$", "per100k", "명/10만명"),
 ("K_SAF_BELT", "안전띠 착용률(전좌석)", D6, False, r"^운전행태_안전띠착용률\(전좌석\)$", None, "%"),
 ("K_SAF_STOP", "횡단보도 정지선 준수율", D6, False, r"^운전행태_횡단보도정지선준수율$", None, "%"),
 ("K_SAF_SIG", "보행자 횡단보도 신호준수율", D6, False, r"^보행행태_횡단보도신호준수율$", None, "%"),
 ("K_EDU_RATIO", "교원 1인당 학생 수", D5, None, r"^교원1인당학생수$", None, "명"),
]
POP = r"^총인구수$"
need_pat = [re.compile(s[4]) for s in SPEC] + [re.compile(POP)] + [re.compile(s[5].split(":", 1)[1]) for s in SPEC if s[5] and s[5].startswith("ratio:")]

# ── 지역 매핑 ──
SIDO = {"서울특별시": "서울", "부산광역시": "부산", "대구광역시": "대구", "인천광역시": "인천", "광주광역시": "광주", "대전광역시": "대전", "울산광역시": "울산", "세종특별자치시": "세종", "경기도": "경기", "강원도": "강원", "강원특별자치도": "강원", "충청북도": "충북", "충청남도": "충남", "전라북도": "전북", "전북특별자치도": "전북", "전라남도": "전남", "경상북도": "경북", "경상남도": "경남", "제주특별자치도": "제주", "제주도": "제주"}
SGG = {(r["s"], r["n"]): r["c"] for r in DS["regions"] if r["l"] == "sgg"}
SUB = {(r["s"], r["n"]): r["c"] for r in DS["regions"] if r["l"] == "sub"}
SIDOC = {r["s"]: r["c"] for r in DS["regions"] if r["l"] == "sido"}
SUBFIX = {"마산합포구": "마산", "마산회원구": "마산", "진해구": "진해", "의창구": "창원", "성산구": "창원"}
ALIAS = {"남구": {"인천": "미추홀구"}, "통합창원시": {"경남": "창원시"}, "통합청주시": {"충북": "청주시"}, "여주군": {"경기": "여주시"}, "당진군": {"충남": "당진시"},
         "용인시처인구": {"경기": "처인구"}, "용인시기흥구": {"경기": "기흥구"}, "용인시수지구": {"경기": "수지구"}}
def region_code(sido, sgg):
    s = SIDO.get(str(sido).strip()); g = str(sgg).strip()
    g = ALIAS.get(g, {}).get(s, g)
    g = re.sub(r"^통합창원시", "", g)                                   # 통합창원시의창구 → 의창구
    if s == "제주": g = re.sub(r"^(제주시|서귀포시).*$", r"\1", g)      # '제주시제주     ' → 제주시
    if not s: return None
    if g == str(sido).strip() or g in SIDO: return SIDOC[s]
    if s == "세종": return "00711"
    if s == "제주" and g == "제주시": return "01600A"
    if s == "제주" and g == "서귀포시": return "01600"
    if (s, g) in SGG: return SGG[(s, g)]
    tail = g.split()[-1] if " " in g else g
    tail = SUBFIX.get(tail, tail)
    if (s, tail) in SUB: return SUB[(s, tail)]
    return None

RIDX = {r["c"]: i for i, r in enumerate(DS["regions"])}
# ── 값 적재: 필요한 지표만 ──
def num(v):
    try: return float(str(v).replace(",", "").replace("등급", ""))
    except: return None
data = {y: collections.defaultdict(dict) for y in YEARS}      # y -> code -> {normname: value}
unmapped = collections.Counter(); matched_names = collections.defaultdict(set)
for y in YEARS:
    with open(KDH / f"values_{y}.csv", encoding="utf-8-sig") as f:
        r = csv.reader(f); next(r)
        cache = {}
        for code, sido, sgg, region, name, val in r:
            n = norm(name)
            if n not in cache: cache[n] = any(p.search(n) for p in need_pat)
            if not cache[n]: continue
            rc = region_code(sido, sgg)
            if not rc: unmapped[(sido, sgg)] += 1; continue
            v = num(val)
            if v is None: continue
            data[y][rc][n] = v; matched_names[n].add(y)
print("미매핑 지역(행 수):", unmapped.most_common(12))

def pick(rowvals, pat):
    for n, v in rowvals.items():
        if pat.search(n): return v
    return None

out = {"generated": datetime.date.today().isoformat(), "source": {"name": SRC, "url": "https://chs.kdca.go.kr/chs/recsRoom/dataBaseMain.do"}, "domains": [D1, D2, D3, D4, D5, D6], "indicators": [], "values": {}}
codes = [r["c"] for r in DS["regions"]]
missing = []
for (iid, name, dom, bad, pat, tr, unit) in SPEC:
    P = re.compile(pat); den = re.compile(tr.split(":", 1)[1]) if tr and tr.startswith("ratio:") else None
    grid = []; yrs = []
    for y in YEARS:
        row = []; any_ = False
        for c in codes:
            rv = data[y].get(c); v = pick(rv, P) if rv else None
            if v is not None and tr:
                if tr == "per100k": pop = pick(rv, re.compile(POP)); v = v / pop * 1e5 if pop else None
                elif tr == "per1k": pop = pick(rv, re.compile(POP)); v = v / pop * 1e3 if pop else None
                elif tr == "percap": pop = pick(rv, re.compile(POP)); v = v / pop if pop else None
                elif den is not None: d = pick(rv, den); v = v / d * 100 if d else None
            if v is not None: any_ = True; row.append(int(round(v * 10)))
            else: row.append(None)
        if any_: grid.append(row); yrs.append(y)
    if len(yrs) < 3: missing.append((iid, name, len(yrs))); continue
    out["indicators"].append({"id": iid, "name": name, "domain": dom, "bad": bad, "unit": unit, "years": yrs, "src": f"{SRC} · 원자료명 「{name}」", "outcome": True, "kdh": True})
    out["values"][iid] = {"crude": grid, "std": grid}
print("지표", len(out["indicators"]), "| 제외(연도 부족)", missing)
(ROOT / "data" / "kdh_dataset.json").write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
print("저장 data/kdh_dataset.json", (ROOT / "data" / "kdh_dataset.json").stat().st_size // 1024, "KB")
for i in out["indicators"][:8] + out["indicators"][-4:]:
    print(" ", i["id"], i["name"], i["years"][0], "~", i["years"][-1], len(i["years"]), "년")
