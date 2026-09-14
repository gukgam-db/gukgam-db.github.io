import { useMemo, useState } from "react";
import { NCD, DOMAINS, INDICATORS, SIDOS } from "../data";
import ExportButtons from "./ExportButtons";

const LEVELS = ["global", "regional", "national", "sido"];
const LEVEL_SHORT = { global: "WHO 글로벌", regional: "WPRO 서태평양", national: "국가", sido: "시도" };

/* 만성질환 예방·관리 탭: 국제→지역→국가→시도 계층 지식베이스 */
export default function NcdView({ filterInd, onClearInd, sidoFull, onPickInd }) {
  const [level, setLevel] = useState("all");
  const [area, setArea] = useState("all");
  const [sido, setSido] = useState(sidoFull || "all");
  const [q, setQ] = useState("");
  const [showDocs, setShowDocs] = useState(false);
  const indByName = Object.fromEntries(INDICATORS.map((i) => [i.name, i]));

  const list = useMemo(() => NCD.entries.filter((e) =>
    (level === "all" || e.level === level) &&
    (area === "all" || e.area === area) &&
    (!filterInd || e.linked.includes(filterInd)) &&
    (e.level !== "sido" || sido === "all" || e.sido === sido) &&
    (!q || [e.goal, ...(e.strategies || []), ...(e.interventions || []), e.source].join(" ").includes(q))
  ), [level, area, sido, q, filterInd]);
  const counts = Object.fromEntries(LEVELS.map((l) => [l, NCD.entries.filter((e) => e.level === l).length]));
  const sidoList = [...new Set(NCD.entries.filter((e) => e.level === "sido" && e.sido).map((e) => e.sido))];

  return (
    <div className="ncd">
      <div className="card">
        <h3>만성질환 예방·관리 지식베이스</h3>
        <div className="desc">WHO 글로벌 NCD 액션플랜 → 서태평양 지역 액션플랜 → HP2030·국가 사업 → 17개 시도 지역보건의료계획. 항목마다 대시보드 지표를 연결해, 프로파일에서 지표가 낮을 때 권고 사업으로 이어집니다. 수집일 {NCD.generated} · {NCD.entries.length}개 항목 · 문서 {NCD.documents.length}건</div>
        <div className="setrow">
          <div className="setitem"><label>계층</label>
            <div className="seg">
              <button className={`seg-btn ${level === "all" ? "on" : ""}`} onClick={() => setLevel("all")}>전체 {NCD.entries.length}</button>
              {LEVELS.map((l) => <button key={l} className={`seg-btn ${level === l ? "on" : ""}`} onClick={() => setLevel(l)}>{LEVEL_SHORT[l]} {counts[l]}</button>)}
            </div>
          </div>
          {(level === "sido" || level === "all") && sidoList.length > 0 && (
            <div className="setitem"><label>시도</label>
              <select value={sido} onChange={(e) => setSido(e.target.value)}>
                <option value="all">전체</option>
                {SIDOS.map((s) => sidoList.includes(s.n) && <option key={s.c} value={s.n}>{s.n}</option>)}
              </select>
            </div>
          )}
          <div className="setitem" style={{ flex: "1 1 200px" }}><label>검색</label>
            <input className="pick-search" style={{ marginBottom: 0 }} placeholder="목표·전략·사업 검색" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>
        <div className="chips" style={{ marginTop: 10 }}>
          <button className={`chip ${area === "all" ? "on" : ""}`} onClick={() => setArea("all")}>모든 영역</button>
          {[...DOMAINS, "공통"].map((d) => <button key={d} className={`chip ${area === d ? "on" : ""}`} onClick={() => setArea(d)}>{d} <small>{NCD.entries.filter((e) => e.area === d).length}</small></button>)}
        </div>
        {filterInd && <div className="badgesrow"><span className="subchip on">지표 필터: <b>{filterInd}</b></span><button className="themebtn" onClick={onClearInd}>필터 해제</button></div>}
      </div>

      <div className="card">
        <h3>항목 {list.length}개 <small className="muted">계층 순: 시도 → 국가 → 서태평양 → 국제</small></h3>
        <ExportButtons name="만성질환_지식베이스" kinds={["csv"]} />
        <div className="ncdlist">
          {[...list].sort((a, b) => ["sido", "national", "regional", "global"].indexOf(a.level) - ["sido", "national", "regional", "global"].indexOf(b.level)).map((e) => (
            <article key={e.id} className={`ncdcard lv-${e.level}`}>
              <div className="ncdhead">
                <span className={`lvbadge lv-${e.level}`}>{LEVEL_SHORT[e.level]}{e.sido ? ` · ${e.sido}` : ""}</span>
                <span className="subchip">{e.area}</span>
              </div>
              <div className="ncdgoal">{e.goal}</div>
              {e.target && (e.target.indicator || e.target.target_value) && (
                <div className="ncdtarget">목표: {e.target.indicator || ""} {e.target.baseline ? `${e.target.baseline} → ` : ""}<b>{e.target.target_value ?? "–"}</b>{e.target.target_year ? ` (${e.target.target_year})` : ""}</div>
              )}
              {e.strategies?.length > 0 && <ul className="ncdul">{e.strategies.map((s, i) => <li key={i}>{s}</li>)}</ul>}
              {e.interventions?.length > 0 && <div className="ncdint">{e.interventions.map((s, i) => <span key={i} className="intchip">{s}</span>)}</div>}
              <div className="ncdfoot">
                <span className="linked">{e.linked.map((n) => <button key={n} className="indlink" onClick={() => onPickInd(indByName[n])} title="지표 분석으로 이동">{n}</button>)}</span>
                {e.url ? <a href={e.url} target="_blank" rel="noopener" className="src">{e.source || "출처"} ↗</a> : <span className="src muted">{e.source}</span>}
              </div>
            </article>
          ))}
          {!list.length && <div className="empty">조건에 맞는 항목이 없습니다</div>}
        </div>
        {/* CSV 내보내기용 숨은 표 */}
        <table hidden><thead><tr><th>계층</th><th>시도</th><th>영역</th><th>목표</th><th>목표치</th><th>전략</th><th>중재/사업</th><th>연결 지표</th><th>출처</th><th>URL</th></tr></thead>
          <tbody>{list.map((e) => <tr key={e.id}><td>{LEVEL_SHORT[e.level]}</td><td>{e.sido || ""}</td><td>{e.area}</td><td>{e.goal}</td><td>{e.target ? `${e.target.indicator || ""} ${e.target.target_value || ""} ${e.target.target_year || ""}` : ""}</td><td>{(e.strategies || []).join(" / ")}</td><td>{(e.interventions || []).join(" / ")}</td><td>{e.linked.join(", ")}</td><td>{e.source}</td><td>{e.url}</td></tr>)}</tbody></table>
      </div>

      <div className="card">
        <h3>수집 문서 {NCD.documents.length}건 <button className="themebtn" onClick={() => setShowDocs((s) => !s)}>{showDocs ? "접기" : "펼치기"}</button></h3>
        {showDocs && (
          <div className="tblscroll"><table className="yeartbl">
            <thead><tr><th>계층</th><th>문서</th><th>기관</th><th>연도/기간</th><th>확보</th><th>비고</th></tr></thead>
            <tbody>{NCD.documents.map((d, i) => <tr key={i}><td>{LEVEL_SHORT[d.level]}</td><td className="tl">{d.url ? <a href={d.url} target="_blank" rel="noopener">{d.title}</a> : d.title}</td><td>{d.org}</td><td>{d.period || d.year}</td><td>{d.found ? "○" : "×"}</td><td className="muted">{d.note}</td></tr>)}</tbody>
          </table></div>
        )}
        {NCD.notes?.length > 0 && showDocs && <ul className="ncdul muted">{NCD.notes.map((n, i) => <li key={i}>{n}</li>)}</ul>}
      </div>
    </div>
  );
}
