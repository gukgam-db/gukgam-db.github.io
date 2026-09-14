import { useEffect, useRef, useState } from "react";
import { fmt, ranked, poolFor, label, SUBS_BY_SGG, val, SIDOS, SGG_ALL, SGG_BY_SIDO, RBY, HC_POOL } from "../data";

/* 순위: 비교 집단(전국 시군구 / 시도 내 시군구 / 17개 시도) 막대. 선택 지역 자동 스크롤 */
export default function RankPanel({ ind, item, year, sel, scope, onSelect }) {
  // 순위 집단 탭: 17개 시도 · 전국 시군구 · 시도 내 시군구 (기본은 선택 지역에 따라 자동)
  const sidoCode = sel.l === "sido" ? sel.c : sel.p;
  const sidoName = RBY.get(sidoCode)?.n || "";
  const [mode, setMode] = useState("auto");
  useEffect(() => setMode("auto"), [sel.c, scope]);
  // 기본: 시도를 고르면 그 시도의 시군구 순위, 시군구를 고르면 비교 범위(전국/시도)에 따라. 17개 시도 순위는 탭으로.
  const auto = sel.l === "sido" ? "insido" : scope === "sido" ? "insido" : "nation";
  const m = mode === "auto" ? auto : mode;
  const pool = m === "sido" ? SIDOS : m === "nation" ? SGG_ALL : m === "insido" ? SGG_BY_SIDO[sidoCode] : m === "hc" ? HC_POOL : poolFor(sel, scope);
  const [rev, setRev] = useState(false);
  const rowsAsc = ranked(ind, item, year, pool);
  const rows = rev ? [...rowsAsc].reverse() : rowsAsc;
  const rankNo = (k) => (rev ? rows.length - k : k + 1);
  const TABS = [["sido", "17개 시도"], ["nation", "전국 시군구"], ["insido", `${sidoName} 시군구`], ["hc", "보건소 단위"]];
  const hcOf = (c) => HC_POOL.find((u) => u.c === c);
  const max = rows.length ? Math.max(...rows.map((x) => x.v)) : 1;
  const listRef = useRef(null);
  useEffect(() => {
    const el = listRef.current?.querySelector(".rrow.sel");
    if (el && listRef.current) {
      const top = el.offsetTop - listRef.current.clientHeight / 2 + el.clientHeight / 2;
      listRef.current.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    }
  }, [ind, item, year, sel, scope, m]);

  const subs = sel.l === "sgg" ? SUBS_BY_SGG[sel.c] : null;

  const mine = (r) => r.c === sel.c || (sel.l === "sido" && m !== "insido" && (r.p === sel.c || r.s === sel.s)) || (m === "hc" && sel.l === "sgg" && r.l === "sub" && r.p === sel.c);
  const rowLabel = (r) => m === "hc" ? (r.hc || label(r)) : m === "nation" && r.l === "sgg" ? `${r.s} ${r.n}` : r.n;
  return (
    <>
      <div className="seg" style={{ marginBottom: 8, flexWrap: "wrap" }}>
        {TABS.map(([k, name]) => <button key={k} className={`seg-btn ${m === k ? "on" : ""}`} onClick={() => setMode(k)}>{name}</button>)}
        <span className="muted" style={{ alignSelf: "center", fontSize: "13px", marginLeft: 6 }}>{rows.length}개</span>
        <button className={`seg-btn ${rev ? "on" : ""}`} style={{ marginLeft: "auto" }} onClick={() => setRev(!rev)} title="양호한 순 ↔ 나쁜 순">{rev ? "나쁜 순 ▲" : "양호한 순 ▼"}</button>
      </div>
      {m === "hc" && <div className="desc" style={{ marginBottom: 6 }}>조사 단위(보건소)별 순위 — 질병관리청 「2025 지역건강통계 한눈에 보기」 부록의 시군구별 표 기준 258개 조사 단위(일반구가 있는 시는 보건소별 행, 시 전체 행 제외, 세종은 세종특별자치시보건소)</div>}
      <div className="rank scroll" ref={listRef}>
        {rows.map(({ r, v }, k) => (
          <div key={r.c} className={`rrow ${r.c === sel.c ? "sel" : ""} ${mine(r) ? "mine" : ""}`} onClick={() => onSelect(r.l === "sub" ? r.p : r.c)} title={r.l === "sub" ? `${label(r)} → 소속 시군구 선택` : undefined}>
            <div className="rn">{rankNo(k)}</div>
            <div className="rl" title={label(r)}>{rowLabel(r)}</div>
            <div className="bar-track"><div className="bar" style={{ width: `${((v / max) * 100).toFixed(1)}%` }} /></div>
            <div className="rv">{fmt(v)}</div>
          </div>
        ))}
        {!rows.length && <div className="empty">해당 연도 자료 없음</div>}
      </div>
      {subs && (
        <div className="subs">
          <div className="desc">보건소별 세부 단위 ({year}년)</div>
          {subs.map((s) => (
            <span key={s.c} className="subchip">{s.n} <b>{fmt(val(ind, item, year, s.c))}</b></span>
          ))}
        </div>
      )}
    </>
  );
}
