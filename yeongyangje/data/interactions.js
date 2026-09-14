/* 근거영양 — 상호작용 데이터
   EBN_DRUG_IX : 성분 × 약물군 (ingredients.js 키 × drugs.js 키)
   EBN_PAIRS   : 성분끼리의 조합 (b는 성분 키 또는 자유 문자열)
   EBN_TIMING  : 복용 타이밍
   검증 2026-09-07. 출처: FDA 라벨·NIH ODS·IOM DRI·Linus Pauling·PubMed 원문 */
(function () {
  function c(v, why, src) { return { v: v, why: why, src: src ? (typeof src === 'string' ? [src] : src) : [] }; }


  /* ================= 성분 × 약물군 ================= */
  var DM = 'https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=', WARF = DM + '7c4deb97-9966-4c8e-9ba6-bb260b71e130',
      SYN = DM + '1e11ad30-1041-4520-10b0-8f9d30d30fcc', CIPRO = DM + 'c47250c2-bece-46b5-8b3b-b7c97d9005d8',
      LEVOFX = DM + 'ac4001ca-882f-4d9b-a570-c1b9d7fd6830', DOXY = DM + '5fdc01c3-c62f-40cf-8351-91cbcc43d379',
      ALEN = DM + '4323d3aa-cbb0-41e2-aba7-7a94a0516993', HCTZ = DM + '55d6aee1-01ca-4791-8404-386664b4ab07',
      PHT = DM + '46d5c0d1-a97b-46d9-8cf4-994780673337', SINEMET = DM + '9b17b028-964a-473c-823d-81423535bd66',
      PEMET = DM + '5fb3a2d5-b9ec-4044-abb9-3e0d848a448e', CSA = DM + '94461af3-11f1-4670-95d4-2965b9538ae3',
      TAC = DM + '213f6047-f897-48a7-b78a-45d7124f2f16', ELIQ = DM + 'a454cd24-0c6d-46e8-b1e4-197388606175',
      SPIRO = DM + '4290b3ec-8993-47d4-bfe3-fcb81d7baed8', LISIN = DM + '43a4d6dd-bcca-412c-b051-ed470208ddb6',
      FDABIO = 'https://www.fda.gov/medical-devices/in-vitro-diagnostics/biotin-interference-troponin-lab-tests-assays-subject-biotin-interference',
      FDAPPI = 'https://www.fda.gov/Drugs/DrugSafety/ucm245011.htm',
      FDADEN = 'https://www.fda.gov/drugs/drug-safety-communications/fda-adds-boxed-warning-increased-risk-severe-hypocalcemia-patients-advanced-chronic-kidney-disease',
      ACR = 'https://acrjournals.onlinelibrary.wiley.com/doi/10.1002/art.40137', HATS = 'https://www.nejm.org/doi/full/10.1056/NEJMoa011090',
      NCCIH = 'https://www.nccih.nih.gov/health/', ADA = 'https://diabetesjournals.org/care/article/49/Supplement_1/S50/163924/',
      OM3B = 'https://www.ahajournals.org/doi/10.1161/JAHA.123.032390', TURM = 'https://www.wmic.wales.nhs.uk/turmeric-potential-interactions/',
      BERB = 'https://pmc.ncbi.nlm.nih.gov/articles/PMC13516377/', CDCPRO = 'https://wwwnc.cdc.gov/eid/article/27/8/21-0018_article';

  var CHELATE = {
    levo: c('caution', '레보티록신과 불용성 덩어리를 만들어 갑상선약 흡수를 떨어뜨립니다. 라벨 지시: 최소 4시간 전후로 떨어뜨려 복용하고 TSH를 확인하세요.', SYN),
    quinolone: c('caution', '시프로플록사신은 흡수가 최대 90% 줄어듭니다. 항생제 복용 2시간 전 또는 6시간 후(레보플록사신은 2시간 전후)에 드세요.', [CIPRO, LEVOFX]),
    tetra: c('caution', '독시사이클린과 서로 결합해 양쪽 흡수가 떨어집니다. 최소 2시간 이상 간격을 두세요.', DOXY),
    bisphos: c('caution', '알렌드로네이트 흡수를 막습니다. 골다공증약은 기상 직후 물만으로 먹고 최소 30분 뒤에, 미네랄은 아예 점심·저녁으로 옮기세요.', ALEN)
  };
  function ext(base, more) { var o = {}; for (var k in base) o[k] = base[k]; for (var k2 in more) o[k2] = more[k2]; return o; }

  window.EBN_DRUG_IX = {
    multi: ext(CHELATE, {
      warfarin: c('caution', '제품마다 비타민 K 함량이 다르므로(0~120 µg) 바꾸면 INR이 흔들립니다. 같은 제품을 일정하게 유지하고, 바꿀 때는 INR을 다시 재세요.', [WARF, 'https://ods.od.nih.gov/factsheets/MVMS-HealthProfessional/']),
      levodopa: c('caution', '들어 있는 철분이 레보도파와 결합해 파킨슨약 흡수를 떨어뜨립니다. 라벨은 시간을 명시하지 않으며 통상 2시간 분리를 권합니다.', SINEMET),
      chemo: c('caution', '비오틴 성분이 검사 수치를 왜곡할 수 있고, 항암 중 추가 항산화제는 권장되지 않습니다.', FDABIO)
    }),
    vitd: {
      diuretic: c('caution', '티아지드 이뇨제는 소변 칼슘 배설을 줄여 혈중 칼슘을 올립니다. 고용량 비타민 D+칼슘과 겹치면 고칼슘혈증이 올 수 있어 혈청 칼슘을 확인하세요.', HCTZ),
      aed: c('caution', '페니토인·카바마제핀이 간 효소를 유도해 비타민 D를 빨리 분해합니다. 골감소증·골연화증 위험이 있어 25(OH)D와 골밀도를 확인하고 보충하세요.', PHT),
      steroid: c('caution', '병용이 오히려 권장됩니다. 스테로이드를 오래 쓰면 뼈가 약해지므로 미국류마티스학회는 비타민 D 600~800 IU + 칼슘 1,000~1,200 mg을 권합니다.', ACR),
      bisphos: c('caution', '병용이 필수입니다. 특히 데노수맙(프롤리아)은 저칼슘혈증을 일으킬 수 있어 시작 전 교정하고 칼슘·비타민 D를 함께 씁니다.', FDADEN)
    },
    vita: {
      tetra: c('caution', '테트라사이클린과 고용량 레티놀을 함께 쓰면 두개내압이 올라가는 부작용(가성뇌종양)이 겹칠 수 있습니다.', DOXY),
      warfarin: c('caution', '고용량 레티놀 장기 복용은 간독성·응고 이상 사례 보고(드묾). 권장량 초과 장기 복용을 피하세요.', 'https://ods.od.nih.gov/factsheets/VitaminA-HealthProfessional/')
    },
    vite: {
      warfarin: c('caution', '비타민 K 작용을 방해하고 혈소판도 억제합니다. 400 IU/일 초과는 피하고, 시작할 때 INR을 다시 재세요.', WARF),
      doac: c('caution', '출혈 위험이 더해집니다. 400 IU/일 초과 고용량을 피하세요.', 'https://ods.od.nih.gov/factsheets/VitaminE-HealthProfessional/'),
      antiplt: c('caution', '아스피린·클로피도그렐의 항혈소판 작용에 더해집니다. 고용량을 피하세요.', 'https://ods.od.nih.gov/factsheets/VitaminE-HealthProfessional/'),
      statin: c('caution', '스타틴에 나이아신을 함께 쓰는 치료 중이라면, 고용량 항산화제가 좋은 콜레스테롤 상승 효과를 상쇄했습니다(HATS 시험).', HATS)
    },
    vitc: {
      statin: c('caution', '스타틴+나이아신 병용 치료 중에는 비타민 C 1,000 mg 같은 고용량 항산화제가 HDL 상승 반응을 막았습니다.', HATS),
      warfarin: c('caution', '1 g/일을 넘는 초고용량에서 INR이 떨어졌다는 사례 보고가 있습니다. 용량을 바꿀 때 INR을 확인하세요.', 'https://pubmed.ncbi.nlm.nih.gov/5108759/'),
      chemo: c('caution', '항암·방사선 치료 중 고용량 항산화제는 치료 효과를 떨어뜨릴 우려가 있어 상용량을 넘기지 마세요.', 'https://academic.oup.com/jnci/article/100/11/773/895704')
    },
    vitk: {
      warfarin: c('avoid', '와파린이 막는 바로 그 경로를 직접 되살립니다. 비타민 K 보충제를 새로 시작하지 마세요. 불가피하면 매일 같은 용량으로 고정하고 INR을 다시 맞춥니다.', WARF)
    },
    vitk2: {
      warfarin: c('avoid', 'MK-7도 같은 비타민 K입니다. 와파린 효과를 떨어뜨려 혈전 위험을 높이므로 병용 금지입니다.', WARF)
    },
    folate: {
      immuno: c('caution', '류마티스에서 저용량 메토트렉세이트를 쓸 때는 오히려 병용이 표준입니다(엽산 5 mg 주 1회 또는 1 mg/일, 메토트렉세이트 먹는 날은 피함). 부작용은 줄고 약효는 유지됩니다.', 'https://sps.nhs.uk/articles/using-folic-acid-with-methotrexate-in-rheumatoid-arthritis/'),
      chemo: c('avoid', '고용량 항암 메토트렉세이트의 해독은 엽산이 아니라 류코보린입니다. 5-FU·카페시타빈은 엽산이 독성을 키웁니다. 다만 페메트렉시드는 엽산 400~1,000 µg 복용이 라벨상 필수이니, 반드시 종양내과 지시대로 하세요.', PEMET),
      aed: c('caution', '엽산이 페니토인 혈중농도를 떨어뜨려 발작 조절이 흔들릴 수 있습니다. 시작·중단 시 약물 농도를 재세요.', PHT),
      ocp: c('caution', '경구피임약을 오래 쓰면 엽산 수치가 떨어질 수 있어 임신 계획 시 특히 보충이 필요합니다.', 'https://ods.od.nih.gov/factsheets/Folate-HealthProfessional/')
    },
    b12: {
      metformin: c('caution', '메트포르민이 회장에서 B12 흡수를 방해합니다. 미국당뇨병학회는 1,500 mg 이상 또는 4~5년 이상 복용자, 빈혈·손발 저림이 있는 경우 정기 B12 검사를 권합니다.', ADA),
      ppi: c('caution', '위산이 줄어 음식 속 B12를 떼어내지 못합니다. 오메프라졸 라벨은 3년 넘는 장기 사용 시 흡수 장애 가능성을 명시합니다.', 'https://www.accessdata.fda.gov/drugsatfda_docs/label/2023/022056s026lbl.pdf'),
      chemo: c('caution', '페메트렉시드 치료 중에는 B12 1 mg 근육주사가 라벨상 필수(첫 투여 1주 전, 이후 3주기마다)입니다. 임의 중단하지 마세요.', PEMET)
    },
    b6: {
      levodopa: c('caution', '카비도파가 함께 든 제품(시네메트 등)이면 B6를 먹어도 됩니다. 라벨에 명시돼 있습니다. 반대로 카비도파 없는 레보도파 단독 제제라면 B6 10~25 mg만으로도 약효가 사라지므로 금기입니다.', SINEMET)
    },
    biotin: {
      antiplt: c('caution', '검사 왜곡 문제입니다. 트로포닌이 거짓으로 낮게 나와 심근경색을 놓친 사망 사례가 FDA에 보고됐습니다. 채혈 전 최소 2~3일 중단하세요.', FDABIO),
      levo: c('caution', 'T4·T3가 거짓 상승하고 TSH가 거짓 저하돼 갑상선약 용량을 잘못 조절할 수 있습니다. 실제 상호작용이 아니라 검사 오류입니다.', FDABIO),
      chemo: c('caution', '종양표지자·호르몬 면역검사 결과가 왜곡될 수 있습니다.', FDABIO)
    },
    calcium: ext(CHELATE, {
      bisphos: c('caution', '알렌드로네이트 흡수를 막습니다. 골다공증약은 기상 직후 물만으로, 최소 30분 뒤 식사. 칼슘은 점심·저녁으로 옮기세요. 단 데노수맙은 저칼슘혈증 예방을 위해 칼슘 1,000 mg + 비타민 D 400 IU 병용이 필요합니다.', [ALEN, FDADEN]),
      diuretic: c('caution', '티아지드가 소변 칼슘 배설을 줄여 고칼슘혈증이 올 수 있습니다. 혈청 칼슘을 확인하세요.', HCTZ),
      ppi: c('caution', '탄산칼슘은 위산이 있어야 녹습니다. 위산억제제를 먹는다면 구연산칼슘으로 바꾸세요.', 'https://pubmed.ncbi.nlm.nih.gov/4000241/'),
      steroid: c('caution', '오히려 병용이 권장됩니다. 미국류마티스학회는 스테로이드 장기 복용자에게 칼슘 1,000~1,200 mg/일을 권합니다.', ACR),
      aed: c('caution', '탄산칼슘·제산제가 페니토인 흡수를 줄입니다. 라벨: 같은 시간대에 복용하지 말 것(2~3시간 분리 관행).', PHT)
    }),
    magnesium: ext(CHELATE, {
      ppi: c('caution', '위산억제제를 3개월 이상(대개 1년 넘게) 쓰면 저마그네슘혈증으로 경련·부정맥이 올 수 있습니다(FDA 경고). 이뇨제·디곡신을 함께 쓰면 특히 위험하고, 넷 중 하나는 보충만으로 교정되지 않아 약을 끊어야 합니다.', FDAPPI),
      diuretic: c('caution', '티아지드·루프 이뇨제는 마그네슘을 빼앗습니다. 마그네슘을 먼저 교정하지 않으면 칼륨 보충도 실패합니다. 반대로 신장 기능이 나쁘면 고마그네슘혈증 위험.', HCTZ),
      aed: c('caution', '수산화마그네슘 제산제가 페니토인 흡수를 줄입니다. 라벨: 같은 시간대에 복용하지 말 것(2~3시간 분리 관행).', PHT)
    }),
    zinc: ext(CHELATE, {
      diuretic: c('caution', '티아지드가 소변으로 아연 배설을 늘려 결핍이 생길 수 있습니다(직접 근거는 미확인).', 'https://ods.od.nih.gov/factsheets/Zinc-HealthProfessional/'),
      immuno: c('caution', '40 mg/일을 오래 넘기면 구리 결핍으로 빈혈·백혈구 감소가 오는데, 면역억제 상태에서는 더 위험합니다.', 'https://ods.od.nih.gov/factsheets/Zinc-HealthProfessional/')
    }),
    iron: ext(CHELATE, {
      levodopa: c('caution', '라벨에 명시돼 있습니다. 철염이 레보도파·카비도파와 결합해 약효를 떨어뜨립니다. 라벨은 시간을 명시하지 않으며 통상 2시간 분리를 권합니다.', SINEMET),
      ppi: c('caution', '위산이 있어야 철이 흡수 가능한 형태로 바뀝니다. 위산억제제 복용 중이면 경구 철분제 반응이 나쁘고, 정맥 철을 고려해야 할 수 있습니다.', 'https://pubmed.ncbi.nlm.nih.gov/21150767/'),
      chemo: c('caution', '확인된 결핍이 아니면 피하세요. 항암 중 철 복용이 예후 악화와 연관됐다는 코호트가 있습니다.', 'https://pubmed.ncbi.nlm.nih.gov/31855498/')
    }),
    selenium: {
      statin: c('caution', '스타틴+나이아신 병용 치료에서 셀레늄이 포함된 항산화제 조합이 치료 효과를 상쇄했습니다.', HATS),
      chemo: c('caution', '고용량 항산화제가 항암 효과를 떨어뜨릴 우려가 있습니다.', 'https://academic.oup.com/jnci/article/100/11/773/895704')
    },
    potassium: {
      acei_arb: c('avoid', '라벨 명시: 칼륨 보충제·칼륨 소금대체품 병용은 혈중 칼륨을 유의하게 올립니다. 의사 상담 없이 저염 소금(칼륨 대체염)을 쓰지 마세요.', LISIN),
      diuretic: c('caution', '스피로노락톤 라벨은 "시작 시 칼륨 보충을 중단하라"고 지시합니다. 반대로 티아지드·루프 이뇨제는 칼륨을 빼앗지만, ARB 복합제라면 자가 보충 금지입니다.', [SPIRO, HCTZ]),
      immuno: c('avoid', '사이클로스포린·타크로리무스 자체가 고칼륨혈증을 일으킵니다. 라벨이 칼륨보존이뇨제 병용 금지와 고칼륨 식이 주의를 명시합니다.', [CSA, TAC]),
      sglt2: c('caution', 'SGLT2 억제제 자체는 고칼륨혈증 위험을 낮추지만, 신기능 저하·ARB 병용 상태라면 칼륨 보충 전 검사가 필요합니다.', 'https://www.ahajournals.org/doi/10.1161/CIRCULATIONAHA.121.057736')
    },
    omega3: {
      warfarin: c('caution', '이론적으로 출혈 위험이 더해지지만, RCT 11건 12만 명 메타분석에서 출혈 증가는 없었습니다. 4 g/일 이상 고용량일 때만 INR·출혈 징후를 살피세요.', OM3B),
      doac: c('caution', '출혈 신호는 정제 EPA 4 g/일에서만(상대 +50%, 절대 +0.6%). 항혈전제 병용 시 통상 용량(1~2 g)은 문제 없었고 고용량은 의사와 상의하세요.', OM3B),
      antiplt: c('caution', '아스피린·클로피도그렐과 겹치면 출혈 위험이 더해집니다. 고용량을 피하세요.', OM3B),
      ssri: c('caution', 'SSRI도 혈소판 기능을 떨어뜨립니다. 소염진통제까지 세 가지가 겹치면 위장 출혈을 살펴야 합니다.', 'https://pubmed.ncbi.nlm.nih.gov/21208586/')
    },
    probiotic: {
      immuno: c('avoid', '균혈증·진균혈증 위험입니다. 특히 S. boulardii는 면역저하·중환자에게 금기이고(EMA 경고), 중심정맥관이 있어도 금기입니다.', CDCPRO),
      chemo: c('avoid', '항암 중 호중구가 떨어진 기간에는 피하세요. 항암치료 중 S. boulardii 진균혈증 사례가 있습니다.', CDCPRO),
      quinolone: c('caution', '항생제가 유산균을 죽입니다. 항생제 복용 후 최소 2시간 간격을 두세요.', 'https://pubmed.ncbi.nlm.nih.gov/31039287/'),
      tetra: c('caution', '항생제와 최소 2시간 간격을 두세요.', 'https://pubmed.ncbi.nlm.nih.gov/31039287/'),
      abx_other: c('caution', '항생제와 최소 2시간 간격. 다만 항생제 연관 설사 예방 목적이라면 이 조합 자체는 근거가 확실합니다.', 'https://pubmed.ncbi.nlm.nih.gov/31039287/'),
      steroid: c('caution', '고용량 스테로이드로 면역이 떨어진 상태에서는 균혈증 위험이 있습니다.', CDCPRO)
    },
    coq10: {
      warfarin: c('caution', '와파린 라벨이 이름을 직접 적어 두었습니다. 구조가 비타민 K와 비슷해 와파린 효과를 떨어뜨릴 수 있습니다. 시작·중단 시 INR을 다시 재세요.', WARF),
      acei_arb: c('caution', '약한 혈압 강하 작용이 더해져 일어설 때 어지러울 수 있습니다.', NCCIH + 'coenzyme-q10'),
      insulin_su: c('caution', '인슐린과 상호작용 가능성이 있어 혈당을 살피세요.', NCCIH + 'coenzyme-q10')
    },
    creatine: {
      metformin: c('caution', '크레아틴은 혈청 크레아티닌을 올려 콩팥 수치(eGFR)를 실제보다 나쁘게 보이게 합니다. 메트포르민·SGLT2 억제제 용량 조절이나 조영제 검사 판단이 틀어질 수 있으니 채혈 전에 복용 사실을 알리세요.', 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5469049/'),
      sglt2: c('caution', '같은 이유로 콩팥 수치가 실제보다 나쁘게 보일 수 있습니다. 채혈 전 복용 사실을 알리세요.', 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5469049/')
    },
    curcumin: {
      warfarin: c('caution', '혈소판을 억제하고 간 효소(CYP2C9)를 막습니다. 흡수를 높인 제형(피페린·파이토좀)을 시작할 때 INR을 다시 재세요.', TURM),
      doac: c('caution', '출혈 위험이 더해지고 P-gp 억제로 아픽사반·리바록사반 농도가 올라갈 수 있습니다.', TURM),
      antiplt: c('caution', '항혈소판 작용이 더해집니다.', TURM),
      immuno: c('caution', '고용량 강황 섭취 후 타크로리무스 농도가 급등해 급성 신독성이 온 사례가 있습니다. 병용 시 혈중농도를 확인하세요.', TURM),
      statin: c('caution', '간 효소(CYP3A4)를 막아 심바스타틴·아토르바스타틴 농도를 올립니다. 근육 증상을 살피세요.', TURM)
    },
    melatonin: {
      warfarin: c('caution', '출혈 위험 증가 보고가 있습니다. 병용 시 INR과 출혈 징후를 살피세요.', 'https://www.goodrx.com/melatonin/interactions'),
      doac: c('caution', '출혈 위험이 더해질 수 있습니다.', 'https://www.goodrx.com/melatonin/interactions'),
      antiplt: c('caution', '출혈 위험이 더해질 수 있습니다.', 'https://www.goodrx.com/melatonin/interactions'),
      ssri: c('caution', '플루복사민은 멜라토닌 분해(CYP1A2)를 강하게 막아 노출을 약 17배 올립니다. 과도한 졸림이 오므로 병용을 피하거나 최소 용량으로.', 'https://pubmed.ncbi.nlm.nih.gov/10668847/'),
      immuno: c('caution', '멜라토닌의 면역 자극 작용이 면역억제 효과를 떨어뜨릴 수 있어 이식 환자는 피하세요.', 'https://www.goodrx.com/melatonin/interactions'),
      insulin_su: c('caution', '야간 인슐린 분비에 영향을 줘 혈당이 흔들릴 수 있습니다.', 'https://doi.org/10.2337/dc26-0164')
    },
    glucosamine: {
      warfarin: c('avoid', 'FDA 부작용 보고 20건, WHO 21건에서 INR이 올랐습니다. 안정적이던 환자가 하루 3,000 mg으로 늘린 뒤 3주 만에 INR이 2.3에서 3.9로 뛴 사례가 있고 뇌출혈 사례도 있습니다.', 'https://pubmed.ncbi.nlm.nih.gov/18363538/'),
      insulin_su: c('caution', '혈당을 올릴 가능성이 보고돼 있습니다(근거는 상충). 당화혈색소를 추적하세요.', NCCIH + 'glucosamine-and-chondroitin-for-osteoarthritis'),
      metformin: c('caution', '혈당에 영향을 줄 가능성이 있어 추적이 필요합니다.', NCCIH + 'glucosamine-and-chondroitin-for-osteoarthritis')
    },
    ryr: {
      statin: c('avoid', '홍국의 모나콜린 K는 처방약 로바스타틴과 같은 물질입니다. 스타틴과 함께 먹는 것은 스타틴을 두 번 먹는 것이며 근육 융해·간독성 위험이 커집니다.', 'https://efsa.onlinelibrary.wiley.com/doi/10.2903/j.efsa.2025.9276'),
      immuno: c('avoid', '베르베린이 간 효소(CYP3A4)를 억제해 사이클로스포린 농도를 올립니다(신장이식 환자 AUC +34.5%, 최저농도 +29%). 홍국은 반대 방향으로, 사이클로스포린이 로바스타틴(=모나콜린 K) 농도를 올려 근육병증 위험. 양쪽 다 병용 금지', ['https://efsa.onlinelibrary.wiley.com/doi/10.2903/j.efsa.2025.9276', BERB]),
      metformin: c('caution', '베르베린이 메트포르민 수송체에 영향을 주고 혈당 강하가 더해집니다. 저혈당·젖산산증을 살피세요.', BERB),
      insulin_su: c('caution', '혈당 강하가 더해져 저혈당이 올 수 있습니다. 약 감량을 고려하세요.', BERB),
      doac: c('caution', '베르베린의 P-gp 억제로 아픽사반·리바록사반·다비가트란 농도가 올라 출혈 위험이 커집니다.', BERB),
      chemo: c('caution', '간 효소를 막아 치료역이 좁은 항암제 농도를 바꿀 수 있습니다.', BERB),
      warfarin: c('caution', 'INR이 흔들릴 수 있습니다.', BERB)
    },
    ginseng: {
      warfarin: c('caution', '와파린 라벨이 인삼을 직접 적어 두었습니다. 와파린 효과를 떨어뜨릴 수 있고, 동시에 혈소판 억제 작용도 보고됩니다. 시작·중단 시 INR을 다시 재세요.', WARF),
      insulin_su: c('caution', '혈당을 낮추는 작용이 있어 저혈당이 올 수 있습니다.', NCCIH + 'asian-ginseng'),
      metformin: c('caution', '혈당 강하가 더해집니다.', NCCIH + 'asian-ginseng'),
      sglt2: c('caution', '혈당 강하가 더해집니다.', NCCIH + 'asian-ginseng'),
      antiplt: c('caution', '진세노사이드의 혈소판 억제로 출혈 위험이 더해집니다.', NCCIH + 'asian-ginseng'),
      doac: c('caution', '출혈 위험이 더해질 수 있습니다.', NCCIH + 'asian-ginseng'),
      immuno: c('caution', '면역을 자극해 자가면역질환 악화나 이식 거부를 부를 수 있습니다. 이식 환자는 피하세요.', NCCIH + 'asian-ginseng')
    },
    greentea: {
      chemo: c('avoid', 'EGCG가 보르테조밉(다발골수종 치료제) 같은 보론산계 약과 직접 결합해 약을 무력화합니다. 치료 중 녹차 제품을 쓰지 마세요.', 'https://ashpublications.org/blood/article/113/23/5927/25877/'),
      warfarin: c('caution', '녹차 잎의 비타민 K 때문에 다량 섭취 시 INR이 떨어진 사례가 있습니다.', 'https://pubmed.ncbi.nlm.nih.gov/10332534/'),
      statin: c('caution', '아토르바스타틴 혈중농도를 바꿀 수 있습니다.', NCCIH + 'green-tea')
    },
    ginkgo: {
      warfarin: c('avoid', '와파린 라벨이 은행잎을 직접 적어 두었습니다. 그 자체로 출혈을 일으키고 와파린 효과에 더해집니다. 병용을 피하는 것이 원칙입니다.', [WARF, NCCIH + 'ginkgo']),
      doac: c('caution', '혈소판 응집을 막아 출혈 위험이 더해집니다. 수술 7~14일 전 중단하세요.', NCCIH + 'ginkgo'),
      antiplt: c('caution', '출혈 위험이 더해집니다. 수술 전 중단하세요.', NCCIH + 'ginkgo'),
      aed: c('caution', '은행 알(종실)의 징코톡신은 경련을 유발하고, 잎 추출물에서도 발작 사례 보고가 있어 뇌전증은 주의.', NCCIH + 'ginkgo'),
      immuno: c('caution', '임상적으로 의미 있는 간 효소(CYP) 상호작용은 확인되지 않았습니다. 출혈 위험 관점에서만 주의.', NCCIH + 'ginkgo')
    },
    sjw: {
      immuno: c('avoid', '사이클로스포린 라벨이 "중대한 상호작용 — 혈중농도 현저 감소"를 경고합니다. 이식 거부가 일어납니다.', [CSA, TAC]),
      doac: c('avoid', '엘리퀴스·자렐토 라벨이 세인트존스워트를 병용 회피 대상으로 직접 명시합니다. 약 농도가 떨어져 혈전이 생깁니다.', ELIQ),
      warfarin: c('avoid', '와파린 효과를 떨어뜨려 INR이 낮아지고 혈전 위험이 커집니다.', WARF),
      ocp: c('avoid', '피임약 농도를 떨어뜨려 돌파출혈과 피임 실패가 일어납니다. 병용 시 다른 피임법을 함께 쓰세요.', NCCIH + 'st-johns-wort'),
      ssri: c('avoid', '세로토닌 작용이 중복돼 세로토닌 증후군(중증 가능)이 올 수 있습니다. 병용 금지입니다.', NCCIH + 'st-johns-wort'),
      chemo: c('avoid', '이리노테칸 활성대사체가 42% 줄고 이매티닙·도세탁셀 농도도 떨어져 치료가 실패합니다.', NCCIH + 'st-johns-wort'),
      aed: c('avoid', '항경련제 농도가 떨어져 발작이 재발할 수 있습니다.', PHT),
      statin: c('caution', '스타틴 농도를 떨어뜨려 콜레스테롤 강하 효과가 사라집니다.', NCCIH + 'st-johns-wort'),
      steroid: c('caution', '스테로이드 분해를 촉진해 효과가 줄 수 있습니다.', NCCIH + 'st-johns-wort')
    },
    ashwagandha: {
      levo: c('avoid', '갑상선호르몬 분비를 자극해 T3·T4가 올라갑니다. 갑상선중독증 사례가 보고됐고, 미국 NCCIH는 갑상선질환자·갑상선약 복용자에게 권하지 않습니다.', NCCIH + 'ashwagandha'),
      immuno: c('avoid', '면역을 자극해 면역억제 효과를 떨어뜨리고 자가면역질환을 악화시킬 수 있습니다.', NCCIH + 'ashwagandha'),
      insulin_su: c('caution', '혈당 강하가 더해져 저혈당이 올 수 있습니다.', NCCIH + 'ashwagandha'),
      metformin: c('caution', '혈당 강하가 더해집니다.', NCCIH + 'ashwagandha'),
      acei_arb: c('caution', '혈압 강하가 더해져 일어설 때 어지러울 수 있습니다.', NCCIH + 'ashwagandha'),
      ssri: c('caution', '진정 작용이 더해집니다.', NCCIH + 'ashwagandha'),
      aed: c('caution', '항경련제와 상호작용이 명시돼 있습니다.', NCCIH + 'ashwagandha')
    },
    milkthistle: {
      insulin_su: c('caution', '당뇨 환자에서 혈당이 떨어졌다는 보고가 있어 저혈당을 살피세요.', 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4908257/')
    },
    garlic: {
      warfarin: c('caution', '와파린 라벨이 마늘을 직접 적어 두었습니다. 그 자체로 출혈을 일으키고 와파린 효과에 더해집니다. 고용량 보충제를 피하세요.', WARF),
      doac: c('caution', '혈소판 억제가 더해집니다. 수술 7~10일 전 중단하세요.', WARF),
      antiplt: c('caution', '출혈 위험이 더해집니다.', WARF),
      chemo: c('caution', '간 효소를 유도해 일부 항암제 농도를 떨어뜨릴 수 있습니다(사퀴나비르 노출 51% 감소 보고).', 'https://pubmed.ncbi.nlm.nih.gov/11740713/')
    },
    nac: {
      antiplt: c('caution', '혈소판 기능을 떨어뜨립니다. 1,200 mg/일을 넘는 고용량 병용 시 출혈을 살피세요(라벨 근거는 없음).', 'https://www.annalsthoracicsurgery.org/article/S0003-4975(08)02022-5/fulltext'),
      warfarin: c('caution', '고용량에서 출혈 위험이 더해질 수 있습니다.', 'https://www.annalsthoracicsurgery.org/article/S0003-4975(08)02022-5/fulltext'),
      chemo: c('caution', '항암 중 고용량 항산화 목적 사용은 종양내과와 상의하세요.', 'https://academic.oup.com/jnci/article/100/11/773/895704')
    },
    ala: {
      insulin_su: c('caution', '인슐린 감수성을 높여 저혈당이 올 수 있습니다. 시작할 때 약 감량을 고려하고 혈당을 자주 재세요.', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC13520106/'),
      metformin: c('caution', '혈당 강하가 더해집니다.', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC13520106/'),
      levo: c('caution', 'T4를 T3로 바꾸는 과정을 억제한다는 보고가 있어 갑상선기능을 다시 확인하세요.', 'https://pubmed.ncbi.nlm.nih.gov/1815532/')
    },
    chromium: {
      levo: c('caution', '크롬 피콜리네이트 동시 복용 시 레보티록신 흡수 17% 감소(n=7). 저자 권고는 "수 시간 분리"이며 갑상선약 라벨 기준대로 4시간 이상 떨어뜨리세요', 'https://pubmed.ncbi.nlm.nih.gov/17725434/'),
      insulin_su: c('caution', '인슐린 감수성이 좋아져 저혈당이 올 수 있습니다.', 'https://ods.od.nih.gov/factsheets/Chromium-HealthProfessional/'),
      metformin: c('caution', '혈당 강하가 더해집니다.', 'https://ods.od.nih.gov/factsheets/Chromium-HealthProfessional/')
    },
    cinnamon: {
      warfarin: c('caution', '카시아 계피의 쿠마린이 간독성과 이론적 항응고 작용을 더합니다. 실론 계피로 바꾸거나 피하세요.', 'https://www.bfr.bund.de/en/service/frequently-asked-questions/topic/faq-on-coumarin-in-cinnamon-and-other-foods/'),
      insulin_su: c('caution', '혈당 강하가 더해져 저혈당이 올 수 있습니다.', NCCIH + 'cinnamon'),
      metformin: c('caution', '혈당 강하가 더해집니다.', NCCIH + 'cinnamon')
    },
    antioxidant: {
      chemo: c('avoid', '항암·방사선 치료 중 고용량 항산화제는 치료 효과를 떨어뜨릴 우려로 권장되지 않습니다.', 'https://academic.oup.com/jnci/article/100/11/773/895704'),
      statin: c('caution', '스타틴+나이아신 병용 치료의 HDL 상승 효과를 상쇄했습니다.', HATS)
    }
  };

  /* ================= 성분끼리의 조합 ================= */
  window.EBN_PAIRS = [
    { a: 'iron', b: 'curcumin', v: 'caution', how: '2시간 이상 분리',
      why: '커큐민이 철과 결합해(킬레이트) 철 결핍을 악화시킨 사례가 보고됐습니다. 철분제를 먹는다면 강황 보충제와 시간을 떼세요.',
      src: ['https://www.wmic.wales.nhs.uk/turmeric-potential-interactions/'] },
    { a: 'iron', b: 'greentea', v: 'caution', how: '1~2시간 분리',
      why: '녹차의 카테킨·탄닌이 식물성 철 흡수를 강하게 막습니다. 녹차추출물 보충제를 쓴다면 철분제와 시간을 떼세요.',
      src: ['https://www.herbalgram.org/resources/herbclip/issues/2005/bin_285/review44336/'] },
    { a: 'zinc', b: 'copper_note', v: 'caution', how: '아연 40 mg/일 넘기면 구리 1~2 mg 병용',
      why: '아연이 장세포 메탈로티오네인을 유도해 구리를 가둬 배설시킵니다. 건강 여성이 아연 50 mg을 10주 먹자 적혈구 구리 효소(SOD) 활성이 떨어졌고, 이 연구가 상한섭취량 40 mg(한국 35 mg)의 근거입니다. 만성 과잉은 빈혈·호중구감소·척수병증까지 갑니다.',
      src: ['https://www.ncbi.nlm.nih.gov/books/NBK222317/', 'https://onlinelibrary.wiley.com/doi/10.1002/ccr3.2987'] },
    { a: 'vite', b: 'vitk', v: 'caution', how: '비타민 E 400 IU 이상이면 병용 주의',
      why: '비타민 E 1,000 IU를 12주 먹자 비타민 K 부족 지표(PIVKA-II)가 1.8 → 5.3 ng/mL로 올랐습니다(건강 남성 32명). 응고시간(PT)은 둔감해서 변화가 안 보입니다. 분리 복용으로 해결되는 문제가 아니라 용량 문제이며, 와파린 복용자는 고용량 E를 피해야 합니다.',
      src: ['https://ajcn.nutrition.org/article/S0002-9165(22)03490-6/pdf'] },
    { a: 'folate', b: 'b12', v: 'caution', how: '엽산 1,000 µg/일 이하 + B12 상태 확인',
      why: '엽산이 빈혈(겉으로 보이는 신호)만 고쳐서 B12 결핍의 신경 손상을 늦게 발견하게 만든다는 것이 상한섭취량 1,000 µg의 근거입니다. 다만 2019년 재검토에서 "엽산이 신경병증을 악화시켰다는 근거는 빈약하다"고 나와 근거 자체가 흔들립니다. 50세 이상·채식·메트포르민 복용자는 B12를 함께 챙기세요.',
      src: ['https://www.ncbi.nlm.nih.gov/books/NBK114318/', 'https://pubmed.ncbi.nlm.nih.gov/31187858/'] },
    { a: 'iron', b: '차·커피(폴리페놀)', v: 'caution', how: '1~2시간 분리',
      why: '홍차·커피·코코아의 폴리페놀이 비헴철 흡수를 강하게, 함량에 비례해 억제합니다(홍차가 가장 강함). 철분제를 먹는 끼니에는 차·커피를 피하세요.',
      src: ['https://doi.org/10.1017/S0007114599000537'] },
    { a: 'iron', b: 'zinc', v: 'caution', how: '공복에 물로 동시 복용할 때만 2시간 분리',
      why: '수용액에서 아연:철 5:1이면 철 흡수가 56% 줄지만, 식사와 함께 먹으면 이 효과가 사라지고 헴철에는 애초에 영향이 없습니다. 철 충족 임신부에게 철 100 mg을 줘도 아연 상태에 문제가 없었습니다.',
      src: ['https://www.ncbi.nlm.nih.gov/books/NBK222317/', 'https://pubmed.ncbi.nlm.nih.gov/17209188/'] },
    { a: 'iron', b: 'calcium', v: 'caution', how: '철결핍 치료 중·임신부만 2시간 분리',
      why: '한 끼 기준으로는 칼슘 165 mg이 비헴철 흡수를 50~60% 줄입니다. 그러나 칼슘을 장기간 늘린 연구들에서 헤모글로빈·페리틴은 변하지 않았고, 방법을 보정한 연구에서는 800 mg 미만이면 억제가 없었습니다. 건강한 사람의 일반 보충제는 분리할 필요가 없고, 철결핍을 치료 중일 때만 분리하세요.',
      src: ['https://pubmed.ncbi.nlm.nih.gov/21462112/', 'https://jn.nutrition.org/article/S0022-3166(22)00142-0/fulltext'] },
    { a: 'iron', b: 'ppi_note', v: 'caution', how: '위산억제제 복용 중이면 경구 철 반응이 나쁨',
      why: '위산이 있어야 철이 녹고 흡수 가능한 형태(2가철)로 바뀝니다. 오메프라졸을 먹는 철결핍빈혈 환자는 경구 철분제에 헤모글로빈이 정상 반응한 비율이 16%에 그쳤습니다. 장기 위산억제제는 철결핍의 원인 목록에 넣어야 합니다.',
      src: ['https://pubmed.ncbi.nlm.nih.gov/21150767/'] },
    { a: 'vitc', b: 'iron', v: 'ok', how: '식품 철에는 같은 끼니에, 철분제 치료에는 불필요',
      why: '비타민 C 50 mg이 식물성 철 흡수를 약 3배 올립니다. 그런데 철결핍빈혈 치료 시험에서는 철분제에 비타민 C 200 mg을 더해도 헤모글로빈 상승이 같았습니다(2.00 vs 1.84 g/dL). 채식 위주 식사에는 의미가 있고, 치료용 철분제에 굳이 추가할 근거는 없습니다.',
      src: ['https://pubmed.ncbi.nlm.nih.gov/2911999/', 'https://jamanetwork.com/journals/jamanetworkopen/fullarticle/2772395'] },
    { a: 'vitd', b: 'calcium', v: 'ok', how: '함께 먹는 것이 맞음',
      why: '비타민 D가 활성형으로 바뀌어 장에서 칼슘을 능동적으로 끌어올립니다. 섭취가 적거나 보통일 때 칼슘 흡수의 대부분이 이 경로입니다. 골다공증 치료에서 둘을 함께 채우는 것이 기본인 이유입니다.',
      src: ['https://www.ncbi.nlm.nih.gov/books/NBK56060/'] },
    { a: 'vitd', b: 'vitk2', v: 'caution', how: '세트로 살 근거는 아직 없음',
      why: '"D가 넣은 칼슘을 K2가 뼈로 보낸다"는 설명은 대리지표(dp-ucMGP)에서만 확인됐습니다. 실제 결과를 본 최고 수준 시험(AVADEC, 24개월)에서 대동맥판 석회화 진행에 차이가 없었고, 체계적 문헌고찰 8편 중 6편이 무효였습니다. 해롭진 않지만 "필요하다"는 근거는 없습니다.',
      src: ['https://www.ahajournals.org/doi/10.1161/CIRCULATIONAHA.121.057008', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10218696/'] },
    { a: 'vitd', b: 'magnesium', v: 'ok', how: '병용이 필요하다는 시험 근거는 없음',
      why: '비타민 D를 활성화하는 효소들이 마그네슘을 필요로 하는 것은 맞습니다. 다만 마그네슘을 보충하면 혈중 비타민 D가 올라간다는 대규모 시험은 없습니다. 기전은 있고 임상 근거는 없는 상태입니다.',
      src: ['https://pubmed.ncbi.nlm.nih.gov/29480918/'] },
    { a: 'calcium', b: 'magnesium', v: 'ok', how: '분리 불필요',
      why: '미국 영양소기준(IOM) 원문: 칼슘이 마그네슘 흡수에 미치는 영향을 본 사람 연구 대부분이 효과 없음이었습니다. 칼슘·마그네슘 복합제를 피할 이유가 없습니다. (다만 칼슘 자체를 1회 500 mg 이하로 나누는 것은 별개로 타당합니다.)',
      src: ['https://www.ncbi.nlm.nih.gov/books/NBK109816/'] },
    { a: 'vitc', b: 'b12', v: 'ok', how: '분리 불필요',
      why: '"고용량 비타민 C가 B12를 파괴한다"는 1974년 주장은 시료를 가열해 측정한 분석법의 인공산물이었습니다. 1976년 재검증에서 비타민 C 첨가가 식사의 B12에 영향을 주지 않았습니다.',
      src: ['https://pubmed.ncbi.nlm.nih.gov/1274888/'] },
    { a: 'selenium', b: '요오드', v: 'ok', how: '경쟁이 아니라 의존 관계',
      why: 'T4를 T3로 바꾸는 효소가 셀레늄 단백질입니다. 셀레늄이 부족하면 갑상선에서 생긴 과산화수소를 못 치워 조직이 상하고, 요오드만 보충하면 오히려 악화될 수 있습니다. 셀레늄 결핍 동물에서 간 효소 활성이 정상의 11%까지 떨어졌습니다. 상한 400 µg은 지키세요.',
      src: ['https://journals.sagepub.com/doi/abs/10.1089/105072502761016494'] },
    { a: 'vite', b: 'statin_niacin', v: 'avoid', how: '스타틴+나이아신 치료 중 고용량 항산화제 금지',
      why: 'HATS 시험: 심장병 환자에게 스타틴+나이아신으로 좋은 콜레스테롤(HDL2)이 42% 올랐는데, 여기에 항산화제(비타민 E 800 IU + C 1,000 mg + 베타카로틴 + 셀레늄)를 더하자 상승분이 0%가 됐습니다. 시간을 나눠 먹어서 해결되는 문제가 아닙니다.',
      src: ['https://www.ahajournals.org/doi/10.1161/hq0801.095151'] },
    { a: 'calcium', b: '카페인', v: 'ok', how: '칼슘을 충분히 먹으면 무시 가능',
      why: '카페인이 3시간 동안 소변 칼슘 배설을 늘리는 것은 맞지만, 24시간 총 배설에는 영향이 없고 손실분은 우유 한두 큰술로 상쇄되는 크기입니다. 칼슘 섭취가 적으면서 카페인이 하루 300 mg을 넘을 때만 의미가 있습니다.',
      src: ['https://pubmed.ncbi.nlm.nih.gov/12204390/'] },
    { a: 'folate', b: '알코올', v: 'caution', how: '상습 음주자는 티아민·엽산·아연 확인',
      why: '알코올은 흡수 통로 단백질의 발현 자체를 억제합니다. 티아민(B1) 수송체가 줄어 베르니케 뇌병증으로 이어지고, 엽산·아연도 흡수가 줄고 배설이 늘어납니다. 시간을 나눠 먹어서 피할 수 있는 문제가 아닙니다.',
      src: ['https://journals.physiology.org/doi/full/10.1152/ajpgi.00132.2010', 'https://www.mdpi.com/2072-6643/15/7/1571'] },
    { a: 'curcumin', b: '피페린(후추 추출물)', v: 'caution', how: '흡수는 늘지만 약물 상호작용 위험',
      why: '"흡수 2,000% 증가"는 1998년 소규모 연구 하나이고 재현된 적이 없습니다. 커큐민 단독 혈중농도가 거의 0이라 배수가 커 보이는 것이며, 3시간 뒤에는 검출되지 않습니다. 게다가 피페린의 작용 기전이 간의 해독 경로(글루쿠론산 포합) 억제라서 같은 경로로 처리되는 약의 농도를 올릴 수 있습니다.',
      src: ['https://pubmed.ncbi.nlm.nih.gov/9619120/', 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4254914/'] },
    { a: 'vita', b: 'vite', v: 'caution', how: '개별 고용량을 동시에 먹을 때만 분리',
      why: '지용성 비타민 A·D·E·K는 담즙 미셀과 같은 수송체를 두고 경쟁합니다. 다만 근거 대부분이 세포 실험이고, 통상 종합비타민 용량에서 사람에게 결핍을 만든다는 시험은 없습니다. 개별 고용량을 한꺼번에 먹을 때만 시간을 나누세요.',
      src: ['https://www.sciencedirect.com/science/article/abs/pii/S0308814614013880'] }
  ];

  /* ================= 복용 타이밍 ================= */
  function t(type, when, time, split, why, src) { return { type: type, when: when, time: time, split: split, why: why, src: src ? (typeof src === 'string' ? [src] : src) : [] }; }
  window.EBN_TIMING = {
    vitd: t('meal', '지방 있는 식사와 함께', '아침·저녁 무관', '분할 불필요',
      '분말·정제 제형은 지방이 있는 식사와 함께 먹을 때 12시간 흡수가 약 32% 높았습니다(고령자 50명 RCT). 반면 이미 기름에 녹인 오일 캡슐은 공복이든 고지방식이든 차이가 없었습니다(88명 교차시험). 반감기가 길어 매일·주 1회 모두 비슷합니다.',
      ['https://pubmed.ncbi.nlm.nih.gov/25441954/', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4882721/']),
    vitk2: t('meal', '지방 있는 식사와 함께', '하루 1회', '분할 불필요',
      'MK-7 420 µg을 지방 13~17 g 아침 직후 먹었을 때 4시간에 최고 농도, 반감기 68시간으로 4일간 검출됐습니다. 하루 한 번으로 충분합니다.',
      ['https://pmc.ncbi.nlm.nih.gov/articles/PMC9237441/']),
    omega3: t('meal', '지방 있는 식사와 함께', '아무 때나', '',
      '고지방 식사(44 g)와 저지방(8 g)을 비교하면 중성지방형 EPA 흡수가 69% → 90%로, 에틸에스터(EE)형은 약 3배 올랐습니다. 특히 값싼 EE형일수록 식사와 함께 먹어야 합니다.',
      ['https://pubmed.ncbi.nlm.nih.gov/2847723/']),
    calcium: t('meal', '탄산칼슘은 식사와 함께 · 구연산칼슘은 무관', '', '1회 500 mg 이하로 분할',
      '위산이 없는 사람이 공복에 먹으면 흡수율이 구연산칼슘 0.45 vs 탄산칼슘 0.04로 10배 차이가 납니다. 단 탄산칼슘도 아침식사와 함께 주면 정상으로 회복됩니다. 그리고 1,000 mg을 한 번에 먹는 것보다 나눠 먹으면 흡수량이 약 2배였습니다.',
      ['https://pubmed.ncbi.nlm.nih.gov/4000241/', 'https://onlinelibrary.wiley.com/doi/full/10.1359/jbmr.2000.15.11.2291']),
    magnesium: t('meal', '식사와 함께', '저녁(수면 목적 시)', '400 mg 넘으면 2~3회 분할',
      '섭취량이 늘수록 흡수 비율이 65%에서 11%까지 떨어집니다(포화되는 능동수송 + 수동확산). 나눠 먹으면 흡수도 낫고 설사도 줄어듭니다. 구연산·글리시네이트가 산화마그네슘보다 잘 녹습니다.',
      ['https://pubmed.ncbi.nlm.nih.gov/1864954/', 'https://pubmed.ncbi.nlm.nih.gov/2407766/']),
    iron: t('empty', '아침 공복', '격일 1회', '하루 2회 분할 금지',
      '철을 먹으면 24시간 뒤 헵시딘(흡수 차단 호르몬)이 올라가 다음 날 흡수를 막고, 48시간이면 정상으로 돌아옵니다. 그래서 매일 먹는 것보다 격일이 흡수가 좋았고(16.3% → 21.8%), 하루 2회 분할은 헵시딘만 더 올렸습니다. 같은 총량이면 2배 용량을 격일로 주는 편이 낫습니다.',
      ['https://pubmed.ncbi.nlm.nih.gov/29032957/', 'https://haematologica.org/article/view/9379']),
    vitc: t('any', '아무 때나', '', '1회 200 mg 이하로 분할',
      '1회 200 mg까지는 거의 100% 흡수되지만 500 mg을 넘으면 흡수율이 떨어지고 1,250 mg에서는 절반이 소변으로 나갑니다. 1,000 mg 한 알보다 250 mg씩 네 번이 효율적입니다.',
      ['https://www.pnas.org/doi/10.1073/pnas.93.8.3704']),
    b12: t('any', '아무 때나', '', '고용량 경구는 1회로 충분',
      '위 내인자를 통한 흡수 통로는 1회 1.5~2 µg에서 포화되고, 그 이상은 수동확산으로 약 1%만 들어옵니다. 그래서 경구 고용량(1,000~2,000 µg)이 의미가 있는 것이고, 나눠 먹을 필요는 없습니다.',
      ['https://ashpublications.org/blood/article/103/7/2863/18297/']),
    folate: t('empty', '공복이 흡수 최고', '', '',
      '공복 보충제 엽산은 거의 100%, 식사와 함께면 85%, 식품 속 엽산은 50% 흡수됩니다. 영양소 기준의 환산식 자체가 이 차이에서 나왔습니다. 다만 차이가 크지 않아 위장이 불편하면 식후도 괜찮습니다.',
      ['https://www.ncbi.nlm.nih.gov/books/NBK114318/']),
    probiotic: t('meal', '식사 직전 30분 또는 식사와 함께', '', '식후 30분은 피하기',
      '위장관 모델 실험에서 식사와 함께 또는 식전 30분에 넣었을 때 균 생존율이 가장 높았고, 식후 30분이 가장 나빴습니다. 약간의 유지방이 위산을 완충합니다. 다만 이는 시험관 모델이고 사람에서 효과 차이를 본 시험은 없습니다.',
      ['https://brill.com/view/journals/bm/2/4/article-p295_5.xml']),
    creatine: t('any', '아무 때나', '', '로딩 시 5 g씩 4회',
      '총 섭취량이 중요하지 시간대는 상관없습니다. 로딩할 때 탄수화물을 함께 먹으면 인슐린 작용으로 근육 저장량이 60% 더 늘었습니다.',
      ['https://journals.physiology.org/doi/abs/10.1152/ajpendo.1996.271.5.e821']),
    coq10: t('meal', '지방 있는 식사와 함께', '', '200 mg 넘으면 분할',
      '식사와 함께 먹으면 장 흡수가 약 3배 높아집니다. 용량이 커질수록 흡수 효율이 떨어지므로 고용량은 나눠 드세요.',
      ['https://www.jstage.jst.go.jp/article/yakushi/127/8/127_8_1251/_article']),
    lutein: t('meal', '반드시 지방과 함께', '', '',
      '샐러드에 아보카도를 넣자 루테인 흡수가 약 5배 늘었습니다. 달걀노른자처럼 인지질과 함께 있을 때 보충제보다 생체이용률이 높습니다. 물만 먹고 삼키면 대부분 낭비됩니다.',
      ['https://pubmed.ncbi.nlm.nih.gov/15735074/', 'https://pubmed.ncbi.nlm.nih.gov/15284371/']),
    curcumin: t('meal', '지방 있는 식사와 함께', '', '',
      '물에 거의 안 녹아 그냥 먹으면 혈중에 잡히지 않습니다. 흡수를 올리려 피페린을 섞은 제품이 많은데, 그 기전이 간 해독 경로 억제라 약물 상호작용과 간 손상 위험이 함께 옵니다.',
      ['https://pubmed.ncbi.nlm.nih.gov/9619120/']),
    melatonin: t('any', '취침 30분~1시간 전(속방형)', '수면위상 조절 목적이면 취침 3~5시간 전', '저용량으로 충분',
      '속방형은 먹고 약 40분에 최고 농도에 도달해 3~5시간이면 사라집니다. 잠드는 시간을 앞당기는 목적이라면 더 이른 시간에 먹어야 하고, 0.5~1 mg 저용량이 고용량과 효과가 같습니다. 한국은 전문의약품입니다.',
      ['https://pmc.ncbi.nlm.nih.gov/articles/PMC11510348/']),
    ala: t('empty', '공복(식전 30분 또는 식후 2시간)', '', '',
      '식사와 함께 먹으면 최고 혈중농도가 약 30%, 총 노출량이 약 20% 줄어듭니다.',
      ['https://lpi.oregonstate.edu/mic/dietary-factors/lipoic-acid']),
    zinc: t('empty', '공복이 원칙, 속 불편하면 식사와 함께', '', '',
      '곡물의 피틴산과 결합하면 흡수가 떨어지므로 공복이 유리하지만, 공복이 몇 % 낫다는 정량적 근거는 확인되지 않았습니다. 철·칼슘 고용량과 공복에 함께 먹는 것만 피하세요.',
      ['https://www.ncbi.nlm.nih.gov/books/NBK222317/']),
    multi: t('meal', '가장 큰 끼니와 함께', '아침', '',
      '지용성 성분(A·D·E·K) 때문에 식사와 함께 먹으라는 권고인데, 종합비타민 자체의 복용 시점을 비교한 임상시험은 없습니다. 개별 성분 근거에서 미뤄 짐작한 권고입니다.',
      []),
    b6: t('any', '식후(속 불편 감소)', '아침', '',
      '수용성이라 시간 제약이 적습니다. 다만 티아민(B1)은 1회 5 mg, 리보플라빈(B2)은 27 mg 부근에서 흡수가 포화되므로 초고용량 한 알은 대부분 낭비입니다.',
      ['https://www.ncbi.nlm.nih.gov/books/NBK114331/', 'https://www.ncbi.nlm.nih.gov/books/NBK114322/'])
  };
})();
