/* 근거영양 — 제품 DB (판매 연계용 스키마 · 현재는 예시 슬롯만, 실제 제품 없음)
   상업화 시 각 제품은 아래 필드를 모두 채워야 등록. 시험성적서(lot_tests) 없는 제품은 등록 불가. */
window.EBN_PRODUCTS = {
  schema: {
    id: "고유 ID", brand: "제조·판매사", name: "제품명", ingredient: "ingredients.js 키", form: "제형(캡슐·정·액상·로젠지)",
    dose_per_serving: "1회 함량(원소 기준)", servings: "총 회분", price_krw: "가격", price_per_day: "1일 비용(자동)",
    certifications: ["GMP", "USP Verified", "NSF", "IFOS", "식약처 건강기능식품 인정"],
    lot_tests: [{ lot: "로트번호", date: "시험일", lab: "시험기관", assay_pct: "표시 함량 대비 %", heavy_metals: "적합/부적합", microbes: "적합/부적합", oxidation_totox: "어유만" }],
    excipients_flag: ["베타카로틴 함유", "비타민 E 고함량", "철분 함유"],
    evidence_match: "이 제품의 함량·형태가 근거 연구의 중재와 일치하는가 (true/false + 메모)",
    coi: "판매자 이해관계 고지 문구"
  },
  items: []
};
