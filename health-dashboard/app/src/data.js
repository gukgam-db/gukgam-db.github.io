// 데이터셋 접근 계층: 인덱스, 값 조회, 통계 헬퍼
import RAW from "../../data/dataset.json";

import HLE_RAW from "../../data/hle.json";

// ── 건강수명 지표 주입: 결과지표(outcome) → 순위 산정 제외, 지표 분석·비교에서 선택 가능 ──
(function injectHle() {
  if (!HLE_RAW.regions || RAW.indicators.some((i) => i.id === "HLE_HLE")) return;
  const codes = RAW.regions.map((r) => r.c);
  const years = [...new Set(Object.values(HLE_RAW.regions).flatMap((r) => Object.keys(r.y).map(Number)))].sort((a, b) => a - b);
  const src = "scripts/build_hle.py — 사망원인통계·주민등록연앙인구·통계청 생명표·지역사회건강조사 주관적 건강인지율 (공식 통계 아님)";
  const defs = [
    { id: "HLE_LE", name: "기대수명(추정)", bad: false, get: (v) => v.le },
    { id: "HLE_HLE", name: "건강수명(주관적 건강 기반·근사)", bad: false, get: (v) => v.hle },
    { id: "HLE_UNH", name: "불건강 기간(기대수명−건강수명)", bad: true, get: (v) => v.le - v.hle },
  ];
  for (const d of defs) {
    const grid = years.map((y) => codes.map((c) => { const v = HLE_RAW.regions[c]?.y?.[String(y)]; return v ? Math.round(d.get(v) * 10) : null; }));
    RAW.indicators.push({ id: d.id, name: d.name, domain: "건강수명", bad: d.bad, unit: "세", years, src, outcome: true });
    RAW.values[d.id] = { crude: grid, std: grid };
  }
})();

// ── 지역사회건강조사 DB(질병관리청 자료실·김동현 교수 구축) 보조 지표 주입: 결과·환경 지표 → 순위 산정 제외 ──
import KDH_RAW from "../../data/kdh_dataset.json";
(function injectKdh() {
  if (!KDH_RAW.indicators || RAW.indicators.some((i) => i.kdh)) return;
  for (const ind of KDH_RAW.indicators) { RAW.indicators.push(ind); RAW.values[ind.id] = KDH_RAW.values[ind.id]; }
})();
export const KDH_SOURCE = KDH_RAW.source || null;

// ── 지역박탈지수(근사) 지표 주입 (data/deprivation.json) ──
import DEP_RAW0 from "../../data/deprivation.json";
(function injectDep() {
  if (!DEP_RAW0.year || RAW.indicators.some((i) => i.id === "DEP_IDX")) return;
  const codes = RAW.regions.map((r) => r.c);
  const years = DEP_RAW0.years || [DEP_RAW0.year];
  const grid = years.map((y) => codes.map((c) => {
    const d = DEP_RAW0.regions[c]; if (!d || !d.q) return null;
    if (y === DEP_RAW0.year) return Math.round(d.idx * 10);
    return d.prev && d.prev.year === y ? Math.round(d.prev.idx * 10) : null;
  }));
  RAW.indicators.push({ id: "DEP_IDX", name: "지역박탈지수(근사, 총조사 집계표)", domain: "지역박탈", bad: true, unit: "점", years,
    src: "scripts/build_deprivation.py — 2020 인구주택총조사 시군구 집계표 7개 변수 z점수 합(김동진 2013 방식 재현, 공식값 아님)", outcome: true, dep: true });
  RAW.values.DEP_IDX = { crude: grid, std: grid };
})();

// ── 지표 방향성 확정표(docs/지표_방향성_v1.md → data/directions.json): bad 덮어쓰기 + 근거 문구 ──
import DIR_RAW from "../../data/directions.json";
(function applyDirections() {
  const items = DIR_RAW.items || {};
  for (const ind of RAW.indicators) {
    const d = items[ind.id];
    if (!d) continue;
    ind.bad = d.dir === "bad" ? true : d.dir === "good" ? false : null;
    ind.ctx = d.dir === "ctx";
    ind.dirNote = d.note || null;
    ind.dirRefs = d.refs || [];
  }
})();

export const DS = RAW;
export const YEARS_ALL = RAW.years;
export const DOMAINS = RAW.domains;                       // 순위 산정 영역
export const DOMAINS_ALL = [...RAW.domains, "건강수명", ...(KDH_RAW.domains || []), "지역박탈"];   // 지표 선택·비교표 영역
export const REGIONS = RAW.regions;
export const RIDX = new Map(REGIONS.map((r, i) => [r.c, i]));
export const RBY = new Map(REGIONS.map((r) => [r.c, r]));
export const SIDOS = REGIONS.filter((r) => r.l === "sido");
export const SGG_ALL = REGIONS.filter((r) => r.l === "sgg");
export const SGG_BY_SIDO = Object.fromEntries(SIDOS.map((s) => [s.c, SGG_ALL.filter((r) => r.p === s.c)]));
export const SUBS_BY_SGG = {};
REGIONS.filter((r) => r.l === "sub").forEach((r) => (SUBS_BY_SGG[r.p] ??= []).push(r));

export const INDICATORS = RAW.indicators;
export const IND_BY_ID = Object.fromEntries(INDICATORS.map((d) => [d.id, d]));
export const IND_BY_DOMAIN = Object.fromEntries(DOMAINS_ALL.map((d) => [d, INDICATORS.filter((i) => i.domain === d)]));

export const ITEMS = { crude: "조율", std: "표준화율" };

export const fmt = (v, digits = 1) => (v == null ? "–" : v.toFixed(digits));
export const label = (r) => (!r ? "" : r.l === "sido" ? r.n : `${r.s} ${r.n}`);
export const sidoOf = (code) => (code.startsWith("0071") ? "0071" : code.slice(0, 3));

/** 지표·항목·연도·지역 → 값(%) 또는 null */
export function val(ind, item, year, code) {
  const yi = ind.years.indexOf(year);
  const ri = RIDX.get(code);
  if (yi < 0 || ri == null) return null;
  const v = RAW.values[ind.id][item][yi][ri];
  return v == null ? null : v / 10;
}

/** 지역의 전 연도 시계열 */
export const series = (ind, item, code) => ind.years.map((y) => val(ind, item, y, code));

/** 지표에서 해당 지역의 값이 있는 최신 연도 */
export function latestYear(ind, item, code) {
  for (let i = ind.years.length - 1; i >= 0; i--)
    if (val(ind, item, ind.years[i], code) != null) return ind.years[i];
  return null;
}

/** 비교 집단: 시군구 선택 시 전국/시도 내 시군구, 시도 선택 시 17개 시도 */
export function poolFor(sel, scope) {
  if (!sel) return SIDOS;
  if (sel.l === "sido") return SIDOS;
  return scope === "sido" ? SGG_BY_SIDO[sel.p] : SGG_ALL;
}

/** 방향 보정 비교: "a가 b보다 양호"면 음수 */
export function betterCmp(ind) {
  return ind.bad ? (a, b) => a - b : (a, b) => b - a;
}

/** 집단 내 순위표 [{r, v}] (양호한 순). 결측 제외 */
export function ranked(ind, item, year, pool) {
  const cmp = betterCmp(ind);
  return pool
    .map((r) => ({ r, v: val(ind, item, year, r.c) }))
    .filter((x) => x.v != null)
    .sort((a, b) => cmp(a.v, b.v));
}

/** 백분위(0~100, 높을수록 양호): 집단 중 나보다 나쁜 비율 (+동률 절반) */
export function percentile(ind, v, poolVals) {
  if (v == null || !poolVals.length) return null;
  let worse = 0, tie = 0;
  for (const p of poolVals) {
    if (p === v) tie++;
    else if (ind.bad ? p > v : p < v) worse++;
  }
  return ((worse + tie / 2) / poolVals.length) * 100;
}

export function median(arr) {
  const a = arr.filter((v) => v != null).sort((x, y) => x - y);
  if (!a.length) return null;
  const m = a.length >> 1;
  return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
}

export function quantile(sorted, q) {
  if (!sorted.length) return null;
  const pos = (sorted.length - 1) * q, lo = Math.floor(pos), hi = Math.ceil(pos);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}

/** 상자그림 통계 */
export function boxStats(vals) {
  const a = vals.filter((v) => v != null).sort((x, y) => x - y);
  if (!a.length) return null;
  return { min: a[0], q1: quantile(a, 0.25), med: quantile(a, 0.5), q3: quantile(a, 0.75), max: a[a.length - 1], n: a.length };
}

/** 전국 기준값: 전 시군구 중앙값 */
export function nationalMedian(ind, item, year) {
  return median(SGG_ALL.map((r) => val(ind, item, year, r.c)));
}

/** 7단계 분위 경계 (단계구분도용) */
export function classBreaks(vals, k = 7) {
  const a = vals.filter((v) => v != null).sort((x, y) => x - y);
  if (a.length < 2) return [];
  const br = [];
  for (let i = 1; i < k; i++) br.push(quantile(a, i / k));
  return br;
}
export const classOf = (v, breaks) => (v == null ? 0 : breaks.filter((b) => v > b).length + 1);

/** 집단 전체의 지표 백분위 한 번에 계산: Map(code → pct). 결측 지역은 제외 */
export function allPercentiles(ind, item, year, pool) {
  const vals = pool.map((r) => [r.c, val(ind, item, year, r.c)]).filter(([, v]) => v != null);
  const sorted = vals.map(([, v]) => v).sort((a, b) => a - b);
  const n = sorted.length, out = new Map();
  if (!n) return out;
  // 이분탐색으로 "나보다 나쁜 수" 계산
  const lower = (x) => { let lo = 0, hi = n; while (lo < hi) { const m = (lo + hi) >> 1; if (sorted[m] < x) lo = m + 1; else hi = m; } return lo; };
  const upper = (x) => { let lo = 0, hi = n; while (lo < hi) { const m = (lo + hi) >> 1; if (sorted[m] <= x) lo = m + 1; else hi = m; } return lo; };
  for (const [c, v] of vals) {
    const below = lower(v), tie = upper(v) - below;
    const worse = ind.bad ? n - upper(v) : below;
    out.set(c, ((worse + tie / 2) / n) * 100);
  }
  return out;
}

/**
 * 집단 내 모든 지역의 영역 점수·종합 점수와 순위.
 * weights: {영역: 가중치} (없으면 균등). year: 지표별 최신 연도 사용(연도 지정 시 해당 연도, 없으면 최신).
 * 반환: { byCode: Map(code → {domains:{d:{score,rank}}, overall:{score,rank}}), n: {d: 집단 크기} }
 */
export function domainRanking(item, pool, weights = null, year = null) {
  const pctByInd = {};
  for (const ind of INDICATORS) {
    if (ind.bad == null || ind.outcome) continue;
    const y = year != null && ind.years.includes(year) ? year : ind.years[ind.years.length - 1];
    pctByInd[ind.id] = allPercentiles(ind, item, y, pool);
  }
  const rows = pool.map((r) => {
    const domains = {};
    for (const d of DOMAINS) {
      const xs = INDICATORS.filter((i) => i.domain === d && pctByInd[i.id]?.has(r.c)).map((i) => pctByInd[i.id].get(r.c));
      if (xs.length) domains[d] = { score: xs.reduce((a, b) => a + b, 0) / xs.length, k: xs.length };
    }
    let wsum = 0, acc = 0;
    for (const d in domains) { const w = weights ? (weights[d] ?? 0) : 1; acc += domains[d].score * w; wsum += w; }
    return { c: r.c, domains, overall: wsum ? acc / wsum : null, k: Object.keys(domains).length };
  });
  const byCode = new Map(rows.map((x) => [x.c, x]));
  const n = {};
  for (const d of DOMAINS) {
    const s = rows.filter((x) => x.domains[d]).sort((a, b) => b.domains[d].score - a.domains[d].score);
    s.forEach((x, i) => (x.domains[d].rank = i + 1)); n[d] = s.length;
  }
  const full = rows.filter((x) => x.overall != null && x.k >= DOMAINS.length - 1).sort((a, b) => b.overall - a.overall);
  full.forEach((x, i) => (x.overallRank = i + 1)); n.overall = full.length;
  return { byCode, n };
}

/* ===== 랭킹 방법론 v1 (docs/랭킹_방법론_v1.md) ===== */
export const PANEL_WEIGHTS = { "흡연": 14, "음주": 11, "신체활동": 11, "식생활·비만": 11, "정신건강": 13, "구강건강": 4, "만성질환": 16, "예방·안전": 9, "의료이용": 11 };
export const EQUAL_WEIGHTS = Object.fromEntries(DOMAINS.map((d) => [d, 1]));
// 결과·유병 성격/중립/합성 지표: 순위 산식에서 제외 권고 (6개 패널 공통 지적)
export const EXCLUDE_IDS = new Set(["DT_HYPER_DOCTOR", "DT_DIA_DOCTOR", "DT_NECE_CLINIC", "DT_117075_H_HEALTHY"]);
export const DEFAULT_RANK_OPT = { weights: "equal", smooth: 3, league: "league", exclude: true };   // 가중치 기본 = 균등 (모의 패널은 검증용)
export const leagueOf = (r) => (r.l !== "sgg" ? "sido" : r.n.endsWith("군") ? "gun" : "city");
export const LEAGUE_NAME = { city: "도시(구·시) 리그", gun: "군 리그", sido: "17개 시도" };

/** 평활값: 평가연도 포함 최근 k개년 평균 (없는 해는 건너뜀) */
export function valSmooth(ind, item, year, code, k = 1) {
  if (k <= 1) return val(ind, item, year, code);
  let s = 0, n = 0;
  for (let y = year - k + 1; y <= year; y++) { const v = val(ind, item, y, code); if (v != null) { s += v; n++; } }
  return n ? s / n : null;
}

/**
 * 종합 순위 산출 (방법론 v1). opts: {weights:'panel'|'equal'|{...}, smooth:1|3, league:'nation'|'league', exclude:bool, year}
 * pool 내에서 리그별로 따로 백분위·순위를 매긴다. 반환 byCode: code → {inds:{id:{v,pct,rank,n,y}}, domains:{d:{score,rank,n}}, overall, overallRank, n, league, grade, weakest}
 */
export function computeRanking(item, pool, opts = DEFAULT_RANK_OPT) {
  const W = opts.weights === "equal" ? EQUAL_WEIGHTS : opts.weights === "panel" ? PANEL_WEIGHTS : (opts.weights || EQUAL_WEIGHTS);
  const groups = opts.league === "league" && pool.some((r) => r.l === "sgg")
    ? { city: pool.filter((r) => leagueOf(r) === "city"), gun: pool.filter((r) => leagueOf(r) === "gun") }
    : { all: pool };
  const byCode = new Map();
  for (const [lg, members] of Object.entries(groups)) {
    if (!members.length) continue;
    const recs = new Map(members.map((r) => [r.c, { c: r.c, inds: {}, domains: {}, league: lg }]));
    for (const ind of INDICATORS) {
      if (ind.bad == null || ind.outcome || (opts.exclude && EXCLUDE_IDS.has(ind.id))) continue;
      const y = opts.year != null && ind.years.includes(opts.year) ? opts.year : ind.years[ind.years.length - 1];
      const vals = members.map((r) => [r.c, valSmooth(ind, item, y, r.c, opts.smooth)]).filter(([, v]) => v != null);
      const sorted = vals.map(([, v]) => v).sort((a, b) => a - b), n = sorted.length;
      if (!n) continue;
      const lower = (x) => { let lo = 0, hi = n; while (lo < hi) { const m = (lo + hi) >> 1; if (sorted[m] < x) lo = m + 1; else hi = m; } return lo; };
      const upper = (x) => { let lo = 0, hi = n; while (lo < hi) { const m = (lo + hi) >> 1; if (sorted[m] <= x) lo = m + 1; else hi = m; } return lo; };
      for (const [c, v] of vals) {
        const below = lower(v), tie = upper(v) - below, worse = ind.bad ? n - upper(v) : below;
        recs.get(c).inds[ind.id] = { v, pct: ((worse + tie / 2) / n) * 100, rank: n - worse - tie + 1, n, y };
      }
    }
    for (const rec of recs.values()) {
      let acc = 0, wsum = 0;
      for (const d of DOMAINS) {
        const xs = INDICATORS.filter((i) => i.domain === d && rec.inds[i.id]).map((i) => rec.inds[i.id].pct);
        if (!xs.length) continue;
        rec.domains[d] = { score: xs.reduce((a, b) => a + b, 0) / xs.length, k: xs.length };
        acc += rec.domains[d].score * W[d]; wsum += W[d];
      }
      rec.overall = wsum ? acc / wsum : null;
      rec.k = Object.keys(rec.domains).length;
    }
    for (const d of DOMAINS) {
      const s = [...recs.values()].filter((x) => x.domains[d]).sort((a, b) => b.domains[d].score - a.domains[d].score);
      s.forEach((x, i) => { x.domains[d].rank = i + 1; x.domains[d].n = s.length; });
    }
    const full = [...recs.values()].filter((x) => x.overall != null && x.k >= DOMAINS.length - 1).sort((a, b) => b.overall - a.overall);
    full.forEach((x, i) => {
      x.overallRank = i + 1; x.n = full.length;
      const p = (i + 1) / full.length;
      x.grade = p <= 0.10 ? "플래티넘" : p <= 0.25 ? "골드" : p <= 0.50 ? "실버" : null;
      const worst = Object.entries(x.domains).sort((a, b) => a[1].score - b[1].score)[0];
      x.weakest = worst && worst[1].score < 25 ? worst[0] : null;
    });
    for (const rec of recs.values()) byCode.set(rec.c, rec);
  }
  return { byCode, weights: W };
}

/* ===== 조사 단위(보건소) 데이터 ===== */
import UNITS_RAW from "../../data/units.json";
export const UNITS = UNITS_RAW;
export const UNIT_BY_CODE = new Map(UNITS_RAW.units.map((u) => [u.c, u]));
/** 보건소 단위 풀: 공식 보건소명이 있는 조사 단위(일반구가 있는 시는 시 전체 행 대신 보건소별 행). 세종특별자치시보건소 포함 */
// 보건소 단위 풀 = 질병관리청 「2025 지역건강통계 한눈에 보기」 부록 시군구별 표의 258개 조사 단위(시 전체 행 제외, 세종시 포함)
import CHS25 from "../../data/chs2025_units.json";
export const CHS25_COUNT = CHS25.count;
export const HC_POOL = CHS25.units.filter((u) => RBY.has(u.c)).map((u) => {
  const off = UNIT_BY_CODE.get(u.c)?.chs;
  return { ...RBY.get(u.c), hc: off || `${u.n}보건소`, hc25: u.n };
});

/* ===== 만성질환 예방·관리 지식베이스 ===== */
import NCD_RAW from "../../data/ncd.json";
export const NCD = NCD_RAW;
export const LEVEL_RANK = { sido: 0, national: 1, regional: 2, global: 3 };
/** 지표명으로 권고 항목 찾기: 선택 지역의 시도 → 국가 → 서태평양 → 국제 순 */
export function recommendFor(indName, sidoFull) {
  return NCD_RAW.entries
    .filter((e) => e.linked.includes(indName) && (e.level !== "sido" || !sidoFull || e.sido === sidoFull))
    .sort((a, b) => LEVEL_RANK[a.level] - LEVEL_RANK[b.level]);
}

// ── 건강수명 (scripts/build_hle.py → data/hle.json) ──
export const HLE = HLE_RAW;
/** 지역 코드 → {y: {year: {le, hle, pr}}} 또는 null */
export const hleOf = (code) => HLE.regions?.[code] || null;
/** 집단 내 건강수명 순위(높을수록 양호), 최신 공통 연도 기준 */
export function hleRank(code, pool) {
  const me = hleOf(code);
  if (!me) return { rank: null, n: 0, median: null };
  const y = Object.keys(me.y).sort().pop();
  const vals = pool.map((r) => [r.c, hleOf(r.c)?.y?.[y]?.hle]).filter(([, v]) => v != null);
  const sorted = vals.map(([, v]) => v).sort((a, b) => b - a);
  const mine = me.y[y].hle;
  const rank = sorted.findIndex((v) => v <= mine) + 1;
  return { rank: rank || null, n: sorted.length, median: median(sorted), y };
}

// ── 감염병 고위험군 (scripts/build_risk.py → data/risk.json) ──
import RISK_RAW from "../../data/risk.json";
export const RISK = RISK_RAW;
export const riskOf = (code) => RISK.regions?.[code] || null;
/** 집단 비율 순위(높을수록 1위), 집단 내 중앙값(%) */
export function riskRank(gid, code, pool) {
  const vals = pool.map((r) => { const x = riskOf(r.c); return x && x[gid] ? [r.c, (x[gid].v / x.pop) * 100] : null; }).filter(Boolean);
  const sorted = vals.map(([, v]) => v).sort((a, b) => b - a);
  const me = riskOf(code); if (!me || !me[gid] || !sorted.length) return { rank: null, n: sorted.length, median: null };
  const mine = (me[gid].v / me.pop) * 100;
  return { rank: sorted.findIndex((v) => v <= mine) + 1 || null, n: sorted.length, median: median(sorted) };
}

// ── 지역박탈지수(근사, 총조사 집계표 기반) scripts/build_deprivation.py → data/deprivation.json ──
import DEP_RAW from "../../data/deprivation.json";
export const DEP = DEP_RAW;
export const depOf = (code) => DEP.regions?.[code] || null;
/** 박탈 5분위(1=가장 덜 박탈)별 지역 목록 */
export function depQuintiles(pool) {
  const q = { 1: [], 2: [], 3: [], 4: [], 5: [] };
  for (const r of pool) { const d = depOf(r.c); if (d?.q) q[d.q].push(r); }
  return q;
}
