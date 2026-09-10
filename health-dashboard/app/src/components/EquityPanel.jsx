import { useRef } from "react";
import { DEP, depOf, depQuintiles, boxStats, fmt, val, label, poolFor, SGG_ALL } from "../data";
import { clientXY } from "./svgUtil";

const QN = { 1: "1분위(가장 덜 박탈)", 2: "2분위", 3: "3분위", 4: "4분위", 5: "5분위(가장 박탈)" };

/* 건강형평성: 지역박탈지수 5분위별 지표 분포(상자그림) + 선택 지역 위치 */
export default function EquityPanel({ ind, item, year, sel, setTip }) {
  const svgRef = useRef(null);
  if (!DEP.year) return <div className="empty">지역박탈지수 자료가 없습니다</div>;
  const pool = SGG_ALL;                               // 분위는 전국 시군구 기준
  const groups = depQuintiles(pool);
  const stats = [1, 2, 3, 4, 5].map((q) => boxStats(groups[q].map((r) => val(ind, item, year, r.c))));
  const me = depOf(sel.c); const mine = val(ind, item, year, sel.c);
  const allv = stats.flatMap((s) => (s ? [s.min, s.max] : [])).concat(mine != null ? [mine] : []);
  if (!allv.length) return <div className="empty">표시할 자료가 없습니다</div>;
  const W = 560, H = 240, L = 40, R = 16, T = 14, B = 40;
  const lo = Math.floor(Math.min(...allv) - 1), hi = Math.ceil(Math.max(...allv) + 1);
  const x = (i) => L + ((W - L - R) * (i + 0.5)) / 5;
  const y = (v) => T + (H - T - B) * (1 - (v - lo) / (hi - lo));
  const bw = 40;
  const meds = stats.map((s) => s?.med);
  const gap = meds[4] != null && meds[0] != null ? meds[4] - meds[0] : null;
  const onMove = (i) => (ev) => {
    const s = stats[i]; const { x: px, y: py } = clientXY(ev);
    setTip({ x: px, y: py, title: `${QN[i + 1]} (n=${s?.n ?? 0})`, rows: s ? [["최대", fmt(s.max)], ["3사분위", fmt(s.q3)], ["중앙값", fmt(s.med)], ["1사분위", fmt(s.q1)], ["최소", fmt(s.min)]] : [["자료", "없음"]] });
  };
  return (
    <>
      <div className="legend">
        <span><i className="sw" style={{ background: "var(--band-solid)", height: 10 }} />분위별 1–3사분위(상자)·최소–최대(수염)·중앙값(선)</span>
        {mine != null && me?.q && <span><i className="sw dot" style={{ background: "var(--series-1)" }} />{label(sel)} ({me.q}분위, 지수 {fmt(me.idx)})</span>}
      </div>
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="박탈 5분위별 분포">
        {[lo, (lo + hi) / 2, hi].map((v) => (
          <g key={v}><line x1={L} x2={W - R} y1={y(v)} y2={y(v)} style={{ stroke: "var(--grid)" }} /><text x={L - 6} y={y(v) + 4} textAnchor="end" className="tick">{fmt(v, 0)}</text></g>
        ))}
        {stats.map((s, i) => s && (
          <g key={i} onMouseMove={onMove(i)} onMouseLeave={() => setTip(null)}>
            <line x1={x(i)} x2={x(i)} y1={y(s.max)} y2={y(s.q3)} style={{ stroke: "var(--muted)" }} />
            <line x1={x(i)} x2={x(i)} y1={y(s.q1)} y2={y(s.min)} style={{ stroke: "var(--muted)" }} />
            <rect x={x(i) - bw / 2} y={y(s.q3)} width={bw} height={Math.max(1, y(s.q1) - y(s.q3))} rx="3" style={{ fill: "var(--band-solid)", stroke: "var(--muted)" }} />
            <line x1={x(i) - bw / 2} x2={x(i) + bw / 2} y1={y(s.med)} y2={y(s.med)} style={{ stroke: "var(--text-primary)", strokeWidth: 2 }} />
            {me?.q === i + 1 && mine != null && <circle cx={x(i)} cy={y(mine)} r="5" style={{ fill: "var(--series-1)", stroke: "#fff", strokeWidth: 1.5 }} />}
            <text x={x(i)} y={H - B + 16} textAnchor="middle" className="tick">{i + 1}분위</text>
            <text x={x(i)} y={H - B + 30} textAnchor="middle" className="tick" style={{ fill: "var(--muted)" }}>{i === 0 ? "덜 박탈" : i === 4 ? "박탈 큼" : ""}</text>
          </g>
        ))}
      </svg>
      <div className="desc" style={{ marginTop: 6 }}>
        5분위−1분위 중앙값 차이 <b>{gap == null ? "–" : `${gap > 0 ? "+" : ""}${fmt(gap)}${ind.unit === "%" ? "%p" : " " + ind.unit}`}</b>
        {ind.bad != null && gap != null && <> → 박탈이 큰 지역일수록 {(ind.bad ? gap > 0 : gap < 0) ? "나쁨" : "좋음"}</>}
        . 지역박탈지수는 {DEP.year}년 인구주택총조사 집계표로 근사 산출(공식값 아님).
      </div>
    </>
  );
}
