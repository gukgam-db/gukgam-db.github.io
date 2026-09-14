import { useRef } from "react";
import { fmt, val, boxStats, poolFor, label } from "../data";
import { nearestIndex, clientXY, Gridlines, XAxis } from "./svgUtil";

/* 격차: 연도별 비교 집단 분포 상자그림 + 선택 지역 점 (CIAT 패널 6 재현) */
export default function GapBoxplot({ ind, item, year, sel, scope, setTip }) {
  const svgRef = useRef(null);
  const W = 560, H = 260, L = 40, R = 16, T = 14, B = 28;
  const ys = ind.years;
  const pool = poolFor(sel, scope);
  const stats = ys.map((y) => boxStats(pool.map((r) => val(ind, item, y, r.c))));
  // 연도별 최댓값·최솟값 지역명
  const ext = ys.map((y) => {
    let mx = null, mn = null;
    for (const r of pool) { const v = val(ind, item, y, r.c); if (v == null) continue; if (!mx || v > mx.v) mx = { r, v }; if (!mn || v < mn.v) mn = { r, v }; }
    return { mx, mn };
  });
  const mine = ys.map((y) => val(ind, item, y, sel.c));
  const allv = stats.flatMap((s) => (s ? [s.min, s.max] : [])).concat(mine.filter((v) => v != null));
  if (!allv.length) return <div className="empty">표시할 자료가 없습니다</div>;
  const lo = Math.floor(Math.min(...allv) - 1), hi = Math.ceil(Math.max(...allv) + 1);
  const x = (i) => L + ((W - L - R) * (i + 0.5)) / ys.length;
  const y = (v) => T + (H - T - B) * (1 - (v - lo) / (hi - lo));
  const bw = Math.min(18, ((W - L - R) / ys.length) * 0.6);

  const onMove = (ev) => {
    const i = Math.max(0, Math.min(ys.length - 1, Math.floor(((clientXY(ev).x - svgRef.current.getBoundingClientRect().left) /
      svgRef.current.getBoundingClientRect().width * W - L) / ((W - L - R) / ys.length))));
    const s = stats[i];
    const { x: px, y: py } = clientXY(ev);
    setTip({ x: px, y: py, title: `${ys[i]}년 (n=${s?.n ?? 0})`,
      rows: s ? [[`최대 · ${ext[i].mx ? label(ext[i].mx.r) : ""}`, fmt(s.max)], ["3사분위", fmt(s.q3)], ["중앙값", fmt(s.med)], ["1사분위", fmt(s.q1)], [`최소 · ${ext[i].mn ? label(ext[i].mn.r) : ""}`, fmt(s.min)],
                 [label(sel), fmt(mine[i])]] : [["자료", "없음"]] });
  };

  return (
    <>
      <div className="legend">
        <span><i className="sw" style={{ background: "var(--band-solid)", height: 10 }} />집단 1–3사분위(상자)·최소–최대(수염)</span>
        <span><i className="sw dot" style={{ background: "var(--series-1)" }} />{label(sel)}</span>
      </div>
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="연도별 격차 상자그림">
        <Gridlines lo={lo} hi={hi} y={y} W={W} L={L} R={R} />
        <XAxis years={ys} x={(i) => x(i)} H={H} />
        {stats.map((s, i) => s && (
          <g key={ys[i]}>
            <line x1={x(i)} x2={x(i)} y1={y(s.max)} y2={y(s.q3)} className="whisker" />
            <line x1={x(i)} x2={x(i)} y1={y(s.q1)} y2={y(s.min)} className="whisker" />
            <rect x={x(i) - bw / 2} y={y(s.q3)} width={bw} height={Math.max(1, y(s.q1) - y(s.q3))} className="box" rx="2" />
            <line x1={x(i) - bw / 2} x2={x(i) + bw / 2} y1={y(s.med)} y2={y(s.med)} className="medline" />
          </g>
        ))}
        {mine.map((v, i) => v != null && (
          <circle key={ys[i]} cx={x(i)} cy={y(v)} r={ys[i] === year ? 5 : 3.2}
            style={{ fill: "var(--series-1)", stroke: "var(--surface-1)" }} strokeWidth="1.5" />
        ))}
        <rect x={L} y={T} width={W - L - R} height={H - T - B} fill="transparent"
          onMouseMove={onMove} onTouchMove={onMove} onMouseLeave={() => setTip(null)} onTouchEnd={() => setTip(null)} />
      </svg>
      {(() => { const i = ys.indexOf(year); const e = ext[i]; const s = stats[i];
        return e && s ? <div className="desc" style={{ marginTop: 4 }}>{year}년 최댓값 <b>{label(e.mx.r)} {fmt(e.mx.v)}</b> · 최솟값 <b>{label(e.mn.r)} {fmt(e.mn.v)}</b> · 격차 {fmt(e.mx.v - e.mn.v)}{ind.unit === "%" ? "%p" : " " + ind.unit} (n={s.n})</div> : null; })()}
    </>
  );
}
