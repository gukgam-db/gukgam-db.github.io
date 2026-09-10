import { useMemo, useState } from "react";
import { INDICATORS, DOMAINS, fmt, val, poolFor, label, RBY, computeRanking, PANEL_WEIGHTS, EQUAL_WEIGHTS, EXCLUDE_IDS, LEAGUE_NAME, recommendFor, depOf, DEP } from "../data";
import ExportButtons from "./ExportButtons";
import HleCard from "./HleCard";
import RiskCard from "./RiskCard";
import GoldenDiamond from "./GoldenDiamond";

const tone = (p) => (p == null ? "" : p >= 75 ? "t-high" : p >= 50 ? "t-mid" : p >= 25 ? "t-low" : "t-min");

/* 순위 산출 방식 설정 (방법론 v1) */
function RankSettings({ opt, onChange, isSgg }) {
  const set = (k, v) => onChange({ ...opt, [k]: v });
  const custom = typeof opt.weights === "object";
  const w = custom ? opt.weights : opt.weights === "panel" ? PANEL_WEIGHTS : EQUAL_WEIGHTS;
  const total = DOMAINS.reduce((a, d) => a + (w[d] || 0), 0);
  return (
    <div className="card rankset">
      <h3>순위 산출 방식 <small className="muted">방법론 v1 · 기본 균등 가중</small></h3>
      <div className="desc">기본: 영역 균등 가중 · 3년 이동평균 · 도시/군 리그 · 결과지표 4개 제외. "모의 패널" 가중치는 AI가 시뮬레이션한 값으로 실제 전문가 조사 결과가 아니며 민감도 검증용입니다. 바꿔 보면 순위가 얼마나 흔들리는지 확인할 수 있습니다.</div>
      <div className="setrow">
        <div className="setitem">
          <label>가중치</label>
          <div className="seg">
            {[["equal", "균등"], ["panel", "모의 패널(검증용)"], ["custom", "직접 조정"]].map(([k, n]) => (
              <button key={k} className={`seg-btn ${(custom ? "custom" : opt.weights) === k ? "on" : ""}`}
                onClick={() => set("weights", k === "custom" ? { ...PANEL_WEIGHTS } : k)}>{n}</button>
            ))}
          </div>
        </div>
        <div className="setitem">
          <label>평활</label>
          <div className="seg">
            <button className={`seg-btn ${opt.smooth === 3 ? "on" : ""}`} onClick={() => set("smooth", 3)}>3년 평균</button>
            <button className={`seg-btn ${opt.smooth === 1 ? "on" : ""}`} onClick={() => set("smooth", 1)}>단년도</button>
          </div>
        </div>
        {isSgg && (
          <div className="setitem">
            <label>리그</label>
            <div className="seg">
              <button className={`seg-btn ${opt.league === "league" ? "on" : ""}`} onClick={() => set("league", "league")}>도시 / 군</button>
              <button className={`seg-btn ${opt.league === "nation" ? "on" : ""}`} onClick={() => set("league", "nation")}>통합</button>
            </div>
          </div>
        )}
        <div className="setitem">
          <label>결과지표 4개 <span className="hint" title="고혈압·당뇨 진단 경험률(검진을 잘할수록 높아짐), 보건기관 이용률(방향 중립), 건강생활실천율(합성지표)">ⓘ</span></label>
          <div className="seg">
            <button className={`seg-btn ${opt.exclude ? "on" : ""}`} onClick={() => set("exclude", true)}>제외</button>
            <button className={`seg-btn ${!opt.exclude ? "on" : ""}`} onClick={() => set("exclude", false)}>포함</button>
          </div>
        </div>
      </div>
      {custom && (
        <div className="sliders">
          {DOMAINS.map((d) => (
            <label key={d} className="slider">
              <span>{d}</span>
              <input type="range" min="0" max="30" value={w[d]} onChange={(e) => set("weights", { ...w, [d]: +e.target.value })} />
              <b>{w[d]}</b>
            </label>
          ))}
          <div className="desc">합계 {total} (비율로 정규화되어 합이 100이 아니어도 됩니다)</div>
        </div>
      )}
    </div>
  );
}

/* 지역 프로파일: 방법론 v1 기반 영역·종합 순위, 등급 배지, 강점·개선·과제 */
export default function Profile({ item, sel, scope, rankOpt, onRankOpt, onPick, onRecommend, setTip }) {
  const pool = poolFor(sel, scope);
  const isSgg = sel.l === "sgg";
  const rk = useMemo(() => computeRanking(item, pool, rankOpt), [item, pool, rankOpt]);
  const me = rk.byCode.get(sel.c);
  const poolName = !isSgg ? "17개 시도" : scope === "sido" ? `${RBY.get(sel.p).n} 시군구` : rankOpt.league === "league" ? LEAGUE_NAME[me?.league] : "전국 시군구";

  // 지표별 행 (값·백분위·순위) + 5년 변화
  const rows = useMemo(() => INDICATORS.map((ind) => {
    const x = me?.inds[ind.id];
    const y = x?.y ?? ind.years[ind.years.length - 1];
    const v = x?.v ?? val(item === "std" ? ind : ind, item, y, sel.c);
    if (v == null) return null;
    const yi = ind.years.indexOf(y);
    let base = null, baseY = null;
    for (let k = Math.max(0, yi - 5); k < yi; k++) { const b = val(ind, item, ind.years[k], sel.c); if (b != null) { base = b; baseY = ind.years[k]; break; } }
    const delta = base == null ? null : val(ind, item, y, sel.c) - base;
    const improve = delta == null || ind.bad == null ? null : ind.bad ? -delta : delta;
    return { ind, y, v, pct: x?.pct ?? null, rank: x?.rank ?? null, n: x?.n ?? null, delta, baseY, improve,
      excluded: rankOpt.exclude && EXCLUDE_IDS.has(ind.id), neutral: ind.bad == null };
  }).filter(Boolean), [me, item, sel, rankOpt]);
  const byId = Object.fromEntries(rows.map((r) => [r.ind.id, r]));
  const scored = rows.filter((r) => r.pct != null);
  const strengths = [...scored].sort((a, b) => b.pct - a.pct).slice(0, 5);
  const improved = rows.filter((r) => r.improve != null).sort((a, b) => b.improve - a.improve).slice(0, 5);
  const weak = [...scored].sort((a, b) => a.pct - b.pct).slice(0, 5);
  const [showWeak, setShowWeak] = useState(false);
  const smoothNote = rankOpt.smooth === 3 ? "최근 3년 평균" : "최신 연도";

  return (
    <div className="profile">
      <div className="card prof-head">
        <div>
          <div className="prof-name">{label(sel)}</div>
          <div className="desc">{poolName} 기준 백분위(높을수록 양호) · {smoothNote} · 순위 산정 지표 {scored.length}개</div>
          <div className="badgesrow">
            {me?.grade && <span className={`gradebadge g-${me.grade}`}>{me.grade}</span>}
            {me?.overallRank && <span className="subchip">{poolName} <b>{me.overallRank}위</b> / {me.n}</span>}
            {me?.weakest && <span className="subchip warn" title="가장 낮은 영역이 하위 25% 이내 — 지자체 참고">⚠ 최저 영역: {me.weakest}</span>}
            {depOf(sel.c)?.q && <span className="subchip" title={`지역박탈지수(근사, ${DEP.year}년 총조사) ${fmt(depOf(sel.c).idx)} · 전국 시군구 중 ${depOf(sel.c).rank}위/${depOf(sel.c).n} (높을수록 박탈 큼)${depOf(sel.c).prev ? ` · 2015년 ${fmt(depOf(sel.c).prev.idx)}(${depOf(sel.c).prev.q}분위)` : ""}`}>지역박탈 <b>{depOf(sel.c).q}분위</b>{depOf(sel.c).prev && depOf(sel.c).prev.q !== depOf(sel.c).q ? ` (2015 ${depOf(sel.c).prev.q}분위→)` : ""}{depOf(sel.c).q === 5 ? " (박탈 큼)" : depOf(sel.c).q === 1 ? " (덜 박탈)" : ""}</span>}
          </div>
        </div>
        <div className="prof-score">
          <div className="k-label">종합 양호도 <small className="muted">({typeof rankOpt.weights === "object" ? "직접 가중" : rankOpt.weights === "panel" ? "모의 패널 가중(검증용)" : "균등 가중"})</small></div>
          <div className="k-value">{me?.overall == null ? "–" : Math.round(me.overall)}<small> / 100</small></div>
        </div>
      </div>

      <RankSettings opt={rankOpt} onChange={onRankOpt} isSgg={isSgg} />

      <div className="grid2">
        <HleCard sel={sel} pool={pool} poolName={poolName} setTip={setTip} />
        <RiskCard sel={sel} pool={pool} poolName={poolName} />
        <GoldenDiamond item={item} sel={sel} />
        <div className="card span2">
          <h3>영역별 순위와 수치</h3>
          <ExportButtons name={`${label(sel)}_영역별순위`} kinds={["list"]} />
          <div className="desc">영역 점수 = 소속 지표 백분위 평균 · 순위는 {poolName} 기준 · 칩의 숫자는 지표별 순위 (회색 칩은 순위 산정 제외 지표)</div>
          <div className="domains">
            {DOMAINS.map((d) => {
              const dr = me?.domains?.[d];
              const inds = INDICATORS.filter((i) => i.domain === d && byId[i.id]);
              return (
                <div key={d} className="drow2">
                  <div className="drow">
                    <div className="dl"><b>{d}</b> <small>{dr?.k ?? 0}</small></div>
                    <div className="bar-track"><div className={`bar ${tone(dr?.score)}`} style={{ width: `${dr?.score ?? 0}%` }} /></div>
                    <div className="rv">{dr ? Math.round(dr.score) : "–"}</div>
                    <div className="drank">{dr?.rank ? <><b>{dr.rank}위</b><small>/{dr.n}</small></> : "–"}</div>
                  </div>
                  <div className="indchips">
                    {inds.map((i) => { const r = byId[i.id]; return (
                      <button key={i.id} className={`indchip ${r.excluded || r.neutral ? "off" : ""}`} onClick={() => onPick(i, r.y)}
                        title={`${i.name} · ${r.y}년${rankOpt.smooth === 3 ? " 기준 3년 평균" : ""} · ${r.excluded ? "순위 산정 제외" : r.neutral ? "중립 지표" : "백분위 " + Math.round(r.pct)}`}>
                        <span className="ic-name">{i.name}</span>
                        <span className="ic-val">{fmt(r.v)}<small>{i.unit}</small></span>
                        <span className={`ic-rank ${r.pct == null ? "" : r.pct >= 75 ? "k-good" : r.pct < 25 ? "k-bad" : ""}`}>{r.rank ? `${r.rank}/${r.n}` : "제외"}</span>
                      </button>); })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card">
          <h3>강점 TOP 5</h3>
          <div className="desc">백분위가 가장 높은 지표 — 이 지역이 이미 잘하고 있는 것</div>
          <div className="badges">
            {strengths.map((r) => (
              <button key={r.ind.id} className={`badge-card ${tone(r.pct)}`} onClick={() => onPick(r.ind, r.y)}>
                <div className="b-name">{r.ind.name}</div>
                <div className="b-val">{fmt(r.v)}<small>{r.ind.unit}</small></div>
                <div className="b-sub">상위 {Math.max(1, Math.round(100 - r.pct))}% · {r.rank}/{r.n}위 · {r.y}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="card">
          <h3>가장 개선된 지표 TOP 5</h3>
          <div className="desc">최근 5년 방향 보정 개선폭(%p) — "올해 가장 건강해진" 후보</div>
          <div className="badges">
            {improved.map((r) => (
              <button key={r.ind.id} className={`badge-card ${r.improve > 0 ? "t-high" : "t-low"}`} onClick={() => onPick(r.ind, r.y)}>
                <div className="b-name">{r.ind.name}</div>
                <div className="b-val">{r.improve > 0 ? "+" : ""}{fmt(r.improve)}<small>%p</small></div>
                <div className="b-sub">{r.baseY}→{r.y}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="card span2">
          <h3>권고 예방·관리 사업 <small className="muted">(하위 25% 지표 기준 · 지식베이스 연결)</small></h3>
          <div className="desc">이 지역의 낮은 지표마다 시도 계획 → 국가 사업 → WHO 권고 순으로 연결된 항목을 보여줍니다. "더 보기"를 누르면 예방·관리 탭에서 전체를 볼 수 있습니다.</div>
          {(() => {
            const sidoFull = isSgg ? RBY.get(sel.p)?.n : sel.n;
            const lows = scored.filter((r) => r.pct < 25).sort((a, b) => a.pct - b.pct).slice(0, 6);
            const items = lows.map((r) => ({ r, recs: recommendFor(r.ind.name, sidoFull).slice(0, 3) })).filter((x) => x.recs.length);
            if (!lows.length) return <div className="empty">하위 25% 지표가 없습니다 — 권고 대상 없음</div>;
            if (!items.length) return <div className="empty">낮은 지표({lows.map((x) => x.ind.name).join(", ")})에 연결된 지식베이스 항목이 아직 없습니다</div>;
            return <div className="recs">{items.map(({ r, recs }) => (
              <div key={r.ind.id} className="rec">
                <div className="rechead"><b>{r.ind.name}</b> <span className="k-bad">{fmt(r.v)}{r.ind.unit} · 하위 {Math.max(1, Math.round(r.pct))}%</span>
                  <button className="xbtn" onClick={() => onRecommend(r.ind.name)}>더 보기 →</button></div>
                {recs.map((e) => <div key={e.id} className="recitem"><span className={`lvbadge lv-${e.level}`}>{e.level === "sido" ? e.sido : e.level === "national" ? "국가" : e.level === "regional" ? "WPRO" : "WHO"}</span>
                  <span className="recgoal">{e.goal}</span>{e.interventions?.[0] && <span className="intchip">{e.interventions[0]}</span>}</div>)}
              </div>))}</div>;
          })()}
        </div>

        <div className="card span2">
          <h3>개선 과제 <small className="muted">(지자체 참고용)</small></h3>
          <div className="desc">백분위가 낮은 지표 — 공개 화면에서는 비공개 원칙(랭킹 기획안)</div>
          {!showWeak ? (
            <button className="themebtn" onClick={() => setShowWeak(true)}>펼쳐 보기</button>
          ) : (
            <div className="badges">
              {weak.map((r) => (
                <button key={r.ind.id} className={`badge-card ${tone(r.pct)}`} onClick={() => onPick(r.ind, r.y)}>
                  <div className="b-name">{r.ind.name}</div>
                  <div className="b-val">{fmt(r.v)}<small>{r.ind.unit}</small></div>
                  <div className="b-sub">하위 {Math.max(1, Math.round(r.pct))}% · {r.rank}/{r.n}위 · {r.y}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <h3>전체 지표</h3>
        <ExportButtons name={`${label(sel)}_프로파일_전체지표`} kinds={["csv"]} />
        <div className="desc">행을 누르면 해당 지표 분석 화면으로 이동합니다</div>
        <div className="tblscroll">
          <table className="proftbl">
            <thead><tr><th>영역</th><th>지표</th><th>연도</th><th>값</th><th>순위</th><th>백분위</th><th>5년 변화</th></tr></thead>
            <tbody>
              {DOMAINS.map((d) => rows.filter((r) => r.ind.domain === d).sort((a, b) => (b.pct ?? -1) - (a.pct ?? -1)).map((r, k) => (
                <tr key={r.ind.id} onClick={() => onPick(r.ind, r.y)} className={r.excluded ? "muted" : ""}>
                  <td className="muted">{k === 0 ? d : ""}</td>
                  <td>{r.ind.name}{r.excluded && <small className="muted"> (산정 제외)</small>}</td>
                  <td>{r.y}</td>
                  <td><b>{fmt(r.v)}</b></td>
                  <td>{r.rank ? `${r.rank}/${r.n}` : "–"}</td>
                  <td>
                    <div className="pctcell">
                      <div className="bar-track"><div className={`bar ${tone(r.pct)}`} style={{ width: `${r.pct ?? 0}%` }} /></div>
                      <span>{r.pct == null ? (r.neutral ? "중립" : "–") : Math.round(r.pct)}</span>
                    </div>
                  </td>
                  <td className={r.improve == null ? "" : r.improve > 0 ? "k-good" : r.improve < 0 ? "k-bad" : ""}>
                    {r.delta == null ? "–" : (r.delta > 0 ? "+" : "") + fmt(r.delta) + "%p"}
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="desc">산출 방식 상세: docs/랭킹_방법론_v1.md — 표준화율·3년 이동평균·리그·가중치 근거(공인 체계 조사, AI 모의 패널은 검증용, 232개 시군구 실증)</div>
    </div>
  );
}
