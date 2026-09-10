import { useMemo, useState, useEffect, useRef } from "react";
import { INDICATORS, IND_BY_DOMAIN, DOMAINS_ALL, SIDOS, SGG_ALL, SGG_BY_SIDO, fmt, val, label, RBY } from "../data";
import ExportButtons from "./ExportButtons";
import { clientXY } from "./svgUtil";

/* 연관지표 탐색: 두 지표의 산점도 + 피어슨·스피어만·켄달 상관(유의성), 연도 애니메이션 — CIAT 심층분석 1 대응 */
function pearson(xs, ys) { const n = xs.length; if (n < 3) return null; const mx = xs.reduce((a, b) => a + b, 0) / n, my = ys.reduce((a, b) => a + b, 0) / n; let sxy = 0, sxx = 0, syy = 0; for (let i = 0; i < n; i++) { sxy += (xs[i] - mx) * (ys[i] - my); sxx += (xs[i] - mx) ** 2; syy += (ys[i] - my) ** 2; } return sxx && syy ? sxy / Math.sqrt(sxx * syy) : null; }
function ranks(a) { const idx = a.map((v, i) => [v, i]).sort((p, q) => p[0] - q[0]); const r = new Array(a.length); let i = 0; while (i < idx.length) { let j = i; while (j + 1 < idx.length && idx[j + 1][0] === idx[i][0]) j++; const avg = (i + j) / 2 + 1; for (let k = i; k <= j; k++) r[idx[k][1]] = avg; i = j + 1; } return r; }
function kendall(xs, ys) { const n = xs.length; if (n < 3) return null; let c = 0, d = 0, tx = 0, ty = 0; for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) { const a = Math.sign(xs[i] - xs[j]), b = Math.sign(ys[i] - ys[j]); if (a === 0 && b === 0) continue; if (a === 0) tx++; else if (b === 0) ty++; else if (a === b) c++; else d++; } const den = Math.sqrt((c + d + tx) * (c + d + ty)); return den ? (c - d) / den : null; }
// 정규분포 양측 p (근사)
function pnorm2(z) { const t = 1 / (1 + 0.2316419 * Math.abs(z)); const dnorm = Math.exp(-z * z / 2) / Math.sqrt(2 * Math.PI); const p = dnorm * (0.31938153 * t - 0.356563782 * t ** 2 + 1.781477937 * t ** 3 - 1.821255978 * t ** 4 + 1.330274429 * t ** 5); return 2 * p; }
function pPearson(r, n) { if (r == null || n < 4 || Math.abs(r) >= 1) return r == null ? null : 0; const t = r * Math.sqrt((n - 2) / (1 - r * r)); return pnorm2(t * (1 - 1 / (4 * (n - 2)))); }   // t → 정규 근사(대표본)
function pKendall(tau, n) { if (tau == null || n < 4) return null; const z = 3 * tau * Math.sqrt(n * (n - 1)) / Math.sqrt(2 * (2 * n + 5)); return pnorm2(z); }

const Sel = ({ value, onChange }) => (
  <select value={value} onChange={(e) => onChange(e.target.value)} style={{ maxWidth: 260 }}>
    {DOMAINS_ALL.map((d) => <optgroup key={d} label={d}>{(IND_BY_DOMAIN[d] || []).map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}</optgroup>)}
  </select>
);

export default function CorrelationView({ setTip }) {
  const [xId, setXId] = useState("DT_H_SM");
  const [yId, setYId] = useState("HLE_HLE");
  const [level, setLevel] = useState("sgg");
  const [sidoF, setSidoF] = useState("all");
  const [item, setItem] = useState("std");
  const xi = INDICATORS.find((i) => i.id === xId), yi = INDICATORS.find((i) => i.id === yId);
  const years = useMemo(() => xi.years.filter((y) => yi.years.includes(y)), [xi, yi]);
  const [year, setYear] = useState(years[years.length - 1]);
  useEffect(() => { if (!years.includes(year)) setYear(years[years.length - 1]); }, [years]);
  const [play, setPlay] = useState(false);
  useEffect(() => { if (!play) return; const t = setInterval(() => setYear((y) => { const i = years.indexOf(y); return years[(i + 1) % years.length]; }), 900); return () => clearInterval(t); }, [play, years]);
  const pool = level === "sido" ? SIDOS : sidoF === "all" ? SGG_ALL : SGG_BY_SIDO[sidoF];
  const pts = useMemo(() => pool.map((r) => ({ r, x: val(xi, item, year, r.c), y: val(yi, item, year, r.c) })).filter((p) => p.x != null && p.y != null), [pool, xi, yi, item, year]);
  const xs = pts.map((p) => p.x), ys = pts.map((p) => p.y), n = pts.length;
  const rP = pearson(xs, ys), rS = pearson(ranks(xs), ranks(ys)), tK = kendall(xs, ys);
  const pP = pPearson(rP, n), pS = pPearson(rS, n), pK = pKendall(tK, n);
  // 회귀선
  const mx = xs.reduce((a, b) => a + b, 0) / (n || 1), my = ys.reduce((a, b) => a + b, 0) / (n || 1);
  const slope = n > 1 ? xs.reduce((a, x, i) => a + (x - mx) * (ys[i] - my), 0) / (xs.reduce((a, x) => a + (x - mx) ** 2, 0) || 1) : 0;
  // 컨테이너 폭에 맞춰 SVG 크기 결정(글자 크기 고정 → 데스크톱/모바일 모두 읽기 좋게)
  const wrapRef = useRef(null);
  const [cw, setCw] = useState(640);
  useEffect(() => { const el = wrapRef.current; if (!el) return; const ro = new ResizeObserver(() => setCw(el.clientWidth || 640)); ro.observe(el); setCw(el.clientWidth || 640); return () => ro.disconnect(); }, []);
  const W = Math.max(340, cw), H = Math.round(Math.min(480, Math.max(300, W * 0.5))), L = 56, R = 16, T = 16, B = 46;
  const xlo = Math.min(...xs), xhi = Math.max(...xs), ylo = Math.min(...ys), yhi = Math.max(...ys);
  const px = (v) => L + (W - L - R) * ((v - xlo) / ((xhi - xlo) || 1));
  const py = (v) => T + (H - T - B) * (1 - (v - ylo) / ((yhi - ylo) || 1));
  const ticks = (lo, hi) => [0, 0.25, 0.5, 0.75, 1].map((f) => lo + (hi - lo) * f);
  const sig = (p) => (p == null ? "" : p < 0.001 ? "***" : p < 0.01 ? "**" : p < 0.05 ? "*" : "");
  return (
    <div className="corr">
      <div className="card">
        <h3>연관지표 탐색 <small className="muted">두 지표의 관계 · 피어슨 · 스피어만 · 켄달</small></h3>
        <div className="desc">지역 단위(시도 17개 또는 시군구)에서 두 지표가 함께 움직이는지 봅니다. 점 하나가 지역 하나이며, ▶로 연도별 변화를 볼 수 있습니다. 상관은 인과가 아니며, 지역 수준의 관계(생태학적 관계)입니다.</div>
        <div className="ctrls" style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "8px 0" }}>
          <label className="subchip">X <Sel value={xId} onChange={setXId} /></label>
          <label className="subchip">Y <Sel value={yId} onChange={setYId} /></label>
          <label className="subchip">단위 <select value={level} onChange={(e) => setLevel(e.target.value)}><option value="sgg">시군구</option><option value="sido">17개 시도</option></select></label>
          {level === "sgg" && <label className="subchip">범위 <select value={sidoF} onChange={(e) => setSidoF(e.target.value)}><option value="all">전국</option>{SIDOS.map((s) => <option key={s.c} value={s.c}>{s.n}</option>)}</select></label>}
          <label className="subchip">값 <select value={item} onChange={(e) => setItem(e.target.value)}><option value="std">표준화율</option><option value="crude">조율</option></select></label>
          <label className="subchip">연도 <button className="seg-btn" onClick={() => setPlay(!play)}>{play ? "■" : "▶"}</button> <select value={year} onChange={(e) => setYear(+e.target.value)}>{years.map((y) => <option key={y} value={y}>{y}</option>)}</select></label>
        </div>
      </div>
      <div className="grid2">
        <div className="card span2">
          <h3>{year}년 · {xi.name} × {yi.name} <small className="muted">(n={n})</small></h3>
          <ExportButtons name={`${year}_${xi.name}_x_${yi.name}_연관`} kinds={["svg", "png"]} />
          <div className="desc">X: {xi.name}({xi.unit}) · Y: {yi.name}({yi.unit}) · 점선 = 최소제곱 추세선 · 점에 마우스를 올리면 지역명</div>
          <div ref={wrapRef}>
          {n < 3 ? <div className="empty">해당 연도에 두 지표를 모두 가진 지역이 없습니다</div> : (
            <svg className="chart" viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{ maxWidth: "100%" }} data-title={`${year} ${xi.name} × ${yi.name}`}>
              {ticks(ylo, yhi).map((v) => <g key={"y" + v}><line x1={L} x2={W - R} y1={py(v)} y2={py(v)} stroke="var(--border)" /><text x={L - 6} y={py(v) + 4} fontSize="11.5" textAnchor="end" fill="var(--muted)">{fmt(v)}</text></g>)}
              {ticks(xlo, xhi).map((v) => <g key={"x" + v}><line y1={T} y2={H - B} x1={px(v)} x2={px(v)} stroke="var(--border)" strokeOpacity="0.5" /><text x={px(v)} y={H - B + 14} fontSize="11.5" textAnchor="middle" fill="var(--muted)">{fmt(v)}</text></g>)}
              <text x={L + (W - L - R) / 2} y={H - 6} fontSize="12.5" textAnchor="middle" fill="var(--text-secondary)">{xi.name}</text>
              <text x={12} y={T + (H - T - B) / 2} fontSize="12.5" textAnchor="middle" fill="var(--text-secondary)" transform={`rotate(-90 12 ${T + (H - T - B) / 2})`}>{yi.name}</text>
              {n > 2 && <line x1={px(xlo)} y1={py(my + slope * (xlo - mx))} x2={px(xhi)} y2={py(my + slope * (xhi - mx))} stroke="var(--bad-text)" strokeDasharray="5 4" strokeWidth="1.5" />}
              {pts.map((p) => (
                <circle key={p.r.c} cx={px(p.x)} cy={py(p.y)} r={level === "sido" ? 6 : 3.5} fill="var(--series-1)" fillOpacity="0.55" stroke="var(--surface-1)" strokeWidth="0.8"
                  onMouseMove={(ev) => { const { x, y } = clientXY(ev); setTip({ x, y, title: label(p.r), rows: [[xi.name, fmt(p.x) + xi.unit], [yi.name, fmt(p.y) + yi.unit]] }); }}
                  onMouseLeave={() => setTip(null)} />
              ))}
              {level === "sido" && pts.map((p) => <text key={"t" + p.r.c} x={px(p.x) + 7} y={py(p.y) + 4} fontSize="11" fill="var(--text-secondary)">{p.r.n.replace(/특별자치도|특별자치시|광역시|특별시/, "")}</text>)}
            </svg>
          )}
          </div>
        </div>
        <div className="card">
          <h3>연관성 통계</h3>
          <ExportButtons name={`${year}_${xi.name}_x_${yi.name}_상관`} kinds={["csv"]} />
          <div className="tblscroll"><table className="yeartbl">
            <thead><tr><th>방법</th><th>계수</th><th>p(근사)</th><th>판정</th></tr></thead>
            <tbody>
              <tr><td>피어슨 r</td><td>{fmt(rP, 3)}</td><td>{pP == null ? "–" : pP < 0.001 ? "<0.001" : fmt(pP, 3)}</td><td style={{ color: sig(pP) ? "var(--bad-text)" : undefined }}>{sig(pP) || "유의하지 않음"}</td></tr>
              <tr><td>스피어만 ρ</td><td>{fmt(rS, 3)}</td><td>{pS == null ? "–" : pS < 0.001 ? "<0.001" : fmt(pS, 3)}</td><td style={{ color: sig(pS) ? "var(--bad-text)" : undefined }}>{sig(pS) || "유의하지 않음"}</td></tr>
              <tr><td>켄달 τ-b</td><td>{fmt(tK, 3)}</td><td>{pK == null ? "–" : pK < 0.001 ? "<0.001" : fmt(pK, 3)}</td><td style={{ color: sig(pK) ? "var(--bad-text)" : undefined }}>{sig(pK) || "유의하지 않음"}</td></tr>
            </tbody>
          </table></div>
          <div className="desc" style={{ marginTop: 6 }}>* p&lt;0.05, ** p&lt;0.01, *** p&lt;0.001 (정규 근사). |r| 0.1 약함 · 0.3 중간 · 0.5 강함(Cohen). 추세선 기울기 {fmt(slope, 3)}: X가 1 오르면 Y가 {fmt(slope, 2)} 변함.</div>
        </div>
        <div className="card">
          <h3>연도별 상관 추이</h3>
          <div className="tblscroll"><table className="yeartbl">
            <thead><tr><th>연도</th><th>n</th><th>피어슨</th><th>스피어만</th></tr></thead>
            <tbody>
              {years.map((y) => { const q = pool.map((r) => [val(xi, item, y, r.c), val(yi, item, y, r.c)]).filter((v) => v[0] != null && v[1] != null); if (q.length < 3) return null; const a = q.map((v) => v[0]), b = q.map((v) => v[1]); return <tr key={y} className={y === year ? "sel" : ""} onClick={() => setYear(y)}><td>{y}</td><td>{q.length}</td><td>{fmt(pearson(a, b), 3)}</td><td>{fmt(q.length > 2 ? pearson(ranks(a), ranks(b)) : null, 3)}</td></tr>; })}
            </tbody>
          </table></div>
        </div>
      </div>
    </div>
  );
}
