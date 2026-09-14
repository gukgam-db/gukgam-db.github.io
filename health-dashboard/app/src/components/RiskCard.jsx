import { useMemo, useState } from "react";
import { RISK, riskOf, riskRank, fmt, label, RBY } from "../data";
import ExportButtons from "./ExportButtons";

const CATS = ["연령", "기저질환", "임신부·영유아", "감염취약시설", "사회적 취약", "예방접종", "감염병", "대응 자원"];
const nf = (v) => (v == null ? "–" : Math.round(v).toLocaleString("ko-KR"));

/* 감염병 대응 고위험군 규모 (프로파일 카드) */
export default function RiskCard({ sel, pool, poolName }) {
  const rec = riskOf(sel.c);
  const [cat, setCat] = useState("전체");
  const rows = useMemo(() => {
    if (!rec) return [];
    return RISK.groups.filter((g) => rec[g.id]).map((g) => {
      const x = rec[g.id]; const pct = (x.v / rec.pop) * 100;
      const rk = riskRank(g.id, sel.c, pool);
      return { g, v: x.v, y: x.y, pct, rank: rk.rank, n: rk.n, median: rk.median, sum: x.sum };
    });
  }, [rec, sel, pool]);
  if (!rec) {
    return <div className="card span2 risk"><h3>감염병 대응 고위험군</h3><div className="desc">이 지역은 연령별 인구 자료가 없어 표시하지 않습니다.</div></div>;
  }
  const head = (id) => rows.find((r) => r.g.id === id);
  const a65 = head("age65"), ltc = head("ltc_fac_cap"), htn = head("htn_est"), dm = head("dm_est");
  const shown = rows.filter((r) => cat === "전체" || r.g.cat === cat);
  return (
    <div className="card span2 risk">
      <h3>감염병 대응 고위험군 <small className="muted">(규모 추정 · 집단 간 중복 있음)</small></h3>
      <ExportButtons name={`${label(sel)}_고위험군`} kinds={["list"]} />
      <div className="desc">
        질병관리청 코로나19·인플루엔자·감염취약시설 지침의 고위험군 정의를 지역 자료로 옮긴 것입니다. "실측"은 행정·건강보험 인원, "추정"은 지역사회건강조사 유병률 × 해당 연령 인구입니다.
        집단은 서로 겹치므로(65세 이상이면서 고혈압 등) 더하지 않습니다. 인구 기준 {RISK.pop_year}년 연앙인구 {nf(rec.pop)}명.
      </div>
      <div className="hle-grid">
        <div className="kpi"><div className="k-label">65세 이상</div><div className="k-value">{nf(a65?.v)}<small> 명</small></div><div className="k-sub">인구의 {fmt(a65?.pct)}% · {poolName} {a65?.rank ?? "–"}위 / {a65?.n}</div></div>
        <div className="kpi"><div className="k-label">고혈압·당뇨 진단경험자(30세 이상, 추정)</div><div className="k-value">{nf((htn?.v || 0) + (dm?.v || 0))}<small> 명</small></div><div className="k-sub">고혈압 {nf(htn?.v)} · 당뇨 {nf(dm?.v)} (중복 포함)</div></div>
        <div className="kpi"><div className="k-label">장기요양 시설 정원</div><div className="k-value">{nf(ltc?.v)}<small> 명</small></div><div className="k-sub">{ltc ? `인구 천명당 ${fmt(ltc.pct * 10)}명 · ${poolName} ${ltc.rank ?? "–"}위 / ${ltc.n}` : "자료 없음"}</div></div>
        <div className="kpi"><div className="k-label">임신부·영유아</div><div className="k-value">{nf((head("preg")?.v || 0) + (head("age0_4")?.v || 0))}<small> 명</small></div><div className="k-sub">등록 임산부 {nf(head("preg")?.v)} · 0~4세 {nf(head("age0_4")?.v)}</div></div>
      </div>
      <div className="seg" style={{ margin: "8px 0", flexWrap: "wrap" }}>
        {["전체", ...CATS].map((c) => <button key={c} className={`seg-btn ${cat === c ? "on" : ""}`} onClick={() => setCat(c)}>{c}</button>)}
      </div>
      <div className="tblscroll">
        <table className="yeartbl">
          <thead><tr><th>집단</th><th>구분</th><th>인원</th><th>인구 대비</th><th>{poolName} 순위(비율)</th><th>중앙값</th><th>자료 연도</th><th>출처</th></tr></thead>
          <tbody>
            {shown.map((r) => (
              <tr key={r.g.id}>
                <td>{r.g.name}</td>
                <td>{r.g.cat} · {r.g.est ? <span className="subchip">추정</span> : <span className="subchip">실측</span>}</td>
                <td style={{ textAlign: "right", fontWeight: 600 }}>{nf(r.v)}</td>
                <td style={{ textAlign: "right" }}>{r.g.id === "ltc_fac_n" || r.g.id === "ltc_hosp" ? "–" : `${fmt(r.pct)}%`}</td>
                <td style={{ textAlign: "right" }}>{r.rank ? `${r.rank} / ${r.n}` : "–"}</td>
                <td style={{ textAlign: "right" }}>{r.median != null ? `${fmt(r.median)}%` : "–"}</td>
                <td>{r.y}{r.sum ? " (시군구 합)" : ""}</td>
                <td className="muted" title={r.g.method}>{r.g.src} <span className="hint">ⓘ</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="desc" style={{ marginTop: 6 }}>순위는 인구 대비 비율이 높은 순(고위험군 비중이 큰 지역이 1위). 요양병원·장기요양 기관 수는 비율을 내지 않습니다. 정신의료기관 입원자·투석·만성폐질환·노숙인·의료 종사자 수는 시군구 자료가 없어 빠져 있습니다.</div>
    </div>
  );
}
