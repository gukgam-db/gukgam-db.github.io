/* 근거영양 — 연구 DB
   각 항목은 원문(PubMed·학술지)에서 확인한 수치만 기록. 확인 안 된 값은 "미확인" 표기.
   grade: A/B/C/D/X (등급 기준은 about.html), design: RCT | META | COHORT | REVIEW | GUIDE
   ing: 성분 id (ingredients.js와 연결), outcome: 결과 영역 */
window.EBN_STUDIES = [

/* ===================== 종합비타민 ===================== */
{
  id: "phs2-cancer", name: "Physicians' Health Study II (PHS II) — 암",
  inst: "하버드 의대 · 브리검 여성병원", journal: "JAMA", year: 2012,
  n: 14641, followup: "중앙값 11.2년", design: "RCT",
  population: "50세 이상 미국 남성 의사", intervention: "종합비타민(센트룸 실버) 1일 1정 vs 위약",
  ing: ["multi"], outcome: ["cancer"],
  effect: ["전체 암 HR 0.92 (0.86–0.998), p=0.04", "암 사망 HR 0.88 (0.77–1.01), p=0.07", "전립선암 HR 0.98 · 대장암 HR 0.89 (유의 없음)"],
  finding: "11년간 매일 종합비타민을 먹은 남성 의사에서 전체 암 발생이 8% 낮았다. 단, 신뢰구간 상한이 1에 거의 닿는 경계선 결과.",
  caveat: "영양 상태가 좋은 남성 의사만 대상. 여성·일반인에 그대로 적용하기 어렵다. 암 사망률 감소는 통계적 유의에 못 미침.",
  grade: "B", urls: ["https://pubmed.ncbi.nlm.nih.gov/23162860/"], updated: "2026-09"
},
{
  id: "phs2-cvd", name: "Physicians' Health Study II (PHS II) — 심혈관·사망",
  inst: "하버드 의대 · 브리검 여성병원", journal: "JAMA", year: 2012,
  n: 14641, followup: "중앙값 11.2년", design: "RCT",
  population: "50세 이상 미국 남성 의사", intervention: "종합비타민 vs 위약",
  ing: ["multi"], outcome: ["cvd", "mortality"],
  effect: ["주요 심혈관 사건 HR 1.01 (0.91–1.10), p=0.91", "심근경색 HR 0.93 · 뇌졸중 HR 1.06", "총 사망 HR 0.94 (0.88–1.02), p=0.13"],
  finding: "종합비타민은 심근경색·뇌졸중·심혈관 사망을 전혀 줄이지 못했다. 총 사망도 차이 없음.",
  caveat: "심혈관 예방 목적으로 종합비타민을 먹을 근거는 없다는 것이 이 연구의 핵심 메시지.",
  grade: "D", urls: ["https://pubmed.ncbi.nlm.nih.gov/23117775/"], updated: "2026-09"
},
{
  id: "phs2-cognition", name: "PHS II — 인지기능 하위연구",
  inst: "하버드 의대 · 브리검 여성병원", journal: "Annals of Internal Medicine", year: 2013,
  n: 5947, followup: "최대 12년, 전화 인지검사 4회", design: "RCT",
  population: "65세 이상 남성 의사", intervention: "종합비타민 vs 위약",
  ing: ["multi"], outcome: ["cognition"],
  effect: ["전반 인지 점수 차이 −0.01 SU (−0.04 ~ 0.02)", "언어 기억 차이 −0.005 SU (유의 없음)"],
  finding: "12년간 종합비타민을 먹어도 인지기능 저하 속도에 차이가 없었다.",
  caveat: "후속 COSMOS(2022~2024)에서는 3년 단기 소폭 이득이 관찰되어 결과가 엇갈림. 전화 검사의 민감도 한계.",
  grade: "D", urls: ["https://pubmed.ncbi.nlm.nih.gov/24490265/"], updated: "2026-09"
},
{
  id: "phs2-eye", name: "PHS II — 백내장·황반변성",
  inst: "하버드 의대 · 브리검 여성병원", journal: "Ophthalmology", year: 2014,
  n: 14641, followup: "11.2년", design: "RCT",
  population: "50세 이상 남성 의사", intervention: "종합비타민 vs 위약",
  ing: ["multi"], outcome: ["eye"],
  effect: ["백내장 HR 0.91 (0.83–0.99), p=0.04", "황반변성 HR 1.19 (0.94–1.50), 유의 없음"],
  finding: "백내장 발생이 9% 낮았다. 황반변성에는 효과 없음.",
  caveat: "효과 크기가 작고 남성 의사 대상. 간호사 건강연구(관찰)에서는 백내장 감소가 확인되지 않음.",
  grade: "B", urls: ["https://pubmed.ncbi.nlm.nih.gov/24268861/"], updated: "2026-09"
},
{
  id: "cosmos-main", name: "COSMOS — 종합비타민 주요 결과 (암·심혈관·사망)",
  inst: "하버드 의대 · 브리검 여성병원", journal: "American Journal of Clinical Nutrition", year: 2022,
  n: 21442, followup: "중앙값 3.6년", design: "RCT",
  population: "미국 여성 65세+, 남성 60세+ (주요 심혈관질환·최근 암 없음)", intervention: "종합비타민(센트룸 실버) vs 위약 (코코아 추출물과 2×2 요인설계)",
  ing: ["multi"], outcome: ["cancer", "cvd", "mortality"],
  effect: ["전체 침습암 HR 0.97 (0.86–1.09), p=0.57", "폐암 HR 0.62 (0.42–0.92) — 하위분석", "심혈관 복합 HR 0.98 (0.86–1.12)", "총 사망 HR 0.93 (0.81–1.08)"],
  finding: "2만 1천 명 고령자에서 3.6년간 종합비타민은 암·심혈관질환·사망을 줄이지 못했다. 안전성 문제는 없었다.",
  caveat: "추적 3.6년은 암·심혈관 결과를 보기엔 짧다. 참가자 약 90%가 백인. 비타민 제공사(Haleon/화이자 컨슈머) 관여. 폐암 감소는 하위집단 신호일 뿐.",
  grade: "D", urls: ["https://pubmed.ncbi.nlm.nih.gov/35294969/", "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9170475/"], updated: "2026-09"
},
{
  id: "cosmos-mind", name: "COSMOS-Mind — 인지기능",
  inst: "웨이크포레스트 의대 (COSMOS 부속연구)", journal: "Alzheimer's & Dementia", year: 2022,
  n: 2262, followup: "3년, 매년 전화 인지검사", design: "RCT",
  population: "평균 73세 고령자", intervention: "종합비타민 vs 위약",
  ing: ["multi"], outcome: ["cognition"],
  effect: ["전반 인지 복합점수 z=0.07 (0.02–0.12), p=0.007", "기억·실행기능도 개선", "심혈관질환 병력자에서 효과 더 큼 (0.14)", "경도인지장애·치매 발생률은 차이 없음"],
  finding: "3년간 종합비타민 복용군의 인지 점수가 위약군보다 소폭 높았다. 논문은 이를 '인지 노화 약 1.8년 지연'으로 해석.",
  caveat: "이 연구의 1차 목표는 코코아였고 종합비타민은 2차 분석. 효과 크기 0.07 SD는 작다. 치매 발생 자체는 줄이지 못했다.",
  grade: "B", urls: ["https://pubmed.ncbi.nlm.nih.gov/36102337/"], updated: "2026-09"
},
{
  id: "cosmos-web", name: "COSMOS-Web — 기억력(온라인 검사)",
  inst: "컬럼비아 대학 (COSMOS 부속연구)", journal: "American Journal of Clinical Nutrition", year: 2023,
  n: 3562, followup: "3년, 매년 온라인 검사", design: "RCT",
  population: "평균 71세", intervention: "종합비타민 vs 위약",
  ing: ["multi"], outcome: ["cognition"],
  effect: ["1년째 즉시회상(ModRey) p=0.025, 차이 약 0.23단어 (d=0.07)", "3년 평균 p=0.011 (d=0.05)", "물체인식·실행기능은 차이 없음"],
  finding: "기억력 검사에서 소폭 우세. 저자들은 '기억 노화 3.1년분'으로 환산했으나 이는 탐색적 추정.",
  caveat: "효과 크기가 매우 작음(단어 0.2개). 기억력 외 영역은 효과 없음.",
  grade: "B", urls: ["https://pubmed.ncbi.nlm.nih.gov/37244291/"], updated: "2026-09"
},
{
  id: "cosmos-meta", name: "COSMOS-Clinic + 3개 하위연구 메타분석 — 인지기능",
  inst: "매사추세츠 종합병원 · 하버드", journal: "American Journal of Clinical Nutrition", year: 2024,
  n: 5203, followup: "2~3년", design: "META",
  population: "COSMOS 참가 고령자(비중복 5,203명)", intervention: "종합비타민 vs 위약",
  ing: ["multi"], outcome: ["cognition"],
  effect: ["전반 인지 0.07 SU (0.03–0.11), p=0.0009", "삽화 기억 0.06 SU (0.03–0.10), p=0.0007", "대면검사(Clinic, n=573) 단독으로는 전반 인지 유의 없음(0.06, −0.003~0.13)"],
  finding: "세 하위연구를 합치면 종합비타민이 고령자의 전반 인지와 기억을 일관되게 소폭 개선. '인지 노화 약 2년 감소'로 해석.",
  caveat: "효과 크기가 작아(0.07 SD) 개인이 체감하기는 어렵다. 치매 예방 근거는 아니다. 연구 기간 2~3년.",
  grade: "B", urls: ["https://pubmed.ncbi.nlm.nih.gov/38244989/"], updated: "2026-09"
},
{
  id: "cosmos-epigenetic", name: "COSMOS — 후성유전 노화시계 (2026)",
  inst: "하버드 · 브리검 여성병원", journal: "Nature Medicine", year: 2026,
  n: 958, followup: "2년", design: "RCT",
  population: "평균 70세", intervention: "종합비타민 vs 위약",
  ing: ["multi"], outcome: ["aging"],
  effect: ["PCGrimAge 연간 변화 차이 −0.113년 (−0.205 ~ −0.020), p=0.017", "PCPhenoAge −0.214년, p=0.032", "노화 가속 상태였던 참가자에서 더 큼 (−0.236년)"],
  finding: "2년간 종합비타민군의 DNA 메틸화 노화시계가 위약군보다 약 4개월 느리게 갔다.",
  caveat: "대리지표(생체 나이 계산값)이며 실제 질병·수명 결과가 아님. 효과 작음. 메틸화 데이터는 FOXO Technologies 지원.",
  grade: "C", urls: ["https://pubmed.ncbi.nlm.nih.gov/41803341/"], updated: "2026-09"
},
{
  id: "cosmos-htn", name: "COSMOS — 고혈압 발생 (2025)",
  inst: "하버드 · 브리검 여성병원", journal: "American Journal of Hypertension", year: 2025,
  n: 8905, followup: "중앙값 3.4년", design: "RCT",
  population: "고혈압 없는 고령자", intervention: "종합비타민 vs 위약",
  ing: ["multi"], outcome: ["cvd"],
  effect: ["고혈압 발생 HR 0.98 (0.90–1.06) — 전체 차이 없음", "식사 질 낮은 군 HR 0.81 (0.70–0.95) vs 높은 군 HR 1.14 (1.01–1.28), 상호작용 p=0.001"],
  finding: "전체적으로는 효과 없음. 식사가 부실한 사람에게만 고혈압 예방 신호, 식사가 좋은 사람은 오히려 반대 신호.",
  caveat: "하위집단 분석. '식사가 부실할수록 종합비타민 이득'이라는 가설과 일치하지만 확정 근거는 아님.",
  grade: "C", urls: ["https://pubmed.ncbi.nlm.nih.gov/41264477/"], updated: "2026-09"
},
{
  id: "nih-aarp-2024", name: "NIH-AARP · PLCO · AHS 통합 코호트 — 종합비타민과 사망 (20년+)",
  inst: "미국 국립암연구소(NCI)", journal: "JAMA Network Open", year: 2024,
  n: 390124, followup: "최대 27년 (중앙값 21~24년), 사망 164,762건", design: "COHORT",
  population: "기저 만성질환 없는 미국 성인, 중앙값 61.5세", intervention: "매일 종합비타민 복용 vs 비복용 (자가보고)",
  ing: ["multi"], outcome: ["mortality"],
  effect: ["총 사망 HR 1.04 (1.02–1.07) 초기 12년", "후기 15년 HR 1.04 (0.99–1.08)", "암 사망 HR 1.01 · 심장질환 사망 HR 1.06"],
  finding: "39만 명을 20년 넘게 추적했지만 종합비타민 복용자의 수명이 길지 않았다. 오히려 4% 높은 사망 위험은 '아픈 사람이 더 먹는' 효과로 해석.",
  caveat: "관찰연구이므로 원인-결과 입증은 불가. 자가보고. 제품 종류·용량 미반영. 백인 위주.",
  grade: "D", urls: ["https://pubmed.ncbi.nlm.nih.gov/38922615/", "https://jamanetwork.com/journals/jamanetworkopen/fullarticle/2820369"], updated: "2026-09"
},
{
  id: "uspstf-2022", name: "USPSTF 2022 권고 — 심혈관질환·암 예방 목적의 비타민·미네랄 보충",
  inst: "미국 예방서비스 태스크포스 · 카이저 퍼머넌트 근거센터", journal: "JAMA", year: 2022,
  n: 739803, followup: "84개 연구(RCT 78 + 코호트 6), 73.9만 명", design: "GUIDE",
  population: "결핍 없는 지역사회 성인 (임신부 제외)", intervention: "종합비타민·단일/복합 영양소 vs 위약",
  ing: ["multi", "betacarotene", "vite"], outcome: ["cancer", "cvd", "mortality"],
  effect: ["종합비타민 암 발생 OR 0.93 (0.87–0.99), RCT 4건", "종합비타민 총 사망 OR 0.94 (0.87–1.01) — 유의 없음", "베타카로틴 폐암 OR 1.20 (1.01–1.42), 심혈관 사망 OR 1.10 (1.02–1.19)", "비타민 E 사망 OR 1.02 — 이득 없음"],
  finding: "권고: 베타카로틴·비타민 E는 '복용 반대(D등급)'. 종합비타민과 기타 단일 영양소는 '근거 불충분(I)'. 암 발생 7% 감소 신호는 있지만 사망 감소는 없음.",
  caveat: "결핍자·임신부에는 적용되지 않음(이들은 별도 권고). 암 감소 신호는 PHS II와 COSMOS에 크게 의존.",
  grade: "B", urls: ["https://pubmed.ncbi.nlm.nih.gov/35727271/", "https://www.uspreventiveservicestaskforce.org/uspstf/recommendation/vitamin-supplementation-to-prevent-cvd-and-cancer-preventive-medication"], updated: "2026-09"
},
{
  id: "nhs-colon-1998", name: "간호사 건강연구(NHS) — 엽산 함유 종합비타민과 대장암",
  inst: "하버드 보건대학원 · 브리검 여성병원", journal: "Annals of Internal Medicine", year: 1998,
  n: 88756, followup: "1980~1994년 (14년), 대장암 442건", design: "COHORT",
  population: "미국 여성 간호사", intervention: "엽산 함유 종합비타민 장기 복용",
  ing: ["multi", "folate"], outcome: ["cancer"],
  effect: ["15년 이상 복용 RR 0.25 (0.13–0.51)", "5~9년 RR 0.83 · 10~14년 RR 0.80 (유의 없음)", "4년 이하 RR 1.02"],
  finding: "15년 이상 장기 복용한 여성에서 대장암이 75% 낮았다. 하버드 '장기 추적' 연구로 자주 인용되는 결과.",
  caveat: "관찰연구. 미국 엽산 강화(1998) 이전 데이터. 여성 건강연구(WHS) 코호트에서는 재현되지 않음. '장기 복용자 = 건강 관리 잘하는 사람' 편향 가능.",
  grade: "C", urls: ["https://pubmed.ncbi.nlm.nih.gov/9758570/"], updated: "2026-09"
},
{
  id: "nhs2-adenoma-2014", name: "간호사 건강연구 II — 종합비타민과 대장 선종",
  inst: "하버드 보건대학원", journal: "British Journal of Cancer", year: 2014,
  n: 43641, followup: "1991~2007년, 선종 2,277건", design: "COHORT",
  population: "내시경 받은 여성 간호사", intervention: "종합비타민 복용 여부·기간",
  ing: ["multi"], outcome: ["cancer"],
  effect: ["복용 경험 RR 0.86 (0.76–0.97)", "20~26년 복용 RR 0.80 (0.64–1.01)", "기간에 따른 추세 없음 (p=0.87)"],
  finding: "종합비타민 복용자에서 대장 선종(암 전 단계)이 14% 적었다.",
  caveat: "관찰연구, 효과 크기 작음, 복용 기간이 길수록 좋아지는 추세는 없음.",
  grade: "C", urls: ["https://pubmed.ncbi.nlm.nih.gov/24220696/"], updated: "2026-09"
},
{
  id: "hpfs-prostate-2022", name: "의료전문가 추적연구(HPFS) — 종합비타민과 전립선암 (30년)",
  inst: "하버드 보건대학원", journal: "Journal of Urology", year: 2022,
  n: 48137, followup: "중앙값 30.7년, 전립선암 7,108건", design: "COHORT",
  population: "미국 남성 의료전문가", intervention: "종합비타민 장기 복용",
  ing: ["multi"], outcome: ["cancer"],
  effect: ["15년 이상 복용: 진행성 전립선암 HR 1.10 (0.80–1.50), 치명적 HR 1.04 (0.83–1.31)"],
  finding: "30년 추적에서 종합비타민은 전립선암 위험을 높이지도 낮추지도 않았다.",
  caveat: "관찰연구. 안전성 측면에서 안심할 수 있는 근거.",
  grade: "D", urls: ["https://pmc.ncbi.nlm.nih.gov/articles/PMC9378679/"], updated: "2026-09"
},
{
  id: "phs1-cvd-2016", name: "Physicians' Health Study I 코호트 — 20년 이상 종합비타민과 심혈관질환",
  inst: "하버드 · 브리검 여성병원", journal: "Journal of Nutrition", year: 2016,
  n: 18530, followup: "약 12년 추적 (기저 복용기간 조사)", design: "COHORT",
  population: "미국 남성 의사", intervention: "종합비타민 20년 이상 복용 vs 비복용",
  ing: ["multi"], outcome: ["cvd"],
  effect: ["20년 이상 복용 주요 심혈관 사건 HR 0.56 (0.35–0.90)", "전체 복용자 HR 0.94 (0.84–1.05) — 유의 없음"],
  finding: "20년 이상 장기 복용자에서만 심혈관 사건 44% 감소 신호. 전체 복용자는 차이 없음.",
  caveat: "관찰연구. 여성건강연구(WHS 37,193명, 16년)에서는 HR 1.01로 재현 안 됨. RCT(PHS II)에서는 효과 없음. '하버드 20년 연구' 인용 시 이 한계를 반드시 함께 봐야 함.",
  grade: "C", urls: ["https://pubmed.ncbi.nlm.nih.gov/27121531/", "https://pubmed.ncbi.nlm.nih.gov/25527758/"], updated: "2026-09"
},
{
  id: "arr-2026-multi", name: "종합비타민 메타분석 19건 통합 리뷰 (550만 명)",
  inst: "싱가포르국립대(NUS) 등", journal: "Ageing Research Reviews", year: 2026,
  n: 5500000, followup: "메타분석 19건", design: "REVIEW",
  population: "성인 전반", intervention: "종합비타민",
  ing: ["multi"], outcome: ["mortality", "cognition", "cvd"],
  effect: ["RCT: 전반 인지·삽화 기억·고위험군 수축기 혈압 개선", "총 사망: 이득 없음", "관찰: 대장암·관상동맥질환·백내장·고관절 골절 감소와 연관, 총 사망은 무관"],
  finding: "2026년 시점 종합 결론: 종합비타민은 수명을 늘리지 않는다. 고령자 인지에는 작은 이득, 특정 질환에는 관찰적 연관만 있음.",
  caveat: "리뷰의 리뷰. 관찰 연관은 원인 입증 아님.",
  grade: "B", urls: ["https://pubmed.ncbi.nlm.nih.gov/41308839/"], updated: "2026-09"
},

/* ===================== 비타민 D ===================== */
{
  id: "vital-d", name: "VITAL — 비타민 D3 (암·심혈관)",
  inst: "하버드 의대 · 브리검 여성병원 (NIH 지원)", journal: "New England Journal of Medicine", year: 2019,
  n: 25871, followup: "중앙값 5.3년", design: "RCT",
  population: "미국 남성 50세+, 여성 55세+ (결핍 여부로 선별 안 함, 흑인 5,106명 포함)", intervention: "비타민 D3 2,000 IU/일 vs 위약 (오메가-3와 2×2 요인설계)",
  ing: ["vitd"], outcome: ["cancer", "cvd", "mortality"],
  effect: ["침습암 HR 0.96 (0.88–1.06), p=0.47", "주요 심혈관 사건 HR 0.97 (0.85–1.12), p=0.69", "암 사망 HR 0.83 (0.67–1.02)", "총 사망 HR 0.99 (0.87–1.12)"],
  finding: "결핍 여부와 상관없이 뽑은 일반 성인에게 비타민 D 2,000 IU는 암도 심혈관질환도 예방하지 못했다.",
  caveat: "참가자 평균 혈중 농도가 이미 충분(약 31 ng/mL). '결핍자'에게는 다른 결과가 나올 수 있음. 5.3년은 암 결과에 짧음.",
  grade: "D", urls: ["https://pubmed.ncbi.nlm.nih.gov/30415629/", "https://www.nejm.org/doi/full/10.1056/NEJMoa1809944"], updated: "2026-09"
},
{
  id: "vital-d-autoimmune", name: "VITAL — 자가면역질환",
  inst: "브리검 여성병원 · 하버드", journal: "BMJ", year: 2022,
  n: 25871, followup: "중앙값 5.3년 (+2년 사후 추적 2024)", design: "RCT",
  population: "VITAL 참가자", intervention: "비타민 D3 2,000 IU/일, 오메가-3 1 g/일",
  ing: ["vitd", "omega3"], outcome: ["immune"],
  effect: ["비타민 D: 자가면역질환 HR 0.78 (0.61–0.99), p=0.05", "오메가-3: HR 0.85 (0.67–1.08)", "둘 다: HR 0.69 (0.49–0.96)", "복용 중단 2년 후: 비타민 D HR 0.98 (효과 소실), 오메가-3 HR 0.83 (0.70–0.99, 지속)"],
  finding: "비타민 D 복용 중에는 자가면역질환(류마티스·건선·갑상선 등)이 22% 적었으나, 끊으면 2년 내 효과가 사라졌다.",
  caveat: "절대 차이 작음(약 1.0% vs 1.2%). 경계선 p값. 다양한 자가면역질환을 묶어서 분석.",
  grade: "B", urls: ["https://pubmed.ncbi.nlm.nih.gov/35082139/", "https://pubmed.ncbi.nlm.nih.gov/38272846/"], updated: "2026-09"
},
{
  id: "vital-d-fracture", name: "VITAL — 골절",
  inst: "브리검 여성병원 · 하버드", journal: "New England Journal of Medicine", year: 2022,
  n: 25871, followup: "중앙값 5.3년", design: "RCT",
  population: "VITAL 참가자 (골다공증으로 선별 안 함)", intervention: "비타민 D3 2,000 IU/일 vs 위약",
  ing: ["vitd"], outcome: ["bone"],
  effect: ["전체 골절 HR 0.98 (0.89–1.08), p=0.70", "비척추 골절 HR 0.97", "고관절 골절 HR 1.01 (0.70–1.47)", "기저 비타민 D 농도·나이·성별로 나눠도 효과 없음"],
  finding: "건강한 중노년에게 비타민 D 2,000 IU는 골절을 전혀 줄이지 못했다.",
  caveat: "결핍자·골다공증 환자·요양시설 거주자는 대상이 아님. 그 집단에는 별도 근거 필요.",
  grade: "D", urls: ["https://pubmed.ncbi.nlm.nih.gov/35939577/"], updated: "2026-09"
},
{
  id: "vital-d-advanced-cancer", name: "VITAL — 진행성(전이·치명적) 암",
  inst: "브리검 여성병원 · 하버드", journal: "JAMA Network Open", year: 2020,
  n: 25871, followup: "중앙값 5.3년", design: "RCT",
  population: "VITAL 참가자", intervention: "비타민 D3 2,000 IU/일",
  ing: ["vitd"], outcome: ["cancer"],
  effect: ["진행성 암 HR 0.83 (0.69–0.99), p=0.04", "BMI<25: HR 0.62 (0.45–0.86) · BMI≥30: HR 1.05 — 상호작용 p=0.03"],
  finding: "암 발생은 못 줄였지만 '전이·사망에 이르는 암'은 17% 적었고, 정상 체중에서 효과가 컸다.",
  caveat: "2차·탐색적 분석. 체중별 차이는 가설 수준.",
  grade: "C", urls: ["https://pmc.ncbi.nlm.nih.gov/articles/PMC7675103/"], updated: "2026-09"
},
{
  id: "vital-dep", name: "VITAL-DEP — 우울증",
  inst: "매사추세츠 종합병원 · 하버드", journal: "JAMA", year: 2020,
  n: 18353, followup: "중앙값 5.3년", design: "RCT",
  population: "평균 67.5세", intervention: "비타민 D3 2,000 IU/일 vs 위약",
  ing: ["vitd"], outcome: ["mood"],
  effect: ["우울증 발생·임상적 우울 증상 HR 0.97 (0.87–1.09), p=0.62", "기분 점수 차이 0.01점"],
  finding: "비타민 D는 고령자의 우울증을 예방하거나 기분을 개선하지 못했다.",
  caveat: "결핍자·우울 고위험군으로 선별하지 않음.",
  grade: "D", urls: ["https://pubmed.ncbi.nlm.nih.gov/32749491/"], updated: "2026-09"
},
{
  id: "dhealth", name: "D-Health — 월 1회 고용량 비타민 D와 사망",
  inst: "QIMR 버고퍼 의학연구소 (호주)", journal: "Lancet Diabetes & Endocrinology", year: 2022,
  n: 21315, followup: "중앙값 5.7년", design: "RCT",
  population: "호주 60~84세 (선거인명부 무작위 모집, 혈중 농도 선별 안 함)", intervention: "비타민 D3 60,000 IU 월 1회 (≈2,000 IU/일) vs 위약",
  ing: ["vitd"], outcome: ["mortality", "cvd"],
  effect: ["총 사망 HR 1.04 (0.93–1.18), p=0.47", "암 사망 HR 1.15 (0.96–1.39)", "주요 심혈관 사건 HR 0.91 (0.81–1.01) · 심근경색 HR 0.81 (0.67–0.98) — BMJ 2023 후속"],
  finding: "월 1회 고용량 비타민 D는 사망률을 줄이지 못했다. 심근경색은 소폭 감소 신호.",
  caveat: "월 1회 몰아 먹는 방식(볼루스)은 매일 복용과 다를 수 있음. 최근 메타분석은 매일 복용에서만 암 사망 감소를 관찰.",
  grade: "D", urls: ["https://pubmed.ncbi.nlm.nih.gov/35026158/", "https://pubmed.ncbi.nlm.nih.gov/37380191/"], updated: "2026-09"
},
{
  id: "vitd-mortality-meta", name: "비타민 D 보충과 사망률 — RCT 메타분석 (BMJ 2019 · Keum 2019 · Kuznia 2023)",
  inst: "쓰촨대 등(BMJ 2019) · 하버드 보건대학원(Keum 2019) · 독일암연구센터(Kuznia 2023)", journal: "BMJ · Annals of Oncology · Ageing Research Reviews", year: 2019,
  n: 75454, followup: "RCT 52건", design: "META",
  population: "성인", intervention: "비타민 D2/D3 vs 위약",
  ing: ["vitd"], outcome: ["mortality", "cancer"],
  effect: ["총 사망 RR 0.98 (0.95–1.02)", "암 사망 RR 0.84 (0.74–0.95) [BMJ 2019] · RR 0.87 (0.79–0.96) [Keum 2019]", "개인자료 메타(Kuznia 2023): 매일 복용 RR 0.88 (0.78–0.98) vs 볼루스 RR 1.07 (0.91–1.24)", "암 발생 RR 0.98 — 차이 없음"],
  finding: "비타민 D는 수명을 늘리지 않고 암 발생도 못 줄이지만, 매일 복용 시 암 '사망'은 12~15% 낮았다. D3가 D2보다 낫다.",
  caveat: "용량·대상 이질적. 암 사망 효과는 소수 대형 시험에 의존. 후속 메타분석(Cheema 2022)에서는 유의 없음(RR 0.93).",
  grade: "B", urls: ["https://pmc.ncbi.nlm.nih.gov/articles/PMC6689821/", "https://pubmed.ncbi.nlm.nih.gov/30796437/", "https://pubmed.ncbi.nlm.nih.gov/37004841/"], updated: "2026-09"
},
{
  id: "d2d", name: "D2d — 당뇨병 전단계에서 비타민 D",
  inst: "터프츠 메디컬센터 (NIDDK 지원)", journal: "New England Journal of Medicine", year: 2019,
  n: 2423, followup: "중앙값 2.5년", design: "RCT",
  population: "당뇨병 전단계 성인 (미국 22개 기관)", intervention: "비타민 D3 4,000 IU/일 vs 위약",
  ing: ["vitd"], outcome: ["metabolic"],
  effect: ["당뇨병 발생 HR 0.88 (0.75–1.04), p=0.12"],
  finding: "단독으로는 유의하지 않았으나 방향은 예방 쪽.",
  caveat: "참가자 대부분이 결핍이 아니었음. 검정력 부족.",
  grade: "C", urls: ["https://pubmed.ncbi.nlm.nih.gov/31173679/"], updated: "2026-09"
},
{
  id: "d2d-ipd-2023", name: "당뇨병 전단계 비타민 D — 3개 RCT 개인자료 메타분석",
  inst: "터프츠 메디컬센터", journal: "Annals of Internal Medicine", year: 2023,
  n: 4190, followup: "약 3년", design: "META",
  population: "당뇨병 전단계 성인 (Tromsø·D2d·DPVD)", intervention: "비타민 D3 4,000 IU/일 또는 주 20,000 IU 또는 엘데칼시톨",
  ing: ["vitd"], outcome: ["metabolic"],
  effect: ["당뇨병 발생 HR 0.85 (0.75–0.96)", "3년 절대 위험 감소 3.3%", "정상 혈당 회복 RR 1.30 (1.16–1.46)", "혈중 25(OH)D ≥125 nmol/L 유지군 HR 0.24 (관찰적)", "신장결석 RR 1.17 (유의 없음), 고칼슘혈증 RR 2.34 (0.83–6.66)"],
  finding: "당뇨병 전단계라면 비타민 D 보충이 당뇨병 진행을 15% 줄인다. 2024 미국 내분비학회 지침이 이를 근거로 고위험 전단계에 권고.",
  caveat: "3개 시험만 통합. 1개는 활성형 비타민 D 유사체 사용.",
  grade: "B", urls: ["https://pubmed.ncbi.nlm.nih.gov/36745886/", "https://pubmed.ncbi.nlm.nih.gov/38828931/"], updated: "2026-09"
},
{
  id: "vitd-ari-2025", name: "비타민 D와 급성 호흡기 감염 — 40개 RCT 메타분석 (2025)",
  inst: "런던 퀸메리대 (Jolliffe·Martineau)", journal: "Lancet Diabetes & Endocrinology", year: 2025,
  n: 61589, followup: "RCT 40건(6.2만 명)", design: "META",
  population: "전 연령", intervention: "비타민 D vs 위약",
  ing: ["vitd"], outcome: ["immune"],
  effect: ["급성 호흡기 감염 OR 0.94 (0.88–1.00), p=0.057 — 유의 없음", "용량·나이·기저 농도별 차이 없음"],
  finding: "2021년까지 보고됐던 '감기·호흡기 감염 예방 효과'가 최신 시험을 합치자 사라졌다.",
  caveat: "효과가 있더라도 매우 작다는 뜻. 결핍자 하위집단 효과도 확인되지 않음.",
  grade: "D", urls: ["https://pubmed.ncbi.nlm.nih.gov/39993397/"], updated: "2026-09"
},
{
  id: "endo-2024", name: "미국 내분비학회 비타민 D 지침 (2024)",
  inst: "Endocrine Society", journal: "Journal of Clinical Endocrinology & Metabolism", year: 2024,
  n: 0, followup: "체계적 문헌고찰 기반", design: "GUIDE",
  population: "전 연령", intervention: "비타민 D 경험적 보충 · 검사",
  ing: ["vitd"], outcome: ["bone", "mortality", "metabolic"],
  effect: ["권장: 1~18세, 75세 이상, 임신부, 고위험 당뇨병 전단계 → 경험적 보충", "비권장: 75세 미만 건강 성인의 기준량 초과 보충, 일상적 25(OH)D 검사", "50세 이상은 간헐적 고용량보다 매일 복용"],
  finding: "건강한 75세 미만 성인은 검사도 고용량 보충도 필요 없고, 75세 이상·임신부·당뇨 전단계는 보충하라는 것이 2024년 결론.",
  caveat: "한국인 결핍률(2022 KNHANES 기준 31~47%)이 미국보다 높아 그대로 적용하기엔 주의 필요.",
  grade: "B", urls: ["https://pubmed.ncbi.nlm.nih.gov/38828931/"], updated: "2026-09"
},
{
  id: "knhanes-vitd", name: "한국인 비타민 D 결핍 실태 — 국민건강영양조사 2022~2023",
  inst: "질병관리청 KNHANES 자료 분석 (Nutrients 2025)", journal: "Nutrients", year: 2025,
  n: 3920, followup: "단면조사", design: "COHORT",
  population: "19세 이상 한국 성인", intervention: "혈중 25(OH)D 측정",
  ing: ["vitd"], outcome: ["deficiency"],
  effect: ["25(OH)D <20 ng/mL: 성인 46.5% (2022, n=3,920)", "19~39세: 남 63.2% · 여 60.7%", "40~64세: 남 46.1% · 여 36.8%", "65세+: 남 38.4% · 여 27.6%", "2022~2023 별도 표본(n=2,612): 평균 24.2 ng/mL, 결핍 31.1%", "청소년 10~18세(2022~2023): 결핍 62.4% (여 71.5% · 남 54.0%)"],
  finding: "한국 성인 3명 중 1~2명이 비타민 D 결핍. 특히 20~30대 실내 근무 세대가 가장 심하다. 2014년(75~82%)보다는 개선.",
  caveat: "두 성인 수치는 표본·기준이 달라 섞어 쓰면 안 됨. 질병관리청 공식 통계표는 확인 안 됨(학술지 분석 기준). 보도에 흔한 '남 75%·여 82%'는 2014년 이전 자료.",
  grade: "B", urls: ["https://pmc.ncbi.nlm.nih.gov/articles/PMC12567185/", "https://pmc.ncbi.nlm.nih.gov/articles/PMC12472871/", "https://pmc.ncbi.nlm.nih.gov/articles/PMC12845353/", "https://pubmed.ncbi.nlm.nih.gov/29952942/"], updated: "2026-09"
},

/* ===================== 오메가-3 ===================== */
{
  id: "vital-omega3", name: "VITAL — 오메가-3 1 g",
  inst: "하버드 의대 · 브리검 여성병원", journal: "New England Journal of Medicine", year: 2019,
  n: 25871, followup: "중앙값 5.3년", design: "RCT",
  population: "미국 남성 50세+, 여성 55세+", intervention: "어유 1 g/일 (EPA+DHA 840 mg) vs 위약",
  ing: ["omega3"], outcome: ["cvd", "cancer"],
  effect: ["주요 심혈관 사건 HR 0.92 (0.80–1.06), p=0.24", "침습암 HR 1.03 (0.93–1.13)", "심근경색 HR 0.72 (0.59–0.90) — 2차 결과", "생선 적게 먹는 사람·흑인에서 심근경색 감소 더 큼 (하위분석)"],
  finding: "일반인에게 오메가-3 1 g은 심혈관질환·암을 예방하지 못했다. 심근경색만 28% 감소(2차 지표).",
  caveat: "심근경색 감소는 1차 목표가 아님. 생선을 거의 안 먹는 사람에겐 이득 가능성.",
  grade: "C", urls: ["https://pubmed.ncbi.nlm.nih.gov/30415637/"], updated: "2026-09"
},
{
  id: "reduce-it", name: "REDUCE-IT — 고순도 EPA 4 g (이코사펜트 에틸)",
  inst: "브리검 여성병원 (스폰서 Amarin)", journal: "New England Journal of Medicine", year: 2019,
  n: 8179, followup: "중앙값 4.9년", design: "RCT",
  population: "스타틴 복용 중 + 중성지방 135~499 + 심혈관질환(70%) 또는 당뇨+위험인자", intervention: "이코사펜트 에틸 4 g/일 vs 위약(미네랄 오일)",
  ing: ["omega3"], outcome: ["cvd"],
  effect: ["1차 복합(심혈관 사망·MI·뇌졸중·재관류·불안정협심증) 17.2% vs 22.0%, HR 0.75 (0.68–0.83), p<0.001", "심혈관 사망 HR 0.80 (0.66–0.98)", "심방세동 입원 3.1% vs 2.1% (p=0.004)", "중대 출혈 2.7% vs 2.1%"],
  finding: "고위험 환자에게 처방용 고순도 EPA 4 g은 심혈관 사건을 25% 줄였다. 단, 심방세동·출혈은 늘었다.",
  caveat: "이건 '처방약'이지 일반 어유 영양제가 아님. 위약(미네랄 오일)이 LDL·염증을 올려 효과가 부풀려졌을 가능성 논쟁 중. STRENGTH(EPA+DHA 4 g)에서는 재현 안 됨.",
  grade: "A", urls: ["https://pubmed.ncbi.nlm.nih.gov/30415628/"], updated: "2026-09"
},
{
  id: "strength", name: "STRENGTH — EPA+DHA 4 g",
  inst: "클리블랜드 클리닉 · 모나시 (스폰서 AstraZeneca)", journal: "JAMA", year: 2020,
  n: 13078, followup: "약 42개월 (무용성으로 조기 중단)", design: "RCT",
  population: "스타틴 복용 중 죽상경화성 이상지질혈증, 22개국", intervention: "오메가-3 카복실산(EPA+DHA) 4 g/일 vs 옥수수유",
  ing: ["omega3"], outcome: ["cvd"],
  effect: ["주요 심혈관 사건 12.0% vs 12.2%, HR 0.99 (0.90–1.09), p=0.84", "심방세동 HR 1.69 (1.29–2.21)", "위장 부작용 24.7% vs 14.7%"],
  finding: "EPA+DHA 혼합 4 g은 심혈관 이득이 전혀 없었고 심방세동만 69% 늘었다.",
  caveat: "REDUCE-IT과의 차이가 EPA 순도 때문인지 위약 차이 때문인지 미해결.",
  grade: "X", urls: ["https://pubmed.ncbi.nlm.nih.gov/33190147/"], updated: "2026-09"
},
{
  id: "ascend", name: "ASCEND — 당뇨병 환자 오메가-3 1 g",
  inst: "옥스퍼드 대학 CTSU", journal: "New England Journal of Medicine", year: 2018,
  n: 15480, followup: "평균 7.4년", design: "RCT",
  population: "심혈관질환 없는 영국 당뇨병 환자", intervention: "오메가-3 1 g/일 (EPA+DHA 840 mg) vs 올리브유",
  ing: ["omega3"], outcome: ["cvd"],
  effect: ["중대 혈관 사건 8.9% vs 9.2%, RR 0.97 (0.87–1.08), p=0.55", "총 사망 RR 0.95 (0.86–1.05)"],
  finding: "당뇨병 환자에게 오메가-3 1 g은 7년간 혈관 사건을 예방하지 못했다.",
  caveat: "저용량, 1차 예방.",
  grade: "D", urls: ["https://pubmed.ncbi.nlm.nih.gov/30146932/"], updated: "2026-09"
},
{
  id: "omega3-af", name: "오메가-3와 심방세동 — 메타분석 (Circulation 2021 · 2026 갱신)",
  inst: "브리검 여성병원", journal: "Circulation · Circ Arrhythm Electrophysiol", year: 2021,
  n: 81210, followup: "RCT 7건, 평균 4.9년 (2026 갱신: 35건 114,592명)", design: "META",
  population: "심혈관 결과 시험 참가자", intervention: "해양성 오메가-3 (용량별)",
  ing: ["omega3"], outcome: ["cvd", "safety"],
  effect: ["심방세동 HR 1.25 (1.07–1.46)", "≤1 g/일 HR 1.12 (1.03–1.22) · >1 g/일 HR 1.49 (1.04–2.15)", "2026 갱신: 고위험군 + >1,500 mg/일 OR 1.43 (1.14–1.79), 절대 증가 0.8%; 저용량은 유의 없음"],
  finding: "오메가-3는 용량이 높을수록 심방세동 위험을 높인다. 특히 심혈관 고위험군의 1.5 g 이상 복용.",
  caveat: "대부분 시험에서 심방세동은 1차 결과가 아니었음.",
  grade: "X", urls: ["https://pubmed.ncbi.nlm.nih.gov/34612056/", "https://pubmed.ncbi.nlm.nih.gov/42517224/"], updated: "2026-09"
},
{
  id: "cochrane-omega3", name: "코크란 리뷰 — 오메가-3와 심혈관질환 (86개 RCT)",
  inst: "이스트앵글리아 대학 (Cochrane)", journal: "Cochrane Database of Systematic Reviews", year: 2020,
  n: 162796, followup: "12~88개월", design: "META",
  population: "성인", intervention: "EPA/DHA 0.5~5 g 이상/일, ALA",
  ing: ["omega3"], outcome: ["cvd", "mortality"],
  effect: ["총 사망 RR 0.97 (0.93–1.01) — 높은 확실성", "심혈관 사망 RR 0.92 (0.86–0.99)", "관상동맥 사건 RR 0.91 (0.85–0.97), NNT 167 — 낮은 확실성", "뇌졸중 RR 1.02", "중성지방 약 15% 감소"],
  finding: "오메가-3 보충제는 사망률·전체 심혈관 사건에 거의 영향이 없고, 관상동맥 사건만 소폭 줄일 가능성.",
  caveat: "REDUCE-IT 제외 시 이득 축소. 중성지방 감소는 확실.",
  grade: "C", urls: ["https://pubmed.ncbi.nlm.nih.gov/32114706/"], updated: "2026-09"
},
{
  id: "epa-vs-dha-2025", name: "순수 EPA vs EPA+DHA — 16개 RCT 메타분석 (2025)",
  inst: "다기관", journal: "JACC: Advances", year: 2025,
  n: 127771, followup: "RCT 16건", design: "META",
  population: "성인", intervention: "정제 EPA vs EPA/DHA 혼합",
  ing: ["omega3"], outcome: ["cvd"],
  effect: ["심혈관 사망: 정제 EPA HR 0.79 (0.67–0.94) vs EPA/DHA HR 0.92 (0.84–1.00)", "2026 메타(고용량 EPA ≥1.8 g, 6건): 불안정협심증 입원 RR 0.75, 심혈관 사망·MI·뇌졸중은 유의 없음"],
  finding: "심혈관 이득은 '고용량 순수 EPA(처방약)'에 국한된다. 일반 어유는 아니다.",
  caveat: "REDUCE-IT 비중 큼.",
  grade: "B", urls: ["https://pubmed.ncbi.nlm.nih.gov/40974959/", "https://pubmed.ncbi.nlm.nih.gov/42070013/"], updated: "2026-09"
},

/* ===================== 유해 근거 · 항산화제 ===================== */
{
  id: "atbc", name: "ATBC — 흡연 남성 베타카로틴·비타민 E",
  inst: "핀란드 국립보건원 · 미국 국립암연구소", journal: "New England Journal of Medicine", year: 1994,
  n: 29133, followup: "5~8년 (중앙값 6.1년)", design: "RCT",
  population: "핀란드 50~69세 남성 흡연자", intervention: "베타카로틴 20 mg/일, 비타민 E 50 mg/일 (2×2)",
  ing: ["betacarotene", "vite"], outcome: ["cancer", "mortality"],
  effect: ["베타카로틴: 폐암 +18% (3~36%), RR 1.18 (1.03–1.36)", "베타카로틴: 총 사망 +8% (1~16%)", "비타민 E: 폐암 −2% (유의 없음), 출혈성 뇌졸중 사망 증가"],
  finding: "흡연자에게 베타카로틴은 폐암을 18%, 사망을 8% 늘렸다. 영양제가 해로울 수 있음을 처음 증명한 연구.",
  caveat: "하루 5개비 이상 흡연자 대상. 비흡연자 유해성은 이 연구로는 알 수 없음.",
  grade: "X", urls: ["https://pubmed.ncbi.nlm.nih.gov/8127329/"], updated: "2026-09"
},
{
  id: "caret", name: "CARET — 베타카로틴 + 비타민 A (조기 중단)",
  inst: "프레드 허친슨 암연구센터", journal: "New England Journal of Medicine", year: 1996,
  n: 18314, followup: "평균 4년 (21개월 조기 중단)", design: "RCT",
  population: "흡연자·과거 흡연자·석면 노출 근로자", intervention: "베타카로틴 30 mg + 레티닐 팔미테이트 25,000 IU/일 vs 위약",
  ing: ["betacarotene", "vita"], outcome: ["cancer", "mortality"],
  effect: ["폐암 RR 1.28 (1.04–1.57), p=0.02", "총 사망 RR 1.17 (1.03–1.33)", "폐암 사망 RR 1.46 (1.07–2.00)"],
  finding: "고용량 베타카로틴+비타민 A가 폐암을 28%, 사망을 17% 늘려 연구가 중단됐다.",
  caveat: "복합 제제라 두 성분의 기여를 분리 못 함. 고위험군 대상.",
  grade: "X", urls: ["https://pubmed.ncbi.nlm.nih.gov/8602180/"], updated: "2026-09"
},
{
  id: "select", name: "SELECT — 비타민 E 400 IU · 셀레늄과 전립선암",
  inst: "SWOG (미국 국립암연구소 지원), 427개 기관", journal: "JAMA", year: 2011,
  n: 34887, followup: "중앙값 7년 (무작위 35,533명, 2011 분석 34,887명)", design: "RCT",
  population: "50/55세 이상 건강한 남성 (PSA ≤4)", intervention: "비타민 E 400 IU/일, 셀레늄 200 µg/일 (2×2)",
  ing: ["vite", "selenium"], outcome: ["cancer"],
  effect: ["비타민 E: 전립선암 HR 1.17 (99% CI 1.004–1.36), p=0.008", "절대 증가 1.6명/1,000인년", "셀레늄 HR 1.09 (유의 없음), 당뇨 신호 RR 1.07", "기저 셀레늄 높은 남성이 셀레늄 복용 시 고등급 전립선암 약 2배 (2014 후속)"],
  finding: "건강한 남성이 비타민 E 400 IU를 먹으면 전립선암이 17% 늘었다. 셀레늄은 예방 효과 없음.",
  caveat: "합성 알파토코페롤. 복용 중단 후에 유해성이 드러남.",
  grade: "X", urls: ["https://jamanetwork.com/journals/jama/fullarticle/1104493", "https://www.cancer.gov/types/prostate/research/select-trial-results-qa"], updated: "2026-09"
},
{
  id: "cochrane-antioxidant", name: "코크란 리뷰 — 항산화 보충제와 사망률 (78개 RCT, 29.7만 명)",
  inst: "니시 대학 · 코펜하겐 임상시험단 (Cochrane)", journal: "Cochrane Database of Systematic Reviews", year: 2012,
  n: 296707, followup: "28일~12년 (평균 3년)", design: "META",
  population: "건강인 21.6만 + 안정 질환자 8.1만, 평균 63세", intervention: "베타카로틴·비타민 A·C·E·셀레늄 vs 위약",
  ing: ["betacarotene", "vita", "vitc", "vite", "selenium"], outcome: ["mortality"],
  effect: ["전체 RR 1.03 (1.01–1.05, 고정효과)", "편향 낮은 시험 RR 1.04 (1.01–1.07)", "베타카로틴 RR 1.05 (1.01–1.09)", "비타민 E RR 1.03 (1.00–1.05)", "비타민 A RR 1.07 (0.97–1.18), 용량 비례 증가", "비타민 C RR 1.02 · 셀레늄 RR 0.97 (유의 없음)"],
  finding: "항산화 보충제는 수명을 늘리지 않으며, 베타카로틴·비타민 E·(고용량) 비타민 A는 사망률을 소폭 높인다.",
  caveat: "2025~2026 갱신판 없음. 비타민 C·셀레늄은 유해 근거 없음(이득도 없음).",
  grade: "X", urls: ["https://pubmed.ncbi.nlm.nih.gov/22419320/"], updated: "2026-09"
},
{
  id: "miller-vite", name: "고용량 비타민 E와 사망률 — 19개 RCT 메타분석",
  inst: "존스홉킨스 의대", journal: "Annals of Internal Medicine", year: 2005,
  n: 135967, followup: "RCT 19건", design: "META",
  population: "성인 (대부분 만성질환자)", intervention: "비타민 E 16.5~2,000 IU/일",
  ing: ["vite"], outcome: ["mortality"],
  effect: ["≥400 IU/일: 사망 +39명/1만 명 (3~74), p=0.035 — 11건 중 9건 증가", "저용량: −16명/1만 명 (유의 없음)", "약 150 IU/일 이상부터 위험 상승"],
  finding: "비타민 E 400 IU 이상은 사망률을 높이므로 피해야 한다.",
  caveat: "고용량 시험은 대부분 만성질환자 소규모. 건강인 일반화 불확실.",
  grade: "X", urls: ["https://pubmed.ncbi.nlm.nih.gov/15537682/"], updated: "2026-09"
},

/* ===================== 칼슘 · 뼈 ===================== */
{
  id: "whi-cad-2006", name: "WHI — 칼슘 + 비타민 D와 골절",
  inst: "오하이오 주립대 · NHLBI (여성건강계획, 40개 기관)", journal: "New England Journal of Medicine", year: 2006,
  n: 36282, followup: "평균 7년", design: "RCT",
  population: "50~79세 폐경 여성", intervention: "탄산칼슘 1,000 mg + 비타민 D3 400 IU/일 vs 위약",
  ing: ["calcium", "vitd"], outcome: ["bone", "safety"],
  effect: ["고관절 골절 HR 0.88 (0.72–1.08), 유의 없음", "전체 골절 HR 0.96 (0.91–1.02)", "고관절 골밀도 +1.06%", "신장결석 HR 1.17 (1.02–1.34)", "순응군 고관절 골절 HR 0.71 (0.52–0.97)"],
  finding: "칼슘+비타민 D는 골절을 유의하게 줄이지 못했고 신장결석은 17% 늘렸다. 꾸준히 먹은 사람에서만 고관절 골절 감소.",
  caveat: "비타민 D 400 IU는 저용량. 위약군도 개인적으로 칼슘을 많이 먹음.",
  grade: "D", urls: ["https://pubmed.ncbi.nlm.nih.gov/16481635/"], updated: "2026-09"
},
{
  id: "whi-cad-2024", name: "WHI 칼슘 + 비타민 D — 22년 장기 추적",
  inst: "애리조나 대학 · 프레드 허친슨", journal: "Annals of Internal Medicine", year: 2024,
  n: 36282, followup: "중앙값 22.3년", design: "RCT",
  population: "WHI 참가 폐경 여성", intervention: "칼슘 + 비타민 D (7년 복용 후 추적)",
  ing: ["calcium", "vitd"], outcome: ["cancer", "cvd", "mortality"],
  effect: ["암 사망 HR 0.93 (0.87–0.99)", "심혈관 사망 HR 1.06 (1.01–1.12)", "총 사망 HR 1.00 (0.97–1.03)"],
  finding: "22년 뒤 암 사망은 7% 낮았지만 심혈관 사망은 6% 높아, 전체 수명에는 차이가 없었다.",
  caveat: "사후 분석. 칼슘과 비타민 D 효과 분리 불가.",
  grade: "C", urls: ["https://pubmed.ncbi.nlm.nih.gov/38467003/"], updated: "2026-09"
},
{
  id: "bolland-calcium", name: "칼슘 보충제와 심근경색 — Bolland 메타분석 (BMJ 2010·2011)",
  inst: "오클랜드 대학 (뉴질랜드)", journal: "BMJ", year: 2010,
  n: 11921, followup: "평균 4년 (2011: 28,072명 포함)", design: "META",
  population: "40세 이상, 칼슘 ≥500 mg/일 1년 이상", intervention: "칼슘 보충제 (±비타민 D) vs 위약",
  ing: ["calcium"], outcome: ["cvd", "safety"],
  effect: ["심근경색 HR 1.31 (1.02–1.67), p=0.035", "뇌졸중 HR 1.20 (0.96–1.50)", "2011 (칼슘±D, 8개 시험+WHI): 심근경색 RR 1.24 (1.07–1.45)"],
  finding: "칼슘 '보충제'는 심근경색 위험을 20~30% 높일 수 있다. 음식 속 칼슘은 해당 없음.",
  caveat: "심혈관 사건이 사전 지정 결과가 아님. 후속 메타분석(Chung 2016 등)은 위험 없음 → 논쟁 중. 절대 위험 증가는 작음.",
  grade: "C", urls: ["https://pubmed.ncbi.nlm.nih.gov/20671013/", "https://pubmed.ncbi.nlm.nih.gov/21505219/"], updated: "2026-09"
},
{
  id: "bmj-2026-fracture", name: "칼슘·비타민 D와 골절 — 69개 RCT 메타분석 (BMJ 2026)",
  inst: "다기관", journal: "BMJ", year: 2026,
  n: 153902, followup: "RCT 69건", design: "META",
  population: "골다공증 약 복용하지 않는 성인", intervention: "칼슘, 비타민 D, 병용 vs 위약",
  ing: ["calcium", "vitd"], outcome: ["bone"],
  effect: ["전체 골절: 칼슘 RR 0.91 (0.81–1.01) · 비타민 D RR 1.00 (0.95–1.06) · 병용 RR 0.91 (0.84–0.99)", "고관절·척추·낙상: 거의 효과 없음", "병용 효과도 임상적 의미 있는 절대 감소 기준에 미달"],
  finding: "2026년 최고 수준 근거: 지역사회 거주 성인에게 칼슘·비타민 D는 골절·낙상 예방 효과가 거의 없다. USPSTF 2024 초안도 '권고 반대(D)'.",
  caveat: "결핍자·요양시설 고령자·골다공증 환자는 대상 아님.",
  grade: "D", urls: ["https://pubmed.ncbi.nlm.nih.gov/42161415/", "https://www.uspreventiveservicestaskforce.org/uspstf/draft-recommendation/vitamin-d-calcium-combined-supplementation-primary-prevention-falls-fractures-communitydwelling-adults"], updated: "2026-09"
},

/* ===================== 눈 ===================== */
{
  id: "areds2", name: "AREDS2 — 황반변성과 루테인·지아잔틴·오메가-3",
  inst: "미국 국립안연구소(NEI, NIH)", journal: "JAMA", year: 2013,
  n: 4203, followup: "중앙값 5년 (+5년 추적 2022)", design: "RCT",
  population: "50~85세 중등도 황반변성(양측 큰 드루젠 등)", intervention: "AREDS 제형(비타민 C 500 mg·E 400 IU·베타카로틴 15 mg·아연 80 mg·구리)에 루테인 10 mg+지아잔틴 2 mg, DHA/EPA 추가",
  ing: ["lutein", "omega3", "zinc", "betacarotene"], outcome: ["eye", "safety"],
  effect: ["진행성 AMD: 루테인/지아잔틴 HR 0.90 (98.7% CI 0.76–1.07), p=0.12, 1차 결과 유의 없음", "오메가-3 HR 0.97 — 효과 없음", "10년 추적: 루테인/지아잔틴 vs 베타카로틴 HR 0.85 (0.73–0.98)", "베타카로틴군 폐암 OR 1.82 (1.06–3.12) — 대부분 과거 흡연자"],
  finding: "AREDS 제형은 중등도 황반변성의 진행을 늦춘다. 베타카로틴은 폐암 위험 때문에 루테인·지아잔틴으로 대체해야 한다. 오메가-3 추가는 효과 없음.",
  caveat: "이미 황반변성이 있는 사람 대상. 건강한 눈의 예방 근거는 아님. 아연 80 mg은 고용량.",
  grade: "B", urls: ["https://pubmed.ncbi.nlm.nih.gov/23644932/", "https://pubmed.ncbi.nlm.nih.gov/35653117/"], updated: "2026-09"
},

/* ===================== 엽산 · B군 ===================== */
{
  id: "mrc-folate-1991", name: "MRC 비타민 연구 — 엽산과 신경관 결손",
  inst: "영국 의학연구위원회(MRC), 7개국 33개 센터", journal: "Lancet", year: 1991,
  n: 1817, followup: "임신 결과 1,195건", design: "RCT",
  population: "신경관 결손 임신력 있는 여성", intervention: "엽산 4 mg/일 vs 기타 비타민 vs 위약 (2×2)",
  ing: ["folate"], outcome: ["pregnancy"],
  effect: ["신경관 결손 RR 0.28 (0.12–0.71) — 72% 예방", "기타 비타민 RR 0.80 (유의 없음)"],
  finding: "임신 전후 엽산이 신경관 결손(이분척추 등)을 72% 막았다. 전 세계 엽산 권고·강화 정책의 근거.",
  caveat: "재발 고위험군 대상. 일반 임신부 권고량은 400 µg(고위험 4 mg).",
  grade: "A", urls: ["https://pubmed.ncbi.nlm.nih.gov/1677062/"], updated: "2026-09"
},
{
  id: "cole-folate-2007", name: "엽산 1 mg과 대장 선종 재발",
  inst: "다트머스 의대", journal: "JAMA", year: 2007,
  n: 1021, followup: "3년 + 3~5년 대장내시경", design: "RCT",
  population: "최근 대장 선종 병력 성인", intervention: "엽산 1 mg/일 vs 위약",
  ing: ["folate"], outcome: ["cancer", "safety"],
  effect: ["선종 재발 RR 1.04 (0.90–1.20) — 예방 효과 없음", "진행성 병변 2차 추적 11.6% vs 6.9%, RR 1.67 (1.00–2.80), p=0.05", "선종 3개 이상·대장 외 암 증가 신호"],
  finding: "고용량 엽산은 대장 선종을 예방하지 못했고 오히려 진행성 병변이 늘어나는 신호. 이미 종양이 있는 사람의 고용량 엽산 주의.",
  caveat: "2차 결과, 경계선 유의. 후속 통합분석(2011)은 전체 선종 효과 없음.",
  grade: "C", urls: ["https://pubmed.ncbi.nlm.nih.gov/17551129/"], updated: "2026-09"
},
{
  id: "bvit-cvd", name: "호모시스테인 강하 B군 비타민과 심혈관질환 — HOPE-2 · NORVIT · VITATOPS",
  inst: "맥마스터 대학 · 트롬쇠 대학 · 서호주", journal: "NEJM 2006 · Lancet Neurology 2010", year: 2006,
  n: 17435, followup: "3.4~5년", design: "RCT",
  population: "혈관질환·당뇨·심근경색·뇌졸중 환자", intervention: "엽산 0.8~2.5 mg + B6 + B12 vs 위약",
  ing: ["folate", "b12", "b6"], outcome: ["cvd"],
  effect: ["HOPE-2 (5,522명): 복합 RR 0.95 (0.84–1.07), 뇌졸중 RR 0.75 (0.59–0.97), 불안정협심증 입원 RR 1.24", "NORVIT (3,749명): 복합 RR 1.08, 3제 병용 RR 1.22 (1.00–1.50) — 유해 경향", "VITATOPS (8,164명): 복합 RR 0.91 (0.82–1.00), p=0.05"],
  finding: "호모시스테인을 낮춰도 심근경색·심혈관 사망은 줄지 않는다. 뇌졸중만 소폭 감소, 일부 시험에서는 유해 경향.",
  caveat: "뇌졸중 감소는 엽산 강화 안 된 지역(중국 등)에 집중. 30개 RCT 메타(2016): 뇌졸중 RR 0.90, 관상동맥 RR 1.04.",
  grade: "D", urls: ["https://pubmed.ncbi.nlm.nih.gov/16531613/", "https://pubmed.ncbi.nlm.nih.gov/16531614/", "https://pubmed.ncbi.nlm.nih.gov/20688574/", "https://pubmed.ncbi.nlm.nih.gov/27528407/"], updated: "2026-09"
},

/* ===================== 비타민 C · 아연 (감기) ===================== */
{
  id: "cochrane-vitc-cold", name: "코크란 리뷰 — 비타민 C와 감기",
  inst: "헬싱키 대학 (Cochrane)", journal: "Cochrane Database of Systematic Reviews", year: 2013,
  n: 11306, followup: "29개 비교", design: "META",
  population: "일반인 · 극한 운동자(마라토너·스키어·군인)", intervention: "비타민 C ≥200 mg/일 규칙적 복용 vs 위약",
  ing: ["vitc"], outcome: ["immune"],
  effect: ["일반인 감기 발생 RR 0.97 (0.94–1.00) — 예방 못 함", "극한 운동자 RR 0.48 (0.35–0.64)", "규칙 복용 시 감기 기간 성인 −8%, 어린이 −14%", "증상 시작 후 복용: 일관된 효과 없음"],
  finding: "비타민 C는 감기를 예방하지 못한다. 평소 꾸준히 먹으면 감기 기간이 약 반나절 짧아진다. 걸린 뒤 먹는 건 효과 없음.",
  caveat: "극한 신체 스트레스 상황에서만 예방 효과.",
  grade: "C", urls: ["https://pubmed.ncbi.nlm.nih.gov/23440782/"], updated: "2026-09"
},
{
  id: "zinc-cold", name: "아연 로젠지와 감기 — 코크란 2024 · Hemilä 분석",
  inst: "메릴랜드 통합보건대 (Cochrane) · 헬싱키 대학", journal: "Cochrane Database of Systematic Reviews", year: 2024,
  n: 8526, followup: "RCT 34건", design: "META",
  population: "성인·어린이", intervention: "아연 로젠지·시럽·스프레이",
  ing: ["zinc"], outcome: ["immune"],
  effect: ["예방 RR 0.93 (0.85–1.01) — 효과 없음", "치료: 감기 기간 −2.37일 (−4.21 ~ −0.53), 이질성 97%, 낮은 확실성", "부작용(메스꺼움·맛) RR 1.34 (1.15–1.55)", "Hemilä 2011: 아연 아세테이트 >75 mg/일 −42% (35~48%), 기타 염 −20%; Hemilä 2017(7 RCT >75 mg): 전체 −33% (21~45%)"],
  finding: "아연 로젠지를 감기 초기에 하루 75 mg 이상 먹으면 기간이 1~2일 짧아질 수 있다. 예방 효과는 없고 부작용은 늘어난다.",
  caveat: "근거 확실성 낮음. 제형·용량 의존. 어린이 시험은 음성.",
  grade: "C", urls: ["https://pubmed.ncbi.nlm.nih.gov/38719213/", "https://pubmed.ncbi.nlm.nih.gov/21769305/", "https://pubmed.ncbi.nlm.nih.gov/28515951/"], updated: "2026-09"
},

/* ===================== 마그네슘 ===================== */
{
  id: "mg-bp-2016", name: "마그네슘과 혈압 — 34개 RCT 메타분석",
  inst: "인디애나 대학 · 스탠퍼드", journal: "Hypertension", year: 2016,
  n: 2028, followup: "중앙값 3개월", design: "META",
  population: "정상·고혈압 성인", intervention: "마그네슘 중앙값 368 mg/일 vs 위약",
  ing: ["magnesium"], outcome: ["bp", "cvd"],
  effect: ["수축기 −2.00 mmHg (0.43–3.58)", "이완기 −1.78 mmHg (0.73–2.82)", "혈청 마그네슘 +0.05 mmol/L"],
  finding: "마그네슘 약 300 mg을 1개월 이상 먹으면 혈압이 약 2 mmHg 내려간다. 통계적으로 확실하지만 크기는 작다.",
  caveat: "고혈압 약을 대체할 수준이 아님. 시험 간 이질성.",
  grade: "B", urls: ["https://www.ahajournals.org/doi/10.1161/hypertensionaha.116.07664"], updated: "2026-09"
},
{
  id: "mg-sleep-2021", name: "마그네슘과 고령자 불면 — 메타분석",
  inst: "댈하우지 · 맥마스터 대학", journal: "BMC Complementary Medicine and Therapies", year: 2021,
  n: 151, followup: "RCT 3건", design: "META",
  population: "고령자 불면증", intervention: "경구 마그네슘 vs 위약",
  ing: ["magnesium"], outcome: ["sleep"],
  effect: ["잠드는 시간 −17.4분 (−27.3 ~ −7.4), p=0.0006", "총 수면시간 +16분 (유의 없음)"],
  finding: "고령자에서 잠드는 시간이 17분 단축. 그러나 시험 3건, 151명뿐이며 근거 질 '낮음~매우 낮음'.",
  caveat: "'마그네슘 = 수면 영양제' 마케팅의 근거는 이 정도가 전부.",
  grade: "C", urls: ["https://link.springer.com/article/10.1186/s12906-021-03297-z"], updated: "2026-09"
},
{
  id: "mg-migraine", name: "마그네슘과 편두통 예방 — 메타분석 · AAN/AHS 지침",
  inst: "타이베이 의대 · 미국신경과학회", journal: "Pain Physician · Neurology", year: 2016,
  n: 789, followup: "경구 RCT 10건", design: "META",
  population: "편두통 환자", intervention: "경구 마그네슘 400~600 mg/일",
  ing: ["magnesium"], outcome: ["pain"],
  effect: ["편두통 빈도 OR 0.20 · 강도 OR 0.27 (신뢰구간 미확인)", "AAN/AHS 2012 지침: Level B '아마도 효과적'"],
  finding: "편두통 예방에 '아마도 효과적' 등급. 부작용이 적어 신경과에서 1차 보조요법으로 쓴다.",
  caveat: "오래된 소규모 시험. 후속 리뷰는 근거가 C등급을 넘지 못한다고 평가.",
  grade: "C", urls: ["https://painphysicianjournal.com/linkout?issn=1533-3159&vol=19&page=E97", "https://americanmigrainefoundation.org/resource-library/magnesium/"], updated: "2026-09"
},

/* ===================== 프로바이오틱스 ===================== */
{
  id: "cochrane-probiotic-aad", name: "코크란 리뷰 — 소아 항생제 연관 설사 예방 프로바이오틱스",
  inst: "Cochrane IBD 그룹", journal: "Cochrane Database of Systematic Reviews", year: 2019,
  n: 6352, followup: "RCT 33건", design: "META",
  population: "항생제 복용 소아(3일~17세)", intervention: "프로바이오틱스(주로 L. rhamnosus GG, S. boulardii) vs 대조",
  ing: ["probiotic"], outcome: ["gut"],
  effect: ["설사 발생 8% vs 19%, RR 0.45 (0.36–0.56), NNT 9", "고용량(≥50억 CFU/일) RR 0.37 (0.30–0.46), NNT 6"],
  finding: "항생제 먹는 아이에게 특정 균주 프로바이오틱스는 설사를 절반 이상 줄인다. 프로바이오틱스 근거 중 가장 확실한 영역.",
  caveat: "균주 특이적. 중증·면역저하 환아에서는 심각한 부작용 보고.",
  grade: "A", urls: ["https://pubmed.ncbi.nlm.nih.gov/31039287/"], updated: "2026-09"
},
{
  id: "probiotic-ibs", name: "프로바이오틱스와 과민성장증후군 — 메타분석 (2018 · 2023)",
  inst: "리즈 대학 · 메이요 · 맥마스터", journal: "Alimentary Pharmacology & Therapeutics · Gastroenterology", year: 2023,
  n: 10332, followup: "RCT 82건", design: "META",
  population: "과민성장증후군 성인", intervention: "다양한 균주·복합 프로바이오틱스",
  ing: ["probiotic"], outcome: ["gut"],
  effect: ["복합 프로바이오틱스: 증상 지속 RR 0.79 (0.68–0.91), NNT 7 — 이질성 72%, 출판 편향 의심", "2023 갱신: 일부 균주(Escherichia, L. plantarum 299V)만 효과, 전반 확실성 낮음~매우 낮음"],
  finding: "효과 있는 균주가 있을 수 있으나 '어떤 균주·조합이 효과적인지는 대부분 불명확'. 부작용은 없음.",
  caveat: "마트에서 파는 제품이 시험한 균주와 같다는 보장이 없음.",
  grade: "C", urls: ["https://pubmed.ncbi.nlm.nih.gov/30294792/", "https://www.gastrojournal.org/article/S0016-5085(23)04838-2/fulltext"], updated: "2026-09"
},
{
  id: "aga-probiotic-2020", name: "미국소화기학회(AGA) 프로바이오틱스 지침 2020",
  inst: "American Gastroenterological Association", journal: "Gastroenterology", year: 2020,
  n: 0, followup: "RCT 287건 기술 검토", design: "GUIDE",
  population: "소화기질환 환자", intervention: "프로바이오틱스",
  ing: ["probiotic"], outcome: ["gut"],
  effect: ["과민성장·크론병·궤양성대장염·C. difficile 치료: '연구 목적으로만' (근거 부족)", "조건부 권장: 항생제 복용 중 C. difficile 예방(특정 균주), 조산아 괴사성장염 예방, 회장낭염 8균주 복합", "조건부 반대: 소아 급성 감염성 위장염"],
  finding: "미국소화기학회 결론: 대부분의 일상적 프로바이오틱스 사용은 근거가 부족하다. 특정 상황·특정 균주만 권장.",
  caveat: "'장 건강에 좋다'는 일반 목적 복용은 지침이 지지하지 않음.",
  grade: "B", urls: ["https://www.gastrojournal.org/article/S0016-5085(20)34729-6/fulltext"], updated: "2026-09"
},

/* ===================== 코엔자임 Q10 ===================== */
{
  id: "qsymbio", name: "Q-SYMBIO — 심부전 코엔자임 Q10",
  inst: "코펜하겐 대학병원 (9개국 다기관)", journal: "JACC: Heart Failure", year: 2014,
  n: 420, followup: "2년", design: "RCT",
  population: "중등도~중증 심부전(NYHA III~IV), 표준치료 병행", intervention: "CoQ10 100 mg 1일 3회(300 mg) vs 위약",
  ing: ["coq10"], outcome: ["cvd", "mortality"],
  effect: ["주요 심혈관 사건 HR 0.50 (0.32–0.80), p=0.003", "심혈관 사망 HR 0.51 (0.28–0.92)", "총 사망 HR 0.51 (0.30–0.89)"],
  finding: "심부전 환자에서 CoQ10 300 mg이 2년간 사망·심혈관 사건을 절반으로 줄였다.",
  caveat: "420명 단일 시험. 사건 수 적음. 비유럽 기관에 결과가 편중됐다는 비판. 심부전 지침 표준치료로 채택되지 않음. 건강인 근거는 아님.",
  grade: "B", urls: ["https://pubmed.ncbi.nlm.nih.gov/25282031/"], updated: "2026-09"
},
{
  id: "coq10-statin", name: "CoQ10과 스타틴 근육통 — 12개 RCT 메타분석",
  inst: "중국중의과학원", journal: "Journal of the American Heart Association", year: 2018,
  n: 575, followup: "RCT 12건", design: "META",
  population: "스타틴 근육 증상 환자", intervention: "CoQ10 vs 위약",
  ing: ["coq10"], outcome: ["muscle", "pain"],
  effect: ["근육통 WMD −1.60 (−1.75 ~ −1.44)", "근력 저하 −2.28 · 경련 −1.78 · 피로 −1.75", "CK(근육효소) 변화 없음"],
  finding: "스타틴 근육 증상이 소폭 완화됐다는 통합 결과. 그러나 개별 RCT 다수는 음성.",
  caveat: "증상 척도 이질적. 소규모. 확실한 근거 아님.",
  grade: "C", urls: ["https://www.ahajournals.org/doi/10.1161/JAHA.118.009835"], updated: "2026-09"
},

/* ===================== 크레아틴 ===================== */
{
  id: "creatine-older", name: "크레아틴 + 근력운동, 고령자 근육량 — 22개 RCT 메타분석",
  inst: "서스캐처원 · 리자이나 대학", journal: "Open Access Journal of Sports Medicine", year: 2017,
  n: 721, followup: "7~52주, 주 2~3회 근력운동", design: "META",
  population: "평균 57~70세", intervention: "크레아틴 모노하이드레이트 + 근력운동 vs 위약 + 근력운동",
  ing: ["creatine"], outcome: ["muscle"],
  effect: ["제지방량 +1.37 kg (0.97–1.76)", "가슴 밀기 근력 SMD 0.35 (p=0.0002)", "다리 밀기 SMD 0.24 (p=0.01)"],
  finding: "근력운동과 함께 먹으면 고령자도 근육 1.4 kg이 더 붙는다. 운동 없이 먹는 효과는 아님.",
  caveat: "ISSN 입장문(2017): 건강인에게 장기(5년, 30 g/일까지) 안전. 신장질환자는 의사 상담.",
  grade: "B", urls: ["https://www.tandfonline.com/doi/full/10.2147/OAJSM.S123529", "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5469049/"], updated: "2026-09"
},
{
  id: "creatine-memory", name: "크레아틴과 기억력 — 메타분석 (2023, 재분석 논쟁)",
  inst: "리버풀 대학 등", journal: "Nutrition Reviews", year: 2023,
  n: 0, followup: "RCT 8건", design: "META",
  population: "건강 성인", intervention: "크레아틴 vs 위약",
  ing: ["creatine"], outcome: ["cognition"],
  effect: ["기억 SMD 0.29 (0.04–0.53)", "66~76세 SMD 0.88 (0.22–1.55)", "재분석 후: 전체 유의 없음, 고령자만 유지"],
  finding: "고령자 기억력 개선 가능성. 그러나 이중 계산 오류가 지적돼 전체 효과는 유의를 잃음.",
  caveat: "근거 불안정. '뇌 영양제'로 팔기엔 이름.",
  grade: "C", urls: ["https://pubmed.ncbi.nlm.nih.gov/35984306/"], updated: "2026-09"
},

/* ===================== 커큐민 ===================== */
{
  id: "curcumin-oa", name: "커큐미노이드와 무릎 관절염 — 15개 RCT 메타분석",
  inst: "다기관", journal: "BMC Complementary Medicine and Therapies", year: 2022,
  n: 1670, followup: "RCT 15건", design: "META",
  population: "무릎 골관절염", intervention: "커큐미노이드 단독 vs 위약 · NSAID",
  ing: ["curcumin"], outcome: ["joint", "pain"],
  effect: ["VAS 통증 −1.77 (−2.44 ~ −1.09) vs 위약", "WOMAC 기능 −5.04", "NSAID 대비 비열등, 부작용 RR 0.71 (0.57–0.90)"],
  finding: "무릎 관절염 통증을 소염진통제만큼 줄이면서 부작용은 적었다는 통합 결과.",
  caveat: "포함 시험 질 낮음. 커큐민 흡수율 매우 낮아 '고흡수 제형'을 쓰는데, 이 제형에서 간 손상 보고 증가(미국 DILIN 10례, 이탈리아 2019년 상반기 28례·토스카나 7례 → 간 경고 라벨 의무화). NIH: 어떤 목적에도 이득 결론 불충분.",
  grade: "C", urls: ["https://link.springer.com/article/10.1186/s12906-022-03740-9", "https://www.nccih.nih.gov/health/turmeric", "https://www.amjmed.com/article/S0002-9343(22)00740-9/fulltext"], updated: "2026-09"
},

/* ===================== 콜라겐 ===================== */
{
  id: "collagen-skin", name: "경구 콜라겐과 피부 노화 — 26개 RCT 메타분석",
  inst: "타이베이 의대", journal: "Nutrients", year: 2023,
  n: 1721, followup: "8~12주 대부분", design: "META",
  population: "20~70세 (95% 여성)", intervention: "가수분해 콜라겐 vs 위약",
  ing: ["collagen"], outcome: ["skin"],
  effect: ["피부 수분 개선 (Z=4.94, p<0.00001)", "탄력 개선 (Z=4.49, p<0.00001)", "효과 크기는 원료·기간에 따라 상이"],
  finding: "피부 수분·탄력이 통계적으로 개선. 다만 대부분 제조사 지원 소규모 단기 시험.",
  caveat: "제조사 무관 시험만 모으면 효과가 사라진다는 2025 분석 보도(원문 미확인). 주름·처짐 같은 눈에 보이는 변화 근거는 약함.",
  grade: "C", urls: ["https://www.mdpi.com/2072-6643/15/9/2080", "https://pubmed.ncbi.nlm.nih.gov/33742704/"], updated: "2026-09"
},
{
  id: "collagen-oa", name: "콜라겐과 골관절염 — 5개 RCT 메타분석 및 재분석 반박",
  inst: "누에보레온 자치대학 · 재분석(von Hippel)", journal: "International Orthopaedics", year: 2019,
  n: 0, followup: "RCT 5건", design: "META",
  population: "골관절염", intervention: "콜라겐 vs 위약",
  ing: ["collagen"], outcome: ["joint"],
  effect: ["WOMAC 총점 −8.00 (−13.04 ~ −2.95)", "WOMAC 통증·기능 하위척도: 유의 없음", "2021 재분석: '강한 결론을 지지하지 않음'"],
  finding: "관절 통증 효과는 소규모 5건에 의존하고, 통계 재분석에서 결론이 흔들렸다.",
  caveat: "관절 목적 콜라겐 구매 근거는 약함.",
  grade: "C", urls: ["https://link.springer.com/article/10.1007/s00264-018-4211-5", "https://pubmed.ncbi.nlm.nih.gov/34636929/"], updated: "2026-09"
},

/* ===================== 철분 · B12 ===================== */
{
  id: "iron-korea", name: "한국 여성 빈혈 유병률 — 질병관리청 2014~2023 추이 · WHO 철분 지침",
  inst: "질병관리청 · WHO", journal: "주간 건강과 질병 2025;18(41) · WHO Guideline 2016", year: 2025,
  n: 0, followup: "단면조사", design: "COHORT",
  population: "10세 이상 한국 여성", intervention: "—",
  ing: ["iron"], outcome: ["deficiency"],
  effect: ["여성(10세+) 연령표준화 빈혈 14.8% · 남성 3.3% (2023)", "여성 연령별: 19~29세 10.0% · 30대 18.2% · 40대 21.7% · 50대 9.9% · 60대 11.6% · 70세+ 20.2%", "남성 70세+ 21.1%", "WHO: 빈혈 유병률 ≥40% 지역에서만 가임기 여성 일괄 보충(30~60 mg, 연 3개월) 권고"],
  finding: "한국 30~40대 여성 5명 중 1명이 빈혈. 그러나 WHO 기준상 한국은 '검사 후 보충' 지역이지 일괄 보충 지역이 아니다.",
  caveat: "질병관리청 공식 간행물 그림에서 읽은 값. 70세 이상은 남녀 모두 5명 중 1명이 빈혈이며 이는 철 결핍보다 만성질환·출혈 원인 감별이 우선. 결핍 없는 철 보충은 위장 부작용·철 과잉 위험.",
  grade: "B", urls: ["https://pmc.ncbi.nlm.nih.gov/articles/PMC12547683/", "https://www.who.int/publications/i/item/9789241510196", "https://ods.od.nih.gov/factsheets/Iron-HealthProfessional/"], updated: "2026-09"
},
{
  id: "b12-metformin", name: "메트포르민과 B12 결핍 — 17개 연구 메타분석 · ADA 2025 권고",
  inst: "다기관 · 미국당뇨병학회", journal: "Cureus · Diabetes Care", year: 2022,
  n: 0, followup: "관찰연구 17건", design: "META",
  population: "메트포르민 복용 2형 당뇨 환자", intervention: "—",
  ing: ["b12"], outcome: ["deficiency"],
  effect: ["B12 결핍 23.2% (복용) vs 17.4% (비복용), OR 2.95 (2.18–4.00)", "용량·기간에 비례", "ADA 2025/2026: 장기(4~5년+)·고용량(≥1,500 mg) 복용자 정기 B12 검사"],
  finding: "메트포르민을 오래 먹으면 B12 결핍이 약 3배. 당뇨약 먹는 부모님은 B12 검사 한 번 받는 게 맞다.",
  caveat: "관찰연구. NIH: 50세 이상은 위산 감소로 식품 B12 흡수가 떨어지므로 강화식품·보충제 권고, 상한섭취량 없음.",
  grade: "B", urls: ["https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9816920/", "https://ods.od.nih.gov/factsheets/VitaminB12-HealthProfessional/", "https://diabetesjournals.org/care/article/49/Supplement_1/S50/163924/"], updated: "2026-09"
},

/* ===================== 멜라토닌 ===================== */
{
  id: "melatonin-meta", name: "멜라토닌과 1차 수면장애 — 19개 RCT 메타분석 · 용량 반응 (2024)",
  inst: "예일 대학 · 피사 대학", journal: "PLoS One · Journal of Pineal Research", year: 2013,
  n: 1683, followup: "RCT 19건 (2024: 26건)", design: "META",
  population: "1차 수면장애 성인", intervention: "멜라토닌 vs 위약",
  ing: ["melatonin"], outcome: ["sleep"],
  effect: ["잠드는 시간 −7.1분 (4.4–9.8)", "총 수면 +8.3분 (1.7–14.8)", "수면 질 SMD 0.22", "2024 용량반응: 3~4 mg, 취침 3시간 전 복용이 최적"],
  finding: "잠드는 시간이 7분 빨라진다. 효과가 작아 미국수면의학회(AASM 2017)는 불면증에 '사용하지 않을 것을 제안'.",
  caveat: "한국에서는 전문의약품(처방 필요). 해외 직구 제품은 함량 편차 −83%~+478% 보고.",
  grade: "B", urls: ["https://pubmed.ncbi.nlm.nih.gov/23691095/", "https://pubmed.ncbi.nlm.nih.gov/38888087/", "https://pubmed.ncbi.nlm.nih.gov/27998379/"], updated: "2026-09"
},

/* ===================== 글루코사민 ===================== */
{
  id: "gait", name: "GAIT — 글루코사민·콘드로이틴 무릎 관절염 (NIH)",
  inst: "미국 NIH (NCCAM·NIAMS), 유타 대학, 16개 기관", journal: "New England Journal of Medicine", year: 2006,
  n: 1583, followup: "24주 (+2년 구조 추적)", design: "RCT",
  population: "통증 있는 무릎 골관절염", intervention: "글루코사민 HCl 1,500 mg · 콘드로이틴 1,200 mg · 병용 · 세레콕시브 · 위약",
  ing: ["glucosamine"], outcome: ["joint", "pain"],
  effect: ["통증 20% 이상 감소: 위약 60.1% · 글루코사민 64.0% (p=0.30) · 콘드로이틴 65.4% · 병용 66.6% (p=0.09) · 세레콕시브 70.1% (p=0.008)", "중등~중증 하위군 병용 79.2% vs 54.3% (탐색적)", "2년 관절 간격 변화: 차이 없음"],
  finding: "NIH 결정판 시험: 글루코사민·콘드로이틴은 위약(60% 반응!)보다 낫지 않았다. 관절 구조도 못 지켰다.",
  caveat: "코크란(25건): 특정 제약사 글루코사민 황산염만 효과, 일반 제품은 SMD −0.05로 효과 없음. ACR 2019·OARSI 2019 지침은 '권장 반대'.",
  grade: "D", urls: ["https://www.nejm.org/doi/full/10.1056/NEJMoa052771", "https://www.cochrane.org/evidence/CD002946_glucosamine-osteoarthritis"], updated: "2026-09"
},

/* ===================== 비타민 K2 ===================== */
{
  id: "k2-bone-cvd", name: "비타민 K2(MK-7) — 폐경 여성 골밀도 RCT · 관상동맥 석회화 AVADEC RCT",
  inst: "마스트리흐트 대학 · 오덴세 대학병원", journal: "Osteoporosis International · JACC: Advances", year: 2023,
  n: 548, followup: "3년 (뼈) · 2년 (심혈관)", design: "RCT",
  population: "건강 폐경 여성 244명 · AVADEC 남성 389명 무작위(석회화 분석 304명)", intervention: "MK-7 180 µg/일 · MK-7 720 µg + 비타민 D 25 µg/일",
  ing: ["vitk2"], outcome: ["bone", "cvd"],
  effect: ["요추·대퇴경부 골밀도 감소 완화 (총 고관절 효과 없음)", "16개 RCT 메타(6,425명): 골절 RR 0.96 (p=0.65) — 효과 없음", "AVADEC: 관상동맥 석회화 진행 차이 없음 (p=0.089)", "투석·당뇨 환자 시험도 모두 음성"],
  finding: "K2는 골밀도를 조금 지키지만 골절은 못 줄이고, 혈관 석회화 예방은 최고 수준 RCT에서 실패했다.",
  caveat: "긍정 시험 대부분이 K2 원료사(NattoPharma/VitaK) 연계 단일 연구진. 와파린 복용자 금기.",
  grade: "D", urls: ["https://pubmed.ncbi.nlm.nih.gov/23525894/", "https://www.jacc.org/doi/10.1016/j.jacadv.2023.100643", "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9403798/"], updated: "2026-09"
},

/* ===================== 홍국 · 베르베린 ===================== */
{
  id: "ryr-berberine", name: "홍국(모나콜린 K) · 베르베린과 콜레스테롤 — 메타분석 및 규제",
  inst: "다기관 (중국 위주)", journal: "Frontiers in Pharmacology · Phytomedicine", year: 2021,
  n: 3159, followup: "RCT 15건 (홍국) · 16건 (베르베린)", design: "META",
  population: "이상지질혈증", intervention: "홍국 200~4,800 mg/일 · 베르베린",
  ing: ["ryr"], outcome: ["lipid"],
  effect: ["홍국 vs 스타틴: LDL 강하 유사, 중성지방 −19.9 mg/dL 추가", "베르베린: LDL −0.38 mmol/L (≈ −15 mg/dL), TC −0.47", "심혈관 사건·사망 결과 시험: 없음"],
  finding: "둘 다 LDL을 낮춘다. 그러나 홍국의 유효성분은 처방약 로바스타틴과 '동일 물질'이라 근육·간 부작용도 같고, 시트리닌(신독성 곰팡이독) 오염 문제로 EU는 2022년 1회분 3 mg 미만 제한 후 전면 금지 추진 중.",
  caveat: "스타틴 복용 중 병용 금지. 임신·간질환·70세 이상 경고. 심혈관 사건을 줄였다는 근거는 없음.",
  grade: "C", urls: ["https://pubmed.ncbi.nlm.nih.gov/35111069/", "https://pubmed.ncbi.nlm.nih.gov/30466986/", "https://eur-lex.europa.eu/legal-content/EN/TXT/PDF/?uri=CELEX%3A32022R0860"], updated: "2026-09"
},
/* ===================== 허브·기타 성분 효능 (2026-09-06 검증) ===================== */
{
  id: "gem-ginkgo", name: "GEM — 은행잎 추출물과 치매 예방",
  inst: "피츠버그 대학 등 미국 5개 센터 (NCCAM·NIA 지원)", journal: "JAMA", year: 2008,
  n: 3069, followup: "중앙값 6.1년", design: "RCT",
  population: "75세 이상 지역사회 노인(정상 2,587 + 경도인지장애 482)", intervention: "은행잎 추출물 EGb 761 120 mg 1일 2회 vs 위약",
  ing: ["ginkgo"], outcome: ["cognition"],
  effect: ["전체 치매 HR 1.12 (0.94–1.33), p=0.21", "알츠하이머 HR 1.16 (0.97–1.39)", "2009 후속: 기억·언어·주의 등 모든 영역 인지 저하 속도 차이 없음"],
  finding: "가장 큰 은행잎 시험에서 치매 예방도 인지 저하 억제도 실패했다.",
  caveat: "75세 이상만 대상. 더 젊은 나이·더 긴 복용은 검증 안 됨.",
  grade: "D", urls: ["https://pubmed.ncbi.nlm.nih.gov/19017911/", "https://pubmed.ncbi.nlm.nih.gov/20040554/"], updated: "2026-09"
},
{
  id: "cochrane-milkthistle", name: "코크란 리뷰 — 밀크시슬과 알코올성·바이러스성 간질환",
  inst: "코펜하겐 코크란 간담도 그룹", journal: "Cochrane Database of Systematic Reviews", year: 2007,
  n: 1088, followup: "RCT 18건", design: "META",
  population: "알코올성·B형·C형 간질환", intervention: "밀크시슬(실리마린) vs 위약",
  ing: ["milkthistle"], outcome: ["mortality"],
  effect: ["총 사망 RR 0.78 (0.53–1.15), 유의 없음", "간질환 합병증 RR 0.95 (0.83–1.09)", "간 관련 사망 감소는 질 낮은 시험에서만(고품질 시험 RR 0.57, 0.28–1.19 유의 없음)", "조직 소견 변화 없음"],
  finding: "'간 영양제' 밀크시슬은 사망·합병증을 줄이지 못했다. 안전하지만 효과도 없다.",
  caveat: "시험의 28.6%만 고품질.",
  grade: "D", urls: ["https://pubmed.ncbi.nlm.nih.gov/17943794/"], updated: "2026-09"
},
{
  id: "ala-neuropathy", name: "알파리포산과 당뇨병성 신경병증 — SYDNEY 2 · NATHAN 1 · 메타분석",
  inst: "독일 당뇨병센터(뒤셀도르프)", journal: "Diabetes Care 2006·2011 · Int J Endocrinol 2012", year: 2011,
  n: 641, followup: "5주(SYDNEY 2, 181명) · 4년(NATHAN 1, 460명)", design: "RCT",
  population: "당뇨병성 말초신경병증", intervention: "경구 알파리포산 600 mg/일 vs 위약",
  ing: ["ala"], outcome: ["pain"],
  effect: ["SYDNEY 2: 증상 점수(TSS) −4.9점(51%) vs 위약 −2.9점(32%), 반응률 62% vs 26%", "NATHAN 1(4년): 1차 복합 지표 유의 없음(p=0.105), 2차 신경병증 점수 개선(p=0.028)", "메타(4 RCT): 경구 SMD −1.78 (−2.45 ~ −1.10)"],
  finding: "600 mg으로 수주 내 신경병증 증상이 개선된다. 4년 장기 시험은 1차 목표를 놓쳤다.",
  caveat: "증상 지표 위주, 이질성 높음. 600 mg 초과는 부작용만 증가.",
  grade: "B", urls: ["https://pubmed.ncbi.nlm.nih.gov/17065669/", "https://pubmed.ncbi.nlm.nih.gov/21775755/", "https://pmc.ncbi.nlm.nih.gov/articles/PMC3272801/"], updated: "2026-09"
},
{
  id: "cinnamon-diabetes", name: "계피와 당뇨병 — 코크란 2012 · 우산 메타분석 2023",
  inst: "코크란 · 타브리즈 의대", journal: "Cochrane · Diabetology & Metabolic Syndrome", year: 2023,
  n: 577, followup: "RCT 10건(코크란) · 메타분석 11건(우산)", design: "META",
  population: "1·2형 당뇨병", intervention: "경구 계피(주로 카시아) 평균 2 g/일, 4~16주",
  ing: ["cinnamon"], outcome: ["metabolic"],
  effect: ["코크란: HbA1c·공복혈당·인슐린 차이 없음", "2023 우산 메타: HbA1c −0.10% (−0.17 ~ −0.03), 공복혈당 −10.9 mg/dL", "2023 용량반응 메타: 공복혈당·HbA1c 유의 없음"],
  finding: "HbA1c 0.1% 감소는 임상적 의미(0.5%)에 한참 못 미친다. 코크란은 '근거 불충분'.",
  caveat: "카시아 계피의 쿠마린 간독성이 이득보다 문제.",
  grade: "D", urls: ["https://www.cochranelibrary.com/cdsr/doi/10.1002/14651858.CD007170.pub2/abstract", "https://pubmed.ncbi.nlm.nih.gov/37316893/"], updated: "2026-09"
},
{
  id: "chromium-glycemic", name: "크롬과 혈당 조절 — 메타분석 2014 · NIH ODS 리뷰 2016",
  inst: "마히돌 대학 · 미국 NIH 식이보충제국", journal: "J Clin Pharm Ther · Nutrition Reviews", year: 2016,
  n: 0, followup: "RCT 25건", design: "META",
  population: "2형 당뇨병", intervention: "크롬(주로 피콜리네이트 200 µg 이상) 8주 이상",
  ing: ["chromium"], outcome: ["metabolic"],
  effect: ["HbA1c −0.55% (−0.88 ~ −0.22), 공복혈당 −1.15 mmol/L — 이질성 높음", "NIH ODS 2016: 20개 RCT 중 HbA1c 목표 도달 3/14건. '권고할 근거 거의 없음'"],
  finding: "통합하면 HbA1c 0.5% 감소로 보이지만 소규모·이질적 시험이며 NIH는 권고하지 않는다.",
  caveat: "고용량(1,200 µg+) 신부전 사례.",
  grade: "C", urls: ["https://pubmed.ncbi.nlm.nih.gov/24635480/", "https://pubmed.ncbi.nlm.nih.gov/27261273/"], updated: "2026-09"
},
{
  id: "greentea-efsa", name: "녹차추출물 — EFSA 2018 안전성 의견 · 코크란 체중 감량 리뷰",
  inst: "유럽식품안전청(EFSA) · 댈하우지 대학(Cochrane)", journal: "EFSA Journal · Cochrane", year: 2018,
  n: 532, followup: "RCT 12주 이상(체중) · 49개 연구 검토(안전성)", design: "META",
  population: "과체중·비만 성인", intervention: "녹차추출물(EGCG) 보충제",
  ing: ["greentea"], outcome: ["safety", "metabolic"],
  effect: ["코크란(일본 외 6건): 체중 −0.04 kg (−0.5 ~ 0.4) — 효과 없음", "EFSA: 보충제 EGCG 800 mg/일 이상에서 간효소 유의 상승, 안전 용량 설정 불가. EU 상한 800 mg", "차로 마시는 EGCG 90~300 mg/일은 안전"],
  finding: "녹차추출물은 살이 빠지지 않고, 800 mg 이상 EGCG는 간을 상하게 한다.",
  caveat: "일본 시험(제조사 연계)은 −0.2~−3.5 kg이나 통합 불가.",
  grade: "X", urls: ["https://efsa.onlinelibrary.wiley.com/doi/10.2903/j.efsa.2018.5239", "https://pubmed.ncbi.nlm.nih.gov/23235664/"], updated: "2026-09"
},
{
  id: "ginseng-evidence", name: "홍삼·인삼 — 피로 메타분석 · 와파린 상호작용 RCT",
  inst: "국립암센터(한국) · 시카고 대학", journal: "J Korean Med Sci 2016 · Annals of Internal Medicine 2004", year: 2016,
  n: 630, followup: "RCT 12건(피로) · 교차 RCT 20명(와파린)", design: "META",
  population: "성인", intervention: "인삼·홍삼 vs 위약",
  ing: ["ginseng"], outcome: ["muscle", "safety"],
  effect: ["피로(4 RCT): SMD 0.34 (0.16–0.52) — 작은 효과", "신체 수행능력(8 RCT): SMD −0.01 — 효과 없음", "2023 메타(19 RCT): 전체 피로 SMD −0.36 (−0.82 ~ 0.11) 유의 없음 · 만성피로 하위군 −0.30 · 일반 피로 −0.48", "Yuan 2004: 미국삼 2주 복용 시 와파린 최고 INR −0.19 (−0.36 ~ −0.07), p=0.0012"],
  finding: "피로에 작은 효과(SMD 0.3)가 소규모 시험에서 보이고, 인삼은 와파린 효과를 측정 가능하게 떨어뜨린다. 면역 결과 메타분석은 없다.",
  caveat: "저자들: '근거 불충분, 소규모 시험'. 와파린 RCT는 건강 자원자 대상 미국삼.",
  grade: "C", urls: ["https://pubmed.ncbi.nlm.nih.gov/27822924/", "https://pubmed.ncbi.nlm.nih.gov/15238367/", "https://pubmed.ncbi.nlm.nih.gov/36730693/"], updated: "2026-09"
},
{
  id: "ashwagandha-evidence", name: "아슈와간다 — 스트레스·불안 메타분석 · 간 손상 사례",
  inst: "테헤란 의대 · 아이슬란드 란드스피탈리/미국 DILIN", journal: "Phytotherapy Research 2022 · Liver International 2020", year: 2022,
  n: 1002, followup: "RCT 12건 · 간 손상 5례", design: "META",
  population: "25~48세 성인", intervention: "뿌리 추출물 240~600 mg/일",
  ing: ["ashwagandha"], outcome: ["mood", "safety"],
  effect: ["불안 SMD −1.55 (−2.37 ~ −0.74), 이질성 93.8%", "스트레스 SMD −1.75 (−2.29 ~ −1.22), 근거 확실성 '낮음'", "간 손상 5례: 잠복기 2~12주, 담즙정체형, 황달, 1~5개월 회복(LiverTox: 간 손상 유발 가능성 있음)"],
  finding: "스트레스 감소 효과는 크게 나오지만 근거 확실성이 낮고(인도 제조사 지원 소규모), 문서화된 간 손상 사례가 있다.",
  caveat: "덴마크 판매 금지(2023), 프랑스 임신·수유 반대(2024).",
  grade: "C", urls: ["https://pubmed.ncbi.nlm.nih.gov/36017529/", "https://pubmed.ncbi.nlm.nih.gov/31991029/"], updated: "2026-09"
},
{
  id: "nac-copd", name: "NAC와 COPD 악화 — 코크란 2019 · PANTHEON",
  inst: "오클랜드 대학(Cochrane) · 광저우 호흡기연구소", journal: "Cochrane · Lancet Respiratory Medicine", year: 2019,
  n: 10377, followup: "RCT 38건(코크란) · 1,006명 1년(PANTHEON)", design: "META",
  population: "COPD·만성 기관지염", intervention: "경구 점액용해제(NAC 등) 2개월 이상 · NAC 600 mg 1일 2회",
  ing: ["nac"], outcome: ["immune"],
  effect: ["악화 없이 지낸 비율 Peto OR 1.73 (1.56–1.91), NNT 8", "입원 OR 0.68 (0.52–0.89)", "사망 OR 0.98 — 차이 없음", "PANTHEON: 악화 1.16 vs 1.49회/인년, RR 0.78 (0.67–0.90)"],
  finding: "고용량 NAC(1,200 mg/일)는 COPD 악화를 20~25% 줄인다. 중등도 환자에서 가장 뚜렷.",
  caveat: "최신·장기 시험일수록 효과 작음. PANTHEON은 제약사 지원, 중국 대상.",
  grade: "B", urls: ["https://pubmed.ncbi.nlm.nih.gov/31107966/", "https://pubmed.ncbi.nlm.nih.gov/24621680/"], updated: "2026-09"
},
{
  id: "biotin-fda", name: "FDA 안전성 서한 — 비오틴의 혈액검사 간섭",
  inst: "미국 FDA", journal: "FDA Safety Communication", year: 2019,
  n: 0, followup: "2017-11 발표, 2019-11 갱신", design: "GUIDE",
  population: "비오틴 보충제 복용자", intervention: "고용량 비오틴(모발·손톱 제품 5~20 mg, RDA 0.03 mg의 최대 650배)",
  ing: ["biotin"], outcome: ["safety"],
  effect: ["스트렙타비딘-비오틴 면역검사에서 거짓 고·저 결과: 트로포닌, TSH·T4, 호르몬, 비타민 D, hCG", "거짓 저하 트로포닌으로 심근경색 놓쳐 사망 1건 보고", "2019: 일부 제조사만 간섭 해소, 14개 트로포닌 검사 여전히 영향"],
  finding: "모발 영양제 수준의 비오틴은 심근경색·갑상선 검사를 왜곡한다. 검사 2일 전에는 끊어야 한다.",
  caveat: "권장량(30 µg) 수준은 간섭 없음.",
  grade: "X", urls: ["https://www.fda.gov/medical-devices/in-vitro-diagnostics/biotin-interference-troponin-lab-tests-assays-subject-biotin-interference", "https://www.thyroid.org/patient-thyroid-information/ct-for-patients/january-2022/vol-15-issue-1-p-7-8/"], updated: "2026-09"
},
{
  id: "garlic-bp", name: "마늘 보충제와 혈압 — 메타분석 (Ried 2016·2020)",
  inst: "호주 국립통합의학연구소", journal: "Journal of Nutrition · Experimental and Therapeutic Medicine", year: 2020,
  n: 970, followup: "RCT 20건(2016) · 고혈압 12건 553명(2020), 중앙값 12주", design: "META",
  population: "성인·고혈압 환자", intervention: "마늘 분말 600~900 mg 또는 숙성마늘 추출물 1,200 mg/일",
  ing: ["garlic"], outcome: ["bp"],
  effect: ["전체: 수축기 −5.1 ± 2.2, 이완기 −2.5 mmHg", "고혈압군: 수축기 −8.3 ± 1.9, 이완기 −5.5 mmHg"],
  finding: "고혈압 환자에서 12주 마늘 보충제로 수축기 혈압 약 8 mmHg 감소.",
  caveat: "단일 저자 리뷰, 저자는 제조사(Kyolic) 지원 시험 수행. 소규모 단기, 심혈관 사건 결과 없음.",
  grade: "C", urls: ["https://pubmed.ncbi.nlm.nih.gov/26764326/", "https://pubmed.ncbi.nlm.nih.gov/32010325/"], updated: "2026-09"
},
{
  id: "sjw-evidence", name: "세인트존스워트 — 코크란 우울증 리뷰 · 이리노테칸 상호작용",
  inst: "뮌헨 공대(Cochrane) · 에라스무스 암센터", journal: "Cochrane 2008 · JNCI 2002", year: 2008,
  n: 5489, followup: "RCT 29건", design: "META",
  population: "주요 우울증 환자", intervention: "하이페리쿰 추출물 vs 위약·항우울제",
  ing: ["sjw"], outcome: ["mood", "safety"],
  effect: ["위약 대비 반응률 RR 1.28 (1.10–1.49) (대규모 9건)", "SSRI 대비 RR 1.00 — 동등", "부작용 중단 OR 0.53 vs SSRI", "이리노테칸 활성대사체 SN-38 AUC −42% (14~70%) — 항암 효과 저하"],
  finding: "우울증에는 SSRI만큼 효과가 있으나 CYP3A4 유도로 항암제·면역억제제·피임약·항응고제를 무력화한다. 국내에서는 건강기능식품이 아닌 일반의약품(예: 페리시정)으로만 허가.",
  caveat: "독일어권 시험이 더 우호적. 추출물 표준화 상이.",
  grade: "B", urls: ["https://pubmed.ncbi.nlm.nih.gov/18843608/", "https://pubmed.ncbi.nlm.nih.gov/12189228/"], updated: "2026-09"
}
];
