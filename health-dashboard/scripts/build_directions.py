# -*- coding: utf-8 -*-
"""
지표 방향성 확정표 → data/directions.json  (근거: docs/지표_방향성_v1.md)
dir: good(높을수록 좋음) | bad(높을수록 나쁨) | ctx(방향 없음·맥락)
규칙 요약
 R1 인구 구성·규모·기후 지표는 예외 없이 맥락 (CHR Demographics, AHR 비가중, ECHI 인구장, 국가지표체계 가치판단 없음)
 R2 의료이용 총량·진료비는 맥락 (OECD "better/worse로 분류 불가", HP2030 성과지표 아님, 격차의 대부분이 인구구조·건강수준)
 R3 질환별 진료인원은 유병률 대리로 나쁨 (PLACES·HP2030·ECHI·Urban HEART), 단 치료 확대가 목표인 정신질환은 맥락
 R4 보건의료 인력·시설(의사·간호사·의원·전문의·복지시설)은 좋음 (국가지표체계 "많을수록 의료복지 수준 높음", CHR 역코딩, SDG 3.c.1); 병상은 과잉 우려로 맥락(OECD·e-나라지표)
 R5 검진·예방접종·준수율 등 예방적 접점은 좋음, 판정 유병 비율은 나쁨(수검률 의존 주석)
 R6 지수는 지수의 정의를 따름 (지역안전등급 1등급 최상 → 숫자 낮을수록 좋음, 교통문화·교통안전지수 높을수록 좋음, 소멸위험지수 높을수록 안전)
 R7 국내 체계가 방향을 명시한 경우 국내 체계 우선 (재정자립도↑, 교원 1인당 학생수↓, 하수도 보급률↑)
"""
import json, datetime
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
R = {
 "CHR": {"name": "County Health Rankings 2025 기술문서", "url": "https://www.countyhealthrankings.org/sites/default/files/media/document/CHRR%20Technical%20Documentation%202025_2.pdf"},
 "CHR_DEMO": {"name": "CHR Demographics(65세 이상)", "url": "https://www.countyhealthrankings.org/health-data/community-conditions/demographics/demographics/65-and-older"},
 "CHR_DIS": {"name": "CHR Disability(Demographics)", "url": "https://www.countyhealthrankings.org/health-data/community-conditions/demographics/demographics/disability-functional-limitations"},
 "CHR_HOME": {"name": "CHR Homeownership", "url": "https://www.countyhealthrankings.org/health-data/community-conditions/physical-environment/housing-and-transportation/homeownership"},
 "CHR_EX": {"name": "CHR Access to Exercise Opportunities", "url": "https://www.countyhealthrankings.org/health-data/community-conditions/health-infrastructure/health-promotion-and-harm-reduction/access-to-exercise-opportunities"},
 "CHR_PM": {"name": "CHR Air Pollution PM2.5", "url": "https://www.countyhealthrankings.org/health-data/community-conditions/physical-environment/air-water-and-land/air-pollution-particulate-matter"},
 "CHR_CLIM": {"name": "CHR Adverse Climate Events", "url": "https://www.countyhealthrankings.org/health-data/community-conditions/physical-environment/climate/adverse-climate-events"},
 "AHR": {"name": "America's Health Rankings 2025 지표표", "url": "https://assets.americashealthrankings.org/ahr_2025annual_measurestable_final-web.pdf"},
 "PLACES_OUT": {"name": "CDC PLACES Health Outcomes", "url": "https://www.cdc.gov/places/measure-definitions/health-outcomes.html"},
 "PLACES_PREV": {"name": "CDC PLACES Prevention", "url": "https://www.cdc.gov/places/measure-definitions/prevention.html"},
 "HP_HDS04": {"name": "Healthy People 2030 HDS-04(고혈압 감소)", "url": "https://odphp.health.gov/healthypeople/objectives-and-data/browse-objectives/heart-disease-and-stroke/reduce-proportion-adults-high-blood-pressure-hds-04"},
 "HP_D": {"name": "Healthy People 2030 Diabetes", "url": "https://odphp.health.gov/healthypeople/objectives-and-data/browse-objectives/diabetes"},
 "HP_MH": {"name": "Healthy People 2030 정신건강(치료 이용 증가)", "url": "https://odphp.health.gov/healthypeople/objectives-and-data/browse-objectives/mental-health-and-mental-disorders"},
 "HP_OH": {"name": "Healthy People 2030 구강(치주염 감소)", "url": "https://odphp.health.gov/healthypeople/objectives-and-data/browse-objectives/oral-conditions"},
 "HP_PREV": {"name": "Healthy People 2030 예방검진 증가", "url": "https://odphp.health.gov/healthypeople/objectives-and-data/browse-objectives/preventive-care"},
 "HP_EMP": {"name": "Healthy People 2030 SDOH-02(고용 증가)", "url": "https://odphp.health.gov/healthypeople/objectives-and-data/browse-objectives/economic-stability/increase-employment-working-age-people-sdoh-02"},
 "HP_EH": {"name": "Healthy People 2030 환경보건", "url": "https://odphp.health.gov/healthypeople/objectives-and-data/browse-objectives/environmental-health"},
 "HP_EH01": {"name": "Healthy People 2030 EH-01(대기질)", "url": "https://odphp.health.gov/healthypeople/objectives-and-data/browse-objectives/environmental-health/reduce-number-days-people-are-exposed-unhealthy-air-eh-01"},
 "HP_IVP06": {"name": "Healthy People 2030 IVP-06(교통사고 사망 감소)", "url": "https://odphp.health.gov/healthypeople/objectives-and-data/browse-objectives/injury-prevention/reduce-deaths-motor-vehicle-crashes-ivp-06"},
 "HP_IVP07": {"name": "Healthy People 2030 IVP-07(안전벨트)", "url": "https://odphp.health.gov/healthypeople/objectives-and-data/browse-objectives/injury-prevention/reduce-proportion-deaths-car-passengers-who-werent-buckled-ivp-07"},
 "HP_AHS": {"name": "Healthy People 2030 AHS(주치의·접근)", "url": "https://odphp.health.gov/healthypeople/objectives-and-data/browse-objectives/health-care-access-and-quality"},
 "OECD_HAAG": {"name": "OECD Health at a Glance 2025(자원·이용 대시보드 방향 없음)", "url": "https://www.oecd.org/content/dam/oecd/en/publications/reports/2025/11/health-at-a-glance-2025_a894f72e/8f9e3f98-en.pdf"},
 "OECD_RWB": {"name": "OECD Regional Well-Being 이용자 가이드", "url": "https://www.oecdregionalwellbeing.org/assets/downloads/Regional-Well-Being-User-Guide.pdf"},
 "OECD_EAG": {"name": "OECD Education at a Glance D2", "url": "https://www.oecd.org/en/publications/education-at-a-glance-2025_1c0d9b8f-en.html"},
 "ECHI": {"name": "ECHI shortlist 88", "url": "https://ec.europa.eu/health/indicators/docs/echi_shortlist_by_policy_area_en.pdf"},
 "URB": {"name": "Eurostat Urban Audit 방법론", "url": "https://ec.europa.eu/eurostat/documents/3859598/5885077/KS-BD-04-002-EN.PDF.pdf"},
 "UH": {"name": "WHO Urban HEART 핵심지표", "url": "https://www.who.int/publications/i/item/9789241500142"},
 "HCI": {"name": "WHO 유럽 건강도시 지표(Webster & Sanderson)", "url": "https://pmc.ncbi.nlm.nih.gov/articles/PMC3764266/"},
 "SDG_361": {"name": "UN SDG 3.6.1 도로교통 사망", "url": "https://unstats.un.org/sdgs/metadata/files/Metadata-03-06-01.pdf"},
 "SDG_3C1": {"name": "UN SDG 3.c.1 보건인력 밀도", "url": "https://unstats.un.org/sdgs/metadata/files/Metadata-03-0C-01.pdf"},
 "SDG_611": {"name": "UN SDG 6.1.1 안전한 식수", "url": "https://unstats.un.org/sdgs/metadata/files/Metadata-06-01-01.pdf"},
 "SDG_911": {"name": "UN SDG 9.1.1 농촌 도로 접근", "url": "https://unstats.un.org/sdgs/metadata/files/Metadata-09-01-01.pdf"},
 "SDG_1162": {"name": "UN SDG 11.6.2 PM2.5", "url": "https://unstats.un.org/sdgs/metadata/files/Metadata-11-06-02.pdf"},
 "SDG_1171": {"name": "UN SDG 11.7.1 공공 열린공간", "url": "https://unstats.un.org/sdgs/metadata/files/Metadata-11-07-01.pdf"},
 "SDG_1111": {"name": "UN SDG 11.1.1 부적절 주거", "url": "https://unstats.un.org/sdgs/metadata/files/Metadata-11-01-01.pdf"},
 "SDG_1511": {"name": "UN SDG 15.1.1 산림 비율", "url": "https://unstats.un.org/sdgs/metadata/files/Metadata-15-01-01.pdf"},
 "SDG_852": {"name": "UN SDG 8.5.2 실업률", "url": "https://unstats.un.org/sdgs/metadata/files/Metadata-08-05-02.pdf"},
 "SDG_32": {"name": "UN SDG 3.2 영아·아동 사망 감소", "url": "https://unstats.un.org/sdgs/metadata/files/Metadata-03-02-01.pdf"},
 "KR_5069": {"name": "국가지표체계 인구 1000명당 의사수", "url": "https://www.index.go.kr/unify/idx-info.do?idxCd=5069"},
 "KR_A0007": {"name": "e-나라지표 병상수", "url": "https://www.index.go.kr/unity/potal/main/EachDtlPageDetail.do?idx_cd=A0007"},
 "KR_A0006": {"name": "e-나라지표 의료인력", "url": "https://www.index.go.kr/unity/potal/main/EachDtlPageDetail.do?idx_cd=A0006"},
 "KR_2458": {"name": "e-나라지표 재정자립도", "url": "https://www.index.go.kr/unity/potal/main/EachDtlPageDetail.do?idx_cd=2458"},
 "KR_1521": {"name": "e-나라지표 교원 1인당 학생수", "url": "https://www.index.go.kr/unity/potal/main/EachDtlPageDetail.do?idx_cd=1521"},
 "KR_1481": {"name": "e-나라지표 하수도 보급률", "url": "https://www.index.go.kr/unity/potal/main/EachDtlPageDetail.do?idx_cd=1481"},
 "KR_8095": {"name": "국민 삶의 질 상수도 보급률", "url": "https://www.index.go.kr/unify/idx-info.do?idxCd=8095"},
 "KR_1206": {"name": "e-나라지표 도로포장률", "url": "https://www.index.go.kr/unity/potal/main/EachDtlPageDetail.do?idx_cd=1206"},
 "KR_8062": {"name": "국민 삶의 질 1인당 도시공원 면적", "url": "https://www.index.go.kr/unify/idx-info.do?idxCd=8062"},
 "KR_2751": {"name": "e-나라지표 공공체육시설", "url": "https://www.index.go.kr/unity/potal/main/EachDtlPageDetail.do?idx_cd=2751"},
 "KR_4275": {"name": "국가발전지표 PM2.5", "url": "https://www.index.go.kr/unify/idx-info.do?idxCd=4275"},
 "KR_4261": {"name": "국가발전지표 도로교통사고 사망률", "url": "https://www.index.go.kr/unify/idx-info.do?idxCd=4261"},
 "KR_8009": {"name": "국민 삶의 질 실업률", "url": "https://www.index.go.kr/unify/idx-info.do?idxCd=8009"},
 "KR_1494": {"name": "e-나라지표 고용률·경제활동참가율", "url": "https://www.index.go.kr/unity/potal/main/EachDtlPageDetail.do?idx_cd=1494"},
 "KR_8092": {"name": "국민 삶의 질 자가점유가구비율", "url": "https://www.index.go.kr/unify/idx-info.do?idxCd=8092"},
 "KR_5061": {"name": "국가발전지표 합계출산율", "url": "https://www.index.go.kr/unify/idx-info.do?idxCd=5061"},
 "KR_1011": {"name": "e-나라지표 출생·사망 추이", "url": "https://www.index.go.kr/unity/potal/main/EachDtlPageDetail.do?idx_cd=1011"},
 "KR_5001": {"name": "국가발전지표 부양인구비", "url": "https://www.index.go.kr/unify/idx-info.do?idxCd=5001"},
 "KR_4227": {"name": "국가발전지표 인구성장률", "url": "https://www.index.go.kr/unify/idx-info.do?idxCd=4227"},
 "KR_1007": {"name": "e-나라지표 인구밀도", "url": "https://www.index.go.kr/unify/idx-info.do?idxCd=1007"},
 "KR_1200": {"name": "e-나라지표 도시지역 인구비율", "url": "https://www.index.go.kr/unity/potal/main/EachDtlPageDetail.do?idx_cd=1200"},
 "KR_2768": {"name": "e-나라지표 등록장애인 현황", "url": "https://www.index.go.kr/unity/potal/main/EachDtlPageDetail.do?idx_cd=2768"},
 "KR_5065": {"name": "국가발전지표 1인가구비율", "url": "https://www.index.go.kr/unify/idx-info.do?idxCd=5065"},
 "KR_1300": {"name": "e-나라지표 산림면적", "url": "https://www.index.go.kr/unity/potal/main/EachDtlPageDetail.do?idx_cd=1300"},
 "KR_1401": {"name": "e-나라지표 강수량 추이", "url": "https://www.index.go.kr/unity/potal/main/EachDtlPageDetail.do?idx_cd=1401"},
 "KR_1431": {"name": "e-나라지표 경상의료비", "url": "https://www.index.go.kr/unity/potal/main/EachDtlPageDetail.do?idx_cd=1431"},
 "KR_1440": {"name": "e-나라지표 암검진 수검률", "url": "https://www.index.go.kr/unity/potal/main/EachDtlPageDetail.do?idx_cd=1440"},
 "KR_NHIS_CHK": {"name": "건강검진 실시기준 판정구분", "url": "https://www.nhis.or.kr/lm/lmxsrv/law/lawDetail.do?SEQ=80&LAWGROUP=1"},
 "KR_1242": {"name": "e-나라지표 재고주택(빈집)", "url": "https://www.index.go.kr/unity/potal/main/EachDtlPageDetail.do?idx_cd=1242"},
 "KR_MOIS": {"name": "행정안전부 지역안전지수(1등급 최안전)", "url": "https://www.mois.go.kr/frt/sub/a06/b10/safetyIndex/screen.do"},
 "KR_TS": {"name": "한국교통안전공단 교통문화지수", "url": "https://main.kotsa.or.kr/portal/contents.do?menuCode=01060304"},
 "KR_KOROAD": {"name": "도로교통공단 교통안전지수", "url": "https://www.busan.go.kr/depart/trsafetyindex001"},
 "KR_EXT": {"name": "한국고용정보원 지방소멸위험지수", "url": "https://www.moel.go.kr/news/enews/report/enewsView.do?news_seq=13488"},
 "KR_HP2030": {"name": "제5차 국민건강증진종합계획(HP2030)", "url": "https://www.mohw.go.kr/board.es?mid=a10401000000&bid=0008&tag=&act=view&list_no=365340"},
 "KR_DEP": {"name": "김동진 외(2013) 한국의 건강불평등 지표와 정책과제(KIHASA)", "url": "http://repository.kihasa.re.kr/bitstream/201002/11225/1/연구보고서%202013-10.pdf"},
 "KR_KHEPI": {"name": "지역보건의료계획 현황분석 지표(KHEPI)", "url": "https://www.jncare.go.kr/health/News/download/663/415"},
 "KR_CHS": {"name": "지역사회건강조사 보도자료(상향·하향지표 각주)", "url": "https://www.kdca.go.kr/bbs/kdca/42/310235/artclView.do?layout=unknown"},
 "KR_PARK": {"name": "박언아·최성용 2019 보건소 이용률 요인", "url": "https://www.kci.go.kr/kciportal/ci/sereArticleSearch/ciSereArtiView.kci?sereArticleSearchBean.artiId=ART002448658"},
 "KR_WI": {"name": "위서연 외 2022 지역별 의료비 격차 요인 분해", "url": "https://www.kci.go.kr/kciportal/ci/sereArticleSearch/ciSereArtiView.kci?sereArticleSearchBean.artiId=ART002915327"},
 "KR_KREI": {"name": "한국농촌경제연구원 P257 농촌·도시 건강실태", "url": "https://repository.krei.re.kr/bitstream/2018.oak/24943/1/P257.pdf"},
 "KR_KOSIS_LOC": {"name": "KOSIS e-지방지표(문화·복지·여가시설)", "url": "https://kosis.kr/visual/eRegionJipyo/themaJipyo/eRegionJipyoThemaJipyoView.do?themaId=A_03_01&menuThemaId=A_03_01_02&jipyoId=5507_6880"},
}
def E(dir, note, *refs): return {"dir": dir, "note": note, "refs": [R[k] for k in refs]}
CTX_POP = "인구 구성·규모 지표는 미국(CHR Demographics·AHR 비가중·PLACES)·유럽(ECHI 인구장)·국내(국가지표체계 가치판단 없음) 모두 방향을 두지 않는 맥락 지표"
MORT = "사망률은 모든 체계에서 낮을수록 좋음(OECD RWB 역코딩, CHR 조기사망, HP2030 감소 목표)"
INF = "법정감염병 발생률은 낮을수록 좋음(Urban HEART·SDG 3.3). 단 신고 체계·검사량에 따라 오를 수 있음"
USE_DZ = "질환별 진료인원은 유병률의 대리지표로 낮을수록 좋음(PLACES 건강결과, HP2030 감소 목표, ECHI·Urban HEART 유병률). 단 진단·접근성이 좋아지면 오를 수 있고, AHR은 이런 유병률을 순위에서 제외함"
ITEMS = {
 # ── 사망률 ──
 **{k: E("bad", MORT, "OECD_RWB", "CHR", "KR_HP2030") for k in ["K_MORT_ALL","K_MORT_CA","K_MORT_STO","K_MORT_LIV","K_MORT_LUNG","K_MORT_COL","K_MORT_HEART","K_MORT_IHD","K_MORT_CVA","K_MORT_PNEU","K_MORT_DM","K_MORT_ALZ","K_MORT_HTN","K_MORT_LIVD","K_MORT_COPD","K_MORT_SUI","K_MORT_TRA","K_MORT_FALL","K_MORT_SEP","K_MORT_TB","K_MORT_HOM"]},
 "K_MORT_INF": E("bad", "영아사망률은 SDG 3.2·Urban HEART 핵심지표로 낮을수록 좋음", "SDG_32", "UH"),
 # ── 감염병 ──
 **{k: E("bad", INF, "UH", "KR_MOIS") for k in ["K_INF_VAR","K_INF_MUMPS","K_INF_HAV","K_INF_TSU","K_INF_MAL","K_INF_SCA","K_INF_PER","K_INF_HFRS","K_INF_LEG","K_INF_SYP","K_INF_TYP","K_INF_TBN"]},
 # ── 의료이용·검진 ──
 "K_USE_PT": E("ctx", "총 진료인원은 OECD가 '좋고 나쁨으로 분류할 수 없는' 이용·자원 지표로 두고, HP2030 성과지표에도 없음. 미국은 예방적 이용(↑)과 회피가능 입원(↓)으로 나눠 방향이 반대라 합산치는 맥락. 지역 격차의 대부분은 인구구조·건강수준 차이(위서연 2022)", "OECD_HAAG", "PLACES_PREV", "KR_WI"),
 "K_USE_COST": E("ctx", "1인당 진료비는 어떤 순위 체계도 지표로 쓰지 않음. 고령화율과 동행(전남 최고·세종 최저)하므로 질병부담 맥락으로 표시", "OECD_HAAG", "AHR", "KR_KREI", "KR_1431"),
 "K_USE_HTN": E("bad", USE_DZ, "PLACES_OUT", "HP_HDS04", "AHR"),
 "K_USE_DM": E("bad", USE_DZ, "PLACES_OUT", "HP_D", "AHR"),
 "K_USE_MENT": E("ctx", "정신질환은 HP2030(미국·한국 모두)이 '치료받는 비율 증가'를 목표로 하므로 진료인원 증가를 나쁨으로 볼 수 없음 → 맥락", "HP_MH", "KR_HP2030"),
 "K_USE_ARTH": E("bad", USE_DZ, "PLACES_OUT", "AHR"),
 "K_USE_PERIO": E("bad", USE_DZ + " (HP2030 OH-06 치주염 감소)", "HP_OH", "PLACES_OUT"),
 "K_USE_LIV": E("bad", USE_DZ, "PLACES_OUT", "ECHI"),
 **{k: E("bad", "암 진료인원은 발생(↓ 목표)과 생존 치료 지속(↑)이 섞임. HP2030 암 발생률·사망률 감소 목표에 따라 낮을수록 좋음으로 두되 해석 주의", "KR_HP2030", "PLACES_OUT") for k in ["K_USE_STO","K_USE_LUNG","K_USE_COL","K_USE_BRE"]},
 "K_CHK_RATE": E("good", "검진 수검률은 모든 체계에서 증가 목표(CHR 역코딩, AHR 가중 +, HP2030 C-05/07/09, 국가지표체계 암검진 수검률)", "CHR", "HP_PREV", "KR_1440"),
 "K_CHK_NORMA": E("good", "판정 정상A는 '건강 양호' 판정 비율(건강검진 실시기준 별표4)이므로 높을수록 좋음. 연령 구조 영향 큼", "KR_NHIS_CHK"),
 "K_CHK_DIS": E("bad", "유질환자 판정 비율은 유병률에 해당해 낮을수록 좋음(HP2030 유병률 감소). 수검률·조기발견이 늘면 함께 오를 수 있음(HP2030 D-02는 '모르는 사람 감소'가 목표)", "KR_NHIS_CHK", "HP_D", "ECHI"),
 "K_CHK_HTN": E("bad", "검진 고혈압 판정 비율은 유병률 대리(HP2030 성인 고혈압 유병률 33.2→32.2% 감소 목표)", "KR_HP2030", "HP_HDS04"),
 "K_CHK_DM": E("bad", "검진 당뇨병 판정 비율은 유병률 대리(HP2030 당뇨 유병률 14.2→13.2% 감소 목표)", "KR_HP2030", "HP_D"),
 # ── 보건의료자원 ──
 **{k: E("good", "인력 공급 지표는 국가지표체계가 '인구당 의사수가 많을수록 의료복지 수준이 높다'고 명시하고, CHR은 1차의료 의사를 역코딩(높을수록 좋음), SDG 3.c.1은 부족 해소 관점. OECD는 more/less로만 표시", "KR_5069", "CHR", "SDG_3C1", "OECD_HAAG") for k in ["K_RES_DOC","K_RES_DENT","K_RES_KM","K_RES_PHARM","K_RES_NURSE","K_RES_EM","K_RES_IM","K_RES_PSY","K_RES_OB","K_RES_PED","K_RES_PHCDOC"]},
 "K_RES_BED": E("ctx", "병상은 OECD가 '과잉은 남용·비용 증가, 균형 필요'로, e-나라지표는 '적정 수급·국민의료비 관리'로 서술해 방향을 두지 않음. 한국은 OECD 최다 수준", "OECD_HAAG", "KR_A0007"),
 "K_RES_CLINIC": E("good", "의원 수는 접근성 자원(국내 체계·Urban HEART 선택지표 '진료소 접근'). 국제 체계에 정확한 대응 지표는 없음", "KR_KHEPI", "UH"),
 "K_RES_WELF": E("good", "e-지방지표가 노인여가복지시설을 배려복지 수준 지표로 설명", "KR_KOSIS_LOC"),
 "K_RES_CULT": E("good", "e-지방지표 '문화향수 기회 확대' 지표", "KR_KOSIS_LOC"),
 "K_RES_SOC": E("good", "e-지방지표 '취약계층 배려복지 수준' 지표", "KR_KOSIS_LOC"),
 # ── 인구·사회·경제 ──
 "K_POP_AGED": E("ctx", CTX_POP + ". 국가지표체계 부양인구비는 '부양 부담 정도'로만 서술", "CHR_DEMO", "AHR", "KR_5001"),
 "K_POP_GROW": E("ctx", CTX_POP + ". 미국 체계에는 인구증가율 지표 없음", "KR_4227", "CHR_DEMO"),
 "K_POP_DENS": E("ctx", CTX_POP + ". CHR '% Rural', Eurostat 인구밀도 모두 유형 분류용", "KR_1007", "URB", "CHR"),
 "K_POP_AGE": E("ctx", CTX_POP + ". Eurostat 중위연령은 인구구조 변화 요약용", "KR_KHEPI", "URB"),
 "K_POP_URB": E("ctx", CTX_POP + ". e-나라지표 '도시화 정도 참고'", "KR_1200", "CHR"),
 "K_POP_DIS": E("ctx", "CHR이 장애 비율을 Demographics로 분류('A Demographics measure'), 등록률은 제도 접근성도 반영 → 취약인구 규모 맥락", "CHR_DIS", "KR_2768"),
 "K_POP_BLS": E("bad", "빈곤율은 CHR 점수 지표(아동빈곤, 낮을수록 좋음)·AHR 경제곤란지수 구성요소. 국내 체계는 '취약인구'로 분류. 단 제도 포괄성이 높은 지역도 값이 오를 수 있음", "CHR", "AHR", "KR_KHEPI"),
 "K_POP_ONE": E("ctx", CTX_POP + ". 1인가구는 국가발전지표가 원인만 서술, Eurostat도 추세 서술만. 독거노인은 취약성 지표", "KR_5065", "URB"),
 "K_POP_TFR": E("good", "국제 체계(ECHI·미국)는 맥락이나, 국내 국가발전지표가 저출산을 문제로 서술하고 저출생 대응이 국가 정책 목표이므로 높을수록 좋음으로 둠", "KR_5061", "ECHI"),
 "K_POP_CBR": E("good", "합계출산율과 같은 이유(국내 정책 맥락). 국제 체계는 맥락", "KR_1011", "ECHI"),
 "K_POP_EXT": E("good", "지수 정의상 0.5 미만이 소멸위험이므로 높을수록 안전", "KR_EXT"),
 "K_ECO_FIN": E("good", "e-나라지표 '비율이 높을수록 세입징수기반이 좋은 것' 명시. 미국·국제 체계에는 대응 지표 없음", "KR_2458"),
 "K_ECO_FIN2": E("good", "재정자립도와 같은 성격(국내 체계 우선)", "KR_2458"),
 "K_ECO_UNEMP": E("bad", "실업률은 모든 체계에서 낮을수록 좋음(CHR Select, OECD RWB 역코딩, Urban HEART, SDG 8.5.2, 국민 삶의 질)", "CHR", "OECD_RWB", "SDG_852", "KR_8009"),
 "K_ECO_EMP": E("good", "고용률은 HP2030 대표지표(SDOH-02 증가), OECD RWB 정방향, e-나라지표 노동력 활용 지표", "HP_EMP", "OECD_RWB", "KR_1494"),
 "K_ECO_YEMP": E("good", "고용률과 동일", "HP_EMP", "KR_1494"),
 "K_ECO_LFP": E("good", "e-나라지표 '노동공급의 가장 순수한 측정치'", "KR_1494"),
 "K_ECO_BIZ": E("ctx", "사업체 밀도는 건강·웰빙 체계 어디에도 방향 지정 사례가 없음(건강도시 프로파일에 현황으로만 수록) → 맥락", "KR_KHEPI", "CHR"),
 "K_ECO_HOME": E("good", "CHR '자가 소유는 더 나은 건강과 연관', Urban HEART 점유안정 대리, 국민 삶의 질 자가점유율. 단 CHR·AHR 순위 산정에서는 제외", "CHR_HOME", "KR_8092", "UH"),
 "K_EDU_RATIO": E("bad", "e-나라지표 '수치가 낮을수록 교육여건이 좋은 것' 명시(국내 체계 우선). OECD는 학급규모 효과가 혼재한다고 서술", "KR_1521", "OECD_EAG"),
 # ── 환경·안전 ──
 "K_ENV_WATER": E("good", "안전한 물 접근은 Urban HEART·SDG 6.1.1·HP2030 EH-03 증가 목표, 국민 삶의 질 지표", "UH", "SDG_611", "KR_8095"),
 "K_ENV_SEWER": E("good", "e-나라지표 '100%에 가까울수록 수혜인구비율 높음' 명시, Urban HEART 위생 접근", "KR_1481", "UH"),
 "K_ENV_ROAD": E("good", "e-나라지표가 증가를 도로의 양적·질적 향상으로 서술, SDG 9.1.1 전천후 도로 접근", "KR_1206", "SDG_911"),
 "K_ENV_PARKN": E("good", "CHR 운동기회 접근(역코딩·높을수록 좋음), SDG 11.7.1 열린공간, 국민 삶의 질 도시공원", "CHR_EX", "SDG_1171", "KR_8062"),
 "K_ENV_PARKA": E("good", "국민 삶의 질 '공원 서비스 양은 삶의 질을 결정하는 중요한 요소', SDG 11.7.1", "KR_8062", "SDG_1171"),
 "K_ENV_SPORT": E("good", "CHR 운동기회 접근, WHO 건강도시 지표 '스포츠·여가시설', e-나라지표 공공체육시설", "CHR_EX", "HCI", "KR_2751"),
 "K_ENV_FOREST": E("ctx", "SDG 15.1.1은 산림을 긍정 지표로 두나 '확대가 보편적으로 바람직하진 않음'을 단서로 붙이고, 미국 체계는 산림 비율을 쓰지 않으며 e-나라지표는 방향 없음. 시군구 산림 비율은 도농 구조를 반영하므로 맥락", "SDG_1511", "KR_1300"),
 "K_ENV_EMPTY": E("ctx", "빈집률은 미국·OECD 어디에도 방향 지표가 없고(OECD 주거DB는 정의만) 국내 체계도 독립 지표가 없음. 쇠퇴 신호로 해석 가능하나 근거 부족 → 맥락", "KR_1242", "AHR"),
 "K_ENV_OLD": E("bad", "AHR은 주택 노후를 납 노출 위험 지표(가중, 낮을수록 좋음)로, SDG 11.1.1·WHO 건강도시는 부적절 주거로 취급", "AHR", "SDG_1111", "HCI"),
 "K_ENV_PM10": E("bad", "미세먼지는 CHR Select·OECD RWB 역코딩·SDG 11.6.2·국가발전지표 모두 낮을수록 좋음(PM10은 HP2030 EH-01 AQI 구성)", "CHR_PM", "HP_EH01", "KR_4275"),
 "K_ENV_PM25": E("bad", "CHR Select 8%·AHR 가중·OECD RWB 역코딩·SDG 11.6.2·국가발전지표 4275", "CHR_PM", "SDG_1162", "KR_4275"),
 "K_ENV_TEMP": E("ctx", "기후 변수 자체는 방향이 없음(Eurostat 기술 변수, CHR은 극단 기후 사건만 '진척 추적용 아님'으로 수록, e-나라지표 참고용)", "CHR_CLIM", "URB", "KR_1401"),
 "K_ENV_RAIN": E("ctx", "연 강수량은 순수 기후 변수(Eurostat Urban Audit, e-나라지표 참고용)", "URB", "KR_1401"),
 "K_SAF_TCI": E("good", "100점 만점 지수, 상승을 '교통문화 수준 향상'으로 정의(한국교통안전공단)", "KR_TS"),
 "K_SAF_TSI": E("good", "도로교통공단 100점 만점·A~E 등급, 높을수록 안전", "KR_KOROAD"),
 **{k: E("bad", "행정안전부 지역안전지수는 '1등급일수록 상대적으로 안전' → 등급 숫자가 낮을수록 좋음", "KR_MOIS") for k in ["K_SAF_G_FIRE","K_SAF_G_TRAF","K_SAF_G_CRIME","K_SAF_G_ACC","K_SAF_G_SUI","K_SAF_G_INF"]},
 "K_SAF_TA": E("bad", "교통사고 건수는 지역안전지수 위해지표, SDG 3.6.1·HP2030 IVP-06 감소 목표", "KR_MOIS", "SDG_361", "HP_IVP06"),
 "K_SAF_TADEATH": E("bad", "SDG 3.6.1 '절반 감축', HP2030 IVP-06, 국가발전지표 도로교통사고 사망률 감소", "SDG_361", "HP_IVP06", "KR_4261"),
 "K_SAF_PED": E("bad", "보행자 사망은 SDG 3.6.1·지역안전지수 위해지표", "SDG_361", "KR_MOIS"),
 "K_SAF_ELD": E("bad", "노인 교통사고 사망은 SDG 3.6.1·지역안전지수 위해지표", "SDG_361", "KR_MOIS"),
 "K_SAF_BELT": E("good", "교통문화지수 세부지표(착용률 상승=개선), AHR 과거 지표, HP2030 IVP-07 관련", "KR_TS", "HP_IVP07"),
 "K_SAF_STOP": E("good", "교통문화지수 세부지표", "KR_TS"),
 "K_SAF_SIG": E("good", "교통문화지수 세부지표", "KR_TS"),
 # ── 지역사회건강조사·건강수명 ──
 "DT_NECE_CLINIC": E("ctx", "보건기관 이용률은 미국 체계(주치의·정기검진 이용)는 좋음으로 보지만, OECD·ECHI는 이용률을 맥락으로 두고 국내 연구(박언아·최성용 2019)는 고령·저소득·미충족의료자·군 지역에서 높아 취약성과 공공 접근성이 동시에 반영된다고 봄 → 방향 없음", "HP_AHS", "OECD_HAAG", "KR_PARK"),
 "HLE_LE": E("good", "기대수명은 OECD RWB·ECHI·CHR(조기사망 역지표) 모두 정방향", "OECD_RWB", "ECHI"),
 "HLE_HLE": E("good", "건강수명은 OECD·ECHI(HLY) 정방향, HP2030 대표지표", "ECHI", "KR_HP2030"),
 "DEP_IDX": E("bad", "지역박탈지수는 정의상 높을수록 박탈이 큼(김동진 외 2013; 영국 IMD·미국 ADI 동일). 집계표 기반 근사값으로 원시자료 기반 공식값과 다를 수 있음", "KR_DEP"),
 "HLE_UNH": E("bad", "불건강 기간(기대수명−건강수명)은 짧을수록 좋음(HP2030 건강수명 격차 축소)", "KR_HP2030"),
}
out = {"generated": datetime.date.today().isoformat(), "rules": [l.strip() for l in __doc__.splitlines() if l.strip().startswith("R")], "items": ITEMS}
(ROOT / "data" / "directions.json").write_text(json.dumps(out, ensure_ascii=False, indent=0), encoding="utf-8")
import collections
print("항목", len(ITEMS), collections.Counter(v["dir"] for v in ITEMS.values()))
# 이전 방향과 비교
k = json.loads((ROOT / "data" / "kdh_dataset.json").read_text(encoding="utf-8"))
prev = {i["id"]: i["bad"] for i in k["indicators"]}; prev["DT_NECE_CLINIC"] = None
m = {"good": False, "bad": True, "ctx": None}
chg = [(i, prev[i], m[v["dir"]]) for i, v in ITEMS.items() if i in prev and prev[i] != m[v["dir"]]]
print("변경", len(chg)); [print("  ", c) for c in chg]
missing = [i["id"] for i in k["indicators"] if i["id"] not in ITEMS]; print("누락", missing)
