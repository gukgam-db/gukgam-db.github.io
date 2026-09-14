/* 근거영양 — 증상별 (검증 2026-09-08) · v: rec 효과 있음 / cond 결핍일 때만 / opt 작은 효과 / no 효과 없음 / avoid 해로울 수 있음 */
window.EBN_SYMPTOMS = [
{ id: "fatigue", icon: "😮‍💨", name: "만성 피로",
  lead: "피로는 영양제가 가장 많이 팔리는 이유이지만, 원인이 확인된 경우에만 답이 있습니다. 한국 가임기 여성의 약 20%는 빈혈 없이 철만 부족한 상태입니다.",
  causes: [
    { v: "cond", name: "철 결핍(빈혈 없음)", ing: "iron", why: "페리틴 50 미만 가임기 여성에게 철분 80 mg 12주(RCT 198명): 피로 개선 47.7% vs 위약 28.8%. 정맥철 시험에서는 페리틴 15 이하에서만 효과(82% vs 47%).", src: "https://www.cmaj.ca/content/184/11/1247" },
    { v: "cond", name: "비타민 D 결핍", ing: "vitd", why: "결핍자 대상 RCT(120명, 고용량 1회) 개선 72% vs 50%. 결핍이 아닌 사람에게 효과를 보인 시험은 없습니다.", src: "https://pubmed.ncbi.nlm.nih.gov/28033244/" },
    { v: "cond", name: "비타민 B12 결핍", ing: "b12", why: "결핍 교정은 확실하나, 결핍 없는 사람에게 B12가 피로를 줄인다는 RCT는 없습니다." },
    { v: "opt", name: "코엔자임 Q10", ing: "coq10", why: "13개 RCT 통합 효과 크기 −0.40(혼합 집단). 2025년 2개 시험 분석은 무효.", src: "https://pubmed.ncbi.nlm.nih.gov/36091835/" },
    { v: "opt", name: "홍삼", ing: "ginseng", why: "12개 RCT 메타 −0.33 vs 19개 RCT 메타 −0.36(유의 없음). 결과가 엇갈리는 작은 효과.", src: "https://pubmed.ncbi.nlm.nih.gov/36730693/" }
  ],
  test: "혈액검사(CBC) + 페리틴(+CRP, 염증 시 페리틴이 거짓 상승) + TSH + 25(OH)D + B12 + 혈당. 코골이·낮 졸림은 수면무호흡 선별, 기분 저하는 우울 선별.",
  flag: "숨참·가슴 통증·실신, 황달, 체중 감소, 열·식은땀, 림프절 붓기, 흑변, 남성·폐경 여성의 철 결핍(위장관 검사 필요), 코골이+낮 졸림, 자살 생각." },
{ id: "hair", icon: "💇", name: "탈모",
  lead: "탈모 영양제의 대표 성분 비오틴은 건강한 사람에게 효과를 본 RCT가 하나도 없고, 오히려 혈액검사를 왜곡합니다.",
  causes: [
    { v: "cond", name: "철 결핍", ing: "iron", why: "휴지기 탈모 환자에서 철 결핍(페리틴 15 미만) 비율이 높다는 환자-대조군 연구가 있고 치료 기준(30~70)은 논쟁 중. 결핍이 아닌 사람에게 철분이 탈모를 줄인다는 RCT는 없음.", src: "https://pmc.ncbi.nlm.nih.gov/articles/PMC12839778" },
    { v: "cond", name: "아연 결핍", ing: "zinc", why: "탈모 환자 312명 연구: 혈청 아연이 대조군보다 낮았고(84 vs 98 µg/dL) 원형탈모에서 70 µg/dL 미만 비율이 4배. 결핍자 5명 증례 전원 호전. 결핍 없는 사람 RCT는 없음.", src: "https://pmc.ncbi.nlm.nih.gov/articles/PMC3870206/" },
    { v: "no", name: "비오틴", ing: "biotin", why: "2017년 검토: 효과 보고 18건 전부 기저 결핍·질환이 있는 증례. 건강 성인 RCT 없음. 고용량(5~100 mg)은 트로포닌·갑상선 검사 왜곡(FDA 경고). 채혈 최소 2~3일 전 중단(검사기관 안내에 따름).", src: "https://karger.com/sad/article-abstract/3/3/166/291279" },
    { v: "no", name: "비타민 D", ing: "vitd", why: "연관성 연구만 있고 RCT 없음." }
  ],
  test: "페리틴, CBC, TSH, (선택) 아연, 25(OH)D.",
  flag: "동전 모양 원형 탈모, 두피 염증·흉터, 피로·추위 못 견딤 동반(갑상선), 새 약 복용 후 급격한 탈모, 여성의 다모증·생리 불순(다낭성난소)." },
{ id: "numb", icon: "🖐️", name: "손발 저림·감각 이상",
  lead: "가장 흔한 영양 원인은 B12 결핍이고, 역설적으로 '신경 영양제'로 팔리는 B6를 고용량으로 오래 먹으면 저림이 생깁니다.",
  causes: [
    { v: "cond", name: "비타민 B12 결핍", ing: "b12", why: "메트포르민 복용자 결핍 23% vs 비복용 17%(교차비 2.95). 위산억제제·위 절제·비건·아산화질소 흡입도 원인. 교정 효과 확실.", src: "https://pmc.ncbi.nlm.nih.gov/articles/PMC9816920/" },
    { v: "avoid", name: "비타민 B6 과잉", ing: "b6", why: "대부분 1,000 mg 이상에서 신경병증이 생기지만 장기 복용 시 50 mg 미만 사례도 있음. 상한: 미국 100 mg, 한국은 2025년 100→50 mg으로 하향, 유럽(2023) 12 mg.", src: "https://www.ncbi.nlm.nih.gov/books/NBK554500/" },
    { v: "avoid", name: "아연 과잉 → 구리 결핍", ing: "zinc", why: "고용량 아연(보충제·틀니 접착제)이 구리를 고갈시켜 척수신경병증+빈혈. 보행 장애는 회복되지 않는 경우가 많음.", src: "https://www.nature.com/articles/sj.bdj.2011.428" },
    { v: "opt", name: "알파리포산(당뇨 신경병증)", ing: "ala", why: "과거 메타는 증상 24% 감소였으나 코크란 2024: 6개월 시점 '효과가 거의 없거나 없을 것', 탈락 편향 큼.", src: "https://www.cochranelibrary.com/cdsr/doi/10.1002/14651858.CD012967.pub2/full" }
  ],
  test: "B12 + 메틸말론산(MMA), 당화혈색소, TSH, 고용량 B6 복용자는 B6 농도, 아연 복용자는 구리·세룰로플라스민, CBC.",
  flag: "갑자기 생긴 한쪽 얼굴·팔 저림+말 어눌함(뇌졸중 응급, 119), 빠르게 진행하거나 올라오는 근력 저하, 보행 불안정, 대소변 장애, 저림+인지 변화(B12·구리 척수병증), 당뇨 환자의 발 상처·감각 소실." },
{ id: "cramp", icon: "🦵", name: "근육 경련(쥐)",
  lead: "'쥐 나면 마그네슘'은 통념입니다. 코크란 리뷰는 고령자의 원인 불명 쥐에 마그네슘이 의미 있는 예방 효과를 주지 않는다고 결론냈습니다.",
  causes: [
    { v: "no", name: "마그네슘", ing: "magnesium", why: "코크란 2020: 고령자 특발성 쥐에 '임상적으로 의미 있는 예방 효과 없을 가능성'(중등도 확실성). 임신부는 결과 상충·확실성 낮음.", src: "https://www.cochranelibrary.com/cdsr/doi/10.1002/14651858.CD009402.pub3/full" },
    { v: "opt", name: "비타민 B군", ing: "b6", why: "고령 고혈압 환자 28명 RCT 하나에서 빈도 감소. 권고하기엔 너무 작음.", src: "https://pubmed.ncbi.nlm.nih.gov/11301568/" },
    { v: "avoid", name: "퀴닌", why: "FDA: 쥐 치료에 사용 금지(혈소판감소·용혈요독증후군, 2005~08년 중대 부작용 38건).", src: "https://www.fda.gov/files/about%20fda/published/Serious-risks-associated-with-using-Quinine-to-prevent-or-treat-nocturnal-leg-cramps.pdf" },
    { v: "rec", name: "스트레칭", why: "미국가정의학회 2017 1차 권고. 취침 전 종아리 스트레칭." }
  ],
  test: "보통 불필요. 잦으면 전해질(Mg·K·Ca), 크레아티닌, TSH, CK, 혈당.",
  flag: "쥐+근력 저하·근육 위축·잔떨림, 새로 시작한 스타틴·이뇨제, 콜라색 소변(횡문근융해), 간질환, 부종·소변량 감소." },
{ id: "sleep", icon: "🌙", name: "잠이 안 옴",
  lead: "영양 결핍이 불면의 주원인인 경우는 드뭅니다. 멜라토닌은 잠드는 시간을 7분, 마그네슘은 17분(저질 근거) 줄입니다. 1차 치료는 인지행동치료(CBT-I)입니다.",
  causes: [
    { v: "opt", name: "멜라토닌", ing: "melatonin", why: "19개 RCT: 잠드는 시간 −7.1분, 총 수면 +8.3분. 용량반응(2024): 4 mg에서 정점, 취침 2~3시간 전이 30분 전보다 나음. 한국은 처방.", src: "https://pubmed.ncbi.nlm.nih.gov/23691095/" },
    { v: "opt", name: "마그네슘", ing: "magnesium", why: "고령자 3개 RCT 151명: 잠드는 시간 −17.4분. 근거 질 낮음~매우 낮음.", src: "https://pmc.ncbi.nlm.nih.gov/articles/PMC8053283/" },
    { v: "no", name: "발레리안", why: "2024 우산 리뷰: 불면에 효능 없음, 주관적 질만 개선 가능. 안전성은 양호.", src: "https://www.sciencedirect.com/science/article/pii/S0924977X24000294" },
    { v: "opt", name: "L-테아닌", why: "2025 메타(18 RCT 897명): 잠드는 시간 SMD 0.15, 수면 질 0.43. 혼합 제품 다수.", src: "https://pubmed.ncbi.nlm.nih.gov/40056718/" },
    { v: "cond", name: "철 결핍(하지불안증후군)", ing: "iron", why: "밤에 다리를 움직이고 싶은 충동이 있으면 하지불안증후군 지침상 페리틴 75 미만에서 철분 치료를 고려합니다(의사 판단). 일반 불면과는 다른 문제." }
  ],
  test: "보통 불필요. 하지불안 증상이면 페리틴, 심계항진·체중 감소면 TSH.",
  flag: "심한 코골이·무호흡 목격, 불면+우울·자살 생각, 밤에 다리를 움직이고 싶은 충동, 체중 감소·두근거림, 3개월 이상 지속." },
{ id: "eye", icon: "👁️", name: "눈 피로·건조",
  lead: "'눈 영양제' 오메가-3는 미국 NIH가 3년간 535명에게 시험한 결과 건조증에 효과가 없었고, 루테인은 주관적 눈 피로를 줄이지 못했습니다.",
  causes: [
    { v: "no", name: "오메가-3(안구건조)", ing: "omega3", why: "DREAM 시험(NEJM 2018, 535명, 3 g 12개월): 증상 점수 −13.9 vs 위약 −12.5, 징후 차이 없음. 중단 후 연장 연구도 무효.", src: "https://www.nejm.org/doi/full/10.1056/NEJMoa1709691" },
    { v: "no", name: "루테인(눈 피로)", ing: "lutein", why: "6개월 RCT 70명: 눈물막 지표는 개선됐지만 자가 보고 눈 피로는 차이 없음. 주관적 피로 개선 근거 없음.", src: "https://pmc.ncbi.nlm.nih.gov/articles/PMC11830589/" },
    { v: "cond", name: "비타민 A", ing: "vita", why: "진짜 결핍(흡수장애·비만수술 후)에서만 안구건조증. 한국에서 드묾." },
    { v: "rec", name: "인공눈물·20-20-20·눈꺼풀 온찜질", why: "1차 치료. 20분마다 20피트(6 m) 밖을 20초 보기." }
  ],
  test: "영양 검사 불필요. 안과 검사(눈물막 파괴시간, 쉬르머). 흡수장애가 있을 때만 혈청 비타민 A.",
  flag: "통증, 눈부심, 시력 저하, 분비물 있는 충혈, 입 마름 동반(쇼그렌), 복시, 갑작스러운 날파리·번쩍임." },
{ id: "cold", icon: "🤧", name: "잦은 감기",
  lead: "비타민 C·D·아연 모두 감기 '예방' 효과는 없습니다. 프로바이오틱스만 코크란에서 상기도 감염 약 24% 감소(낮은 확실성, 어린이·성인 혼합)를 보였습니다.",
  causes: [
    { v: "opt", name: "비타민 C", ing: "vitc", why: "코크란 2013: 일반인 발생 감소 없음. 평소 복용 시 기간 성인 −8%·어린이 −14%. 걸린 뒤 복용은 효과 없음.", src: "https://www.cochranelibrary.com/cdsr/doi/10.1002/14651858.CD000980.pub4/full" },
    { v: "opt", name: "아연 로젠지", ing: "zinc", why: "코크란 2024(34 RCT): 예방 효과 없음, 기간 약 2일 단축(낮은 확실성), 위장 부작용. 코 스프레이 아연은 후각 소실.", src: "https://pubmed.ncbi.nlm.nih.gov/38719213/" },
    { v: "no", name: "비타민 D", ing: "vitd", why: "2025 갱신 메타(40개 RCT 6.2만 명): 전체 OR 0.94(0.88~1.00), 유의하지 않음. 연령·기저 농도·복용 빈도·용량 어느 하위군에서도 효과 차이가 확인되지 않았습니다.", src: "https://www.thelancet.com/journals/landia/article/PIIS2213-8587(24)00348-6/fulltext" },
    { v: "opt", name: "프로바이오틱스", ing: "probiotic", why: "코크란 2022(16개 RCT 4,798명): 1회 이상 상기도 감염 RR 0.76(0.67~0.87), 낮은 확실성. 어린이·성인·고령자 혼합.", src: "https://www.cochranelibrary.com/cdsr/doi/10.1002/14651858.CD006895.pub4/full" },
    { v: "no", name: "에키네시아·엘더베리", why: "코크란 2014(24건): 치료 효과 없음, 예방은 미미할 가능성. 엘더베리는 소규모 제조사 지원 5건, 결론 불가.", src: "https://www.cochranelibrary.com/cdsr/doi/10.1002/14651858.CD000530.pub3/full" }
  ],
  test: "보통 불필요. 결핍 위험이 있으면 25(OH)D. 면역글로불린 검사는 아래 신호가 있을 때만.",
  flag: "1년에 폐렴 2회 이상, 반복 농양, 10일 넘게 열 나는 감기, 체중 감소, 식은땀." },
{ id: "joint", icon: "🦴", name: "관절 통증",
  lead: "가장 많이 팔리는 글루코사민은 미국 NIH 결정판 시험에서 위약(60% 반응)보다 낫지 않았습니다. 관절염에 영양 결핍이 원인인 경우는 거의 없습니다.",
  causes: [
    { v: "no", name: "글루코사민·콘드로이틴", ing: "glucosamine", why: "GAIT(NEJM 2006, 1,583명): 위약과 차이 없음. 중등~중증 하위군 병용 79% vs 54%는 가설 수준.", src: "https://www.nejm.org/doi/full/10.1056/NEJMoa052771" },
    { v: "opt", name: "커큐민", ing: "curcumin", why: "통증 −1.77점(10점 만점), 기능 −7.06. 시험 질 낮음. 고흡수 제형 간 손상 주의.", src: "https://link.springer.com/article/10.1186/s12906-022-03740-9" },
    { v: "opt", name: "콜라겐", ing: "collagen", why: "11개 RCT 870명 통증·기능 개선. 대부분 6개월 미만, 제조사 지원, 제형 다양.", src: "https://www.oarsijournal.com/article/S1063-4584(24)00004-9/fulltext" },
    { v: "opt", name: "오메가-3(류마티스)", ing: "omega3", why: "류마티스에서 소염진통제 사용량 감소. 골관절염은 2023 메타 −0.29 vs 2025 메타 무효로 상충.", src: "https://pubmed.ncbi.nlm.nih.gov/22835600/" },
    { v: "no", name: "비타민 D", ing: "vitd", why: "JAMA RCT 2건(결핍 환자 포함): 통증·연골 손실에 효과 없음.", src: "https://jamanetwork.com/journals/jama/fullarticle/2499277" }
  ],
  test: "염증 징후가 있으면 ESR/CRP, 류마티스인자·항CCP, 요산. 골연화증 의심 시에만 25(OH)D.",
  flag: "뜨겁게 부은 관절(감염·통풍), 아침 뻣뻣함 1시간 이상, 양쪽 손가락 대칭 부종, 열, 발진, 체중 감소, 밤에 심한 통증." },
{ id: "memory", icon: "🧠", name: "기억력 저하·건망증",
  lead: "'뇌 영양제' 은행잎은 3,069명 6년 시험에서 치매를 막지 못했습니다. 종합비타민의 인지 효과는 통계적으로 있으나 개인이 느끼기엔 작습니다.",
  causes: [
    { v: "cond", name: "비타민 B12 결핍", ing: "b12", why: "결핍 교정은 확실. 결핍 없는 고령자에게 B12·엽산은 인지 개선 없음(코크란). 호모시스테인 높은 경우만 가능성.", src: "https://www.cochrane.org/evidence/CD004514_no-evidence-folic-acid-or-without-vitamin-b12-improves-cognitive-function-unselected-elderly-people" },
    { v: "opt", name: "종합비타민(60세+)", ing: "multi", why: "COSMOS 3개 연구 5,200명: 전반 인지 +0.07 SD, 삽화 기억 +0.06 SD. '인지 노화 약 2년 지연' 수준의 작은 효과.", src: "https://ajcn.nutrition.org/article/S0002-9165(23)66342-7/fulltext" },
    { v: "no", name: "오메가-3", ing: "omega3", why: "코크란 2012(3 RCT 3,536명): 인지 건강한 고령자에 효과 없음.", src: "https://pubmed.ncbi.nlm.nih.gov/22696350/" },
    { v: "no", name: "은행잎", ing: "ginkgo", why: "GEM(JAMA 2008, 3,069명, 6.1년): 치매 HR 1.12(0.94~1.33), 무효.", src: "https://jamanetwork.com/journals/jama/fullarticle/182920" },
    { v: "opt", name: "크레아틴", ing: "creatine", why: "2022 메타 기억 SMD 0.29(고령자 위주). 방법론 논쟁, 확실성 낮음.", src: "https://pubmed.ncbi.nlm.nih.gov/35984306/" }
  ],
  test: "B12(+MMA), TSH, CBC, 혈당, 엽산. 우울 선별, 복용 약 검토(항콜린제·수면제). 인지 검사.",
  flag: "가족이 먼저 알아챈 저하, 길 잃음, 일상생활 장애, 몇 주~몇 달 만에 급격한 진행, 국소 신경 증상, 60세 미만의 진행성 저하." },
{ id: "nail", icon: "💅", name: "손톱 갈라짐·부서짐",
  lead: "비오틴 근거는 30년 전 대조군 없는 소규모 관찰 2건이 전부입니다. 반면 검사 왜곡 위험은 FDA가 경고했습니다.",
  causes: [
    { v: "cond", name: "철 결핍", ing: "iron", why: "숟가락 모양 손톱(스푼 네일)은 결핍 교정으로 회복. 결핍 없는 사람 RCT 없음." },
    { v: "no", name: "비오틴", ing: "biotin", why: "1989년 45명(대조군 없음) 91% 개선, 1993년 35명 63% 주관적 개선. 위약대조 RCT 없음. 2018 JAAD '비오틴 치료 재고'.", src: "https://www.jaad.org/article/S0190-9622(18)30204-4/abstract" },
    { v: "rec", name: "물·세제 노출 줄이기", why: "가장 흔한 원인. 장갑 착용, 보습." }
  ],
  test: "페리틴/CBC, TSH, 변형된 손톱은 진균 검사. 실용적인 비오틴 혈액검사는 없음.",
  flag: "손톱 밑 검은 줄(흑색종), 점상 함몰·기름 얼룩(건선), 곤봉지, 한 손톱만 변형, 스푼 네일+피로." },
{ id: "mood", icon: "🌧️", name: "우울감",
  lead: "비타민 D는 1.8만 명 5년 시험에서 우울증을 예방하지 못했습니다. EPA 위주 오메가-3와 활성엽산은 '치료 보조'로 작은 근거가 있습니다.",
  causes: [
    { v: "no", name: "비타민 D(예방)", ing: "vitd", why: "VITAL-DEP(JAMA 2020, 18,353명, 2,000 IU 5.3년): 우울증 발생·기분 점수 차이 없음. 2024 메타(31 RCT)는 단기(24주 이하)·기존 우울증에서 증상 감소(SMD −0.32)였으나 52주 초과 시험에서는 효과가 사라졌습니다.", src: "https://jamanetwork.com/journals/jama/fullarticle/2768978" },
    { v: "opt", name: "오메가-3(EPA 위주)", ing: "omega3", why: "26개 RCT 2,160명: 전체 SMD −0.28. EPA 60% 이상·1 g 이하에서 −0.50~−1.03. DHA 위주는 무효. 치료 대체가 아니라 보조.", src: "https://www.nature.com/articles/s41398-019-0515-5" },
    { v: "opt", name: "엽산·L-메틸엽산 — 항우울제 보조(처방 영역)", ing: "folate", why: "항우울제에 엽산(L-메틸엽산 포함)을 더한 6개 RCT: 반응률 RR 1.36(1.16~1.59), 소규모. 15 mg L-메틸엽산은 처방 용량입니다.", src: "https://pubmed.ncbi.nlm.nih.gov/34450256/" },
    { v: "no", name: "SAMe", why: "코크란 2016: 근거 불충분, 조증 유발 보고.", src: "https://www.cochranelibrary.com/cdsr/doi/10.1002/14651858.CD011286.pub2/full" },
    { v: "avoid", name: "세인트존스워트", ing: "sjw", why: "위약보다 낫고 항우울제와 동등(코크란 29건 5,489명)이지만 피임약·항응고제·SSRI(세로토닌 증후군)와 중대한 상호작용. 국내에서는 일반의약품으로만 허가.", src: "https://www.cochranelibrary.com/cdsr/doi/10.1002/14651858.CD000448.pub3/related-content" }
  ],
  test: "TSH, CBC, B12, 엽산, 결핍 위험 시 25(OH)D. 우울 선별(PHQ-9).",
  flag: "자살 생각, 환각·망상, 일상 기능 상실, 조증 병력, 산후 발병, 2주 이상 지속." },
{ id: "mouth", icon: "👄", name: "입안 염증·구내염",
  lead: "반복되는 구내염 환자의 일부에서 B12·철·엽산 결핍이 발견됩니다. 결핍이 없는 사람에게 B12가 효과를 보인 시험은 소규모 1건뿐입니다.",
  causes: [
    { v: "cond", name: "B12·철·엽산 결핍", ing: "b12", why: "재발성 구내염 코호트에서 B12 결핍 최대 50%, 철 7~12.5%, 엽산 7.5%. 결핍 교정으로 호전.", src: "https://www.sciencedirect.com/science/article/pii/S0929664618307435" },
    { v: "opt", name: "B12 1,000 µg 설하(결핍 무관)", ing: "b12", why: "RCT 58명 6개월: 기저 B12와 무관하게 궤양 기간·수 감소. 단일 소규모, 재현 안 됨.", src: "https://www.nature.com/articles/6400688" },
    { v: "cond", name: "리보플라빈(B2) 결핍", why: "입꼬리 갈라짐·자홍색 혀. 한국에서 드묾." },
    { v: "rec", name: "SLS 없는 치약·자극 피하기", why: "계면활성제(SLS) 치약이 재발 요인. 바꿔 보는 것이 먼저." }
  ],
  test: "CBC, 페리틴, B12, 엽산. 위장 증상 있으면 셀리악 항체.",
  flag: "3주 넘는 궤양, 낫지 않는 단일 궤양(편평세포암), 생식기 궤양·포도막염(베체트), 체중 감소·설사(염증성 장질환·셀리악), 열, 피부 병변 동반." },
{ id: "bone", icon: "🩻", name: "뼈 시림·골다공증 걱정",
  lead: "'뼈가 시리다'는 골다공증 증상이 아닙니다. 골다공증은 부러지기 전까지 증상이 없습니다. 걱정된다면 보충제가 아니라 골밀도 검사입니다.",
  causes: [
    { v: "cond", name: "칼슘 + 비타민 D", ing: "calcium", why: "섭취·혈중 농도가 낮을 때만 이득. 지역사회 거주 폐경 여성의 저용량 일률 보충은 USPSTF 2024 초안 '권고 반대'. 요양시설 거주 고령자는 근거 있음(생애주기 참고).", src: "https://www.uspreventiveservicestaskforce.org/uspstf/draft-recommendation/vitamin-d-calcium-combined-supplementation-primary-prevention-falls-fractures-communitydwelling-adults" },
    { v: "cond", name: "비타민 D 심한 결핍(골연화증)", ing: "vitd", why: "25(OH)D 10~12 ng/mL 미만이면 뼈 통증·근력 저하가 실제로 생김. 검사로 확인." }
  ],
  test: "골밀도(DXA): 여성 54·60·66세 국가검진, 남성 70세 이상 또는 위험인자. 25(OH)D, 칼슘, 인, ALP, 이상 시 PTH.",
  flag: "키 4 cm 이상 줄어듦, 가벼운 충격에 골절, 장기 스테로이드, 밤에 심한 허리 통증·체중 감소." },
{ id: "bp", icon: "🩺", name: "혈압 걱정",
  lead: "영양제로 낮출 수 있는 혈압은 마그네슘 2 mmHg, 오메가-3 2~4 mmHg 수준입니다. 식단(DASH)은 약 11 mmHg, 소금 줄이기는 5 mmHg입니다.",
  causes: [
    { v: "opt", name: "마그네슘", ing: "magnesium", why: "34개 RCT 2,028명(368 mg/일): 수축기 −2.0, 이완기 −1.8 mmHg.", src: "https://www.ahajournals.org/doi/10.1161/hypertensionaha.116.07664" },
    { v: "opt", name: "칼륨(식사로)", ing: "potassium", why: "32개 RCT: 하루 +30 mmol 추가에서 효과 정점, 80 mmol 이상은 이득 없음(U자형). 신장질환·ACEi/ARB·스피로노락톤 복용 시 주의.", src: "https://www.ahajournals.org/doi/10.1161/JAHA.119.015719" },
    { v: "opt", name: "마늘 추출물", ing: "garlic", why: "고혈압 환자 수축기 −8.3 mmHg. 단, 저자의 시험이 제조사(Kyolic) 지원.", src: "https://pubmed.ncbi.nlm.nih.gov/32010325/" },
    { v: "no", name: "코엔자임 Q10", ing: "coq10", why: "코크란 2016: 임상적으로 의미 있는 혈압 효과 없음(중등도 질).", src: "https://www.cochranelibrary.com/cdsr/doi/10.1002/14651858.CD007435.pub3/abstract" },
    { v: "opt", name: "오메가-3 2~3 g", ing: "omega3", why: "71개 RCT: 정상인 −2, 고혈압 −4.5 mmHg. 이 용량은 심방세동 위험과 맞물림.", src: "https://www.ahajournals.org/doi/10.1161/JAHA.121.025071" }
  ],
  test: "가정 혈압 측정이 핵심. 기본 대사 검사, 소변, 지질. 이뇨제 복용 시 K·Mg.",
  flag: "180/120 이상, 두통·가슴 통증·시야 변화 동반, 30세 이전 발병, 약 3개로도 조절 안 됨(2차성 고혈압), 임신." },
{ id: "gut", icon: "🚽", name: "소화불량·변비",
  lead: "변비에는 산화마그네슘·차전자피가 2023년 미국 소화기학회 지침에 '근거 있는 치료'로 들어갔습니다. 소화불량 자체에 근거 있는 영양제는 없습니다.",
  causes: [
    { v: "rec", name: "산화마그네슘(변비)", ing: "magnesium", why: "RCT(1.5 g/일): 전반 개선 70.6% vs 위약 25.0%. AGA/ACG 2023 조건부 권고(매우 낮은 확실성). 신장질환자는 고마그네슘혈증 위험으로 복용 전 의사 확인.", src: "https://pmc.ncbi.nlm.nih.gov/articles/PMC6786451/" },
    { v: "rec", name: "차전자피(식이섬유)", why: "AGA/ACG 2023 조건부 권고(낮은 확실성). 용량은 제품 표시량부터 점진 증량. 폴리에틸렌글리콜(PEG)만 강한 권고.", src: "https://gi.org/journals-publications/ebgi/schoenfeld2_june2023/" },
    { v: "opt", name: "프로바이오틱스(변비)", ing: "probiotic", why: "메타분석: 장 통과시간 −12.4시간, 주 배변 +1.3회. B. lactis는 효과, L. casei Shirota는 무효. 편향 큼.", src: "https://ajcn.nutrition.org/article/S0002-9165(23)04789-5/fulltext" },
    { v: "avoid", name: "칼슘·철분 보충제(변비 원인)", ing: "calcium", why: "변비를 일으키는 흔한 보충제. 새로 생긴 변비라면 먼저 의심." }
  ],
  test: "CBC, TSH, 칼슘, 혈당. 45~50세 이상에서 첫 발생이거나 아래 신호가 있으면 대장내시경.",
  flag: "혈변, 의도치 않은 체중 감소, 50세 이후 새로 시작, 철 결핍성 빈혈, 대장암 가족력, 심한 복통·구토, 밤에 깨우는 증상." }
];
