import { useEffect, useMemo, useRef, useState } from "react";
import { INDICATORS, DS, SIDOS, SGG_ALL, val, fmt, nationalMedian, NCD } from "../data";
import EV from "../../../data/chronicle_events.json";
import S25 from "../../../data/chs2025_summary25.json";

/* 지역건강 연대기 전시관 — 박물관형 3D 복도(연도별 전시실) + 데이터가 쓰는 '올해의 10대 뉴스' + 정책·제도 연표(링크만) + 변화의 벽
   원칙: 지침·백서 원문은 보관하지 않고 링크만 둔다. 뉴스는 지역사회건강조사 시군구 중앙값(표준화율)의 전년 대비 변화로 자동 산출. */
const YEARS = DS.years;
const CHS = INDICATORS.filter((i) => !i.kdh && !i.outcome && !i.dep && i.bad != null && i.years.length >= 2);
const CAT = EV.categories;
const CAT_ICON = { survey: "📋", law: "⚖️", plan: "🗺️", program: "🏥", crisis: "🦠", admin: "🏛️", intl: "🌐" };
const TOPICS = ["조사", "흡연", "음주", "신체활동", "영양", "정신건강", "심뇌혈관", "만성질환", "감염병", "법·제도", "국가계획", "사업", "행정구역", "국제"];
const DOMAIN_TOPIC = { "흡연": "흡연", "음주": "음주", "신체활동": "신체활동", "식생활·비만": "영양", "정신건강": "정신건강", "만성질환": "심뇌혈관", "예방접종·검진": "감염병" };
const norm = (s) => String(s).replace(/[\s()·]/g, "");
const WALL = S25.names.map((n) => CHS.find((i) => norm(i.name) === norm(n)) || CHS.find((i) => norm(n).includes(norm(i.name)) || norm(i.name).includes(norm(n)))).filter(Boolean);
const docYear = (d) => { const m = String(d.year || "").match(/\d{4}/); return m ? +m[0] : null; };
const DOCS = NCD.documents.map((d) => ({ ...d, y: docYear(d) })).filter((d) => d.y);

const sign = (x) => (x > 0 ? "+" : "");
const punit = (u) => (u === "%" ? "%p" : u);

export default function ChronicleView({ setTip, onPick }) {
  const latest = YEARS[YEARS.length - 1];
  const [year, setYear] = useState(latest);
  const [play, setPlay] = useState(false);
  const [topic, setTopic] = useState(null);
  const yearsAll = useMemo(() => [...YEARS, ...Object.keys(EV.eras).map(Number).filter((y) => !YEARS.includes(y))].sort(), []);
  useEffect(() => { if (!play) return; const t = setInterval(() => setYear((y) => { const i = yearsAll.indexOf(y); return i >= yearsAll.length - 1 ? yearsAll[0] : yearsAll[i + 1]; }), 1700); return () => clearInterval(t); }, [play, yearsAll]);
  useEffect(() => { const h = (e) => { if (e.key === "ArrowRight") setYear((y) => yearsAll[Math.min(yearsAll.length - 1, yearsAll.indexOf(y) + 1)]); if (e.key === "ArrowLeft") setYear((y) => yearsAll[Math.max(0, yearsAll.indexOf(y) - 1)]); }; window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h); }, [yearsAll]);

  // 지표별 전국(시군구 중앙값) 시계열·시도 격차
  const MED = useMemo(() => Object.fromEntries(CHS.map((ind) => [ind.id, Object.fromEntries(ind.years.map((y) => [y, nationalMedian(ind, "std", y)]))])), []);
  const SPREAD = useMemo(() => Object.fromEntries(CHS.map((ind) => [ind.id, Object.fromEntries(ind.years.map((y) => { const vs = SIDOS.map((s) => val(ind, "std", y, s.c)).filter((v) => v != null); return [y, vs.length > 3 ? Math.max(...vs) - Math.min(...vs) : null]; }))])), []);

  // 올해의 10대 뉴스 (연도별 자동 산출)
  const NEWS = useMemo(() => {
    const out = {};
    for (const y of YEARS) {
      const items = [];
      for (const ind of CHS) {
        const v = MED[ind.id][y], p = MED[ind.id][y - 1];
        if (v == null) continue;
        const hist = ind.years.filter((yy) => yy <= y).map((yy) => MED[ind.id][yy]).filter((x) => x != null);
        const isMax = hist.length > 2 && v >= Math.max(...hist), isMin = hist.length > 2 && v <= Math.min(...hist);
        const record = ind.bad ? (isMin ? ["역대 최저", true] : isMax ? ["역대 최고", false] : null) : (isMax ? ["역대 최고", true] : isMin ? ["역대 최저", false] : null);
        if (p == null) { if (record) items.push({ kind: "record", ind, v, p: null, d: 0, rel: 0, good: record[1], record: record[0], score: 5 }); continue; }
        const d = v - p, rel = p ? (d / Math.abs(p)) * 100 : 0;
        const good = ind.bad ? d < 0 : d > 0;
        items.push({ kind: "change", ind, v, p, d, rel, good, record: record?.[0] || null, score: Math.abs(rel) + (record ? 8 : 0) + (Math.abs(d) < 0.3 ? -6 : 0) });
        const s = SPREAD[ind.id][y], sp = SPREAD[ind.id][y - 1];
        if (s != null && sp != null && sp > 0) { const gd = s - sp; items.push({ kind: "gap", ind, v: s, p: sp, d: gd, rel: (gd / sp) * 100, good: gd < 0, record: null, score: Math.abs(gd / sp) * 30 - 2 }); }
      }
      items.sort((a, b) => b.score - a.score);
      const picked = [], perDomain = {}, perInd = {}; let gaps = 0;
      for (const it of items) {
        const k = it.ind.domain; if ((perDomain[k] || 0) >= 3 || (perInd[it.ind.id] || 0) >= 1) continue;
        if (it.kind === "gap") { if (gaps >= 3) continue; gaps++; }   // 격차 뉴스는 연도당 최대 3개
        picked.push(it); perDomain[k] = (perDomain[k] || 0) + 1; perInd[it.ind.id] = 1;
        if (picked.length >= 10) break;
      }
      out[y] = picked.map((it, i) => ({ ...it, rank: i + 1 }));
    }
    return out;
  }, [MED, SPREAD]);

  const topicOf = (ind) => DOMAIN_TOPIC[ind.domain] || ind.domain;
  const news = (NEWS[year] || []).filter((it) => !topic || topicOf(it.ind) === topic);
  const events = EV.events.filter((e) => e.year === year && (!topic || (e.topics || []).includes(topic)));
  const docs = DOCS.filter((d) => d.y === year);
  const era = EV.eras[String(year)] || "";
  const cur = yearsAll.indexOf(year);

  const headline = (it) => {
    const u = it.ind.unit || "";
    if (it.kind === "gap") return `${it.ind.name} 시도 간 격차 ${fmt(it.p)}→${fmt(it.v)}${punit(u)} · ${it.d < 0 ? "축소" : "확대"}`;
    if (it.kind === "record") return `${it.ind.name} ${fmt(it.v)}${u} · ${it.record}`;
    return `${it.ind.name} ${fmt(it.p)}→${fmt(it.v)}${u} (${sign(it.d)}${fmt(it.d)}${punit(u)})`;
  };
  const Spark = ({ ind, y, good }) => {
    const ys = ind.years, vs = ys.map((yy) => MED[ind.id][yy]); const ok = vs.filter((v) => v != null);
    if (ok.length < 2) return null;
    const lo = Math.min(...ok), hi = Math.max(...ok), W = 120, H = 30;
    const px = (i) => 3 + (W - 6) * (i / (ys.length - 1)), py = (v) => 3 + (H - 6) * (1 - (v - lo) / ((hi - lo) || 1));
    const d = vs.map((v, i) => (v == null ? null : `${i ? "L" : "M"}${px(i).toFixed(1)},${py(v).toFixed(1)}`)).filter(Boolean).join(" ");
    const yi = ys.indexOf(y), v = vs[yi];
    return (
      <svg className="mspark" viewBox={`0 0 ${W} ${H}`} width={W} height={H} aria-hidden="true">
        <path d={d} fill="none" stroke="var(--m-muted)" strokeWidth="1.5" />
        {v != null && <circle cx={px(yi)} cy={py(v)} r="3.5" fill={good ? "var(--m-good)" : "var(--m-bad)"} stroke="var(--m-bg)" strokeWidth="1.5" />}
      </svg>
    );
  };

  const goto = (ind) => { if (onPick) onPick(ind, YEARS.includes(year) ? year : latest); };
  const plaqueOf = (y, i) => {
    const k = i - cur; if (Math.abs(k) > 5) return null;
    const n = (NEWS[y] || []).length, m = EV.events.filter((e) => e.year === y).length;
    const style = { transform: `translate(-50%,-50%) translate3d(${k * 150}px, ${Math.abs(k) * 6}px, ${-Math.abs(k) * 150}px) rotateY(${k > 0 ? -16 : k < 0 ? 16 : 0}deg)`, zIndex: 50 - Math.abs(k), opacity: Math.max(0.18, 1 - Math.abs(k) * 0.17) };
    return (
      <button key={y} className={`plaque ${k === 0 ? "cur" : ""}`} style={style} onClick={() => setYear(y)} aria-label={`${y}년 전시실`}>
        <div className="p-year">{y}</div>
        <div className="p-era">{EV.eras[String(y)] || ""}</div>
        <div className="p-meta">{n ? `뉴스 ${n}` : "자료 없음"} · 사건 {m}</div>
      </button>
    );
  };

  return (
    <div className="museum">
      <header className="m-head">
        <div className="m-title">
          <div className="m-kicker">KOREA COMMUNITY HEALTH · CHRONICLE HALL</div>
          <h2>지역건강 연대기 전시관 <span className="m-years">2008 → {latest}</span></h2>
          <p>지침·백서·계획은 원문 대신 <b>링크</b>로, 그 시대의 건강은 <b>데이터</b>로 전시합니다. 전시실을 고르면 그해 시군구 중앙값이 가장 크게 움직인 지표 10개("올해의 10대 뉴스"), 그해의 법·제도·계획·위기, 발간 자료를 한 벽에 겁니다. ← → 키로 이동, ▶로 자동 관람.</p>
        </div>
        <div className="m-ctrl">
          <button className={`m-play ${play ? "on" : ""}`} onClick={() => setPlay(!play)}>{play ? "■ 정지" : "▶ 자동 관람"}</button>
          <div className="m-yearbar">{yearsAll.map((y) => <button key={y} className={`m-ychip ${y === year ? "on" : ""} ${!YEARS.includes(y) ? "noData" : ""}`} onClick={() => setYear(y)}>{String(y).slice(2)}</button>)}</div>
        </div>
      </header>

      <div className="hall" role="listbox" aria-label="연도별 전시실">
        <div className="hall-floor" />
        <div className="hall-light" />
        {yearsAll.map((y, i) => plaqueOf(y, i))}
        <button className="hall-nav prev" onClick={() => setYear(yearsAll[Math.max(0, cur - 1)])} aria-label="이전 연도">‹</button>
        <button className="hall-nav next" onClick={() => setYear(yearsAll[Math.min(yearsAll.length - 1, cur + 1)])} aria-label="다음 연도">›</button>
      </div>

      <div className="m-topics">
        <button className={`m-tchip ${!topic ? "on" : ""}`} onClick={() => setTopic(null)}>전체</button>
        {TOPICS.map((t) => <button key={t} className={`m-tchip ${topic === t ? "on" : ""}`} onClick={() => setTopic(topic === t ? null : t)}>{t}</button>)}
      </div>

      <section className="room">
        <div className="room-head">
          <div className="room-no">제{cur + 1}전시실</div>
          <h3><span className="room-year">{year}</span> {era}</h3>
        </div>
        <div className="room-grid">
          <div className="m-card news">
            <div className="m-cardhead"><span className="m-icon">📰</span><h4>올해의 10대 뉴스 <small>시군구 중앙값(표준화율) 전년 대비 · 자동 산출</small></h4></div>
            {news.length === 0 && <div className="m-empty">{YEARS.includes(year) ? "이 주제의 지표 변화가 없습니다" : "조사 자료가 아직 없는 해입니다 — 사건·자료만 전시"}</div>}
            <ol className="m-news">
              {news.map((it) => (
                <li key={it.rank + it.ind.id} className={`m-item ${it.good ? "good" : "bad"}`} onClick={() => goto(it.ind)} title="지표 분석으로 이동">
                  <div className="m-rank">{it.rank}</div>
                  <div className="m-body">
                    <div className="m-hl">{headline(it)}</div>
                    <div className="m-sub">
                      <span className={`m-badge ${it.good ? "good" : "bad"}`}>{it.kind === "gap" ? (it.good ? "격차 축소" : "격차 확대") : it.good ? "개선" : "악화"}</span>
                      {it.record && <span className="m-badge rec">{it.record}</span>}
                      <span className="m-dom">{it.ind.domain}</span>
                      {it.kind === "change" && <span className="m-rel">{sign(it.rel)}{fmt(it.rel, 1)}%</span>}
                    </div>
                  </div>
                  <Spark ind={it.ind} y={year} good={it.good} />
                </li>
              ))}
            </ol>
            {YEARS.includes(year) && year === YEARS[0] && <div className="m-note">첫해는 전년 비교가 없어 뉴스 대신 사건·자료를 전시합니다. 2009년부터 자동 산출됩니다.</div>}
          </div>

          <div className="m-card events">
            <div className="m-cardhead"><span className="m-icon">🏛️</span><h4>그해의 법·제도·계획·사건 <small>링크만 보관 · AI 정리, 원문 확인 필요</small></h4></div>
            {events.length === 0 && <div className="m-empty">등록된 사건이 없습니다</div>}
            <ul className="m-events">
              {events.map((e, i) => (
                <li key={i} className={`m-ev cat-${e.cat}`}>
                  <div className="m-evhead"><span className="m-cat">{CAT_ICON[e.cat]} {CAT[e.cat]}</span><span className="m-org">{e.org}</span></div>
                  <div className="m-evtitle">{e.url ? <a href={e.url} target="_blank" rel="noreferrer">{e.title} ↗</a> : e.title}</div>
                  <div className="m-evsum">{e.summary}</div>
                  {e.topics && <div className="m-evtags">{e.topics.map((t) => <span key={t} className="m-tag">{t}</span>)}</div>}
                </li>
              ))}
            </ul>
            {docs.length > 0 && (
              <div className="m-shelf">
                <div className="m-shelfhead">📚 그해 발간 자료 <small>{docs.length}건 · 원문 링크</small></div>
                {docs.map((d, i) => (
                  <a key={i} className="m-doc" href={d.url || "#"} target="_blank" rel="noreferrer" title={d.note || ""}>
                    <span className={`m-lvl lv-${d.level}`}>{{ global: "WHO", regional: "WPRO", national: "국가", sido: "시도" }[d.level] || d.level}</span>
                    <span className="m-doctitle">{d.title}</span>
                    <span className="m-docorg">{d.org}</span>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="wall">
        <div className="m-cardhead"><span className="m-icon">🧱</span><h4>변화의 벽 <small>「한눈에 보기」 25개 지표 중 시군구 자료가 있는 {WALL.length}개 · 전국 시군구 중앙값 · 막대는 그 지표의 역대 최댓값 대비 · ▶ 재생 시 해마다 움직임</small></h4></div>
        <div className="wall-grid">
          {WALL.map((ind) => {
            const v = MED[ind.id][year], p = MED[ind.id][year - 1], base = MED[ind.id][ind.years[0]];
            const mx = Math.max(...ind.years.map((y) => MED[ind.id][y]).filter((x) => x != null));
            const d = v != null && p != null ? v - p : null, good = d == null ? null : ind.bad ? d < 0 : d > 0;
            const db = v != null && base != null ? v - base : null;
            return (
              <div key={ind.id} className={`tile ${v == null ? "na" : ""}`} onClick={() => goto(ind)} title="지표 분석으로 이동"
                onMouseMove={(ev) => setTip && setTip({ x: ev.clientX, y: ev.clientY, title: ind.name, rows: [[`${year} 중앙값`, v == null ? "–" : fmt(v) + ind.unit], ["전년 대비", d == null ? "–" : sign(d) + fmt(d) + punit(ind.unit)], [`${ind.years[0]} 대비`, db == null ? "–" : sign(db) + fmt(db) + punit(ind.unit)], ["방향", ind.bad ? "낮을수록 양호 ↓" : "높을수록 양호 ↑"]] })}
                onMouseLeave={() => setTip && setTip(null)}>
                <div className="t-name">{ind.name} <span className="t-dir">{ind.bad ? "↓" : "↑"}</span></div>
                <div className="t-val">{v == null ? "–" : fmt(v)}<small>{v == null ? "" : ind.unit}</small></div>
                <div className="t-bar"><div className="t-fill" style={{ width: v == null ? 0 : `${(v / mx) * 100}%` }} /></div>
                <div className="t-foot">
                  <span className={`t-delta ${good == null ? "" : good ? "good" : "bad"}`}>{d == null ? "전년 자료 없음" : `${sign(d)}${fmt(d)}${punit(ind.unit)} ${good ? "개선" : "악화"}`}</span>
                  <span className="t-base">{db == null ? "" : `${ind.years[0]}년 대비 ${sign(db)}${fmt(db)}`}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
      <div className="m-foot">전시 원칙: 문서 원문은 보관하지 않고 발행기관 링크만 둡니다. 연도 표제와 사건 요약은 편집자(AI) 정리이므로 인용 전 원문을 확인하세요. 뉴스 순위 = |전년 대비 상대변화| + 역대 기록 가산, 영역당 최대 3개·격차 뉴스 최대 3개.</div>
    </div>
  );
}
