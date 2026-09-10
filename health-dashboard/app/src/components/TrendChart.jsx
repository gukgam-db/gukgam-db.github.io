import { useRef } from "react";
import { fmt, series, nationalMedian, label, RBY } from "../data";
import { pathOf, nearestIndex, clientXY, Gridlines, XAxis } from "./svgUtil";

/* 연도별 추이: 선택 지역 · 소속 시도 · 전국 중앙값 */
export default function TrendChart({ ind, item, year, sel, setTip }) {
  const svgRef = useRef(null);
  const W = 560, H = 260, L = 40, R = 16, T = 14, B = 28;
  const ys = ind.years;
  const s1 = series(ind, item, sel.c);
  const s2 = sel.l === "sgg" ? series(ind, item, sel.p) : null;
  const s3 = ys.map((y) => nationalMedian(ind, item, y));
  const all = [...s1, ...(s2 || []), ...s3].filter((v) => v != null);
  if (!all.length) return <div className="empty">표시할 자료가 없습니다</div>;
  const lo = Math.floor(Math.min(...all) - 1), hi = Math.ceil(Math.max(...all) + 1);
  const x = (i) => L + ((W - L - R) * i) / Math.max(1, ys.length - 1);
  const y = (v) => T + (H - T - B) * (1 - (v - lo) / (hi - lo));
  const yi = ys.indexOf(year);

  const onMove = (ev) => {
    const i = nearestIndex(ev, svgRef.current, W, L, R, ys.length);
    const { x: px, y: py } = clientXY(ev);
    const rows = [[label(sel), fmt(s1[i]) + ind.unit]];
    if (s2) rows.push([RBY.get(sel.p).n, fmt(s2[i]) + ind.unit]);
    rows.push(["전국 중앙값", fmt(s3[i]) + ind.unit]);
    setTip({ x: px, y: py, title: `${ys[i]}년`, rows });
  };

  return (
    <>
      <div className="legend">
        <span><i className="sw" style={{ background: "var(--series-1)" }} />{label(sel)}</span>
        {s2 && <span><i className="sw dashed" style={{ borderColor: "var(--series-3)" }} />{RBY.get(sel.p).n} 전체(시도, 점선)</span>}
        <span><i className="sw" style={{ background: "var(--series-2)" }} />전국 시군구 중앙값</span>
        <span className="muted">세로 점선 = 선택 연도</span>
      </div>
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="연도별 추이">
        <Gridlines lo={lo} hi={hi} y={y} W={W} L={L} R={R} />
        <XAxis years={ys} x={x} H={H} />
        <line x1={x(yi)} x2={x(yi)} y1={T} y2={H - B} style={{ stroke: "var(--baseline)" }} strokeDasharray="3 3" />
        <path d={pathOf(s3, x, y)} fill="none" style={{ stroke: "var(--series-2)" }} strokeWidth="2" strokeLinejoin="round" />
        {s2 && <path d={pathOf(s2, x, y)} fill="none" style={{ stroke: "var(--series-3)" }} strokeWidth="1.8" strokeDasharray="5 3" strokeLinejoin="round" />}
        <path d={pathOf(s1, x, y)} fill="none" style={{ stroke: "var(--series-1)" }} strokeWidth="2.4" strokeLinejoin="round" />
        {s1[yi] != null && <circle cx={x(yi)} cy={y(s1[yi])} r="4.5" style={{ fill: "var(--series-1)", stroke: "var(--surface-1)" }} strokeWidth="2" />}
        <rect x={L} y={T} width={W - L - R} height={H - T - B} fill="transparent"
          onMouseMove={onMove} onTouchMove={onMove} onMouseLeave={() => setTip(null)} onTouchEnd={() => setTip(null)} />
      </svg>
    </>
  );
}
