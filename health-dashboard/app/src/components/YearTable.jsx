import { fmt, val, ranked, SGG_ALL, SIDOS, SGG_BY_SIDO, RBY } from "../data";

/* 연도별 추이표: 수치 · 전국 순위 · 시도 내 순위 · 증감량 · 증감률 (CIAT 패널 5 재현) */
export default function YearTable({ ind, item, sel, year, onYear }) {
  const isSgg = sel.l === "sgg";
  const natPool = isSgg ? SGG_ALL : SIDOS;
  const sidoPool = isSgg ? SGG_BY_SIDO[sel.p] : null;
  let prev = null;
  const rows = ind.years.map((y) => {
    const v = val(ind, item, y, sel.c);
    const nat = ranked(ind, item, y, natPool);
    const nr = nat.findIndex((x) => x.r.c === sel.c) + 1;
    const sd = sidoPool ? ranked(ind, item, y, sidoPool) : null;
    const sr = sd ? sd.findIndex((x) => x.r.c === sel.c) + 1 : null;
    const d = v != null && prev != null ? v - prev : null;
    const pct = d != null && prev ? (d / prev) * 100 : null;
    if (v != null) prev = v;
    return { y, v, nr, nN: nat.length, sr, sN: sd?.length, d, pct };
  });
  const good = (d) => (d == null || ind.bad == null ? "" : (d < 0) === ind.bad ? "k-good" : "k-bad");

  return (
    <div className="tblscroll">
      <table className="yeartbl">
        <thead>
          <tr>
            <th>연도</th><th>{ind.name} ({ind.unit})</th>
            <th>{isSgg ? "전국 순위" : "시도 순위"}</th>
            {isSgg && <th>{RBY.get(sel.p).n} 내</th>}
            <th>증감량({ind.unit === "%" ? "%p" : ind.unit})</th><th>증감률(%)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.y} className={r.y === year ? "sel" : ""} onClick={() => onYear(r.y)}>
              <td>{r.y}</td>
              <td><b>{fmt(r.v)}</b></td>
              <td>{r.nr ? `${r.nr} / ${r.nN}` : "–"}</td>
              {isSgg && <td>{r.sr ? `${r.sr} / ${r.sN}` : "–"}</td>}
              <td className={good(r.d)}>{r.d == null ? "–" : (r.d > 0 ? "+" : "") + fmt(r.d)}</td>
              <td className={good(r.d)}>{r.pct == null ? "–" : (r.pct > 0 ? "+" : "") + fmt(r.pct)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
