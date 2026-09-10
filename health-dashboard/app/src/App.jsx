import { useEffect, useMemo, useState } from "react";
import { DS, INDICATORS, RBY, label, DEFAULT_RANK_OPT, KDH_SOURCE } from "./data";
import { IndicatorPicker, RegionPicker, YearControl, ItemToggle } from "./components/Pickers";
import Kpis from "./components/Kpis";
import TrendChart from "./components/TrendChart";
import ChoroplethMap from "./components/ChoroplethMap";
import RankPanel from "./components/RankPanel";
import YearTable from "./components/YearTable";
import GapBoxplot from "./components/GapBoxplot";
import EquityPanel from "./components/EquityPanel";
import Profile from "./components/Profile";
import Compare, { NAT, MAX_CMP } from "./components/Compare";
import Tooltip from "./components/Tooltip";
import UnitsView from "./components/UnitsView";
import NcdView from "./components/NcdView";
import CorrelationView from "./components/CorrelationView";
import HotspotView from "./components/HotspotView";
import ChronicleView from "./components/ChronicleView";
import ExportButtons from "./components/ExportButtons";

const DEFAULT_IND = INDICATORS.find((i) => i.id === "DT_H_SM") || INDICATORS[0];

// URL 해시(#ind=…&sido=…)로 화면 상태를 공유 가능하게
function readHash() {
  const h = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const ind = INDICATORS.find((i) => i.id === h.get("ind"));
  const sgg = h.get("sgg"), sido = h.get("sido");
  const sgg0 = RBY.get(sgg)?.l === "sub" ? RBY.get(sgg).p : sgg;   // 세부 단위 코드는 소속 시군구로
  return {
    ind: ind || DEFAULT_IND,
    item: h.get("item") === "crude" ? "crude" : "std",   // 방법론 v1: 표준화율 기본
    // 세부 단위(보건소) 코드는 시군구 선택으로 쓰지 않는다 — 부모 시군구로 올림
    sido: RBY.get(sido)?.l === "sido" ? sido : (RBY.get(sgg0)?.l === "sgg" ? RBY.get(sgg0).p : "001"),
    sgg: RBY.get(sgg0)?.l === "sgg" ? sgg0 : null,
    year: h.get("year") ? +h.get("year") : null,
    scope: h.get("scope") === "sido" ? "sido" : "nation",
    view: ["profile", "compare", "units", "ncd", "corr", "hot", "chronicle"].includes(h.get("view")) ? h.get("view") : "analysis",
    ncdInd: h.get("nind") || null,
    cmp: (h.get("cmp") || "").split(",").filter((c) => c === NAT || RBY.has(c)).slice(0, MAX_CMP),
    rankOpt: {
      weights: h.get("w") === "panel" ? "panel" : h.get("w") === "custom" && h.get("cw")
        ? Object.fromEntries(h.get("cw").split(",").map((v, i) => [DS.domains[i], Math.max(0, Math.min(30, +v || 0))]))
        : "equal",
      smooth: h.get("sm") === "1" ? 1 : 3,
      league: h.get("lg") === "nation" ? "nation" : "league",
      exclude: h.get("ex") !== "0",
    },
  };
}

export default function App() {
  const init = useMemo(readHash, []);
  const [ind, setInd] = useState(init.ind);
  const [item, setItem] = useState(init.item);
  const [sido, setSido] = useState(init.sido);
  const [sgg, setSgg] = useState(init.sgg);
  const [yearSel, setYearSel] = useState(init.year);
  const [scope, setScope] = useState(init.scope);   // 순위·격차·지도 비교 범위: nation | sido
  const [view, setView] = useState(init.view);      // analysis | profile | compare
  const [cmp, setCmp] = useState(init.cmp);         // 비교 대상 코드 목록 (NAT = 전국 중앙값)
  const [rankOpt, setRankOpt] = useState(init.rankOpt); // 순위 산출 방식 (방법론 v1)
  const [ncdInd, setNcdInd] = useState(init.ncdInd);     // 지식베이스 지표 필터
  const [playing, setPlaying] = useState(false);
  const [tip, setTip] = useState(null);
  const [theme, setTheme] = useState(() => document.documentElement.getAttribute("data-theme") || null);

  const sel = RBY.get(sgg || sido);
  const years = ind.years;
  const year = yearSel != null && years.includes(yearSel) ? yearSel : years[years.length - 1];

  useEffect(() => {
    const h = new URLSearchParams({ ind: ind.id, item, sido, ...(sgg ? { sgg } : {}), year: String(year), scope, view,
      ...(cmp.length ? { cmp: cmp.join(",") } : {}),
      w: typeof rankOpt.weights === "object" ? "custom" : rankOpt.weights, sm: String(rankOpt.smooth), lg: rankOpt.league, ex: rankOpt.exclude ? "1" : "0",
      ...(typeof rankOpt.weights === "object" ? { cw: DS.domains.map((d) => rankOpt.weights[d] ?? 0).join(",") } : {}),
      ...(ncdInd ? { nind: ncdInd } : {}) });
    window.history.replaceState(null, "", "#" + h.toString());
  }, [ind, item, sido, sgg, year, scope, view, cmp, rankOpt, ncdInd]);

  // 연도 애니메이션
  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => {
      setYearSel((y) => {
        const cur = y != null && years.includes(y) ? y : years[years.length - 1];
        const i = years.indexOf(cur);
        if (i >= years.length - 1) { setPlaying(false); return cur; }
        return years[i + 1];
      });
    }, 800);
    return () => clearInterval(t);
  }, [playing, years]);
  const togglePlay = () => {
    if (!playing && years.indexOf(year) >= years.length - 1) setYearSel(years[0]);
    setPlaying((p) => !p);
  };

  const selectRegion = (code) => {
    const r = RBY.get(code);
    if (!r) return;
    if (r.l === "sido") { setSido(r.c); setSgg(null); }
    else if (r.l === "sub") { const p = RBY.get(r.p); if (p) { setSido(p.p); setSgg(p.c); } }   // 보건소 세부 단위 → 소속 시군구
    else { setSido(r.p); setSgg(r.c); }
  };
  const [fs, setFs] = useState(() => { try { return Number(localStorage.getItem("hd-fs") || 0); } catch { return 0; } });
  const bumpFs = (d) => setFs((v) => { const n = Math.max(-1, Math.min(2, v + d)); try { localStorage.setItem("hd-fs", String(n)); } catch {} return n; });
  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    setTheme(next);
  };
  const pickFromProfile = (i, y) => { setInd(i); setYearSel(y); setView("analysis"); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const inCmp = cmp.includes(sel.c);
  const addToCompare = () => {
    if (inCmp) { setCmp(cmp.filter((c) => c !== sel.c)); return; }
    if (cmp.length >= MAX_CMP) return;
    // 처음 담을 때는 전국 중앙값을 같이 넣어 비교 기준을 제공
    setCmp(cmp.length ? [...cmp, sel.c] : [NAT, sel.c]);
  };

  const scopeLabel = sel.l === "sido" ? "17개 시도" : scope === "sido" ? `${RBY.get(sel.p).n} 내 시군구` : "전국 시군구";

  return (
    <div className={`viz-root fs-${fs}`}>
      <div className="wrap">
        <header className="top">
          <div>
            <div className="title">지역 건강프로파일 대시보드</div>
            <div className="subtitle">지역사회건강조사 {INDICATORS.filter((i) => !i.outcome).length}개 지표 · 건강수명 · 결과·환경 DB {INDICATORS.filter((i) => i.kdh).length}개 지표 · 시도/시군구 · {DS.years[0]}–{DS.years[DS.years.length - 1]}</div>
          </div>
          <div className="topright">
            <div className="seg views">
              <button className={`seg-btn ${view === "analysis" ? "on" : ""}`} onClick={() => setView("analysis")}>지표 분석</button>
              <button className={`seg-btn ${view === "profile" ? "on" : ""}`} onClick={() => setView("profile")}>지역 프로파일</button>
              <button className={`seg-btn ${view === "compare" ? "on" : ""}`} onClick={() => setView("compare")}>
                지역 비교{cmp.length ? <small className="cnt">{cmp.length}</small> : null}
              </button>
              <button className={`seg-btn ${view === "ncd" ? "on" : ""}`} onClick={() => setView("ncd")}>예방·관리</button>
              <button className={`seg-btn ${view === "corr" ? "on" : ""}`} onClick={() => setView("corr")}>연관지표</button>
              <button className={`seg-btn ${view === "hot" ? "on" : ""}`} onClick={() => setView("hot")}>핫스팟</button>
              <button className={`seg-btn ${view === "chronicle" ? "on" : ""}`} onClick={() => setView("chronicle")}>연대기 전시관</button>
              <button className={`seg-btn ${view === "units" ? "on" : ""}`} onClick={() => setView("units")}>조사 단위</button>
            </div>
            <button className="themebtn" onClick={() => bumpFs(-1)} disabled={fs <= -1} title="글자 작게">A−</button>
            <button className="themebtn" onClick={() => bumpFs(1)} disabled={fs >= 2} title="글자 크게">A+</button>
            <button className="themebtn" onClick={toggleTheme}>{theme === "dark" ? "☀ 라이트" : "☾ 다크"}</button>
          </div>
        </header>

        {!["units", "ncd", "corr", "hot", "chronicle"].includes(view) && <div className="controls">
          {view !== "profile" && <IndicatorPicker ind={ind} onChange={(i) => { setInd(i); setPlaying(false); }} />}
          {view !== "compare" && <RegionPicker sido={sido} sgg={sgg} onSido={(c) => { setSido(c); setSgg(null); }} onSgg={setSgg} />}
          {view !== "compare" && (
            <div className="ctrl">
              <label>비교 담기</label>
              <button className={`themebtn ${inCmp ? "on" : ""}`} onClick={addToCompare} disabled={!inCmp && cmp.length >= MAX_CMP}
                title="지역 비교 화면에 이 지역을 추가/제거">
                {inCmp ? "✓ 담김 (빼기)" : "+ 비교에 추가"}
              </button>
            </div>
          )}
          {view !== "compare" && sel.l === "sgg" && (
            <div className="ctrl">
              <label>비교 범위</label>
              <div className="seg">
                <button className={`seg-btn ${scope === "nation" ? "on" : ""}`} onClick={() => setScope("nation")}>전국</button>
                <button className={`seg-btn ${scope === "sido" ? "on" : ""}`} onClick={() => setScope("sido")}>{RBY.get(sel.p).n}</button>
              </div>
            </div>
          )}
          <ItemToggle item={item} onChange={setItem} ind={ind} />
          {view !== "profile" && <YearControl years={years} year={year} onYear={(y) => { setYearSel(y); setPlaying(false); }} playing={playing} onPlay={togglePlay} />}
        </div>}

        {view === "units" ? (
          <UnitsView setTip={setTip} />
        ) : view === "corr" ? (
          <CorrelationView setTip={setTip} />
        ) : view === "chronicle" ? (
          <ChronicleView setTip={setTip} onPick={(i, y) => { setInd(i); if (y) setYearSel(y); setView("analysis"); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
        ) : view === "hot" ? (
          <HotspotView setTip={setTip} onPick={(i, code, y) => { const r = RBY.get(code); if (!r) return; setInd(i); if (r.l === "sgg") { setSido(r.p); setSgg(code); } else { setSido(code); setSgg(null); } if (y) setYearSel(y); setView("analysis"); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
        ) : view === "ncd" ? (
          <NcdView filterInd={ncdInd} onClearInd={() => setNcdInd(null)} sidoFull={RBY.get(sido)?.n}
            onPickInd={(i) => { if (i) { setInd(i); setView("analysis"); window.scrollTo({ top: 0, behavior: "smooth" }); } }} />
        ) : view === "compare" ? (
          <Compare ind={ind} item={item} year={year} codes={cmp} onCodes={setCmp} onYear={(y) => setYearSel(y)}
            onPick={(i, y) => { setInd(i); setYearSel(y); window.scrollTo({ top: 0, behavior: "smooth" }); }} setTip={setTip} />
        ) : view === "analysis" ? (
          <>
            <Kpis ind={ind} item={item} year={year} sel={sel} />
            <div className="grid2">
              <div className="card span2 mapcard">
                <div className="cardhead">
                  <div>
                    <h3>{year}년 {ind.name} — {scope === "sido" && sel.l === "sgg" ? `${RBY.get(sel.p).n} ` : "전국 "}시군구 단계구분도</h3>
                    <ExportButtons name={`${year}_${ind.name}_지도`} />
                    <div className="desc">7단계 분위({scope === "sido" && sel.l === "sgg" ? RBY.get(sel.p).n : "전국"} 기준) · 지역을 누르면 선택 · ▶ 로 연도 애니메이션</div>
                  </div>
                </div>
                <ChoroplethMap ind={ind} item={item} year={year} sel={sel} scope={sel.l === "sgg" ? scope : "nation"}
                  onSelect={selectRegion} setTip={setTip} />
              </div>

              <div className="card">
                <h3>{ind.name} 추이</h3>
                <ExportButtons name={`${ind.name}_추이_${label(sel)}`} />
                <div className="desc">{years[0]}–{years[years.length - 1]} · {ind.src}</div>
                {ind.dirNote && <div className="desc dirnote"><b>{ind.bad === true ? "높을수록 나쁨" : ind.bad === false ? "높을수록 좋음" : "방향 없음(맥락 지표)"}</b> — {ind.dirNote}{ind.dirRefs?.length ? <> · 근거: {ind.dirRefs.map((r, i) => <a key={i} className="src" style={{ whiteSpace: "normal" }} href={r.url} target="_blank" rel="noreferrer">{r.name}</a>).reduce((a, b) => [a, ", ", b])}</> : null}</div>}
                <TrendChart ind={ind} item={item} year={year} sel={sel} setTip={setTip} />
              </div>

              <div className="card">
                <h3>순위</h3>
                <ExportButtons name={`${year}_${ind.name}_순위_${scopeLabel}`} kinds={["list"]} />
                <div className="desc">{year}년 · 양호한 순 ({ind.bad == null ? "값 큰 순" : ind.bad ? "낮을수록 양호" : "높을수록 양호"})</div>
                <RankPanel ind={ind} item={item} year={year} sel={sel} scope={scope} onSelect={selectRegion} />
              </div>

              <div className="card">
                <h3>연도별 추이표</h3>
                <ExportButtons name={`${ind.name}_연도별_${label(sel)}`} kinds={["csv"]} />
                <div className="desc">수치 · 순위 · 증감량 · 증감률 (행을 누르면 연도 이동)</div>
                <YearTable ind={ind} item={item} sel={sel} year={year} onYear={(y) => setYearSel(y)} />
              </div>

              <div className="card">
                <h3>지역 간 격차 — {scopeLabel}</h3>
                <ExportButtons name={`${ind.name}_격차_${scopeLabel}`} />
                <div className="desc">연도별 분포(상자그림)와 {label(sel)}의 위치</div>
                <GapBoxplot ind={ind} item={item} year={year} sel={sel} scope={scope} setTip={setTip} />
              </div>

              <div className="card">
                <h3>건강형평성 — 지역박탈 5분위별 분포</h3>
                <ExportButtons name={`${year}_${ind.name}_박탈분위`} kinds={["svg", "png"]} />
                <div className="desc">{year}년 · 전국 시군구를 지역박탈지수(근사)로 5등분해 {ind.name} 분포를 비교</div>
                <EquityPanel ind={ind} item={item} year={year} sel={sel} setTip={setTip} />
              </div>
            </div>
          </>
        ) : (
          <Profile item={item} sel={sel} scope={scope} rankOpt={rankOpt} onRankOpt={setRankOpt} onPick={pickFromProfile} setTip={setTip}
            onRecommend={(name) => { setNcdInd(name); setView("ncd"); window.scrollTo({ top: 0, behavior: "smooth" }); }} />
        )}

        <footer>
          자료원: 질병관리청 「지역사회건강조사」 — 통계청 KOSIS 공유서비스(openAPI), 수집일 {DS.generated}.
          {KDH_SOURCE && <> 사망률·감염병·의료이용·자원·인구·환경 지표: <a className="src" style={{ whiteSpace: "normal" }} href={KDH_SOURCE.url} target="_blank" rel="noreferrer">{KDH_SOURCE.name}</a>.</>}
          지도 경계: 통계청 2018 행정구역(행정구역 변경분은 최신 코드로 연결).<br />
          전국 기준값은 전 시군구 중앙값. 표준화율은 연령 표준화 값으로 지역 간 비교에 적합합니다.
          구조는 질병관리청 수도권질병대응센터 CIAT를 참조했습니다.
        </footer>
      </div>
      <Tooltip tip={tip} />
    </div>
  );
}
