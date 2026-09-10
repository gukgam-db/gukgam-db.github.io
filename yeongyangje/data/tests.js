/* 근거영양 — 검사 가이드 (검증 2026-09-08)
   비급여 가격: 한국건강관리협회 서울서부·경남지부 2026-01-01 고시 / 메디플라워 / 약체크 블로그. 기관별 차이 큼.
   국가검진: 국민건강보험공단 「2025년 건강검진 안내」 */
window.EBN_TESTS = {
  tests: [
    { id: "vitd", name: "25(OH)D", en: "비타민 D", ing: "vitd",
      what: "몸에 저장된 비타민 D의 양(D2+D3 합계). 한국 성인 31~47%가 결핍이므로 영양제 결정에 가장 먼저 필요한 검사입니다.",
      cutoffs: ["IOM: 20 ng/mL 이상 충분 · 12 미만 결핍", "내분비학회 2011: 20 미만 결핍 · 21~29 부족 · 30 이상 충분"],
      cutNote: "2024년 미국 내분비학회는 목표 수치를 정하지 않았고, 건강 성인의 '일상적 검사에 반대(suggest against routine testing)'합니다. 즉 검사는 결핍 위험이 있는 사람(실내 근무·고령·흡수장애·골다공증)에게 의미가 있습니다.",
      national: "미포함", cost: "비급여 13,030~20,000원(검진센터) · 의원 2~5만 원 · 급여 대상(골다공증·만성신장병·흡수장애·특정 약물 등)이면 본인부담 5천~1.5만 원",
      prep: "공복 불필요", retest: "보충 시작 8~12주 후(반감기 2~3주). 유지 단계에서는 연 1회 이내",
      interfere: "비타민 D2 복용자는 면역측정법이 40~45% 과소평가 → 질량분석(LC-MS/MS) 요청. 고용량(5 mg 이상) 비오틴 복용 시 채혈 최소 2~3일 전 중단(검사기관 안내에 따름)",
      src: ["https://www.endocrine.org/clinical-practice-guidelines/vitamin-d-for-prevention-of-disease", "https://ods.od.nih.gov/factsheets/VitaminD-HealthProfessional/", "https://kss.kahp.or.kr/br/nkubMgt/nkubMgtList.do"] },
    { id: "ferritin", name: "페리틴 + 혈색소 + 철포화도", en: "Ferritin · Hb · TSAT", ing: "iron",
      what: "페리틴은 저장철, 혈색소(Hb)는 빈혈 여부, 철포화도(TSAT)는 지금 쓸 수 있는 철. 빈혈이 생기기 전 '철 고갈' 단계를 잡으려면 페리틴이 필요합니다.",
      cutoffs: ["WHO 2020 페리틴: 성인 15 µg/L 미만 결핍 · 염증 있으면 70 미만", "WHO 혈색소: 여성 12 g/dL · 남성 13 미만 빈혈", "철 과잉 의심: 남성·폐경 여성 200 초과, 월경 여성 150 초과"],
      cutNote: "페리틴은 염증·간질환·비만·암에서 거짓 상승하므로 CRP를 같이 봐야 합니다. 피로 연구에서 효과가 확인된 기준은 페리틴 50 미만(경구)·15 이하(정맥)였습니다.",
      national: "혈색소만 포함(2년마다) · 페리틴·철포화도는 미포함", cost: "페리틴 11,570~20,000원 · 철·UIBC 각 3,120원 · CRP 수천 원",
      prep: "혈청철·철포화도는 하루 중 변동이 커 아침 공복 권장", retest: "철분 시작 2~4주 후 혈색소, 정상화 후 3개월 더 복용해 저장철 채우고 페리틴 재검",
      interfere: "염증 시 페리틴 거짓 상승. 면역측정법 비오틴 간섭 가능",
      src: ["https://www.ncbi.nlm.nih.gov/books/NBK569877/", "https://www.ncbi.nlm.nih.gov/books/NBK602198/"] },
    { id: "b12", name: "비타민 B12 (+ 메틸말론산)", en: "Serum B12 · MMA · Homocysteine", ing: "b12",
      what: "혈청 B12가 경계 구간이면 메틸말론산(MMA)이 더 정확합니다. 50세 이상, 메트포르민·위산억제제 복용자, 채식, 위 절제 후에 필요합니다.",
      cutoffs: ["NIH: 200~250 pg/mL 미만 저하", "MMA 0.271 µmol/L 초과 시 결핍 시사"],
      cutNote: "혈청 B12가 200~300 사이면 증상과 맞지 않을 때 MMA로 확인합니다(호모시스테인보다 특이적). 위 내인자 항체가 있으면 B12가 거짓 정상으로 나올 수 있습니다.",
      national: "미포함", cost: "B12 13,030원 · 호모시스테인 15,780원 · MMA는 대형 수탁검사(검진센터 목록에 없음, 가격 미확인)",
      prep: "공복 불필요", retest: "경구 치료 후 증상·혈액 재평가 시점은 의료진이 정함(NICE 2024는 고정 간격을 두지 않음)",
      interfere: "고용량 엽산이 빈혈만 가려 신경 손상이 진행될 수 있음. 비오틴 간섭 가능",
      src: ["https://ods.od.nih.gov/factsheets/VitaminB12-HealthProfessional/", "https://www.nice.org.uk/guidance/ng239"] },
    { id: "folate", name: "엽산", en: "Serum folate", ing: "folate",
      what: "한국은 미국과 달리 곡물 엽산 강화 정책이 없어 '검사 불필요' 논리가 그대로 적용되지 않습니다. 임신 준비·구내염·빈혈 감별 시.",
      cutoffs: ["NIH: 혈청 엽산 3 ng/mL 미만 결핍"],
      national: "미포함", cost: "13,030원", prep: "공복 불필요", retest: "필요 시 3개월",
      src: ["https://ods.od.nih.gov/factsheets/Folate-HealthProfessional/", "https://pmc.ncbi.nlm.nih.gov/articles/PMC5792260/"] },
    { id: "omega3", name: "오메가-3 지수", en: "Omega-3 Index (RBC EPA+DHA %)", ing: "omega3",
      what: "적혈구막의 EPA+DHA 비율. 오메가-3 섭취 상태를 반영하는 지표입니다(표준 진료 지침에는 없음).",
      cutoffs: ["4% 미만 고위험 · 4~8% 중간 · 8% 초과 저위험 (Harris & von Schacky)"],
      cutNote: "국내 문헌은 한국인 평균이 8%를 넘어 목표치를 10%로 올려 잡자고 제안합니다. 생선을 먹는 한국인은 보충제 없이 이미 목표 이상인 경우가 많습니다. 관찰연구 기반 지표입니다.",
      national: "미포함", cost: "기능의학 클리닉 등 일부 기관만 제공. 가격 미확인(기관 문의)",
      prep: "공복 불필요(건조혈액반점 채취)", retest: "보충 시작 3~4개월 후(적혈구 수명 120일)",
      src: ["https://pubmed.ncbi.nlm.nih.gov/17876200/", "https://www.kci.go.kr/kciportal/ci/sereArticleSearch/ciSereArtiView.kci?sereArticleSearchBean.artiId=ART001436429"] },
    { id: "mg", name: "마그네슘", en: "Serum Mg", ing: "magnesium",
      what: "혈청 마그네슘은 몸 전체 마그네슘의 약 1%만 반영해 결핍을 잘 못 잡습니다. 그래도 신장질환·이뇨제·위산억제제 장기 복용자의 안전 확인용으로는 필요합니다.",
      cutoffs: ["정상 0.75~0.95 mmol/L"],
      cutNote: "적혈구 마그네슘·부하검사 등은 검증되지 않았습니다(NIH). '마그네슘 결핍 검사'를 내세우는 곳은 주의.",
      national: "미포함", cost: "2,010원", prep: "공복 불필요", retest: "위산억제제 1년 이상·이뇨제 병용 시 정기 확인",
      src: ["https://ods.od.nih.gov/factsheets/Magnesium-HealthProfessional/"] },
    { id: "zinc", name: "아연", en: "Serum zinc", ing: "zinc",
      what: "채혈 시간·공복 여부에 따라 기준이 달라지고 염증·스테로이드·용혈에 영향을 받습니다. 탈모·미각 이상에서 결핍이 의심될 때만.",
      cutoffs: ["아침 공복: 여성 70 · 남성 74 µg/dL 미만", "오후 비공복: 여성 59 · 남성 61 미만"],
      national: "미포함", cost: "36,450원", prep: "아침 공복 채혈", retest: "보충 2~3개월 후",
      src: ["https://ods.od.nih.gov/factsheets/Zinc-HealthProfessional/", "https://www.ncbi.nlm.nih.gov/books/NBK493231/"] },
    { id: "bone", name: "골밀도(DXA) · 칼슘 · PTH", en: "DXA · Ca · PTH", ing: "calcium",
      what: "골다공증은 증상이 없어 검사만이 답입니다. 여성은 국가검진에 포함돼 있습니다.",
      cutoffs: ["WHO T-score: −2.5 이하 골다공증 · −1 ~ −2.5 골감소증"],
      national: "골밀도: 여성 54·60·66세(2025년부터 60세 추가) · 칼슘·PTH 미포함", cost: "골밀도 요추·대퇴 각 45,620원 · 총칼슘 2,010원 · PTH 20,490원",
      prep: "공복 불필요", retest: "골감소증 2~3년, 골다공증 치료 중 1~2년",
      src: ["https://www.osteoporosis.foundation/health-professionals/diagnosis", "https://www.nhis.or.kr/static/html/wbma/c/wbhaca04500_2025_2.pdf"] },
    { id: "basic", name: "혈당 · 당화혈색소 · 지질 · 신장 · 간", en: "FPG · HbA1c · Lipids · eGFR · AST/ALT", ing: "",
      what: "영양제 판정의 바탕이 되는 기본 검사. 대부분 국가검진에 있지만 당화혈색소는 없습니다.",
      cutoffs: ["공복혈당 126 이상 당뇨 · 100~125 전단계", "당화혈색소 6.5% 이상 당뇨 · 5.7~6.4 전단계", "eGFR 60 미만 3개월 지속 = 만성 신장질환", "총콜레스테롤 240 · LDL 160 · 중성지방 200 이상, HDL 40 미만"],
      cutNote: "당뇨 전단계는 비타민 D 보충 이득이 확인된 집단(진행 15% 감소)이므로 당화혈색소 추가(8,890원)가 의미 있습니다.",
      national: "공복혈당·크레아티닌/eGFR·AST/ALT/γ-GTP: 2년마다 · 지질 4종: 남 24세+·여 40세+ 4년마다 · 당화혈색소: 미포함", cost: "당화혈색소 8,890원",
      prep: "8시간 이상 공복(전날 저녁 9시 이후 금식)", retest: "검진 주기",
      src: ["https://www.nhis.or.kr/static/html/wbma/c/wbhaca04500_2025_2.pdf", "https://diabetesjournals.org/care/article/48/Supplement_1/S27/157566"] },
    { id: "thyroid", name: "갑상선 TSH · free T4", en: "TSH · fT4", ing: "biotin",
      what: "피로·탈모·체중 변화·기억력 저하의 흔한 원인이자 영양제로 해결되지 않는 원인. 국가검진에 없습니다.",
      cutoffs: ["TSH 4.5~10: 무증상 저하증, 일상적 치료 비권고 · 10 초과: 치료 고려"],
      national: "미포함", cost: "TSH 18,950원 + free T4 13,630원 · 세트 6만 원(의원)", prep: "공복 불필요, 아침 채혈 선호",
      retest: "갑상선약 용량 조절 후 6~8주",
      interfere: "비오틴(모발 영양제 5~10 mg)이 TSH 거짓 저하·T4 거짓 상승 → 갑상선항진으로 오인. 채혈 2~3일 전 중단",
      src: ["https://www.guidelinecentral.com/guideline/6855/", "https://www.fda.gov/medical-devices/in-vitro-diagnostics/biotin-interference-troponin-lab-tests-assays-subject-biotin-interference"] },
    { id: "uric", name: "요산", en: "Uric acid", ing: "",
      what: "통풍·고요산혈증 확인. 국가검진에 없어 따로 요청해야 합니다.",
      cutoffs: ["남성 7.0 · 여성 6.0 mg/dL 초과 고요산혈증(일반 기준)"],
      national: "미포함", cost: "2,000~2,640원", prep: "공복 권장", retest: "치료 중 3~6개월",
      src: ["https://kss.kahp.or.kr/br/nkubMgt/nkubMgtList.do"] },
    { id: "none", name: "비타민 A · E · K · C", en: "", ing: "",
      what: "일상적으로 검사하지 않습니다. 검진센터 비급여 목록에도 없고, 흡수장애·특수 질환이 아니면 측정할 이유가 없습니다. '비타민 종합검사' 패키지는 대부분 불필요합니다.",
      cutoffs: [], national: "미포함", cost: "—", prep: "—", retest: "—", src: [] }
  ],
  national: {
    html: '<div class="two-col"><div><h3 style="margin-top:0">✅ 국가검진(일반건강검진)에 있는 것</h3><ul>' +
      '<li>혈색소(빈혈) · 공복혈당 · 크레아티닌/eGFR(신장) · AST/ALT/γ-GTP(간) · 혈압 · 비만 · 요단백 — <b>2년마다, 전액 공단 부담</b></li>' +
      '<li>지질 4종(총콜레스테롤·HDL·LDL·중성지방) — 남 24세 이상·여 40세 이상, <b>4년마다</b></li>' +
      '<li>골밀도 — <b>여성 54·60·66세</b> (2025년부터 60세 추가)</li>' +
      '<li>B형간염 40세 · C형간염 항체 56세(2025 신규) · 인지기능 66세 이상 2년마다 · 우울증 선별 20~34세 2년마다·35~39세 1회·40~79세 10년마다(2025 개편)</li>' +
      '<li>대상: 2026년은 <b>짝수년 출생자</b>(직장 비사무직은 매년). 전날 저녁 9시 이후 금식.</li></ul></div>' +
      '<div><h3 style="margin-top:0">❌ 없는 것 — 영양제 결정에 필요하면 추가 요청</h3><ul>' +
      '<li><b>25(OH)D</b> 1.3~2만 원 · <b>페리틴</b> 1.2~2만 원 · <b>B12</b> 1.3만 원 · <b>당화혈색소</b> 0.9만 원 · <b>TSH+fT4</b> 3.3만 원 · 요산 0.3만 원 · 마그네슘 0.2만 원</li>' +
      '<li>위 다섯 가지(비타민 D·페리틴·B12·당화혈색소·갑상선)를 검진에 추가하면 <b>약 7~8만 원</b>. 영양제 결정에 가장 자주 필요한 검사들입니다.</li>' +
      '<li>비타민 A·E·K·C, 오메가-3 지수, 적혈구 마그네슘, 모발 미네랄 검사는 일상적으로 불필요합니다.</li>' +
      '<li>기관별 가격은 <a href="https://www.hira.or.kr/npay/index.do" target="_blank" rel="noopener">건강보험심사평가원 비급여 진료비 공개</a>에서 비교할 수 있습니다.</li></ul></div></div>' +
      '<p class="small">출처: 국민건강보험공단 「2025년 건강검진 안내」 · 한국건강관리협회 비급여 고시(2026-01-01) · 메디플라워 · 약체크. 가격은 기관마다 다르며 참고용입니다.</p>'
  }
};
