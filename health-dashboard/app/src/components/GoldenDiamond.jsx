import { useMemo, useState } from "react";
import { INDICATORS, fmt, val, label, RBY, nationalMedian } from "../data";
import ExportButtons from "./ExportButtons";

/* 황금다이아몬드(보건사업 우선순위): 시간축(기준연도 대비 개선/유지/악화) × 공간축(비교지역 대비 좋음/비슷/나쁨) 3×3 → 1~5순위
   CIAT 분석도구와 같은 구조. 방향은 지표 확정표(높을수록 좋음/나쁨)를 자동 적용. 방향 없는 맥락 지표는 제외 */
const PRI = { "악화|나쁨": 1, "악화|비슷": 2, "유지|나쁨": 2, "악화|좋음": 3, "유지|비슷": 3, "개선|나쁨": 3, "유지|좋음": 4, "개선|비슷": 4, "개선|좋음": 5 };
const PRI_LABEL = { 1: "1순위 — 악화 중이고 비교지역보다 나쁨", 2: "2순위 — 악화 또는 비교지역보다 나쁨", 3: "3순위 — 혼재", 4: "4순위 — 개선 또는 비교지역보다 좋음", 5: "5순위 — 개선 중이고 비교지역보다 좋음" };
const TIME = ["악화", "유지", "개선"], SPACE = ["나쁨", "비슷", "좋음"];

export default function GoldenDiamond({ item, sel }) {
  const isSgg = sel.l === "sgg";
  const years = INDICATORS.find((i) => i.id === "DT_H_SM")?.years || [];
  const latest = years[years.length - 1];
  // 당해연도·기준연도 모두 여러 해 선택 가능(선택한 해의 평균으로 비교). 기본: 최신 1개년 vs 그 이전 2개년(2020·2021 제외)
  const [curYears, setCurYears] = useState([latest]);
  const [baseYears, setBaseYears] = useState(() => years.filter((y) => y < latest && y !== 2020 && y !== 2021).slice(-2));
  const [ref, setRef] = useState(isSgg ? "sido" : "nation");
  const [tol, setTol] = useState(5);                // 판정 여유(상대 %)
  const toggle = (list, setList, other, setOther) => (y) => {
    if (list.includes(y)) { if (list.length > 1) setList(list.filter((x) => x !== y)); return; }
    setList([...list, y].sort()); if (other.includes(y)) setOther(other.filter((x) => x !== y));
  };
  const toggleCur = toggle(curYears, setCurYears, baseYears, setBaseYears), toggleBase = toggle(baseYears, setBaseYears, curYears, setCurYears);
  const preset = (nCur, nBase, covid) => () => {
    const ys = years.filter((y) => !(covid && (y === 2020 || y === 2021)));
    const c = ys.slice(-nCur); const b = ys.filter((y) => y < c[0]).slice(-nBase);
    setCurYears(c); setBaseYears(b);
  };
  const yl = (a) => (a.length ? (a.length > 3 ? `${a[0]}–${a[a.length - 1]}(${a.length}개년)` : a.join("·")) : "없음");
  const curLabel = yl(curYears), baseLabel = yl(baseYears);
  const mean = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);
  const refName = ref === "sido" ? `${RBY.get(sel.p)?.n || ""} 전체` : "전국 시군구 중앙값";

  const rows = useMemo(() => INDICATORS.filter((i) => i.bad != null && !i.dep).map((ind) => {
    const v = mean(curYears.map((y) => val(ind, item, y, sel.c)).filter((x) => x != null));
    if (v == null) return null;
    const base = mean(baseYears.map((y) => val(ind, item, y, sel.c)).filter((x) => x != null));
    const refV = mean(curYears.map((y) => (ref === "sido" && isSgg ? val(ind, item, y, sel.p) : nationalMedian(ind, item, y))).filter((x) => x != null));
    if (base == null || refV == null) return null;
    const rel = (a, b) => (b === 0 ? 0 : ((a - b) / Math.abs(b)) * 100);
    const dT = rel(v, base), dS = rel(v, refV);
    const good = (d) => (ind.bad ? d < -tol : d > tol), badd = (d) => (ind.bad ? d > tol : d < -tol);
    const t = good(dT) ? "개선" : badd(dT) ? "악화" : "유지";
    const s = good(dS) ? "좋음" : badd(dS) ? "나쁨" : "비슷";
    return { ind, v, base, refV, dT, dS, t, s, pri: PRI[`${t}|${s}`] };
  }).filter(Boolean), [item, sel, curYears, baseYears, ref, tol]);

  const cell = (t, s) => rows.filter((r) => r.t === t && r.s === s);
  const W = 560, H = 430, L = 64, T = 34, cw = (W - L - 8) / 3, ch = (H - T - 8) / 3;
  const fillOf = (p) => ({ 1: "#f8b4a8", 2: "#fcd9c4", 3: "#f3f4f6", 4: "#cfe3fb", 5: "#a9ccf6" })[p];
  return (
    <div className="card span2 gd">
      <h3>황금다이아몬드 — 보건사업 우선순위 <small className="muted">(시간축 × 공간축)</small></h3>
      <ExportButtons name={`${label(sel)}_황금다이아몬드_${curLabel}`} kinds={["svg", "png", "list"]} />
      <div className="desc">
        당해연도({curLabel}) 평균값을 기준연도({baseLabel}) 평균과 비교해 개선·유지·악화, {refName} 대비 좋음·비슷·나쁨으로 나눕니다(판정 여유 ±{tol}%, 지표 방향 자동 적용). 연도는 여러 해를 골라 평균으로 볼 수 있습니다(단년도 값의 표본오차를 줄일 때 유용).
        1순위(악화 + 나쁨)가 사업 우선 검토 대상입니다. 통합건강증진사업 계획서의 CIAT 황금다이아몬드와 같은 구조입니다.
      </div>
      <div className="ctrls" style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "8px 0", alignItems: "center" }}>
        <label className="subchip">비교 <select value={ref} onChange={(e) => setRef(e.target.value)}>{isSgg && <option value="sido">소속 시도</option>}<option value="nation">전국 중앙값</option></select></label>
        <label className="subchip">여유 <select value={tol} onChange={(e) => setTol(+e.target.value)}>{[0, 3, 5, 10].map((n) => <option key={n} value={n}>±{n}%</option>)}</select></label>
        <span className="muted" style={{ fontSize: 13 }}>빠른 선택:</span>
        <button className="themebtn" onClick={preset(1, 2, true)}>최신 1년 vs 이전 2년</button>
        <button className="themebtn" onClick={preset(3, 3, true)}>최근 3년 vs 이전 3년</button>
        <button className="themebtn" onClick={preset(1, 1, false)}>전년 대비</button>
      </div>
      <div className="gd-years">
        <div className="gd-yrow"><span className="gd-ylab">당해연도 <small className="muted">({curYears.length}개년 평균)</small></span>
          {years.map((y) => <button key={y} className={`ychip ${curYears.includes(y) ? "on cur" : ""}`} onClick={() => toggleCur(y)}>{y}</button>)}</div>
        <div className="gd-yrow"><span className="gd-ylab">기준연도 <small className="muted">({baseYears.length}개년 평균)</small></span>
          {years.map((y) => <button key={y} className={`ychip ${baseYears.includes(y) ? "on base" : ""}`} onClick={() => toggleBase(y)}>{y}</button>)}</div>
      </div>
      <div className="hle-row">
        <svg className="chart" viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxWidth: 620 }} data-title={`${label(sel)} 황금다이아몬드 ${curLabel}`}>
          <text x={L + (W - L) / 2} y={14} fontSize="11" textAnchor="middle" fill="#6b7280">공간축: {refName} 대비 →</text>
          <text x={12} y={T + (H - T) / 2} fontSize="11" textAnchor="middle" fill="#6b7280" transform={`rotate(-90 12 ${T + (H - T) / 2})`}>시간축: {curLabel} vs {baseLabel} ↑</text>
          {TIME.slice().reverse().map((t, ti) => SPACE.map((s, si) => {
            const items = cell(t, s); const p = PRI[`${t}|${s}`];
            const x0 = L + si * cw, y0 = T + ti * ch;
            return (
              <g key={t + s}>
                <rect x={x0} y={y0} width={cw - 4} height={ch - 4} rx="6" fill={fillOf(p)} stroke="#d1d5db" />
                <text x={x0 + 8} y={y0 + 14} fontSize="10.5" fontWeight="700" fill="#374151">{t}·{s} · {p}순위 ({items.length})</text>
                {items.slice(0, 8).map((r, k) => <text key={r.ind.id} x={x0 + 8} y={y0 + 30 + k * 12.5} fontSize="9.5" fill="#111827">{r.ind.name.length > 16 ? r.ind.name.slice(0, 16) + "…" : r.ind.name}</text>)}
                {items.length > 8 && <text x={x0 + 8} y={y0 + 30 + 8 * 12.5} fontSize="9.5" fill="#6b7280">외 {items.length - 8}개</text>}
              </g>
            );
          }))}
          {TIME.slice().reverse().map((t, ti) => <text key={t} x={L - 6} y={T + ti * ch + ch / 2} fontSize="10.5" textAnchor="end" fill="#374151">{t}</text>)}
          {SPACE.map((s, si) => <text key={s} x={L + si * cw + cw / 2} y={H - 0} fontSize="10.5" textAnchor="middle" fill="#374151">{s}</text>)}
        </svg>
        <div style={{ flex: "1 1 260px", minWidth: 0 }}>
          <div className="tblscroll">
            <table className="yeartbl">
              <thead><tr><th>순위</th><th>지표</th><th>{curLabel}</th><th>기준 {baseLabel}</th><th>{refName}</th><th>시간</th><th>공간</th></tr></thead>
              <tbody>
                {[...rows].sort((a, b) => a.pri - b.pri || Math.abs(b.dS) - Math.abs(a.dS)).slice(0, 15).map((r) => (
                  <tr key={r.ind.id}><td style={{ fontWeight: 700 }}>{r.pri}</td><td>{r.ind.name}</td><td>{fmt(r.v)}</td><td>{fmt(r.base)}</td><td>{fmt(r.refV)}</td><td>{r.t} ({r.dT > 0 ? "+" : ""}{fmt(r.dT, 0)}%)</td><td>{r.s} ({r.dS > 0 ? "+" : ""}{fmt(r.dS, 0)}%)</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="desc" style={{ marginTop: 4 }}>{Object.entries(PRI_LABEL).map(([k, v]) => <div key={k}>{v}</div>)}</div>
        </div>
      </div>
    </div>
  );
}
