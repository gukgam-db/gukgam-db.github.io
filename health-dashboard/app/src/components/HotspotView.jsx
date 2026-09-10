import { useMemo, useState, useEffect } from "react";
import { neighbors } from "topojson-client";
import { geoMercator, geoPath, geoCentroid } from "d3-geo";
import { INDICATORS, IND_BY_DOMAIN, DOMAINS_ALL, RBY, fmt, val } from "../data";
import { TOPO, OBJ, FC, GEOMAP, SIDO_MESH } from "./ChoroplethMap";
import ExportButtons from "./ExportButtons";
import { clientXY } from "./svgUtil";

/* 핫스팟 분석 — CIAT 심층분석 2 대응
   ① Getis-Ord Gi*: 당해연도 값이 이웃(경계를 맞댄 시군구)과 함께 높은 군집(핫스팟)·낮은 군집(콜드스팟), z값·유의수준 90/95/99%
   ② Mann-Kendall 추세: 연도별 값의 단조 증가/감소 검정(z) + Sen 기울기(연간 변화량 중앙값)
   가중치: 이진 인접(경계 공유, 자기 자신 포함). 섬(이웃 없음)은 중심점 기준 가장 가까운 2개 시군구를 이웃으로 사용. */
const W = 560, H = 560;
const PROJ = geoMercator().fitExtent([[6, 6], [W - 6, H - 6]], FC);
const PATH = geoPath(PROJ);
const D_PATHS = FC.features.map((f) => PATH(f));
const D_MESH = PATH(SIDO_MESH);
const CENT = FC.features.map((f) => geoCentroid(f));
const NB = (() => {
  const nb = neighbors(OBJ.geometries).map((a) => [...a]);
  nb.forEach((a, i) => {
    if (a.length) return;
    const d = CENT.map((c, j) => [j === i ? Infinity : (c[0] - CENT[i][0]) ** 2 + (c[1] - CENT[i][1]) ** 2, j]).sort((p, q) => p[0] - q[0]);
    a.push(d[0][1], d[1][1]);
  });
  return nb;
})();
const ISLAND = new Set(neighbors(OBJ.geometries).map((a, i) => (a.length ? -1 : i)).filter((i) => i >= 0));

const resolve = (f, ind, item, year) => {
  for (const c of GEOMAP[f.properties.code] || []) { const v = val(ind, item, year, c); if (v != null) return { code: c, v }; }
  return { code: (GEOMAP[f.properties.code] || [])[0], v: null };
};
const regName = (code, f) => { const r = RBY.get(code); if (!r) return f.properties.name; const p = r.l === "sub" ? RBY.get(r.p) : null; return p ? `${p.s} ${p.n} · ${r.n}` : `${r.s} ${r.n}`; };

/** Getis-Ord Gi* (이진 인접 + 자기 포함) → 폴리곤별 z */
function gistar(vals) {
  const idx = vals.map((v, i) => (v == null ? -1 : i)).filter((i) => i >= 0);
  const n = idx.length; if (n < 5) return vals.map(() => null);
  const xs = idx.map((i) => vals[i]);
  const mean = xs.reduce((a, b) => a + b, 0) / n;
  const S = Math.sqrt(xs.reduce((a, b) => a + b * b, 0) / n - mean * mean);
  return vals.map((v, i) => {
    if (v == null) return null;
    const js = [i, ...NB[i]].filter((j) => vals[j] != null);
    const Wi = js.length, sum = js.reduce((a, j) => a + vals[j], 0);
    const den = S * Math.sqrt((n * Wi - Wi * Wi) / (n - 1));
    return den ? (sum - mean * Wi) / den : 0;
  });
}
/** Mann-Kendall z + Sen 기울기 (동률 보정 없음, n≥5) */
function mannKendall(series) {
  const pts = series.filter((p) => p[1] != null); const n = pts.length;
  if (n < 5) return null;
  let s = 0; const slopes = [];
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) { const d = pts[j][1] - pts[i][1]; s += Math.sign(d); slopes.push(d / (pts[j][0] - pts[i][0])); }
  const v = n * (n - 1) * (2 * n + 5) / 18;
  const z = s > 0 ? (s - 1) / Math.sqrt(v) : s < 0 ? (s + 1) / Math.sqrt(v) : 0;
  slopes.sort((a, b) => a - b);
  const sen = slopes.length % 2 ? slopes[(slopes.length - 1) / 2] : (slopes[slopes.length / 2 - 1] + slopes[slopes.length / 2]) / 2;
  return { z, sen, n, first: pts[0][1], last: pts[n - 1][1], y0: pts[0][0], y1: pts[n - 1][0] };
}
const zClass = (z) => (z == null ? "na" : z >= 2.58 ? "h3" : z >= 1.96 ? "h2" : z >= 1.65 ? "h1" : z <= -2.58 ? "c3" : z <= -1.96 ? "c2" : z <= -1.65 ? "c1" : "ns");
const CLS_COLOR = { h3: "var(--seqr-700)", h2: "var(--seqr-500)", h1: "var(--seqr-300)", c3: "var(--seq-700)", c2: "var(--seq-500)", c1: "var(--seq-300)", ns: "var(--grid)", na: "var(--page)" };
const CLS_LABEL = { h3: "핫스팟 99%", h2: "핫스팟 95%", h1: "핫스팟 90%", c3: "콜드스팟 99%", c2: "콜드스팟 95%", c1: "콜드스팟 90%", ns: "유의하지 않음", na: "자료 없음" };
const MK_LABEL = { h3: "증가 99%", h2: "증가 95%", h1: "증가 90%", c3: "감소 99%", c2: "감소 95%", c1: "감소 90%", ns: "뚜렷한 추세 없음", na: "자료 부족(5개년 미만)" };

const Sel = ({ value, onChange }) => (
  <select value={value} onChange={(e) => onChange(e.target.value)} style={{ maxWidth: 280 }}>
    {DOMAINS_ALL.map((d) => <optgroup key={d} label={d}>{(IND_BY_DOMAIN[d] || []).map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}</optgroup>)}
  </select>
);

export default function HotspotView({ setTip, onPick }) {
  const [id, setId] = useState("DT_H_SM");
  const [item, setItem] = useState("std");
  const [mode, setMode] = useState("gi");
  const ind = INDICATORS.find((i) => i.id === id);
  const years = ind.years;
  const [year, setYear] = useState(years[years.length - 1]);
  useEffect(() => { if (!years.includes(year)) setYear(years[years.length - 1]); }, [years]);
  const [play, setPlay] = useState(false);
  useEffect(() => { if (!play) return; const t = setInterval(() => setYear((y) => years[(years.indexOf(y) + 1) % years.length]), 900); return () => clearInterval(t); }, [play, years]);

  const res = useMemo(() => FC.features.map((f) => resolve(f, ind, item, year)), [ind, item, year]);
  const gi = useMemo(() => gistar(res.map((r) => r.v)), [res]);
  const mk = useMemo(() => FC.features.map((f) => {
    const codes = GEOMAP[f.properties.code] || [];
    const series = years.map((y) => { for (const c of codes) { const v = val(ind, item, y, c); if (v != null) return [y, v]; } return [y, null]; });
    return mannKendall(series);
  }), [ind, item, years]);

  const cls = mode === "gi" ? gi.map(zClass) : mk.map((m) => zClass(m?.z));
  const LAB = mode === "gi" ? CLS_LABEL : MK_LABEL;
  const counts = cls.reduce((a, c) => { a[c] = (a[c] || 0) + 1; return a; }, {});
  const rows = FC.features.map((f, i) => ({ f, i, code: res[i].code, name: regName(res[i].code, f), v: res[i].v, z: mode === "gi" ? gi[i] : mk[i]?.z ?? null, cls: cls[i], m: mk[i] }))
    .filter((r) => r.z != null && r.cls !== "ns" && r.cls !== "na").sort((a, b) => Math.abs(b.z) - Math.abs(a.z));
  const dirWord = ind.bad === true ? "값이 높을수록 나쁜 지표" : ind.bad === false ? "값이 높을수록 좋은 지표" : "방향 없는(맥락) 지표";

  const onMove = (i) => (ev) => {
    const { x, y } = clientXY(ev); const r = res[i]; const m = mk[i];
    const trows = mode === "gi"
      ? [[`${ind.name} (${year})`, r.v == null ? "–" : fmt(r.v) + ind.unit], ["Gi* z", fmt(gi[i], 2)], ["판정", CLS_LABEL[cls[i]]]]
      : [[`${ind.name} ${m ? `${m.y0}→${m.y1}` : ""}`, m ? `${fmt(m.first)} → ${fmt(m.last)}${ind.unit}` : "–"], ["Mann-Kendall z", fmt(m?.z, 2)], ["Sen 기울기/년", fmt(m?.sen, 3)], ["판정", MK_LABEL[cls[i]]]];
    if (ISLAND.has(i)) trows.push(["이웃", "섬: 최근접 2곳으로 대체"]);
    setTip({ x, y, title: regName(r.code, FC.features[i]), rows: trows });
  };

  return (
    <div className="hot">
      <div className="card">
        <h3>핫스팟 분석 <small className="muted">Getis-Ord Gi* 공간 군집 · Mann-Kendall 추세</small></h3>
        <div className="desc">이웃 시군구와 함께 값이 높거나(핫스팟) 낮은(콜드스팟) 지역 군집을 찾고, 연도별 값의 증가·감소 추세를 검정합니다. 붉은색 = 높은 값 군집/증가, 파란색 = 낮은 값 군집/감소이며, 선택 지표는 {dirWord}입니다. 인접 = 경계를 맞댄 시군구(자기 포함), 섬은 가장 가까운 2곳을 이웃으로 씁니다. 지도를 클릭하면 지표 분석 화면으로 이동합니다.</div>
        <div className="ctrls" style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "8px 0" }}>
          <label className="subchip">지표 <Sel value={id} onChange={setId} /></label>
          <label className="subchip">값 <select value={item} onChange={(e) => setItem(e.target.value)}><option value="std">표준화율</option><option value="crude">조율</option></select></label>
          <div className="seg">
            <button className={`seg-btn ${mode === "gi" ? "on" : ""}`} onClick={() => setMode("gi")}>공간 군집(Gi*)</button>
            <button className={`seg-btn ${mode === "mk" ? "on" : ""}`} onClick={() => setMode("mk")}>시간 추세(Mann-Kendall)</button>
          </div>
          {mode === "gi" && <label className="subchip">연도 <button className="seg-btn" onClick={() => setPlay(!play)}>{play ? "■" : "▶"}</button> <select value={year} onChange={(e) => setYear(+e.target.value)}>{years.map((y) => <option key={y} value={y}>{y}</option>)}</select></label>}
        </div>
      </div>
      <div className="grid2">
        <div className="card">
          <h3>{mode === "gi" ? `${year}년 · ${ind.name} 핫스팟·콜드스팟` : `${ind.name} 추세 ${years[0]}–${years[years.length - 1]}`}</h3>
          <ExportButtons name={`${mode === "gi" ? year + "_" : ""}${ind.name}_${mode === "gi" ? "핫스팟" : "추세"}`} kinds={["svg", "png"]} />
          <div className="desc">{mode === "gi" ? "Gi* z ≥ 1.65/1.96/2.58 → 90/95/99% 핫스팟, z ≤ −1.65/−1.96/−2.58 → 콜드스팟" : "Mann-Kendall z ≥ 1.65/1.96/2.58 → 90/95/99% 증가, 음수는 감소 · Sen 기울기 = 연간 변화량 중앙값"} · 시군구 {FC.features.length}개 폴리곤 기준</div>
          <div className="mapwrap">
            <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="핫스팟 지도">
              {FC.features.map((f, i) => (
                <path key={f.properties.code} d={D_PATHS[i]} className="poly" style={{ fill: CLS_COLOR[cls[i]] }}
                  onMouseMove={onMove(i)} onMouseLeave={() => setTip(null)}
                  onClick={() => { const r = RBY.get(res[i].code); if (r && onPick) onPick(ind, r.l === "sub" ? r.p : r.c, year); }} />
              ))}
              <path d={D_MESH} className="sido-line" />
            </svg>
            <div className="maplegend">
              {["h3", "h2", "h1", "ns", "c1", "c2", "c3", "na"].map((k) => (
                <span key={k} className="lg-item"><i style={{ background: CLS_COLOR[k] }} /><small>{LAB[k]} ({counts[k] || 0})</small></span>
              ))}
            </div>
          </div>
        </div>
        <div className="card">
          <h3>{mode === "gi" ? "유의한 핫스팟·콜드스팟 목록" : "유의한 증가·감소 지역 목록"} <small className="muted">|z| 큰 순 · {rows.length}곳</small></h3>
          <ExportButtons name={`${ind.name}_${mode === "gi" ? year + "_핫스팟" : "추세"}_목록`} kinds={["csv"]} />
          {rows.length === 0 ? <div className="empty">유의한 지역이 없습니다</div> : (
            <div className="tblscroll" style={{ maxHeight: 640, overflowY: "auto" }}><table className="yeartbl">
              <thead><tr><th>지역</th>{mode === "gi" ? <><th>값({year})</th><th>Gi* z</th></> : <><th>처음→마지막</th><th>Sen/년</th><th>z</th></>}<th>판정</th></tr></thead>
              <tbody>
                {rows.slice(0, 60).map((r) => (
                  <tr key={r.f.properties.code} onClick={() => { const reg = RBY.get(r.code); if (reg && onPick) onPick(ind, reg.l === "sub" ? reg.p : reg.c, year); }}>
                    <td>{r.name}</td>
                    {mode === "gi" ? <><td>{fmt(r.v)}{ind.unit}</td><td>{fmt(r.z, 2)}</td></> : <><td>{fmt(r.m.first)} → {fmt(r.m.last)}{ind.unit} <small className="muted">{r.m.y0}–{r.m.y1}</small></td><td>{fmt(r.m.sen, 3)}</td><td>{fmt(r.z, 2)}</td></>}
                    <td style={{ color: r.cls.startsWith("h") ? "var(--seqr-600)" : "var(--seq-600)" }}>{LAB[r.cls]}</td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          )}
          {rows.length > 60 && <div className="desc">상위 60곳만 표시 · CSV에도 60곳</div>}
        </div>
      </div>
    </div>
  );
}
