import { useEffect, useMemo, useRef, useState } from "react";
import { DOMAINS_ALL as DOMAINS, IND_BY_DOMAIN, INDICATORS, SIDOS, SGG_BY_SIDO, ITEMS } from "../data";

/* 지표 탐색기: 영역 칩 + 검색 + 목록 */
export function IndicatorPicker({ ind, onChange }) {
  const [domain, setDomain] = useState(ind.domain);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);

  useEffect(() => {
    const close = (e) => { if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const list = useMemo(() => {
    const base = q ? INDICATORS.filter((i) => i.name.includes(q)) : IND_BY_DOMAIN[domain];
    return base;
  }, [domain, q]);

  return (
    <div className="picker" ref={boxRef}>
      <label>지표</label>
      <button className="pick-btn" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span className="pick-domain">{ind.domain}</span>
        <span className="pick-name">{ind.name}</span>
        <span className="pick-caret">▾</span>
      </button>
      {open && (
        <div className="pick-panel">
          <input className="pick-search" placeholder="지표 검색 (예: 흡연, 우울)" value={q}
            onChange={(e) => setQ(e.target.value)} autoFocus />
          {!q && (
            <div className="chips">
              {DOMAINS.map((d) => (
                <button key={d} className={`chip ${d === domain ? "on" : ""}`} onClick={() => setDomain(d)}>
                  {d} <small>{IND_BY_DOMAIN[d].length}</small>
                </button>
              ))}
            </div>
          )}
          <div className="pick-list">
            {list.map((i) => (
              <button key={i.id} className={`pick-item ${i.id === ind.id ? "on" : ""}`}
                onClick={() => { onChange(i); setOpen(false); setQ(""); setDomain(i.domain); }}>
                <span>{i.name}</span>
                <small>{i.years[0]}–{i.years[i.years.length - 1]} · {i.bad === null ? "중립" : i.bad ? "낮을수록 양호" : "높을수록 양호"}</small>
              </button>
            ))}
            {!list.length && <div className="pick-empty">검색 결과 없음</div>}
          </div>
        </div>
      )}
    </div>
  );
}

/* 지역 선택: 시도 → 시군구 */
export function RegionPicker({ sido, sgg, onSido, onSgg }) {
  const sggs = SGG_BY_SIDO[sido] || [];
  return (
    <>
      <div className="ctrl">
        <label htmlFor="selSido">시도</label>
        <select id="selSido" value={sido} onChange={(e) => onSido(e.target.value)}>
          {SIDOS.map((s) => <option key={s.c} value={s.c}>{s.n}</option>)}
        </select>
      </div>
      <div className="ctrl">
        <label htmlFor="selSgg">시군구</label>
        <select id="selSgg" value={sgg || ""} onChange={(e) => onSgg(e.target.value || null)}>
          <option value="">시도 전체</option>
          {sggs.map((r) => <option key={r.c} value={r.c}>{r.n}</option>)}
        </select>
      </div>
    </>
  );
}

/* 연도 슬라이더 + 재생 */
export function YearControl({ years, year, onYear, playing, onPlay }) {
  const idx = years.indexOf(year);
  return (
    <div className="ctrl yearctrl">
      <label htmlFor="selYear">연도</label>
      <div className="yearrow">
        <button className="playbtn" onClick={onPlay} aria-label={playing ? "정지" : "연도 애니메이션 재생"}>
          {playing ? "■" : "▶"}
        </button>
        <input id="selYear" type="range" min="0" max={years.length - 1} value={idx}
          onChange={(e) => onYear(years[+e.target.value])} />
        <span className="yearval">{year}년</span>
      </div>
    </div>
  );
}

/* 조율/표준화율 토글 */
export function ItemToggle({ item, onChange, ind }) {
  if (ind?.outcome) {
    return (
      <div className="ctrl">
        <label>값 유형</label>
        <div className="desc" style={{ marginTop: 6 }}>{ind.kdh ? "DB 원자료 값(표준화사망률은 연령표준화)" : "산출값(조율·표준화 구분 없음)"}</div>
      </div>
    );
  }
  return (
    <div className="ctrl">
      <label>값 유형 <span className="hint" title="표준화율: 지역 간 연령 구조 차이를 보정한 값. 지역 비교에는 표준화율을 권장">ⓘ</span></label>
      <div className="seg">
        {Object.entries(ITEMS).map(([k, name]) => (
          <button key={k} className={`seg-btn ${item === k ? "on" : ""}`} onClick={() => onChange(k)}>{name}</button>
        ))}
      </div>
    </div>
  );
}
