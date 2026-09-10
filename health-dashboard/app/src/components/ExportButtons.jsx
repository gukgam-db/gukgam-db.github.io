import { downloadSvg, downloadPng, downloadCsv, downloadListCsv } from "../export";

/* 카드 우상단 내보내기 버튼. kinds: "svg" | "png" | "csv" | "list" */
export default function ExportButtons({ name, kinds = ["svg", "png"] }) {
  const run = (kind) => (e) => {
    const card = e.currentTarget.closest(".card");
    if (!card) return;
    try {
      ({ svg: downloadSvg, png: downloadPng, csv: downloadCsv, list: downloadListCsv })[kind](card, name);
    } catch (err) {
      console.error("내보내기 실패:", kind, name, err);
      alert("내보내기에 실패했습니다: " + err.message);
    }
  };
  const labelOf = { svg: "SVG", png: "PNG", csv: "CSV", list: "CSV" };
  const titleOf = { svg: "SVG로 저장 (PPT에서 편집 가능)", png: "PNG 이미지로 저장", csv: "표를 CSV로 저장", list: "목록을 CSV로 저장" };
  return (
    <div className="exports" role="group" aria-label="내보내기">
      {kinds.map((k) => (
        <button key={k} className="xbtn" onClick={run(k)} title={titleOf[k]}>↓ {labelOf[k]}</button>
      ))}
    </div>
  );
}
