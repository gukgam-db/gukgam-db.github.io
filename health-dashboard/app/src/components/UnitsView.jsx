import { useMemo, useState } from "react";
import { feature, mesh } from "topojson-client";
import { geoMercator, geoPath } from "d3-geo";
import { DS, RBY, UNITS, UNIT_BY_CODE, SIDOS } from "../data";
import { clientXY } from "./svgUtil";
import ExportButtons from "./ExportButtons";

const TOPO = DS.geo.topo, OBJ = TOPO.objects[Object.keys(TOPO.objects)[0]], FC = feature(TOPO, OBJ), GEOMAP = DS.geo.map;
const TOPO_SIDO = { 11: "001", 21: "002", 22: "003", 23: "004", 24: "005", 25: "006", 26: "007", 29: "0071", 31: "008", 32: "009", 33: "010", 34: "011", 35: "012", 36: "013", 37: "014", 38: "015", 39: "016" };
const polySido = (f) => TOPO_SIDO[f.properties.code.slice(0, 2)];
const SIDO_MESH = mesh(TOPO, OBJ, (a, b) => polySido(a) !== polySido(b));
const W = 700, H = 820;
const CHANGED = { "00309": "2023년 경북 → 대구 편입", "00403": "2018년 남구 → 미추홀구 개명" };

function classify(u) {
  if (!u) return "none";
  if (CHANGED[u.c]) return "changed";
  if (u.l === "sub") return "multi";
  if (u.has_subs) return "multi";
  return "single";
}
const CLS_NAME = { single: "시군구 = 보건소 1곳", multi: "한 시군구에 보건소 여러 곳(세부 단위)", changed: "행정구역 변경(이관·개명)", none: "자료 없음" };

export default function UnitsView({ setTip }) {
  const [selCode, setSelCode] = useState(null);
  const [q, setQ] = useState("");
  const path = useMemo(() => geoPath(geoMercator().fitExtent([[6, 6], [W - 6, H - 6]], FC)), []);
  const dPaths = useMemo(() => FC.features.map((f) => path(f)), [path]);
  const dMesh = useMemo(() => path(SIDO_MESH), [path]);
  const resolved = useMemo(() => FC.features.map((f) => {
    const cands = GEOMAP[f.properties.code] || [];
    // 최신 자료가 있는 후보 우선 (군위군: 대구 코드)
    const code = cands.find((c) => UNIT_BY_CODE.get(c)?.status !== "ended" && UNIT_BY_CODE.get(c)?.status !== "no_data") || cands[0];
    return { code, unit: UNIT_BY_CODE.get(code) };
  }), []);
  const sel = selCode ? UNIT_BY_CODE.get(selCode) : null;
  const selParent = sel?.l === "sub" ? UNIT_BY_CODE.get(sel.p) : sel;
  const siblings = selParent?.has_subs ? UNITS.units.filter((u) => u.l === "sub" && u.p === selParent.c) : [];
  const selPoly = FC.features.find((f) => (GEOMAP[f.properties.code] || []).includes(selCode));

  const list = useMemo(() => {
    const qq = q.trim();
    return UNITS.units.filter((u) => !qq || u.n.includes(qq) || (u.chs || "").includes(qq) || u.s.includes(qq) || (u.parent || "").includes(qq));
  }, [q]);
  const yearly = UNITS.yearly, ymax = Math.max(...yearly.map((y) => y.units));
  const fac = UNITS.facilities;
  const facRows = ["계", ...SIDOS.map((s) => s.n)].filter((k) => fac[k] || fac[k.replace("특별자치도", "도")]).map((k) => [k, fac[k] || fac[k.replace("특별자치도", "도")]]);
  const facKeys = ["보건소(보건의료원포함)", "보건지소", "보건진료소", "건강생활지원센터", "합계"];

  return (
    <div className="units">
      <div className="card">
        <h3>이 대시보드의 "시군구"는 무엇을 뜻하나</h3>
        <div className="unitsdoc">
          <p><b>조사 단위는 행정안전부 행정구역이 아니라 보건소입니다.</b> 지역사회건강조사는 매년 전국 보건소가 각자 관할 주민 약 900명을 조사하고, 통계도 보건소 단위로 만들어집니다. 2025년 조사 단위는 질병관리청 「2025 지역건강통계 한눈에 보기」 부록 기준 <b>258개 보건소</b>(KOSIS 수록 단위 {yearly[yearly.length - 1].units}개는 시 전체 행 포함, 보건소정보 페이지 공식 목록은 {UNITS.official_count}곳), 행정안전부 기초자치단체는 229곳(2025년)입니다.</p>
          <p>숫자가 다른 이유: ① <b>큰 시의 일반구마다 보건소</b>가 있습니다(수원 4·청주 4·성남 3·고양 3·부천 3·용인 3·창원 3·안양 2·안산 2·포항 2·평택 2·구미 2·남양주 2·제주시 3·서귀포시 3). KOSIS는 이런 시에 "시 전체" 행과 "보건소별" 행을 모두 제공하고, 이 대시보드는 시 전체 행을 시군구로, 보건소별 행을 세부 단위로 씁니다. ② 군 지역의 <b>보건의료원</b>은 보건소 역할을 겸합니다. ③ <b>행정구역 변경</b> — 군위군은 2023년 대구로 편입, 인천 남구는 2018년 미추홀구로 개명, 청원군(2014년 청주 통합)·연기군(2012년 세종 출범)은 폐지되어 과거 연도에만 있습니다.</p>
          <p><b>순위 분모가 232·231·226으로 조금씩 다른 이유</b>: 지표마다 그 해에 값이 있는 단위 수가 다르기 때문입니다(폐지·신설 단위, 일부 지표의 미조사). 화면의 "N/231"은 <i>그 지표·그 해에 값이 있는 시군구 수</i>입니다.</p>
          <p><b>법정동과 행정동</b>: 법정동은 지번·등기에 쓰는 법적 구역이고, 행정동은 주민센터가 실제로 행정을 맡는 단위입니다. 보건소 관할과 표본추출(통·반/리, 주민등록 주소 기준)은 <b>행정동·읍·면</b>을 따릅니다. 이 대시보드의 지도는 통계청 2018년 시군구 경계를 쓰며, 일반구까지 그려져 있어 보건소 단위와 거의 일치합니다.</p>
        </div>
      </div>

      <div className="grid2">
        <div className="card span2 unitmap">
          <h3>조사 단위 지도 — 시군구·보건소 확인</h3>
          <ExportButtons name="조사단위_지도" />
          <div className="desc">폴리곤을 누르면 KOSIS 코드·공식 보건소명·세부 단위·수록 기간을 표시합니다. 색은 단위 유형.</div>
          <div className="unitwrap">
            <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="조사 단위 지도">
              {FC.features.map((f, i) => {
                const { code, unit } = resolved[i]; const cls = classify(unit);
                const isSel = selCode && (code === selCode || (sel?.l === "sub" ? unit?.p === sel.p : unit?.p === selCode || unit?.c === selCode));
                return <path key={f.properties.code} d={dPaths[i]} className={`poly u-${cls} ${isSel ? "sel" : ""}`}
                  onClick={() => setSelCode(code)}
                  onMouseMove={(ev) => { const { x, y } = clientXY(ev); setTip({ x, y, title: unit ? `${unit.s} ${unit.parent && unit.l === "sub" ? unit.parent + " · " : ""}${unit.n}` : f.properties.name, rows: [["공식 보건소", unit?.chs || "–"], ["KOSIS 코드", code || "–"]] }); }}
                  onMouseLeave={() => setTip(null)} />;
              })}
              <path d={dMesh} className="sido-line" />
            </svg>
            <div className="unitside">
              <div className="maplegend">
                {Object.entries(CLS_NAME).map(([k, n]) => <span key={k} className="lg-item"><i className={`u-${k}`} /><small>{n}</small></span>)}
              </div>
              {sel ? (
                <div className="unitinfo">
                  <div className="ui-name">{sel.s} {sel.l === "sub" ? `${sel.parent} · ${sel.n}` : sel.n}</div>
                  <div className="ui-row"><span>공식 보건소</span><b>{sel.chs || (sel.has_subs ? `${siblings.length}곳 (세부 참조)` : "–")}</b></div>
                  <div className="ui-row"><span>KOSIS 코드</span><b>{sel.c}</b> <small>{sel.l === "sub" ? "보건소 세부단위(7자리)" : "시군구(5자리)"}</small></div>
                  {selPoly && <div className="ui-row"><span>통계청 경계코드</span><b>{selPoly.properties.code}</b> <small>{selPoly.properties.name}</small></div>}
                  <div className="ui-row"><span>수록 기간</span><b>{sel.first ?? "–"}–{sel.last ?? "–"}</b> <small>{sel.status === "ended" ? "종료(폐지·이관)" : sel.status === "started_later" ? "중간 신설" : ""}</small></div>
                  {CHANGED[sel.c] && <div className="ui-row"><span>변경</span><b>{CHANGED[sel.c]}</b></div>}
                  {sel.fac && Object.keys(sel.fac).length > 0 && (
                    <div className="ui-row"><span>보건기관</span><b>{Object.entries(sel.fac).map(([k, v]) => `${k} ${v}`).join(" · ")}</b></div>
                  )}
                  {(UNITS.fac_by_unit?.[sel.c]?.list?.length > 0) && (
                    <details className="faclist"><summary>기관 목록 {UNITS.fac_by_unit[sel.c].list.length}곳 (2025.12 기준)</summary>
                      <ul>{UNITS.fac_by_unit[sel.c].list.map((f, i) => <li key={i}><b>{f.n}</b> <small>{f.t}{f.p ? ` · ${f.p}` : ""}</small><br /><small className="muted">{f.a}{f.tel ? ` · ${f.tel}` : ""}</small></li>)}</ul>
                    </details>
                  )}
                  {siblings.length > 0 && (
                    <div className="ui-subs"><span>세부 단위(보건소별)</span>
                      {siblings.map((s) => <button key={s.c} className={`subchip ${s.c === selCode ? "on" : ""}`} onClick={() => setSelCode(s.c)}>{s.n} <small>{s.chs?.replace(/보건소$/, "")}</small></button>)}
                    </div>
                  )}
                </div>
              ) : <div className="empty">지도에서 지역을 눌러 보세요</div>}
            </div>
          </div>
        </div>

        <div className="card">
          <h3>연도별 조사 참여 단위 수</h3>
          <ExportButtons name="연도별_참여단위" />
          <div className="desc">KOSIS에 값이 수록된 단위(현재흡연율 기준). 시군구 행 + 보건소 세부 행, 세부가 있는 시는 세부로 계산</div>
          <svg viewBox="0 0 560 220" width="100%" role="img" aria-label="연도별 참여 단위 수">
            {yearly.map((y, i) => {
              const x = 40 + i * (500 / yearly.length), bw = 500 / yearly.length - 6, h = (y.units / ymax) * 160;
              return <g key={y.year}>
                <rect x={x} y={190 - h} width={bw} height={h} rx="3" style={{ fill: "var(--series-1)" }} />
                <text className="axis" x={x + bw / 2} y={186 - h} textAnchor="middle">{y.units}</text>
                {i % 2 === 0 && <text className="axis" x={x + bw / 2} y={208} textAnchor="middle">{y.year}</text>}
              </g>;
            })}
          </svg>
          <div className="desc">질병관리청 공식 참여 보건소: 2025년 258곳(한눈에 보기 부록 시군구별 표 기준, 도시유형별 25·100·10·41·67·15). KOSIS 수록 단위가 조금 더 많은 것은 제주시·서귀포시 등이 "시 전체 행 + 보건소별 행"으로 수록되기 때문입니다.</div>
        </div>

        <div className="card">
          <h3>시도별 지역보건의료기관 수 ({UNITS.facilities_year})</h3>
          <ExportButtons name="시도별_보건기관수" kinds={["csv"]} />
          <div className="desc">{UNITS.facilities_source}. 보건지소·보건진료소는 조사 단위가 아니라 보건소 산하 기관입니다.</div>
          <div className="tblscroll">
            <table className="yeartbl">
              <thead><tr><th>시도</th>{facKeys.map((k) => <th key={k}>{k.replace("(보건의료원포함)", "")}</th>)}</tr></thead>
              <tbody>{facRows.map(([k, v]) => <tr key={k} className={k === "계" ? "sel" : ""}><td>{k === "계" ? "전국" : k}</td>{facKeys.map((f) => <td key={f}>{v[f] ?? "–"}</td>)}</tr>)}</tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>조사 단위 목록 ({UNITS.units.length}개 = 시군구 {UNITS.units.filter((u) => u.l === "sgg").length} + 세부 {UNITS.units.filter((u) => u.l === "sub").length})</h3>
        <ExportButtons name="조사단위_목록" kinds={["csv"]} />
        <div className="desc">공식 보건소명은 질병관리청 지역사회건강조사 보건소정보 페이지 기준({UNITS.official_count}곳). 행을 누르면 지도에서 강조됩니다.</div>
        <input className="pick-search" placeholder="시도·시군구·보건소명 검색" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="tblscroll unitlist">
          <table className="yeartbl">
            <thead><tr><th>시도</th><th>시군구</th><th>세부 단위</th><th>공식 보건소명</th><th>KOSIS 코드</th><th>수록</th><th>보건지소</th><th>진료소</th><th>상태</th></tr></thead>
            <tbody>
              {list.map((u) => (
                <tr key={u.c} className={u.c === selCode ? "sel" : ""} onClick={() => setSelCode(u.c)}>
                  <td>{u.s}</td><td>{u.l === "sub" ? u.parent : u.n}</td><td>{u.l === "sub" ? u.n : u.has_subs ? `${u.subs.length}곳` : ""}</td>
                  <td>{u.chs || (u.has_subs ? "(세부 참조)" : "–")}</td><td className="muted">{u.c}</td><td>{u.first ?? "–"}–{u.last ?? "–"}</td>
                  <td>{(u.fac?.["일반보건지소"] || 0) + (u.fac?.["통합보건지소"] || 0) || ""}</td><td>{u.fac?.["보건진료소"] || ""}</td>
                  <td>{u.status === "active" ? "" : u.status === "ended" ? "종료" : u.status === "started_later" ? "신설" : "자료 없음"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h3>보건지소·보건진료소 데이터와 PHIS</h3>
        <div className="unitsdoc">
          <p><b>PHIS(지역보건의료정보시스템, 한국사회보장정보원)</b>는 보건기관 내부 업무·실적 시스템으로, 외부에 공개된 API가 없습니다. 실적통계는 보건기관 사용자와 정책담당자만 조회합니다.</p>
          <p>대신 <b>공공데이터포털</b> 보건복지부 「전국 지역보건의료기관 현황」(Open API, 2025-12-31 기준 {UNITS.fac_total?.toLocaleString()}건: 보건소·보건의료원·보건지소·보건진료소·건강생활지원센터, 시도·시군구·상위기관·주소·전화)을 연결했습니다. 지도에서 지역을 누르면 그 시군구의 기관 목록이 나옵니다(위경도 미제공이라 점 표시는 없음). 시도별 합계 표는 KOSIS 통계표(2025) 기준입니다.</p>
        </div>
      </div>
    </div>
  );
}
