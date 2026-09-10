import { useMemo, useRef, useState } from "react";
import { INDICATORS, DOMAINS_ALL as DOMAINS, SIDOS, SGG_BY_SIDO, SGG_ALL, RBY, fmt, val, nationalMedian, ranked, percentile, latestYear, label, betterCmp } from "../data";
import { pathOf, nearestIndex, clientXY, Gridlines, XAxis } from "./svgUtil";
import ExportButtons from "./ExportButtons";

export const NAT = "NAT";                       // 전국(전 시군구 중앙값) 가상 지역
export const MAX_CMP = 6;
const COLORS = [1, 2, 3, 4, 5, 6].map((n) => `var(--cat-${n})`);

export const cmpLabel = (code) => (code === NAT ? "전국 중앙값" : label(RBY.get(code)));
const valueOf = (ind, item, year, code) => (code === NAT ? nationalMedian(ind, item, year) : val(ind, item, year, code));

/* 비교 대상 관리 칩 + 추가 컨트롤 */
function CompareBar({ codes, onChange }) {
  const [sido, setSido] = useState("001");
  const [sgg, setSgg] = useState("");
  const add = (c) => { if (c && !codes.includes(c) && codes.length < MAX_CMP) onChange([...codes, c]); };
  return (
    <div className="cmpbar">
      <div className="chips">
        {codes.map((c, i) => (
          <span key={c} className="cmpchip" style={{ borderColor: COLORS[i] }}>
            <i style={{ background: COLORS[i] }} />{cmpLabel(c)}
            <button aria-label="제거" onClick={() => onChange(codes.filter((x) => x !== c))}>×</button>
          </span>
        ))}
        {!codes.length && <span className="muted">비교할 지역을 추가하세요</span>}
      </div>
      <div className="cmpadd">
        <select value={sido} onChange={(e) => { setSido(e.target.value); setSgg(""); }}>
          {SIDOS.map((s) => <option key={s.c} value={s.c}>{s.n}</option>)}
        </select>
        <select value={sgg} onChange={(e) => setSgg(e.target.value)}>
          <option value="">시도 전체</option>
          {(SGG_BY_SIDO[sido] || []).map((r) => <option key={r.c} value={r.c}>{r.n}</option>)}
        </select>
        <button className="themebtn" onClick={() => add(sgg || sido)} disabled={codes.length >= MAX_CMP}>+ 추가</button>
        <button className="themebtn" onClick={() => add(NAT)} disabled={codes.includes(NAT) || codes.length >= MAX_CMP}>+ 전국 중앙값</button>
        <small className="muted">최대 {MAX_CMP}개</small>
      </div>
    </div>
  );
}

/* 여러 지역 추이 겹쳐 보기 */
function MultiTrend({ ind, item, year, codes, setTip }) {
  const svgRef = useRef(null);
  const W = 560, H = 280, L = 40, R = 16, T = 14, B = 28;
  const ys = ind.years;
  const seriesAll = codes.map((c) => ys.map((y) => valueOf(ind, item, y, c)));
  const all = seriesAll.flat().filter((v) => v != null);
  if (!all.length) return <div className="empty">표시할 자료가 없습니다</div>;
  const lo = Math.floor(Math.min(...all) - 1), hi = Math.ceil(Math.max(...all) + 1);
  const x = (i) => L + ((W - L - R) * i) / Math.max(1, ys.length - 1);
  const y = (v) => T + (H - T - B) * (1 - (v - lo) / (hi - lo));
  const yi = ys.indexOf(year);
  const onMove = (ev) => {
    const i = nearestIndex(ev, svgRef.current, W, L, R, ys.length);
    const { x: px, y: py } = clientXY(ev);
    setTip({ x: px, y: py, title: `${ys[i]}년`, rows: codes.map((c, k) => [cmpLabel(c), fmt(seriesAll[k][i]) + ind.unit]) });
  };
  return (
    <>
      <div className="legend">
        {codes.map((c, k) => <span key={c}><i className="sw" style={{ background: COLORS[k] }} />{cmpLabel(c)}</span>)}
      </div>
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="지역 비교 추이">
        <Gridlines lo={lo} hi={hi} y={y} W={W} L={L} R={R} />
        <XAxis years={ys} x={x} H={H} />
        <line x1={x(yi)} x2={x(yi)} y1={T} y2={H - B} style={{ stroke: "var(--baseline)" }} strokeDasharray="3 3" />
        {seriesAll.map((s, k) => (
          <g key={codes[k]}>
            <path d={pathOf(s, x, y)} fill="none" style={{ stroke: COLORS[k] }} strokeWidth={codes[k] === NAT ? 1.8 : 2.2}
              strokeDasharray={codes[k] === NAT ? "5 3" : undefined} strokeLinejoin="round" />
            {s[yi] != null && <circle cx={x(yi)} cy={y(s[yi])} r="4" style={{ fill: COLORS[k], stroke: "var(--surface-1)" }} strokeWidth="1.5" />}
          </g>
        ))}
        <rect x={L} y={T} width={W - L - R} height={H - T - B} fill="transparent"
          onMouseMove={onMove} onTouchMove={onMove} onMouseLeave={() => setTip(null)} onTouchEnd={() => setTip(null)} />
      </svg>
    </>
  );
}

/* 선택 연도 막대 비교 + 전국 순위 */
function YearBars({ ind, item, year, codes }) {
  const natRank = ranked(ind, item, year, SGG_ALL);
  const sidoRank = ranked(ind, item, year, SIDOS);
  const rows = codes.map((c, k) => {
    const v = valueOf(ind, item, year, c);
    let rank = null, n = null;
    if (c !== NAT) {
      const r = RBY.get(c);
      const pool = r.l === "sido" ? sidoRank : natRank;
      const i = pool.findIndex((x) => x.r.c === c);
      if (i >= 0) { rank = i + 1; n = pool.length; }
    }
    return { c, k, v, rank, n };
  });
  const max = Math.max(...rows.map((r) => r.v ?? 0), 0.1);
  const cmp = betterCmp(ind);
  const best = rows.filter((r) => r.v != null && r.c !== NAT).sort((a, b) => cmp(a.v, b.v))[0];
  return (
    <div className="rank">
      {rows.map((r) => (
        <div key={r.c} className={`rrow cmp ${best && r.c === best.c ? "sel" : ""}`}>
          <div className="rl" title={cmpLabel(r.c)}>{cmpLabel(r.c)}</div>
          <div className="bar-track"><div className="bar" style={{ width: `${((r.v ?? 0) / max * 100).toFixed(1)}%`, background: COLORS[r.k] }} /></div>
          <div className="rv">{fmt(r.v)}</div>
          <div className="rk">{r.rank ? `${r.rank}/${r.n}위` : ""}</div>
        </div>
      ))}
      {best && ind.bad != null && <div className="desc" style={{ marginTop: 8 }}>가장 양호: <b>{cmpLabel(best.c)}</b> ({ind.bad ? "낮을수록" : "높을수록"} 양호)</div>}
    </div>
  );
}

/* 연도별 비교표: 첫 지역 대비 차이 */
function YearCompareTable({ ind, item, year, codes, onYear }) {
  return (
    <div className="tblscroll">
      <table className="yeartbl">
        <thead>
          <tr><th>연도</th>{codes.map((c) => <th key={c}>{cmpLabel(c)}</th>)}{codes.length > 1 && <th>차이 (1번째 − 2번째)</th>}</tr>
        </thead>
        <tbody>
          {ind.years.map((y) => {
            const vs = codes.map((c) => valueOf(ind, item, y, c));
            const d = vs.length > 1 && vs[0] != null && vs[1] != null ? vs[0] - vs[1] : null;
            return (
              <tr key={y} className={y === year ? "sel" : ""} onClick={() => onYear(y)}>
                <td>{y}</td>
                {vs.map((v, i) => <td key={i}>{fmt(v)}</td>)}
                {codes.length > 1 && <td className={d == null || ind.bad == null ? "" : (d < 0) === ind.bad ? "k-good" : "k-bad"}>{d == null ? "–" : (d > 0 ? "+" : "") + fmt(d)}</td>}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* 전 지표 × 지역 비교표: 값 + 전국 백분위, 가장 양호한 지역 강조 */
function AllIndicatorTable({ item, year, codes, onPick }) {
  const rows = useMemo(() => INDICATORS.map((ind) => {
    const y = ind.years.includes(year) ? year : ind.years[ind.years.length - 1];
    const pool = ranked(ind, item, y, SGG_ALL).map((x) => x.v);
    const cells = codes.map((c) => {
      const v = valueOf(ind, item, y, c);
      const pct = c === NAT || ind.bad == null ? null : percentile(ind, v, pool);
      return { v, pct };
    });
    const cmp = betterCmp(ind);
    const cands = cells.map((x, i) => ({ i, v: x.v })).filter((x) => x.v != null && codes[x.i] !== NAT);
    const bestI = ind.bad == null || cands.length < 2 ? -1 : cands.sort((a, b) => cmp(a.v, b.v))[0].i;
    return { ind, y, cells, bestI };
  }), [item, year, codes]);
  const wins = codes.map((_, i) => rows.filter((r) => r.bestI === i).length);
  return (
    <>
      {codes.length > 1 && (
        <div className="wins">
          {codes.map((c, i) => c !== NAT && (
            <span key={c} className="subchip"><i className="dotc" style={{ background: COLORS[i] }} />{cmpLabel(c)} <b>{wins[i]}개 지표 우세</b></span>
          ))}
        </div>
      )}
      <div className="tblscroll">
        <table className="cmptbl">
          <thead><tr><th>영역</th><th>지표</th><th>연도</th>{codes.map((c) => <th key={c}>{cmpLabel(c)}</th>)}</tr></thead>
          <tbody>
            {DOMAINS.map((d) => rows.filter((r) => r.ind.domain === d).map((r, k) => (
              <tr key={r.ind.id} onClick={() => onPick(r.ind, r.y)}>
                <td className="muted">{k === 0 ? d : ""}</td>
                <td className="tl">{r.ind.name} <small className="muted">{r.ind.bad == null ? "" : r.ind.bad ? "↓" : "↑"}</small></td>
                <td className="muted">{r.y}</td>
                {r.cells.map((cell, i) => (
                  <td key={i} className={i === r.bestI ? "best" : ""}>
                    <div className="cmpcell">
                      <b>{fmt(cell.v)}</b>
                      {cell.pct != null && <span className="pctmini"><i style={{ width: `${cell.pct}%`, background: COLORS[i] }} /><small>{Math.round(cell.pct)}</small></span>}
                    </div>
                  </td>
                ))}
              </tr>
            )))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default function Compare({ ind, item, year, codes, onCodes, onYear, onPick, setTip }) {
  return (
    <div className="compare">
      <div className="card">
        <h3>비교 대상</h3>
        <div className="desc">전국 중앙값 · 시도 · 시군구를 자유롭게 섞어 비교합니다 (예: 전국 vs 서울 vs 마포구 vs 송파구)</div>
        <CompareBar codes={codes} onChange={onCodes} />
      </div>
      {codes.length > 0 && (
        <>
          <div className="grid2">
            <div className="card">
              <h3>{ind.name} 추이 비교</h3>
              <ExportButtons name={`${ind.name}_추이비교`} />
              <div className="desc">{ind.years[0]}–{ind.years[ind.years.length - 1]} · {ind.bad == null ? "중립 지표" : ind.bad ? "낮을수록 양호" : "높을수록 양호"}</div>
              <MultiTrend ind={ind} item={item} year={year} codes={codes} setTip={setTip} />
            </div>
            <div className="card">
              <h3>{year}년 {ind.name}</h3>
              <ExportButtons name={`${year}_${ind.name}_비교`} kinds={["list"]} />
              <div className="desc">막대 비교 · 시군구는 전국 시군구 순위, 시도는 17개 시도 순위</div>
              <YearBars ind={ind} item={item} year={year} codes={codes} />
            </div>
          </div>
          <div className="card">
            <h3>연도별 비교표</h3>
            <ExportButtons name={`${ind.name}_연도별비교`} kinds={["csv"]} />
            <div className="desc">행을 누르면 연도 이동 · 차이는 첫 번째 지역에서 두 번째 지역을 뺀 값</div>
            <YearCompareTable ind={ind} item={item} year={year} codes={codes} onYear={onYear} />
          </div>
          <div className="card">
            <h3>전 지표 비교 ({INDICATORS.length}개)</h3>
            <ExportButtons name={`${year}_전지표비교`} kinds={["csv"]} />
            <div className="desc">{year}년 기준(해당 연도 없으면 최신) · 값 아래 막대는 전국 시군구 백분위(높을수록 양호) · 색 강조는 비교 지역 중 가장 양호 · 행을 누르면 그 지표로 이동</div>
            <AllIndicatorTable item={item} year={year} codes={codes} onPick={onPick} />
          </div>
        </>
      )}
    </div>
  );
}
