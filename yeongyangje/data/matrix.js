/* 근거영양 — 성분 × 질환·상태 판정 매트릭스
   출처 검증 2026-09-06 (NIH ODS·NCCIH·LiverTox·FDA·EMA·EFSA·학회 지침·PubMed·식약처 의약품안전나라)
   v: ok | caution | avoid | na  · why: 한 줄 이유 · src: 근거 URL
   셀이 없으면 na(특별한 문제·이득 없음)로 처리 */
(function () {
  var X = {};
  function c(v, why, src) { return { v: v, why: why, src: src ? (typeof src === 'string' ? [src] : src) : [] }; }
  var ODS = 'https://ods.od.nih.gov/factsheets/', NC = 'https://www.nccih.nih.gov/health/', LT = 'https://www.ncbi.nlm.nih.gov/books/', SPAQI = 'https://www.mayoclinicproceedings.org/article/S0025-6196(20)30920-4/fulltext';

  /* ===== 오메가-3 ===== */
  X.omega3 = {
    healthy: c('na', '생선 주 2회 이상 먹는 건강인은 보충제 이득 없음(VITAL·코크란)', 'https://pubmed.ncbi.nlm.nih.gov/30415637/'),
    htn: c('ok', '혈압 문제 없음, 소폭 강하 가능', 'https://ods.od.nih.gov/factsheets/Omega3FattyAcids-HealthProfessional/'),
    diabetes: c('ok', '혈당 악영향 없음. 단 ASCEND(1.5만 명): 당뇨 환자 혈관 사건 예방 실패', 'https://pubmed.ncbi.nlm.nih.gov/30146932/'),
    dyslip: c('caution', '중성지방 15% 감소. 심혈관 사건 감소는 처방용 고순도 EPA 4 g만(REDUCE-IT). 일반 어유는 대체 불가, FDA 보충제 상한 EPA+DHA 5 g', ODS + 'Omega3FattyAcids-HealthProfessional/'),
    ckd: c('ok', '신독성 없음. KDOQI 2020 영양 지침에서 보조요법으로 언급', 'https://www.ajkd.org/article/S0272-6386(20)30726-5/fulltext'),
    liver: c('ok', 'LiverTox: 간 손상 보고 없음', LT + 'NBK548910/'),
    hf_af: c('caution', '심방세동 위험 용량 비례 증가(7개 RCT 8.1만 명 HR 1.25, >1 g HR 1.49). 심부전·심방세동 환자는 EPA+DHA 1 g/일 이하', 'https://www.ahajournals.org/doi/10.1161/CIRCULATIONAHA.121.055654'),
    gi: c('ok', '위장 불편 외 문제 없음', 'https://ods.od.nih.gov/factsheets/Omega3FattyAcids-HealthProfessional/'),
    cancer: c('ok', 'CYP 상호작용 없음. 악액질에 흔히 사용', 'https://ods.od.nih.gov/factsheets/Omega3FattyAcids-HealthProfessional/'),
    pregnancy: c('ok', 'NIH: 저수은 생선 주 8~12 oz 권장. 보충제 이득은 불확실하나 위해 신호 없음', ODS + 'Omega3FattyAcids-HealthProfessional/'),
    anticoag: c('caution', '11개 RCT 12만 명 메타(2024): 전체 출혈 증가 없음(RR 1.09). 고용량 정제 EPA만 상대 50%(절대 +0.6%) 증가. NIH는 와파린 병용 시 주의 권고', ['https://www.ahajournals.org/doi/10.1161/JAHA.123.032390', ODS + 'Omega3FattyAcids-HealthProfessional/']),
    surgery: c('caution', 'SPAQI 합의: 수술 1~2주 전 중단 고려(혈소판 영향, 근거는 약함)', SPAQI)
  };

  /* ===== 프로바이오틱스 ===== */
  X.probiotic = {
    healthy: c('na', '일반 "장 건강" 목적 근거 부족(AGA 2020). 항생제 복용 중에는 이득', 'https://www.gastrojournal.org/article/S0016-5085(20)34729-6/fulltext'),
    ckd: c('caution', '투석 환자 중심정맥관 보유 시 S. boulardii 금기(EMA 2017, 진균혈증)', 'https://www.ema.europa.eu/en/documents/psusa/saccharomyces-boulardii-cmdh-scientific-conclusions-and-grounds-variation-amendments-product-information-and-timetable-implementation-psusa00009284201702_en.pdf'),
    liver: c('caution', '간경변은 면역저하 상태. 드물게 Lactobacillus 균혈증·간농양 보고', 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5116133/'),
    gi: c('caution', 'AGA 2020: 크론병·궤양성대장염은 임상시험 내에서만, 회장낭염은 8균주 복합 제안. PPI·위 절제 근거 없음', 'https://www.gastrojournal.org/article/S0016-5085(20)34729-6/fulltext'),
    autoimmune: c('caution', '면역억제제(고용량 스테로이드·생물학제제) 복용 중이거나 중심정맥관이 있으면 S. boulardii 금기(EMA), 세균 균주도 균혈증 사례 대부분 면역저하자. 면역억제제 없이 조절 중인 자가면역질환은 통상 문제 없음', [ODS + 'Probiotics-HealthProfessional/', 'https://wwwnc.cdc.gov/eid/article/27/8/21-0018_article']),
    cancer: c('caution', '호중구감소증: LGG 소아 RCT는 균혈증 없었으나 면역저하자 균혈증 사례 지속. 중심정맥관 있으면 S. boulardii 금지', 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10976466/'),
    pregnancy: c('ok', '산모 안전성 신호 없음. 단 미숙아 프로바이오틱스는 FDA 2023 경고(패혈증 사망)', 'https://www.fda.gov/media/172606/download'),
    surgery: c('caution', '수술 후 중환자실·중심정맥관: S. boulardii 진균혈증 61례(사망 10) 보고', 'https://www.ema.europa.eu/en/documents/psusa/saccharomyces-boulardii-cmdh-scientific-conclusions-and-grounds-variation-amendments-product-information-and-timetable-implementation-psusa00009284201702_en.pdf')
  };

  /* ===== 코엔자임 Q10 ===== */
  X.coq10 = {
    healthy: c('na', '건강인 이득 근거 없음', NC + 'coenzyme-q10'),
    htn: c('ok', 'NCCIH: 의미 있는 혈압 효과 없으나 해도 없음', NC + 'coenzyme-q10'),
    diabetes: c('caution', 'NCCIH: 인슐린과 상호작용 가능, 혈당 모니터', NC + 'coenzyme-q10'),
    dyslip: c('ok', '스타틴 근육통 개선 근거 혼재, 해는 없음', NC + 'coenzyme-q10'),
    ckd: c('ok', '신장 문제 없음', NC + 'coenzyme-q10'),
    liver: c('ok', 'LiverTox: 간 손상 가능성 낮음', LT + 'NBK603562/'),
    hf_af: c('ok', 'Q-SYMBIO RCT(300 mg, 2년): 심부전 주요 사건 HR 0.50. 심장내과 상의', 'https://www.jacc.org/doi/10.1016/j.jchf.2014.06.008'),
    cancer: c('caution', 'NCI: 항암치료 중 항산화제(CoQ10 포함) 복용이 유방암 재발·생존 악화와 연관(관찰). 종양내과 상의', 'https://www.cancer.gov/about-cancer/treatment/cam/hp/coenzyme-q10-pdq'),
    pregnancy: c('caution', '임신 안전성 자료 없음', NC + 'coenzyme-q10'),
    anticoag: c('caution', '비타민 K 유사 구조로 INR 감소 사례 보고. RCT(100 mg 4주)는 INR 변화 없음. 시작 후 INR 확인', 'https://pubmed.ncbi.nlm.nih.gov/12083489/')
  };

  /* ===== 크레아틴 ===== */
  X.creatine = {
    healthy: c('ok', '근력운동 병행 시 근육량 증가. 5년 장기 안전성(ISSN)', 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5469049/'),
    ckd: c('avoid', '30개 RCT 메타: 건강인 신기능 변화 없음. 그러나 ISSN·안전성 리뷰는 기존 신장질환·신독성 약물 병용 시 사용 반대. 혈청 크레아티닌 상승으로 eGFR 과소평가(시스타틴 C로 확인)', ['https://link.springer.com/article/10.1186/s12882-025-04558-6', 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5469049/']),
    liver: c('ok', '간독성 신호 없음(ISSN)', 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5469049/'),
    osteo: c('ok', '근력운동과 병행 시 뼈에 이득 가능(ISSN)', 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5469049/'),
    hf_af: c('caution', '수분 저류·체중 1~2 kg 증가가 심부전 모니터링을 혼란시킬 수 있음. 심장 환자 자료 제한', 'https://www.reccardioclinics.org/en-efficacy-and-safety-of-creatine-suppleme-articulo-S2605153224001304'),
    pregnancy: c('caution', '사람 안전성 RCT 없음(동물 자료는 안심)', 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5469049/'),
    stones: c('caution', '수분 섭취 의존. 결석 신호는 없음(이론적)', 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5469049/'),
  };

  /* ===== 커큐민 ===== */
  X.curcumin = {
    healthy: c('na', '무릎 관절염 외 근거 없음. 고흡수 제형 간 손상 보고', LT + 'NBK548561/'),
    diabetes: c('caution', '혈당 강하 가능, 모니터', 'https://pubmed.ncbi.nlm.nih.gov/22773702/'),
    ckd: c('caution', '만성 강황 보충 옥살산 신병증 사례', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10962410/'),
    liver: c('avoid', 'LiverTox A등급(확실한 간독성). DILIN 2023 10례(입원 5, 급성 간부전 사망 1), 이탈리아 2019 37례. 피페린 고흡수 제형, HLA-B*35:01', [LT + 'NBK548561/', 'https://www.amjmed.com/article/S0002-9343(22)00740-9/fulltext']),
    gi: c('caution', '담낭 수축 자극(40 mg → 50% 수축). 증상 있는 담석·담도 폐쇄 시 피하기', 'https://onlinelibrary.wiley.com/doi/10.1046/j.1440-6047.2002.00296.x'),
    cancer: c('caution', '항산화·CYP 상호작용 이론적. 종양내과 상의', 'https://www.cancer.gov/about-cancer/treatment/cam/hp/curcumin-pdq'),
    pregnancy: c('avoid', 'NCCIH: 보충제 용량은 임신 중 안전하지 않을 수 있음', NC + 'turmeric'),
    anticoag: c('caution', '혈소판 응집 억제(시험관·동물). 임상 의미는 미확인', 'https://pubmed.ncbi.nlm.nih.gov/22531131/'),
    stones: c('avoid', '강황(수용성 옥살산 91%)은 소변 옥살산을 유의하게 올림(교차 RCT)', 'https://pubmed.ncbi.nlm.nih.gov/18469248/'),
    surgery: c('caution', '항혈소판 작용, 수술 1~2주 전 중단', SPAQI)
  };

  /* ===== 콜라겐 ===== */
  X.collagen = {
    healthy: c('ok', '해롭지 않음. 피부 수분 소폭 개선(제조사 지원 시험)', 'https://pubmed.ncbi.nlm.nih.gov/33742704/'),
    ckd: c('caution', '단백질 10~20 g/일은 신장질환 단백질 제한에 포함. 하이드록시프롤린 → 옥살산', 'https://www.ajkd.org/article/S0272-6386(20)30726-5/fulltext'),
    osteo: c('ok', '골밀도 이득 가능(소규모)', 'https://pubmed.ncbi.nlm.nih.gov/29337906/'),
    stones: c('caution', '젤라틴·하이드록시프롤린 5~10 g 이상 부하 시 소변 옥살산 43% 증가. 칼슘옥살산 결석자는 고용량 피하기', 'https://www.kidney-international.org/article/S0085-2538(15)51883-8/pdf')
  };

  /* ===== 루테인 ===== */
  X.lutein = {
    healthy: c('na', '황반변성 없는 눈 예방 근거 없음', 'https://www.nei.nih.gov/research/clinical-trials/age-related-eye-disease-studies-aredsareds2'),
    smoker: c('ok', 'AREDS2 10년: 베타카로틴을 루테인·지아잔틴으로 바꾸자 흡연자 폐암 초과 위험 사라짐. 흡연자용 눈 영양제는 베타카로틴 없는 것', 'https://www.aao.org/eyenet/article/long-term-outcomes-of-revised-areds2-supplement')
  };

  /* ===== 멜라토닌 ===== */
  X.melatonin = {
    healthy: c('ok', '잠드는 시간 7분 단축. 한국은 전문의약품(처방)', 'https://pubmed.ncbi.nlm.nih.gov/23691095/'),
    htn: c('caution', '니페디핀 복용 고혈압 환자에서 저녁 5 mg이 24시간 혈압 +6.5/+4.9 mmHg, 심박 증가(교차 RCT)', 'https://pubmed.ncbi.nlm.nih.gov/10792199/'),
    diabetes: c('caution', '당 내성·1상 인슐린 분비 저하(특히 MTNR1B 위험 대립유전자). 식사와 2시간 이상 간격', 'https://doi.org/10.2337/dc26-0164'),
    liver: c('ok', 'LiverTox: 간 손상 없음', LT + 'NBK548519/'),
    autoimmune: c('caution', '면역 자극 작용. 중증근무력증 악화 사례. 면역억제제와 이론적 길항', 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7640643/'),
    cancer: c('caution', 'RCT 메타(Seely 2012): 1년 생존 개선·중대 부작용 없음이나 근거 질 낮음. 종양내과 상의', 'https://journals.sagepub.com/doi/full/10.1177/1534735411425484'),
    pregnancy: c('caution', 'NCCIH: 임신·수유 안전성 연구 부족', NC + 'melatonin-what-you-need-to-know'),
    anticoag: c('caution', 'NCCIH: 항응고제 병용 시 의료 감독 필요. 와파린 INR 상승 사례', NC + 'melatonin-what-you-need-to-know')
  };

  /* ===== 글루코사민 ===== */
  X.glucosamine = {
    healthy: c('na', 'NIH GAIT: 위약보다 낫지 않음', NC + 'glucosamine-and-chondroitin-for-osteoarthritis'),
    diabetes: c('caution', 'NCCIH: 일부에서 혈당 상승 가능, 모니터', NC + 'glucosamine-and-chondroitin-for-osteoarthritis'),
    liver: c('caution', '만성 간질환자 간독성 사례 보고', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC3752575/'),
    gi: c('ok', '새우 알레르기 15명 이중맹검 유발시험에서 갑각류 유래 글루코사민 내약성 양호', 'https://onlinelibrary.wiley.com/doi/abs/10.1111/j.1365-2222.2006.02590.x'),
    pregnancy: c('caution', 'NCCIH: 알려진 것 거의 없음', NC + 'glucosamine-and-chondroitin-for-osteoarthritis'),
    anticoag: c('avoid', 'FDA MedWatch 20건 + WHO 21건: 와파린 INR 상승·출혈(뇌출혈 사례 포함), 용량 의존, 중단 시 회복. 와파린 복용 중 새로 시작하지 말 것', 'https://pubmed.ncbi.nlm.nih.gov/18363538/')
  };

  /* ===== 홍국·베르베린 ===== */
  X.ryr = {
    healthy: c('na', 'LDL 관리는 의사와 스타틴 상담. 심혈관 사건 감소 근거 없음', NC + 'red-yeast-rice'),
    diabetes: c('caution', '베르베린: 메트포르민·설폰요소제·인슐린과 저혈당 상가 작용, OCT/MATE 수송체 영향', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC13516377/'),
    dyslip: c('avoid', '홍국 모나콜린 K = 로바스타틴. 처방 스타틴과 병용 금지(근육병증 상가). FDA는 의미 있는 로바스타틴 함유 제품을 미승인 의약품으로 취급', NC + 'red-yeast-rice'),
    ckd: c('caution', '시트리닌(신독성 곰팡이독) 오염: 37개 제품 중 1개만 EU 기준 충족', NC + 'red-yeast-rice'),
    liver: c('avoid', 'LiverTox C등급(드문 간독성). 로바스타틴과 동일 성분이므로 로바스타틴 라벨의 활동성 간질환·원인불명 지속적 간효소 상승 금기가 그대로 적용', [LT + 'NBK548168/', 'https://dailymed.nlm.nih.gov/dailymed/search.cfm?labeltype=all&query=lovastatin']),
    hf_af: c('caution', '베르베린 QT 연장 상가 가능', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC13516377/'),
    autoimmune: c('avoid', '베르베린: 사이클로스포린 AUC +34.5%(신장이식). 홍국: 스타틴계 CYP3A4 기질, 사이클로스포린과 근육병증', ['https://pmc.ncbi.nlm.nih.gov/articles/PMC13516377/', NC + 'red-yeast-rice']),
    cancer: c('caution', '베르베린 CYP3A4/2D6/P-gp 억제(기전·약동학 연구) → 치료역 좁은 항암제와 병용 전 종양내과 확인. 홍국은 CYP3A4 억제제(아졸·일부 TKI)와 노출 증가', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC13516377/'),
    pregnancy: c('avoid', '홍국: NCCIH 임신·수유 중 비권고(자료 없음), 성분이 로바스타틴이므로 스타틴 임신 주의와 동일하게 취급. 베르베린: 빌리루빈 알부민 결합 치환(페닐부타존 10배) → 핵황달 위험, 태반·모유 통과', [NC + 'red-yeast-rice', 'https://www.ncbi.nlm.nih.gov/books/NBK600384/']),
    anticoag: c('caution', '베르베린 CYP2C9 억제 → 와파린 상승 이론적', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC13516377/'),
  };

  /* ===== 홍삼 ===== */
  X.ginseng = {
    healthy: c('ok', '피로 소규모 시험 혼재, 질병 예방 근거 없음. 안전성은 양호', NC + 'asian-ginseng'),
    htn: c('caution', '메타분석(17 RCT 1,381명): 혈압에 유의한 영향 없음(중립). 과거 상승 사례 보고 때문에 조절 안 되는 고혈압은 주의', ['https://pubmed.ncbi.nlm.nih.gov/27074879/']),
    diabetes: c('caution', '혈당 강하 가능 → 혈당조절제와 저혈당(NCCIH)', NC + 'asian-ginseng'),
    liver: c('ok', 'LiverTox: 단독 간 손상 없음', LT + 'NBK548200/'),
    autoimmune: c('caution', 'NCCIH: 자가면역질환 악화 가능', NC + 'asian-ginseng'),
    cancer: c('caution', '진세노사이드의 에스트로겐 수용체 활성은 시험관에서만 확인(생체 내 미확인). 호르몬 의존성 암은 종양내과 상의. 이마티닙+홍삼 간독성 사례', ['https://pmc.ncbi.nlm.nih.gov/articles/PMC3659583/', LT + 'NBK548200/']),
    pregnancy: c('avoid', 'NCCIH: 안전하지 않을 수 있음(동물 기형 유발 성분)', NC + 'asian-ginseng'),
    anticoag: c('caution', 'Yuan 2004 RCT(미국삼, n=20): 와파린 INR·AUC 감소(와파린 라벨도 인삼을 효과 감소 목록에 명시). 홍삼 교차시험(판막 환자 25명): INR 면밀 감시 하 사용 가능. 식약처 병용정보: 혈소판 응집 억제 → 항혈소판제(클로피도그렐 등) 병용 주의', ['https://pubmed.ncbi.nlm.nih.gov/15238367/', 'https://nedrug.mfds.go.kr/bbs/13']),
    surgery: c('caution', 'SPAQI: 수술 2주 전 중단', SPAQI)
  };

  /* ===== 밀크시슬 ===== */
  X.milkthistle = {
    healthy: c('na', '코크란: 간질환 사망·합병증 개선 근거 없음. 안전', 'https://pubmed.ncbi.nlm.nih.gov/17943794/'),
    diabetes: c('caution', '5개 RCT 메타: 공복혈당 −27 mg/dL, HbA1c −1.07 → 인슐린·설폰요소제와 저혈당 주의', 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4908257/'),
    liver: c('ok', 'LiverTox: 안전. HCV·지방간 시험에서 이득은 거의 없음', LT + 'NBK548817/'),
    gi: c('ok', '위장 불편 외 없음. 국화과 알레르기 주의', NC + 'milk-thistle'),
    cancer: c('caution', '200 mg 1일 3회가 이리노테칸 약동학을 유의하게 바꾸지 않음(낮은 우려)', 'https://aacrjournals.org/clincancerres/article/11/21/7800/194156/'),
    pregnancy: c('caution', 'NCCIH: 알려진 것 거의 없음', NC + 'milk-thistle'),
    anticoag: c('caution', 'in vitro CYP2C9 억제 → 와파린 INR 모니터(임상 미확인)', NC + 'milk-thistle'),
  };

  /* ===== 녹차추출물 ===== */
  X.greentea = {
    healthy: c('na', '체중 감량 효과 미미. 차로 마시는 건 안전, 고용량 추출물은 간독성', NC + 'green-tea'),
    htn: c('caution', '카페인 함유. 고용량 녹차는 나돌롤 혈중농도 감소', NC + 'green-tea'),
    dyslip: c('caution', '녹차추출물이 아토르바스타틴 혈중농도 감소', NC + 'green-tea'),
    liver: c('avoid', 'LiverTox A등급(HLA-B*35:01 72%, 중증 35%, 이식 8%). EFSA 2018: EGCG 800 mg/일 이상 간효소 상승, EU 상한 800 mg', ['https://efsa.onlinelibrary.wiley.com/doi/10.2903/j.efsa.2018.5239', LT + 'NBK547925/']),
    osteo: c('caution', '랄록시펜과 상호작용(NCCIH)', NC + 'green-tea'),
    hf_af: c('caution', '카페인', NC + 'green-tea'),
    gi: c('caution', '카테킨이 비헴철 흡수 −14~27%. 철 결핍·위 절제 빈혈은 피하고 철분과 시간 분리', 'https://www.herbalgram.org/resources/herbclip/issues/2005/bin_285/review44336/'),
    cancer: c('avoid', 'EGCG가 보르테조밉(다발골수종 치료제) 등 보론산계 프로테아좀 억제제를 화학적으로 불활성화', 'https://ashpublications.org/blood/article/113/23/5927/25877/'),
    pregnancy: c('caution', '카페인 제한. 추출물 수준 EGCG 미연구', NC + 'green-tea'),
    anticoag: c('caution', '녹차 잎 비타민 K로 INR 감소 사례(대량 음용). 추출물은 미확인', 'https://journals.sagepub.com/doi/10.1345/aph.18238'),
    stones: c('caution', '차는 중등도 옥살산 공급원(추출물 기준 자료 없음)', NC + 'green-tea')
  };

  /* ===== 마늘 ===== */
  X.garlic = {
    healthy: c('ok', '혈압 소폭 강하 가능', NC + 'garlic'),
    htn: c('ok', 'NCCIH: 혈압 소폭 강하 가능', NC + 'garlic'),
    dyslip: c('ok', '지질 효과 미미, 상호작용 없음', NC + 'garlic'),
    liver: c('caution', '이식 후 마늘 보충제 간독성 단일 사례', 'https://pubmed.ncbi.nlm.nih.gov/28543822/'),
    gi: c('caution', '위장 불편·역류', NC + 'garlic'),
    cancer: c('caution', 'CYP3A4/P-gp 유도: 사퀴나비르 AUC −51%. CYP3A4 대사 항암제 이론적', 'https://pubmed.ncbi.nlm.nih.gov/11740713/'),
    pregnancy: c('caution', 'NCCIH: 식품량 초과는 안전 불확실', NC + 'garlic'),
    anticoag: c('caution', 'NCCIH: 항응고제·아스피린과 출혈 위험 증가', NC + 'garlic'),
    surgery: c('avoid', '수술 7일~2주 전 중단(혈소판 억제, SPAQI)', SPAQI)
  };

  /* ===== 은행잎 ===== */
  X.ginkgo = {
    healthy: c('na', '치매 예방 RCT(GEM 3,069명) 실패. 기억력 근거 없음', 'https://pubmed.ncbi.nlm.nih.gov/19017911/'),
    liver: c('ok', 'LiverTox: 간 손상 없음. 설치류 고용량 간·갑상선 종양(NTP)은 사람 관련성 논쟁', LT + 'NBK548847/'),
    thyroid: c('caution', 'NTP 설치류 갑상선 종양. 사람 자료 없음(이론적)', 'https://ntp.niehs.nih.gov/ntp/htdocs/LT_rpts/TR578_508.pdf'),
    pregnancy: c('avoid', 'NCCIH: 조기 진통·분만 시 출혈 증가 가능', NC + 'ginkgo'),
    anticoag: c('avoid', '사례: 와파린+은행잎 뇌출혈 등 보고. 소규모 RCT(Jiang 2005·Engelsen 2003)는 INR 변화가 없었으나 미국 보훈병원 대규모 코호트에서는 병용 시 출혈 사건 HR 1.38(1.20~1.58). 와파린 라벨·NCCIH 모두 출혈 경고 → 병용 피하기', ['https://pubmed.ncbi.nlm.nih.gov/15801937/', 'https://pubmed.ncbi.nlm.nih.gov/26958257/', NC + 'ginkgo']),
    surgery: c('avoid', '수술 36시간~2주 전 중단(SPAQI 2주)', SPAQI)
  };

  /* ===== 세인트존스워트 ===== */
  X.sjw = {
    healthy: c('caution', '경증 우울 효과 있으나 CYP3A4 강력 유도. 복용 중인 모든 약 확인 필수', NC + 'st-johns-wort'),
    htn: c('caution', '칼슘채널차단제(니페디핀·베라파밀) 대사 유도. 항우울제와 세로토닌 증후군', NC + 'st-johns-wort-and-depression-in-depth'),
    dyslip: c('caution', '심바스타틴·아토르바스타틴 노출 감소', 'https://bpspubs.onlinelibrary.wiley.com/doi/10.1111/bph.14936'),
    liver: c('ok', '단독 간 손상 없음(다른 약의 간독성은 증가시킬 수 있음)', LT + 'NBK548880/'),
    hf_af: c('avoid', '디곡신 농도 감소(NCCIH). DOAC(아픽사반·리바록사반)은 라벨에서 병용 회피 명시', NC + 'st-johns-wort-and-depression-in-depth'),
    autoimmune: c('avoid', '사이클로스포린 농도 급감 → 심장·신장 이식 급성 거부 사례 11건+. 타크로리무스 AUC 유의 감소', ['https://pubmed.ncbi.nlm.nih.gov/11888457/', 'https://accp1.onlinelibrary.wiley.com/doi/abs/10.1177/0091270003261078']),
    cancer: c('avoid', '이리노테칸 활성대사체 SN-38 AUC −42%(Mathijssen 2002). 이마티닙 AUC 약 30% 감소', ['https://pubmed.ncbi.nlm.nih.gov/12189228/', 'https://www.frontiersin.org/journals/oncology/articles/10.3389/fonc.2019.01356/full']),
    pregnancy: c('avoid', '안전 자료 부족. 경구피임약 실패(돌발 출혈·의도치 않은 임신)', NC + 'st-johns-wort-and-depression-in-depth'),
    anticoag: c('avoid', '와파린 효과 약화, DOAC 농도 감소(P-gp/CYP3A4)', NC + 'st-johns-wort-and-depression-in-depth'),
    surgery: c('avoid', '수술 5일~2주 전 중단: 마취제·아편유사제 대사 유도', SPAQI)
  };

  /* ===== 아슈와간다 ===== */
  X.ashwagandha = {
    healthy: c('caution', '스트레스 소규모 단기 시험만. 간 손상(LiverTox B) 보고. NCCIH: 3개월 이내 단기 사용 자료만', NC + 'ashwagandha'),
    htn: c('caution', '혈압약과 상호작용 가능(NIH ODS)', ODS + 'Ashwagandha-HealthProfessional/'),
    diabetes: c('caution', '당뇨약과 상가적 혈당 강하', NC + 'ashwagandha'),
    liver: c('avoid', 'LiverTox B등급(담즙정체형, 2~12주). 기존 간질환자 사망·이식 사례. 간경변·진행 간질환 금기', LT + 'NBK548536/'),
    thyroid: c('avoid', 'T4·T3 상승, TSH 감소(RCT 600 mg). 갑상선중독증 사례. NCCIH: 갑상선질환·갑상선호르몬 복용자 비권장', ['https://journals.sagepub.com/doi/10.1089/acm.2017.0183', NC + 'ashwagandha']),
    autoimmune: c('avoid', 'NCCIH: 자가면역질환 비권장, 면역억제제와 상호작용', NC + 'ashwagandha'),
    cancer: c('avoid', '호르몬 의존성 전립선암(테스토스테론 상승)', NC + 'ashwagandha'),
    pregnancy: c('avoid', 'NIH·NCCIH: 임신 중 피하기(유산 보고). 덴마크 2023 판매 금지, 프랑스 ANSES 2024 임신·수유 반대', ODS + 'Ashwagandha-HealthProfessional/'),
    surgery: c('avoid', 'NCCIH: 수술 전 비권장(진정·마취 상호작용)', NC + 'ashwagandha')
  };

  /* ===== NAC ===== */
  X.nac = {
    healthy: c('na', '일반 항산화 목적 근거 없음', LT + 'NBK548401/'),
    htn: c('caution', '니트로글리세린(정맥·패치)과 심한 저혈압·두통', 'https://reference.medscape.com/drug/acetylcysteine-343425'),
    ckd: c('ok', '신장 해 없음(조영제 신병증 예방 연구)', 'https://pubmed.ncbi.nlm.nih.gov/21859972/'),
    liver: c('ok', 'LiverTox: 간 보호 작용', LT + 'NBK548401/'),
    hf_af: c('ok', '심장수술 후 심방세동 감소 메타분석', 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC3331849/'),
    gi: c('caution', '위장 불편. 천식 환자 기관지 경련(약품 라벨)', 'https://reference.medscape.com/drug/acetylcysteine-343425'),
    cancer: c('caution', 'JNCI 2008: 항암·방사선 중 항산화 보충제는 권장하지 않음', 'https://academic.oup.com/jnci/article/100/11/773/895704'),
    pregnancy: c('caution', '치료 목적(아세트아미노펜 중독)으로는 사용. 보충제 용량 안전성 미확인', 'https://dailymed.nlm.nih.gov/dailymed/search.cfm?labeltype=all&query=acetadote'),
    anticoag: c('caution', '혈소판 억제 성질. 심장수술 메타분석에서 출혈 재수술·수혈 증가 없음', 'https://www.annalsthoracicsurgery.org/article/S0003-4975(08)02022-5/fulltext'),
  };

  /* ===== 알파리포산 ===== */
  X.ala = {
    healthy: c('na', '당뇨 신경병증 외 근거 없음', 'https://lpi.oregonstate.edu/mic/dietary-factors/lipoic-acid'),
    diabetes: c('caution', '당뇨약과 저혈당 상가. 인슐린 자가면역 증후군(Hirata) 유발 — 동아시아인 HLA-DRB1*04:06, 심한 저혈당, 중단 시 회복', ['https://pmc.ncbi.nlm.nih.gov/articles/PMC13520106/', 'https://onlinelibrary.wiley.com/doi/abs/10.1111/cen.12334']),
    liver: c('ok', 'LiverTox: 간 손상 무관(과량은 젖산산증)', LT + 'NBK591554/'),
    thyroid: c('caution', '동물: T4와 병용 시 T4→T3 전환 56% 억제. 레보티록신과 시간 분리, 갑상선기능 모니터', 'https://pubmed.ncbi.nlm.nih.gov/1815532/'),
    autoimmune: c('caution', '인슐린 자가면역 증후군은 자가면역 기전(이론적)', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC13520106/'),
    cancer: c('caution', '항암 중 항산화제 우려(JNCI 2008)', 'https://academic.oup.com/jnci/article/100/11/773/895704'),
    pregnancy: c('caution', '자료 불충분', 'https://lpi.oregonstate.edu/mic/dietary-factors/lipoic-acid'),
  };

  /* ===== 크롬 ===== */
  X.chromium = {
    healthy: c('na', '혈당·체중 효과 임상적 의미 없음', 'https://ods.od.nih.gov/factsheets/Chromium-HealthProfessional/'),
    diabetes: c('caution', '인슐린 작용 증강 → 당뇨약과 혈당 강하(NIH ODS). 200~1,000 µg 25개 RCT 부작용 초과 없음', ODS + 'Chromium-HealthProfessional/'),
    ckd: c('avoid', '크롬 피콜리네이트 1,200~2,400 µg/일 신부전 사례', 'https://pubmed.ncbi.nlm.nih.gov/9562138/'),
    liver: c('caution', '크롬 피콜리네이트 1,200~2,400 µg/일 신부전 사례에서 간 기능 이상 동반', 'https://pubmed.ncbi.nlm.nih.gov/9562138/'),
    thyroid: c('caution', '크롬 피콜리네이트 동시 복용 시 레보티록신 AUC 17% 감소(n=7). 수 시간 분리', 'https://pubmed.ncbi.nlm.nih.gov/17725434/'),
    pregnancy: c('ok', '충분섭취량(30 µg) 이내는 문제 없음', 'https://ods.od.nih.gov/factsheets/Chromium-HealthProfessional/'),
  };

  /* ===== 계피 ===== */
  X.cinnamon = {
    healthy: c('na', '혈당 효과 불확실. 카시아 계피 쿠마린 간독성', NC + 'cinnamon'),
    diabetes: c('caution', '보충 용량(최대 6 g)에서 인슐린·설폰요소제와 저혈당 상가. 효과는 불확실(NCCIH)', NC + 'cinnamon'),
    liver: c('avoid', '카시아 쿠마린 TDI 0.1 mg/kg/일(60 kg 6 mg, BfR). 민감자 가역적 간 손상. 간질환자 위험(NCCIH). 실론 계피 선호', ['https://www.bfr.bund.de/en/service/frequently-asked-questions/topic/faq-on-coumarin-in-cinnamon-and-other-foods/', NC + 'cinnamon']),
    cancer: c('caution', 'NCCIH: 항암제 상호작용 가능성', NC + 'cinnamon'),
    pregnancy: c('caution', 'NCCIH: 다량은 임신 중 안전하지 않음(식품량은 무방)', NC + 'cinnamon'),
    stones: c('ok', '계피는 소변 옥살산을 올리지 않음(교차 RCT)', 'https://pubmed.ncbi.nlm.nih.gov/18469248/')
  };


  /* ===== 비타민·미네랄 (출처: NIH ODS·FDA 라벨·KDOQI 2020·KDIGO·ACOG·ASMBS·USPSTF 등) ===== */
  var KDOQI = 'https://www.ajkd.org/article/S0272-6386(20)30726-5/fulltext', SYN = 'https://www.accessdata.fda.gov/drugsatfda_docs/label/2022/021402s036lbl.pdf', FDABIO = 'https://www.fda.gov/medical-devices/in-vitro-diagnostics/biotin-interference-troponin-lab-tests-assays-subject-biotin-interference', USPSTF = 'https://www.uspreventiveservicestaskforce.org/uspstf/recommendation/vitamin-supplementation-to-prevent-cvd-and-cancer-preventive-medication', DELCAP = 'https://ascopost.com/issues/february-25-2020/using-antioxidants-and-other-supplements-with-chemotherapy-may-increase-risk-of-breast-cancer-recurrence-and-mortality/', ASMBS = 'https://asmbs.org/wp-content/uploads/2017/06/ASMBS-Nutritional-Guidelines-2016-Update.pdf', FOSA = 'https://www.accessdata.fda.gov/drugsatfda_docs/label/2012/021575s017lbl.pdf', CDCHH = 'https://www.cdc.gov/hereditary-hemochromatosis/about/index.html', VITALB = 'https://pmc.ncbi.nlm.nih.gov/articles/PMC5648175/';

  X.multi = {
    healthy: c('na', '사망·심혈관 효과 없음(USPSTF I등급). 저용량은 해롭지 않음', USPSTF),
    diabetes: c('ok', '상호작용 없음. 메트포르민 복용자의 B12 공급원으로 유용', 'https://diabetesjournals.org/care/article/49/Supplement_1/S183/163934/'),
    dyslip: c('ok', 'USPSTF: 예방 근거 불충분(I), 해 신호 없음', USPSTF),
    ckd: c('caution', '신장 전용 제형 사용. 일반 종합비타민의 비타민 A가 투석 환자에서 축적(KDOQI 2020 5.4.1)', KDOQI),
    liver: c('caution', '혈색소증이면 철·비타민 C 함유 제품 피하기. 비타민 A 상한 이내', CDCHH),
    osteo: c('caution', '칼슘·마그네슘·철 성분: 경구 비스포스포네이트 복용 30분 이후', FOSA),
    hf_af: c('caution', '비오틴 성분이 트로포닌(심근경색 검사)을 거짓 저하', FDABIO),
    thyroid: c('caution', '칼슘·철·마그네슘: 레보티록신과 4시간 이상 분리. 비오틴은 TSH·T4 검사 왜곡', [SYN, 'https://www.thyroid.org/patient-thyroid-information/ct-for-patients/january-2022/vol-15-issue-1-p-7-8/']),
    gi: c('ok', '비만수술 후 ASMBS: 미네랄 포함 종합비타민 100~200% RDA 필수', ASMBS),
    cancer: c('ok', '표준 용량 종합비타민은 허용. 추가 항산화제는 피하기(DELCaP)', DELCAP),
    pregnancy: c('caution', '산전용 제품. 레티놀(비타민 A) 3,000 µg RAE 이하', 'https://ods.od.nih.gov/factsheets/VitaminA-HealthProfessional/'),
    anticoag: c('caution', '비타민 K 함량을 일정하게 유지(와파린). DOAC은 문제 없음', 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8395160/'),
    smoker: c('caution', '베타카로틴 없는 제품 선택(종합비타민 70%가 함유)', ['https://pubmed.ncbi.nlm.nih.gov/18429004/', USPSTF])
  };
  X.vitd = {
    healthy: c('ok', '결핍자 교정은 확실. 결핍 없는 성인 질병 예방 효과 없음(VITAL)', 'https://pubmed.ncbi.nlm.nih.gov/30415629/'),
    diabetes: c('ok', '상호작용 없음. 당뇨 전단계는 진행 15% 감소', 'https://pubmed.ncbi.nlm.nih.gov/36745886/'),
    dyslip: c('ok', '소규모 연구에서 아토르바스타틴 농도 소폭 감소(경미)', 'https://ods.od.nih.gov/factsheets/VitaminD-HealthProfessional/'),
    ckd: c('ok', 'KDOQI 5.3.1: 콜레칼시페롤로 결핍 교정. 활성형(칼시트리올) 자가 복용 금지(고칼슘혈증)', [KDOQI, 'https://kdigo.org/wp-content/uploads/2017/02/2017-KDIGO-CKD-MBD-GL-Update.pdf']),
    liver: c('ok', '결핍 흔함. 표준 용량', 'https://ods.od.nih.gov/factsheets/VitaminD-HealthProfessional/'),
    osteo: c('ok', '비스포스포네이트·데노수맙 치료의 기본. 데노수맙 박스 경고: 저칼슘혈증 교정 후 투여', 'https://www.fda.gov/drugs/drug-safety-communications/fda-adds-boxed-warning-increased-risk-severe-hypocalcemia-patients-advanced-chronic-kidney-disease'),
    hf_af: c('ok', 'VITAL Rhythm: 2,000 IU 심방세동 영향 없음', 'https://www.acc.org/clinical-topics/arrhythmias-and-clinical-ep/~/media/67142EC297834666B0CF741690027D9D.pdf'),
    thyroid: c('ok', '갑상선항진 골소실에 칼슘+D 권장. 레보티록신 흡수 문제 없음', 'https://ods.od.nih.gov/factsheets/VitaminD-HealthProfessional/'),
    gi: c('ok', '비만수술 후 ASMBS: 3,000 IU 이상, 25(OH)D 30 목표. 염증성 장질환 흡수 저하', ASMBS),
    autoimmune: c('caution', 'ACR 스테로이드 골다공증: 600~800 IU 권장. 단 사르코이드증 등 육아종 질환은 고칼슘혈증 — 저용량·혈중/소변 칼슘 모니터', ['https://acrjournals.onlinelibrary.wiley.com/doi/10.1002/art.42646', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7886067/']),
    cancer: c('ok', '결핍 시 보충. 림프종·육아종성 종양은 고칼슘혈증 모니터', 'https://ods.od.nih.gov/factsheets/VitaminD-HealthProfessional/'),
    pregnancy: c('ok', 'ACOG: 1,000~2,000 IU 안전, 상한 4,000 IU', 'https://www.acog.org/clinical/clinical-guidance/committee-opinion/articles/2011/07/vitamin-d-screening-and-supplementation-during-pregnancy'),
    stones: c('caution', 'WHI 칼슘 1,000 mg + D 400 IU: 결석 HR 1.17. 고칼슘뇨 있으면 24시간 소변 칼슘 확인', 'https://www.nejm.org/doi/full/10.1056/NEJMoa055218')
  };
  X.vita = {
    healthy: c('na', '한국인 결핍 드묾. 고용량 사망률 증가(코크란)', 'https://pubmed.ncbi.nlm.nih.gov/22419320/'),
    ckd: c('avoid', '레티놀·RBP4 축적, 투석으로 제거 안 됨. KDOQI 5.4.1: 투석 환자 일상 보충 금지', KDOQI),
    liver: c('avoid', '간독성. 25,000 IU/일 6년으로 간경변 보고', 'https://www.sciencedirect.com/science/article/abs/pii/0016508591906728'),
    osteo: c('caution', '고용량 레티놀은 골밀도 저하·골절 연관. 상한 3,000 µg RAE', 'https://ods.od.nih.gov/factsheets/VitaminA-HealthProfessional/'),
    gi: c('ok', '담췌우회술(BPD/DS) 후 결핍 → ASMBS 모니터하며 보충', ASMBS),
    cancer: c('caution', 'DELCaP: 항암 중 비타민 A·카로티노이드 복용 → 예후 악화', DELCAP),
    pregnancy: c('avoid', '3,000 µg RAE(10,000 IU)/일 초과 시 기형(임신 22,748건: 유병비 4.8, 57명 중 1명). 7주 이전 위험 집중', ['https://www.nejm.org/doi/full/10.1056/NEJM199511233332101', 'https://ods.od.nih.gov/factsheets/VitaminA-HealthProfessional/']),
    smoker: c('caution', 'CARET: 비타민 A 25,000 IU + 베타카로틴 → 폐암 +28%', USPSTF)
  };
  X.vite = {
    healthy: c('avoid', '400 IU+ 사망률 증가, 전립선암 +17%. USPSTF D', USPSTF),
    dyslip: c('caution', 'USPSTF D(심혈관 이득 없음). 출혈성 뇌졸중 +22%', ['https://pubmed.ncbi.nlm.nih.gov/21051774/', USPSTF]),
    ckd: c('caution', 'KDOQI 5.4.1: 투석 환자 일상 보충 아님(독성)', KDOQI),
    liver: c('ok', 'AASLD 2023: 조직검사 확인 NASH(비당뇨·비간경변)에 800 IU. 간경변에는 아님', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10735173/'),
    hf_af: c('caution', 'HOPE-TOO 400 IU: 심부전 RR 1.13(1.01~1.26), 심부전 입원 RR 1.21', 'https://pubmed.ncbi.nlm.nih.gov/15769967/'),
    gi: c('ok', '지방 흡수장애(BPD/DS 후) 결핍 위험 시 보충', ASMBS),
    cancer: c('avoid', '방사선 치료 중 400 IU + 베타카로틴 → 국소 재발 HR 1.37(Bairati). DELCaP 예후 악화', ['https://pubmed.ncbi.nlm.nih.gov/16027437/', DELCAP]),
    pregnancy: c('caution', '이득 없음. 비타민 C+E 시험에서 임신성 고혈압·조기 양막파열 증가 보고. 권장량 12 mg만', 'https://pubmed.ncbi.nlm.nih.gov/26343254/'),
    anticoag: c('caution', '혈소판 억제·비타민 K 의존 인자 길항. 400 IU 초과 시 INR 모니터. 혈중 비타민 E 높을수록 와파린 출혈', ['https://ods.od.nih.gov/factsheets/VitaminE-HealthProfessional/', 'https://www.ahajournals.org/doi/abs/10.1161/jaha.113.000364']),
    smoker: c('caution', 'ATBC 50 mg: 남성 흡연자 지주막하출혈 +50%', 'https://www.ahajournals.org/doi/full/10.1161/01.ATV.20.1.230'),
    surgery: c('caution', '항혈소판 작용, 수술 전 중단', SPAQI),
  };
  X.vitc = {
    healthy: c('ok', '감기 예방 못 함. 상한 2,000 mg', 'https://ods.od.nih.gov/factsheets/VitaminC-HealthProfessional/'),
    diabetes: c('caution', '500 mg/일 초과 시 연속혈당측정기(프리스타일 리브레) 수치 거짓 상승 → 저혈당 놓칠 수 있음', 'https://www.freestyle.abbott/us-en/safety-information.html'),
    ckd: c('caution', 'KDOQI 5.2.1: 권장량(90/75 mg)까지만. 고용량은 투석 환자 옥살산증', KDOQI),
    liver: c('caution', '혈색소증·철 과잉: 500 mg 초과 시 철 흡수 증가(CDC: 피하기). 그 외 간질환은 무방', CDCHH),
    gi: c('ok', '비헴철 흡수 보조. PPI·무산증은 흡수 저하', 'https://ods.od.nih.gov/factsheets/VitaminC-HealthProfessional/'),
    cancer: c('avoid', '항암·방사선 중 고용량 항산화제 피하기(DELCaP·ACS)', [DELCAP, 'https://acsjournals.onlinelibrary.wiley.com/doi/full/10.3322/canjclin.55.5.319']),
    pregnancy: c('ok', '권장 85 mg, 상한 2,000 mg', 'https://ods.od.nih.gov/factsheets/VitaminC-HealthProfessional/'),
    anticoag: c('caution', '1~2 g/일 이상이 와파린 효과 감소(사례 보고, 근거 약함)', 'https://pubmed.ncbi.nlm.nih.gov/5108759/'),
    smoker: c('ok', '흡연자는 +35 mg/일 필요', 'https://ods.od.nih.gov/factsheets/VitaminC-HealthProfessional/'),
    stones: c('avoid', '남성 1,000 mg/일 이상: 결석 HR 1.43(HPFS 4만 명). 여성은 무관', 'https://www.ajkd.org/article/S0272-6386(15)01163-4/abstract'),
    gout: c('ok', '요산 −0.35 mg/dL(메타). 통풍 환자 500 mg은 임상적 의미 없음', 'https://onlinelibrary.wiley.com/doi/abs/10.1002/art.37925')
  };
  X.vitk = {
    healthy: c('na', '건강인 보충 근거 없음', 'https://ods.od.nih.gov/factsheets/VitaminK-HealthProfessional/'),
    ckd: c('ok', 'KDOQI 5.5.1: 와파린 아니면 허용', KDOQI),
    liver: c('ok', '담즙정체 결핍. 독성 없음(상한 없음)', 'https://ods.od.nih.gov/factsheets/VitaminK-HealthProfessional/'),
    hf_af: c('caution', '심방세동 환자 대부분 항응고제 복용 → 아래 항응고제 항목', 'https://ods.od.nih.gov/factsheets/VitaminK-HealthProfessional/'),
    gi: c('ok', '지방 흡수장애 결핍', 'https://ods.od.nih.gov/factsheets/VitaminK-HealthProfessional/'),
    pregnancy: c('ok', '문제 없음', 'https://ods.od.nih.gov/factsheets/VitaminK-HealthProfessional/'),
    anticoag: c('avoid', '와파린 효과 직접 길항. 새 K·K2 보충제 시작 금지, 섭취량 일정 유지. DOAC·아스피린·클로피도그렐은 무관', ['https://ods.od.nih.gov/factsheets/VitaminK-HealthProfessional/', 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8395160/'])
  };
  X.vitk2 = X.vitk;
  X.folate = {
    healthy: c('ok', '가임기 여성 400 µg. 상한 1,000 µg(B12 결핍 신경손상 가림)', 'https://ods.od.nih.gov/factsheets/Folate-HealthProfessional/'),
    dyslip: c('na', 'KDOQI 5.1.1: 호모시스테인 목적 엽산 무의미', KDOQI),
    ckd: c('ok', '결핍 시 보충(KDOQI 5.1.2)', KDOQI),
    gi: c('ok', '설파살라진 복용자 1 mg, 비만수술 후 ASMBS. B12 먼저 확인', ASMBS),
    autoimmune: c('ok', '류마티스 메트렉세이트 독성 감소(표준 병용 처방)', 'https://sps.nhs.uk/articles/using-folic-acid-with-methotrexate-in-rheumatoid-arthritis/'),
    cancer: c('caution', '항엽산제(메토트렉세이트)와 병용·카페시타빈과 과량 시 독성. 페메트렉시드는 350~1,000 µg 필수', ['https://www.accessdata.fda.gov/drugsatfda_docs/label/2024/210661s000lbl.pdf', 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9693983/']),
    pregnancy: c('ok', '임신 전~12주 400~800 µg. 상한 1,000 µg', 'https://ods.od.nih.gov/factsheets/Folate-HealthProfessional/'),
    anticoag: c('ok', '와파린 상호작용 없음', 'https://ods.od.nih.gov/factsheets/Folate-HealthProfessional/'),
  };
  X.b12 = {
    healthy: c('ok', '50세+ 흡수 저하로 강화식품·보충제 권고(NIH). 상한 없음', 'https://ods.od.nih.gov/factsheets/VitaminB12-HealthProfessional/'),
    diabetes: c('ok', 'ADA 2026: 장기 메트포르민 복용자 정기 B12 검사', 'https://diabetesjournals.org/care/article/49/Supplement_1/S183/163934/'),
    ckd: c('ok', '결핍 시 보충(KDOQI 5.1.2)', KDOQI),
    gi: c('ok', '위 절제·비만수술·위축성 위염·장기 PPI → 필요. 고용량 경구 또는 주사', ASMBS),
    cancer: c('caution', 'DELCaP: 항암 중 B12 복용 예후 악화. 페메트렉시드는 1,000 µg 근육주사 필수', [DELCAP, 'https://www.accessdata.fda.gov/drugsatfda_docs/label/2024/210661s000lbl.pdf']),
    pregnancy: c('ok', '상한 없음', 'https://ods.od.nih.gov/factsheets/VitaminB12-HealthProfessional/'),
    smoker: c('caution', 'VITAL 코호트: 남성 장기 고용량 B12(>55 µg/일) 폐암 HR 1.98, 흡연 남성 HR 3.71', VITALB)
  };
  X.b6 = {
    healthy: c('na', '100 mg/일 초과 장기 복용 시 감각신경병증(상한 100 mg)', 'https://ods.od.nih.gov/factsheets/VitaminB6-HealthProfessional/'),
    ckd: c('ok', '투석 손실, 소량 보충', KDOQI),
    pregnancy: c('ok', 'ACOG: 입덧에 10~25 mg 8시간마다. 상한 100 mg', 'https://www.acog.org/clinical/clinical-guidance/practice-bulletin/articles/2018/01/nausea-and-vomiting-of-pregnancy'),
    smoker: c('caution', 'VITAL 코호트: 남성 장기 >20 mg/일 폐암 HR 1.82, 흡연 남성 HR 2.93', VITALB),
    stones: c('ok', '소변 옥살산 감소 가능, 해 없음', 'https://www.aafp.org/pubs/afp/issues/2017/0501/p552.html'),
  };
  X.biotin = {
    healthy: c('na', '결핍 외 근거 없음. 고용량은 혈액검사 왜곡', 'https://ods.od.nih.gov/factsheets/Biotin-HealthProfessional/'),
    dyslip: c('caution', '트로포닌 거짓 저하 → 심근경색 놓침(FDA 2017/2019, 사망 1건 보고)', FDABIO),
    hf_af: c('caution', '트로포닌·NT-proBNP 면역검사 왜곡', FDABIO),
    thyroid: c('caution', 'T4·T3 거짓 상승, TSH 거짓 저하 → 갑상선항진·과량 투약으로 오인. 라벨 최소 2일, 미국갑상선학회 3~5일 전 중단', 'https://www.thyroid.org/patient-thyroid-information/ct-for-patients/january-2022/vol-15-issue-1-p-7-8/'),
    autoimmune: c('caution', '자가면역 갑상선 추적검사 왜곡', FDABIO),
    cancer: c('caution', '종양표지자·호르몬 면역검사 왜곡 가능(FDA)', FDABIO),
    pregnancy: c('caution', '산전 종합비타민 비오틴이 hCG 검사 영향 가능', 'https://pharmacyservices.utah.edu/alerts/2019/11/biotin-vitamin-b7-may-interfere-laboratory-test-results-leading-inaccurate')
  };
  X.calcium = {
    healthy: c('na', '지역사회 성인 골절 예방 효과 거의 없음(BMJ 2026). 식사로', 'https://pubmed.ncbi.nlm.nih.gov/42161415/'),
    dyslip: c('caution', 'Bolland 2010 심근경색 신호 vs NOF/ASPC 2016 "상한(2,000~2,500) 이내 안전". 식사 우선, 분할 복용', ['https://pubmed.ncbi.nlm.nih.gov/20671013/', 'https://www.bonehealthandosteoporosis.org/news/nof-and-aspc-position-statement-on-calcium-and-cardiovascular-disease/']),
    ckd: c('caution', 'KDOQI 6.2.1: 3~4기 총 원소칼슘 800~1,000 mg. 투석 고칼슘혈증 회피, 칼슘계 인결합제 제한(KDIGO 2017)', [KDOQI, 'https://kdigo.org/wp-content/uploads/2017/02/2017-KDIGO-CKD-MBD-GL-Update.pdf']),
    osteo: c('ok', '필수. 경구 비스포스포네이트 30분 이후. 데노수맙은 칼슘·D 충족 필수(진행 신장질환 저칼슘혈증 박스 경고)', [FOSA, 'https://www.fda.gov/drugs/drug-safety-communications/fda-adds-boxed-warning-increased-risk-severe-hypocalcemia-patients-advanced-chronic-kidney-disease']),
    thyroid: c('caution', '탄산칼슘이 레보티록신 흡착 → 4시간 이상 분리', SYN),
    gi: c('caution', '무산증·PPI: 탄산칼슘 흡수 0.04 vs 구연산칼슘 0.45 → 구연산염 사용. 비만수술 후 구연산칼슘 1,200~1,500 mg', ['https://pubmed.ncbi.nlm.nih.gov/4000241/', ASMBS]),
    autoimmune: c('ok', 'ACR 스테로이드 골다공증 1,000~1,200 mg', 'https://acrjournals.onlinelibrary.wiley.com/doi/10.1002/art.42646'),
    cancer: c('ok', '아로마타제 억제제·항안드로겐 치료 골소실에 필요', 'https://ods.od.nih.gov/factsheets/Calcium-HealthProfessional/'),
    pregnancy: c('ok', '권장 1,000 mg, 상한 2,500 mg', 'https://ods.od.nih.gov/factsheets/Calcium-HealthProfessional/'),
    stones: c('caution', '보충제 칼슘+D 결석 HR 1.17. 식사와 함께 복용, 식사 칼슘은 오히려 보호', 'https://www.nejm.org/doi/full/10.1056/NEJMoa055218')
  };
  X.magnesium = {
    healthy: c('ok', '보충제 상한 350 mg. 안전', 'https://ods.od.nih.gov/factsheets/Magnesium-HealthProfessional/'),
    htn: c('ok', '약 368 mg/일에서 혈압 −2.0/−1.8 mmHg', 'https://www.ahajournals.org/doi/10.1161/hypertensionaha.116.07664'),
    diabetes: c('ok', '메트포르민 복용자 저마그네슘 흔함. 상호작용 없음', 'https://ods.od.nih.gov/factsheets/Magnesium-HealthProfessional/'),
    ckd: c('avoid', 'eGFR<30·투석: 배설 감소로 고마그네슘혈증. NIH: 중증 신부전은 피하기', 'https://ods.od.nih.gov/factsheets/Magnesium-HealthProfessional/'),
    liver: c('ok', '간경변 저마그네슘 흔함', 'https://ods.od.nih.gov/factsheets/Magnesium-HealthProfessional/'),
    osteo: c('caution', '다가 양이온: 알렌드로네이트 30분 이후', FOSA),
    hf_af: c('ok', '저마그네슘은 부정맥 유발. 정맥 마그네슘은 심방세동 치료에 사용', 'https://ods.od.nih.gov/factsheets/Magnesium-HealthProfessional/'),
    thyroid: c('caution', '마그네슘 제산제·보충제: 레보티록신과 4시간 이상 분리', SYN),
    gi: c('ok', 'PPI 1년 이상 → 저마그네슘혈증(FDA 2011). 염증성 장질환 설사 악화 가능', 'https://secure.medicalletter.org/TML-article-1361a'),
    autoimmune: c('caution', '타크로리무스·사이클로스포린은 저마그네슘혈증을 유발해 보충이 필요할 수 있으나, 수산화마그네슘 제산제는 타크로리무스 혈중농도를 올린다고 라벨에 명시. 제산제형은 피하고 보충제는 혈중농도 확인 하에', 'https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=213f6047-f897-48a7-b78a-45d7124f2f16'),
    cancer: c('ok', '시스플라틴·세툭시맙 저마그네슘혈증', 'https://dailymed.nlm.nih.gov/dailymed/search.cfm?labeltype=all&query=erbitux'),
    pregnancy: c('ok', '권장 350~360 mg, 보충 상한 350 mg', 'https://ods.od.nih.gov/factsheets/Magnesium-HealthProfessional/'),
    stones: c('ok', '구연산마그네슘은 소변 옥살산 감소', 'https://www.aafp.org/pubs/afp/issues/2017/0501/p552.html')
  };
  X.zinc = {
    healthy: c('ok', '상한 40 mg. 50 mg/일 이상 수주 → 구리 결핍(빈혈·호중구감소·신경병증)', 'https://ods.od.nih.gov/factsheets/Zinc-HealthProfessional/'),
    dyslip: c('caution', '50 mg/일 이상 HDL 저하', 'https://ods.od.nih.gov/factsheets/Zinc-HealthProfessional/'),
    ckd: c('caution', 'KDOQI 5.6.1: CKD 일상 아연 보충 아님', KDOQI),
    liver: c('ok', '간경변 결핍 흔함. 40 mg 이하', 'https://ods.od.nih.gov/factsheets/Zinc-HealthProfessional/'),
    gi: c('ok', '염증성 장질환 결핍 약 50%. 비만수술 후 아연 8~22 mg + 구리 1~2 mg', ASMBS),
    pregnancy: c('ok', '권장 11 mg, 상한 40 mg', 'https://ods.od.nih.gov/factsheets/Zinc-HealthProfessional/'),
  };
  X.iron = {
    healthy: c('caution', '검사 없는 복용 비권장. 상한 45 mg', 'https://ods.od.nih.gov/factsheets/Iron-HealthProfessional/'),
    ckd: c('caution', 'KDIGO 2012: 비투석 CKD는 경구 1~3개월 시도, 혈액투석은 정맥철 우선 — 신장내과 지시', 'https://kdigo.org/wp-content/uploads/2016/10/KDIGO-2012-Anemia-Guideline-English.pdf'),
    liver: c('avoid', '혈색소증 금기(CDC). 만성 간질환은 페리틴·TSAT 확인 후에만', CDCHH),
    osteo: c('caution', '비스포스포네이트 30분 이후', FOSA),
    hf_af: c('caution', 'HFrEF 경구철 효과 없음(IRONOUT-HF). 정맥철은 2a 권고 — 심장내과', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10307722/'),
    thyroid: c('caution', '황산철: 레보티록신과 4시간 이상 분리', SYN),
    gi: c('caution', '활동성 염증성 장질환·Hb<10: 정맥철 1차(ECCO). 비만수술 후 18~60 mg. PPI는 흡수 저하', ['https://pmc.ncbi.nlm.nih.gov/articles/PMC5946590/', ASMBS]),
    cancer: c('caution', '확인된 결핍만. DELCaP: 항암 중 철 복용 예후 악화', DELCAP),
    pregnancy: c('ok', '권장 27 mg(미국)·24 mg(한국), 상한 45 mg', 'https://ods.od.nih.gov/factsheets/Iron-HealthProfessional/'),
  };
  X.selenium = {
    healthy: c('na', 'SELECT: 예방 효과 없음', 'https://jamanetwork.com/journals/jama/fullarticle/1104493'),
    diabetes: c('caution', 'NPC 200 µg/일: 2형 당뇨 HR 1.55', 'https://www.acpjournals.org/doi/10.7326/0003-4819-147-4-200708210-00175'),
    dyslip: c('na', 'SELECT: 심혈관·암 이득 없음', 'https://jamanetwork.com/journals/jama/fullarticle/1104493'),
    ckd: c('na', 'KDOQI 5.6.1: 일상 보충 아님', KDOQI),
    thyroid: c('ok', 'EUGOGO 2021: 경증 활동성 그레이브스 안병증에 6개월 셀레늄(결핍 지역). 하시모토 근거 약함', 'https://academic.oup.com/ejendo/article-abstract/185/4/G43/6654384'),
    gi: c('ok', '비만수술·염증성 장질환 결핍', ASMBS),
    cancer: c('caution', '항산화제: 항암·방사선 중 고용량 피하기', 'https://acsjournals.onlinelibrary.wiley.com/doi/full/10.3322/canjclin.55.5.319'),
    pregnancy: c('ok', '권장 60 µg, 상한 400 µg', 'https://ods.od.nih.gov/factsheets/Selenium-HealthProfessional/'),
  };
  X.betacarotene = {
    healthy: c('na', 'USPSTF D: 해가 이득보다 큼', USPSTF),
    dyslip: c('caution', 'USPSTF D', USPSTF),
    cancer: c('avoid', '방사선 치료 중 30 mg → 재발 HR 1.37', 'https://pubmed.ncbi.nlm.nih.gov/16027437/'),
    pregnancy: c('ok', '레티놀과 달리 기형 유발 없음', 'https://ods.od.nih.gov/factsheets/VitaminA-HealthProfessional/'),
    smoker: c('avoid', 'ATBC 20 mg 폐암 +18%, CARET +28%·사망 +17%. 과거 흡연자도 피하기', ['https://www.ahajournals.org/doi/full/10.1161/01.ATV.20.1.230', USPSTF])
  };
  X.antioxidant = {
    healthy: c('na', '수명 연장 없음, 베타카로틴·E 사망률 증가', 'https://pubmed.ncbi.nlm.nih.gov/22419320/'),
    cancer: c('avoid', 'ACS·DELCaP·JNCI: 항암·방사선 중 고용량 항산화제 피하기', [DELCAP, 'https://academic.oup.com/jnci/article/100/11/773/895704']),
    smoker: c('avoid', '베타카로틴 함유 시 폐암 위험', USPSTF)
  };
  X.potassium = {
    healthy: c('ok', '식사(채소·과일)로. 미국 OTC는 99 mg 상한', 'https://ods.od.nih.gov/factsheets/Potassium-HealthProfessional/'),
    htn: c('ok', '2017 ACC/AHA: 식사 칼륨 증가. 칼륨 대체염은 신장질환·칼륨보존 약물 아니면 가능', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6346270/'),
    diabetes: c('caution', '신장질환 동반·ACEi/ARB 복용 시 고칼륨혈증', 'https://ods.od.nih.gov/factsheets/Potassium-HealthProfessional/'),
    ckd: c('avoid', '고칼륨혈증. KDIGO 2024·KDOQI 6.4: 개인별 조절, 보충제 금지', ['https://kdigo.org/wp-content/uploads/2017/02/KDIGO-2024-CKD-Guideline-Executive-Summary.pdf', KDOQI]),
    liver: c('caution', '간경변 스피로노락톤 복용 시', 'https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=4290b3ec-8993-47d4-bfe3-fcb81d7baed8'),
    hf_af: c('caution', '스피로노락톤·에플레레논 + ACEi/ARB → 고칼륨혈증(RALES형). 확인된 저칼륨혈증에만', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6346270/'),
    autoimmune: c('avoid', '타크로리무스·사이클로스포린 고칼륨혈증', 'https://www.drugs.com/pro/tacrolimus.html'),
    pregnancy: c('ok', '식사로 2,900 mg', 'https://ods.od.nih.gov/factsheets/Potassium-HealthProfessional/'),
    stones: c('ok', '구연산칼륨은 칼슘 결석 재발 약 75% 감소(염화칼륨은 효과 없음)', 'https://www.aafp.org/pubs/afp/issues/2017/0501/p552.html')
  };

  window.EBN_MATRIX = X;
})();
