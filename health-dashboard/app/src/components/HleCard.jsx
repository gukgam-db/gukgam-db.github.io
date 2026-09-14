import { useMemo } from "react";
import { HLE, hleOf, hleRank, fmt, label, RBY } from "../data";
import ExportButtons from "./ExportButtons";

/* 기대수명 · 건강수명 · 불건강 기간 (프로파일 카드) */
export default function HleCard({ sel, pool, poolName, setTip }) {
  const rec = hleOf(sel.c);
  const isSgg = sel.l === "sgg";
  const rk = useMemo(() => hleRank(sel.c, pool), [sel, pool]);
  if (!rec) {
    return (
      <div className="card span2 hle">
        <h3>기대수명 · 건강수명</h3>
        <div className="desc">이 지역은 건강수명 산출 자료(사망자·인구 표)가 없어 표시하지 않습니다.</div>
      </div>
    );
  }
  const years = Object.keys(rec.y).map(Number).sort((a, b) => a - b);
  const y = years[years.length - 1];
  const cur = rec.y[y];
  const first = rec.y[years[0]];
  const nat = HLE.national;
  const natYears = Object.keys(nat.computed || {}).map(Number);
  const natY = natYears.length ? natYears.reduce((a, b) => (Math.abs(b - y) < Math.abs(a - y) || (Math.abs(b - y) === Math.abs(a - y) && b > a) ? b : a)) : null;
  const natRow = natY != null ? nat.computed[String(natY)] : null;
  const refs = nat.refs || [];
  const kind = isSgg ? "근사" : "추정";
  const sidoRec = isSgg ? hleOf(sel.p) : null;
  const sidoCur = sidoRec?.y?.[String(y)] || (sidoRec && sidoRec.y[Object.keys(sidoRec.y).sort().pop()]);

  // 추이 막대(연도별 기대수명·건강수명)
  const W = 320, H = 104, pad = { l: 30, r: 6, t: 16, b: 18 };
  const vals = years.flatMap((yy) => [rec.y[yy].le, rec.y[yy].hle]).filter((v) => v != null);
  const lo = Math.floor(Math.min(...vals) - 2), hi = Math.ceil(Math.max(...vals) + 1);
  const sx = (i) => pad.l + (i + 0.5) * ((W - pad.l - pad.r) / years.length);
  const sy = (v) => pad.t + (H - pad.t - pad.b) * (1 - (v - lo) / (hi - lo));
  const path = (key) => years.map((yy, i) => `${i ? "L" : "M"}${sx(i).toFixed(1)},${sy(rec.y[yy][key]).toFixed(1)}`).join(" ");

  return (
    <div className="card span2 hle">
      <h3>기대수명 · 건강수명 <small className="muted">({isSgg ? "시군구 근사" : "시도 추정"} · 주관적 건강 기반)</small></h3>
      <ExportButtons name={`${label(sel)}_건강수명`} kinds={["svg", "png"]} />
      <div className="desc">
        건강수명 = 기대수명 중 "스스로 건강하다"고 느끼며 사는 햇수(Sullivan 방식). {isSgg ? "시군구는 사망원인통계 3년 합산 생명표 + 지역사회건강조사 주관적 건강인지율(전국 연령 곡선 보정)로 근사한 값" : "시도는 통계청 시도별 간이생명표 + 지역사회건강조사 주관적 건강인지율로 산출한 값"}이며 <b>공식 통계가 아닙니다</b>. 지역 차이는 주로 주관적 건강 응답 차이에서 나오며, 청구자료(YLD) 기반 건강수명과는 순위가 크게 다를 수 있습니다(방법론 문서 §3.3b).
      </div>
      <div className="hle-grid">
        <div className="kpi">
          <div className="k-label">기대수명 <small className="muted">{isSgg ? `${y - 1}–${y + 1}년 합산` : `${y}년`}</small></div>
          <div className="k-value">{fmt(cur.le)}<small> 세</small></div>
          <div className="k-sub">{natRow ? `전국 ${fmt(natRow.le)}세(${natY})` : ""}{sidoCur ? ` · ${RBY.get(sel.p).n} ${fmt(sidoCur.le)}세` : ""}</div>
        </div>
        <div className="kpi">
          <div className="k-label">건강수명 <small className="muted">({kind})</small></div>
          <div className="k-value">{fmt(cur.hle)}<small> 세</small></div>
          <div className="k-sub">{natRow ? `전국 ${fmt(natRow.hle)}세` : ""}{sidoCur ? ` · ${RBY.get(sel.p).n} ${fmt(sidoCur.hle)}세` : ""}</div>
        </div>
        <div className="kpi">
          <div className="k-label">불건강 기간 <small className="muted">기대수명 − 건강수명</small></div>
          <div className="k-value">{fmt(cur.le - cur.hle)}<small> 년</small></div>
          <div className="k-sub">{natRow ? `전국 ${fmt(natRow.le - natRow.hle)}년` : ""} · 불건강률(추정) {fmt(cur.pr)}%{cur.good != null ? ` · 주관적 건강인지율 ${fmt(cur.good)}%` : ""}</div>
        </div>
        <div className="kpi">
          <div className="k-label">{poolName} 건강수명 순위</div>
          <div className="k-value">{rk.rank ? `${rk.rank}` : "–"}<small> / {rk.n}</small></div>
          <div className="k-sub">중앙값 {fmt(rk.median)}세 · {first && years.length > 1 ? `${years[0]}→${y} ${cur.hle - first.hle >= 0 ? "▲" : "▼"} ${fmt(Math.abs(cur.hle - first.hle))}년` : ""}</div>
        </div>
      </div>
      <div className="hle-row">
        <svg className="chart" viewBox={`0 0 ${W} ${H}`} width="100%" style={{ maxWidth: 420 }} data-title={`${label(sel)} 기대수명·건강수명 추이`}>
          {[lo, Math.round((lo + hi) / 2), hi].map((v) => (
            <g key={v}><line x1={pad.l} x2={W - pad.r} y1={sy(v)} y2={sy(v)} stroke="#e5e7eb" strokeWidth="1" /><text x={pad.l - 4} y={sy(v) + 3} fontSize="11" textAnchor="end" fill="#6b7280">{v}</text></g>
          ))}
          <path d={path("le")} fill="none" stroke="#6b7280" strokeWidth="2" />
          <path d={path("hle")} fill="none" stroke="#2563eb" strokeWidth="2.5" />
          {years.map((yy, i) => (
            <g key={yy}>
              <circle cx={sx(i)} cy={sy(rec.y[yy].le)} r="2.5" fill="#6b7280" />
              <circle cx={sx(i)} cy={sy(rec.y[yy].hle)} r="3" fill="#2563eb"
                onMouseEnter={(e) => setTip?.({ x: e.clientX, y: e.clientY, html: `<b>${yy}</b><br/>기대수명 ${fmt(rec.y[yy].le)}세<br/>건강수명 ${fmt(rec.y[yy].hle)}세<br/>불건강 ${fmt(rec.y[yy].le - rec.y[yy].hle)}년` })}
                onMouseLeave={() => setTip?.(null)} />
              <text x={sx(i)} y={H - 4} fontSize="11" textAnchor="middle" fill="#6b7280">{yy}</text>
            </g>
          ))}
          <text x={W - pad.r} y={9} fontSize="11" textAnchor="end" fill="#6b7280">─ 기대수명 <tspan fill="#2563eb">─ 건강수명</tspan></text>
        </svg>
        <div className="hle-refs">
          <div className="k-label">전국 공식 건강수명(정의별)</div>
          <table className="tbl small">
            <tbody>
              {refs.map((r) => (
                <tr key={r.id}><td>{r.label}</td><td style={{ textAlign: "right", fontWeight: 600 }}>{fmt(r.t)}세</td><td className="muted">{r.year}{r.m != null ? ` · 남 ${fmt(r.m)} 여 ${fmt(r.f)}` : ""}</td></tr>
              ))}
            </tbody>
          </table>
          <div className="desc" style={{ marginTop: 6 }}>{HLE.method?.summary}</div>
        </div>
      </div>
    </div>
  );
}
