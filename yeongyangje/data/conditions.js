/* 근거영양 — 질환·상태 정의 (성분 × 질환 매트릭스의 열)
   matrix.js 의 각 셀은 { v: 'ok'|'caution'|'avoid'|'na', why: '...', src: [url] }
   v: ok = 먹어도 됨(이득 가능) · caution = 용량 제한 또는 의사·약사 확인 · avoid = 금기 · na = 특별한 문제·이득 없음 */
window.EBN_CONDITIONS = [
  { id: "healthy",   name: "건강 성인",              short: "건강",     desc: "진단 질환·복용 약 없음" },
  { id: "htn",       name: "고혈압",                 short: "고혈압",   desc: "혈압약 복용 포함" },
  { id: "diabetes",  name: "당뇨병",                 short: "당뇨",     desc: "메트포르민·SGLT2·인슐린 포함, 저혈당 위험" },
  { id: "dyslip",    name: "이상지질혈증·심혈관질환", short: "지질·CVD", desc: "스타틴 복용, 협심증·심근경색 병력" },
  { id: "ckd",       name: "만성 신장질환",           short: "신장",     desc: "3~5기, 투석" },
  { id: "liver",     name: "간질환",                 short: "간",       desc: "지방간·간염·간경변" },
  { id: "osteo",     name: "골다공증",               short: "골다공증", desc: "비스포스포네이트·데노수맙 치료 포함" },
  { id: "hf_af",     name: "심부전·심방세동",         short: "심부전·AF", desc: "부정맥 포함" },
  { id: "thyroid",   name: "갑상선질환",             short: "갑상선",   desc: "레보티록신 복용, 갑상선기능항진" },
  { id: "gi",        name: "위장질환",               short: "위장",     desc: "위 절제·비만수술, 위축성 위염, PPI 장기, 염증성 장질환, 담석" },
  { id: "autoimmune",name: "자가면역질환",           short: "자가면역", desc: "면역억제제 복용 포함" },
  { id: "cancer",    name: "암 치료 중",             short: "암 치료",  desc: "항암제·방사선" },
  { id: "pregnancy", name: "임신·수유",              short: "임신",     desc: "용량 상한·기형 위험" },
  { id: "anticoag",  name: "항응고·항혈소판제",       short: "항응고제", desc: "와파린·DOAC·아스피린·클로피도그렐" },
  { id: "smoker",    name: "흡연자",                 short: "흡연",     desc: "현재·과거 흡연" },
  { id: "stones",    name: "신장결석 병력",           short: "결석",     desc: "옥살산·칼슘 결석" },
  { id: "gout",      name: "통풍·고요산혈증",         short: "통풍",     desc: "" },
  { id: "surgery",   name: "수술 2주 전",             short: "수술",     desc: "출혈 위험" }
];
