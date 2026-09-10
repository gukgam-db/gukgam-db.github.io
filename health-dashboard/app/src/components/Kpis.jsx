import { fmt, val, ranked, percentile, nationalMedian, label, SGG_BY_SIDO, SIDOS, RBY } from "../data";

/* 현황: 값·전년 대비, 전국 기준, 순위(전국/시도 내), 백분위 게이지 */
export default function Kpis({ ind, item, year, sel }) {
  const v = val(ind, item, year, sel.c);
  const du = ind.unit === "%" ? "%p" : ` ${ind.unit}`;   // 차이 단위
  const yi = ind.years.indexOf(year);
  const prev = yi > 0 ? val(ind, item, ind.years[yi - 1], sel.c) : null;
  const delta = v == null || prev == null ? null : v - prev;
  const deltaGood = delta == null || ind.bad == null ? null : (delta < 0) === ind.bad;

  const isSgg = sel.l === "sgg";
  const natPool = isSgg ? ranked(ind, item, year, Object.values(SGG_BY_SIDO).flat()) : ranked(ind, item, year, SIDOS);
  const natRank = natPool.findIndex((x) => x.r.c === sel.c) + 1;
  const sidoPool = isSgg ? ranked(ind, item, year, SGG_BY_SIDO[sel.p]) : null;
  const sidoRank = sidoPool ? sidoPool.findIndex((x) => x.r.c === sel.c) + 1 : null;
  const pct = ind.bad == null ? null : percentile(ind, v, natPool.map((x) => x.v));
  const nat = nationalMedian(ind, item, year);
  const sidoVal = isSgg ? val(ind, item, year, sel.p) : null;

  return (
    <div className="kpis">
      <div className="kpi">
        <div className="k-label">{label(sel)} · {year}년</div>
        <div className="k-value">{fmt(v)}<small> {ind.unit}</small></div>
        <div className={`k-sub ${deltaGood == null ? "" : deltaGood ? "k-good" : "k-bad"}`}>
          {delta == null ? "전년 자료 없음" : `${delta > 0 ? "▲" : delta < 0 ? "▼" : "="} 전년 대비 ${fmt(Math.abs(delta))}${du}`}
        </div>
      </div>
      <div className="kpi">
        <div className="k-label">전국 시군구 중앙값</div>
        <div className="k-value">{fmt(nat)}<small> {ind.unit}</small></div>
        <div className="k-sub">
          {v != null && nat != null ? `중앙값 대비 ${fmt(Math.abs(v - nat))}${du} ${v - nat >= 0 ? "높음" : "낮음"}` : ""}
          {isSgg && sidoVal != null ? ` · ${RBY.get(sel.p).n} 전체 ${fmt(sidoVal)}` : ""}
        </div>
      </div>
      <div className="kpi">
        <div className="k-label">{isSgg ? "전국 시군구 순위" : "전국 시도 순위"} (양호한 순)</div>
        <div className="k-value">{natRank || "–"}<small> / {natPool.length}</small></div>
        <div className="k-sub">
          {sidoRank ? `${RBY.get(sel.p).n} 내 ${sidoRank} / ${sidoPool.length}` : ""}
          {ind.bad == null ? "중립 지표(방향 없음)" : ind.bad ? " · 낮을수록 양호" : " · 높을수록 양호"}
        </div>
      </div>
      <div className="kpi">
        <div className="k-label">양호도 백분위 ({isSgg ? "전국 시군구" : "17개 시도"} 기준)</div>
        <div className="k-value">{pct == null ? "–" : Math.round(pct)}<small> / 100</small></div>
        <div className="gauge" aria-hidden="true">
          <div className="gauge-fill" style={{ width: `${pct ?? 0}%` }} />
        </div>
      </div>
    </div>
  );
}
