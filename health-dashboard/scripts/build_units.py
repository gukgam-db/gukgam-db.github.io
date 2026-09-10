# -*- coding: utf-8 -*-
"""조사 단위(보건소) 데이터셋: KOSIS 수록 단위 ↔ 질병청 공식 보건소 목록 매핑, 연도별 참여 단위 수, 시도별 보건기관 수"""
import json, re, time, collections
from pathlib import Path
from collections import defaultdict

ROOT = Path(__file__).resolve().parent.parent
D = json.loads((ROOT / "data/dataset.json").read_text(encoding="utf-8"))
R = D["regions"]; IDX = {r["c"]: i for i, r in enumerate(R)}
SIDO_FULL = {r["c"]: r["n"] for r in R if r["l"] == "sido"}
SHORT = {"서울특별시": "서울", "부산광역시": "부산", "대구광역시": "대구", "인천광역시": "인천", "광주광역시": "광주", "대전광역시": "대전",
         "울산광역시": "울산", "세종특별자치시": "세종", "경기도": "경기", "강원도": "강원", "강원특별자치도": "강원", "충청북도": "충북",
         "충청남도": "충남", "전라북도": "전북", "전북특별자치도": "전북", "전라남도": "전남", "경상북도": "경북", "경상남도": "경남", "제주특별자치도": "제주"}
PARENT_FIX = {"01602": "01600", "01604": "01600A"}   # 제주 세부단위의 부모 코드가 KOSIS에 없음 → 서귀포시/제주시로 연결
for r in R:
    if r["l"] == "sub" and r["p"] not in IDX and r["p"] in PARENT_FIX: r["p"] = PARENT_FIX[r["p"]]
subs = defaultdict(list)
for r in R:
    if r["l"] == "sub": subs[r["p"]].append(r)

# ---- 연도별 참여 단위 (현재흡연율 기준: 전 연도 수록) ----
ind = next(i for i in D["indicators"] if i["id"] == "DT_H_SM"); M = D["values"]["DT_H_SM"]["crude"]
have_year = {r["c"]: [y for yi, y in enumerate(ind["years"]) if M[yi][IDX[r["c"]]] is not None] for r in R}
yearly = []
for yi, y in enumerate(ind["years"]):
    have = {c for c, ys in have_year.items() if y in ys}
    sgg = [r for r in R if r["l"] == "sgg" and r["c"] in have]
    sub = [r for r in R if r["l"] == "sub" and r["c"] in have]
    units = sum(1 for r in sgg if not any(s["c"] in have for s in subs.get(r["c"], []))) + len(sub)
    yearly.append({"year": y, "sgg_rows": len(sgg), "sub_rows": len(sub), "units": units})

# ---- 공식 보건소 목록 매핑 ----
official = [l.strip().split("|") for l in (ROOT / "data/chs_health_centers.txt").read_text(encoding="utf-8").splitlines() if "|" in l]
def norm(s): return re.sub(r"(보건의료원|보건소|시|군|구)$", "", s)
def keyset(name):  # 이름에서 후보 키워드 추출
    n = name.replace("보건의료원", "").replace("보건소", "")
    return n
manual = {("경기", "안산시상록수"): "상록구", ("경기", "부천시원미"): "원미구", ("경기", "부천시오정"): "오정구", ("경기", "부천시소사"): "소사구",
          ("경기", "남양주풍양"): "남양주 풍양", ("경기", "남양주"): "남양주", ("충남", "계룡"): "계룡시", ("충남", "공주"): "공주시", ("충남", "금산"): "금산군",
          ("충남", "논산"): "논산시", ("충남", "보령"): "보령시", ("충남", "부여"): "부여군", ("충남", "서천"): "서천군", ("세종", "세종특별자치시"): "세종시",
          ("제주", "제주시제주"): "제주", ("제주", "서귀포시서귀포"): "서귀포",
          ("경기", "안산시단원"): "단원구", ("충북", "청주시흥덕"): "흥덕구", ("충북", "청주시상당"): "상당구", ("충북", "청주시청원"): "청원구",
          ("충북", "청주시서원"): "서원구", ("경북", "구미시선산"): "선산", ("경북", "구미시구미"): "구미",
          ("제주", "서귀포시서부"): ("서귀포시", "서부"), ("제주", "서귀포시동부"): ("서귀포시", "동부"),
          ("제주", "제주시서부"): ("제주시", "서부"), ("제주", "제주시동부"): ("제주시", "동부")}
units_by_sido = defaultdict(list)
for r in R:
    if r["l"] in ("sgg", "sub"): units_by_sido[r["s"]].append(r)
mapping, unmatched = {}, []
used = set()
for sido_full, name in official:
    s = SHORT.get(sido_full, sido_full); key = keyset(name)
    cands = units_by_sido[s]
    target = None
    if (s, key) in manual:
        m = manual[(s, key)]
        if isinstance(m, tuple):
            target = next((r for r in cands if r["l"] == "sub" and r["n"] == m[1] and r["p"] in IDX and R[IDX[r["p"]]]["n"] == m[0]), None)
        else:
            target = next((r for r in cands if r["n"] == m and r["c"] not in used), None)
    if not target:
        # 세부단위 우선: 세부 이름이 key 안에 있고, 부모 시군구 이름 접두가 맞으면
        best = []
        for r in cands:
            rn = r["n"].replace(" ", "")
            if r["l"] == "sub":
                parent = R[IDX[r["p"]]]["n"] if r["p"] in IDX else ""
                if rn in key and (parent.replace("시", "") in key or key.startswith(rn)): best.append((2, len(rn), r))
            else:
                if rn == key or rn == key + "시" or rn == key + "군" or rn == key + "구" or key == rn or key.startswith(rn) and len(key) - len(rn) <= 0:
                    best.append((1, len(rn), r))
        # 세부 없는 시군구: key가 시군구명과 정확히 같을 때
        if not best:
            for r in cands:
                if r["l"] == "sgg" and r["n"] == key: best.append((1, len(r["n"]), r))
        if best:
            best.sort(key=lambda x: (-x[0], -x[1])); target = best[0][2]
    if target and target["c"] not in used:
        mapping[target["c"]] = name; used.add(target["c"])
    else:
        unmatched.append((sido_full, name, target["n"] if target else None))
print(f"공식 {len(official)}개 중 매핑 {len(mapping)}개, 미매핑 {len(unmatched)}: {unmatched}")

# ---- 단위 목록 ----
def status(r):
    ys = have_year.get(r["c"], [])
    if not ys: return "no_data"
    if ys[-1] < ind["years"][-1]: return "ended"
    if ys[0] > ind["years"][0]: return "started_later"
    return "active"
units = []
for r in R:
    if r["l"] not in ("sgg", "sub"): continue
    ys = have_year.get(r["c"], [])
    units.append({"c": r["c"], "n": r["n"], "l": r["l"], "s": r["s"], "p": r["p"], "parent": R[IDX[r["p"]]]["n"] if r["p"] in IDX else None,
                  "chs": mapping.get(r["c"]), "first": ys[0] if ys else None, "last": ys[-1] if ys else None, "status": status(r),
                  "has_subs": r["c"] in subs, "subs": [s["n"] for s in subs.get(r["c"], [])]})
# ---- 보건기관 3,607건 (공공데이터포털 API) → 조사 단위별 매핑 ----
import csv as _csv
fac_rows = list(_csv.DictReader(open(ROOT / "data/health_facilities.csv", encoding="utf-8-sig"))) if (ROOT / "data/health_facilities.csv").exists() else []
by_unit = {}
unmapped_fac = collections.Counter()
sgg_by_sido_name = defaultdict(dict); sub_by_parent = defaultdict(dict)
for u in units:
    if u["l"] == "sgg": sgg_by_sido_name[u["s"]][u["n"]] = u["c"]
    else: sub_by_parent[u["p"]][u["n"]] = u["c"]
SUBFIX = {"상록구": "상록구", "단원구": "단원구", "마산합포구": "마산", "마산회원구": "마산", "진해구": "진해", "의창구": "창원", "성산구": "창원"}
for f in fac_rows:
    s_short = SHORT.get(f["시도"], f["시도"]); sg = f["시군구"].strip(); code = None
    parts = sg.split()
    if len(parts) == 2:  # "수원시 권선구" → 세부단위, 없으면 시 전체
        city, gu = parts; pc = sgg_by_sido_name[s_short].get(city)
        gu2 = SUBFIX.get(gu, gu)
        code = sub_by_parent.get(pc, {}).get(gu2) or pc
    elif sg in sgg_by_sido_name[s_short]: code = sgg_by_sido_name[s_short][sg]
    elif sg in ("세종특별자치시", "세종시", "세종"): code = sgg_by_sido_name["세종"].get("세종시")
    elif sg == "제주시": code = sgg_by_sido_name["제주"].get("제주시")
    elif sg == "서귀포시": code = sgg_by_sido_name["제주"].get("서귀포시")
    if not code: unmapped_fac[(f["시도"], sg)] += 1; continue
    d = by_unit.setdefault(code, {"counts": collections.Counter(), "list": []})
    d["counts"][f["기관유형"]] += 1
    d["list"].append({"n": f["보건기관명"], "t": f["기관유형"], "p": f["상위기관명"], "a": f["주소"], "tel": f["대표 전화번호"]})
for code, d in by_unit.items(): d["counts"] = dict(d["counts"])
print(f"보건기관 {len(fac_rows)}건 중 매핑 {sum(len(d['list']) for d in by_unit.values())}건, 미매핑 {sum(unmapped_fac.values())}: {list(unmapped_fac.items())[:12]}")
# 시군구 합계(세부 포함)
for u in units:
    if u["l"] == "sgg":
        tot = collections.Counter(by_unit.get(u["c"], {}).get("counts", {}))
        for sc in subs.get(u["c"], []): tot.update(by_unit.get(sc["c"], {}).get("counts", {}))
        u["fac"] = dict(tot)
    else:
        u["fac"] = by_unit.get(u["c"], {}).get("counts", {})

# ---- 시도별 보건기관 수 (KOSIS 2025) ----
fac = defaultdict(dict)
for row in json.loads((ROOT / "data/facilities_sido_2025.json").read_text(encoding="utf-8")):
    fac[row["C1_NM"].strip()][row["C2_NM"].strip()] = int(float(row["DT"])) if row["DT"] not in (None, "", "-") else None
out = {"generated": time.strftime("%Y-%m-%d"), "official_count": len(official), "official_source": "https://chs.kdca.go.kr/chs/mainContent/pbhlthInfoMain.do",
       "yearly": yearly, "units": units, "facilities": fac, "fac_by_unit": by_unit, "fac_source": "공공데이터포털 보건복지부_전국 지역보건의료기관 현황_20251231 (Open API)", "fac_total": len(fac_rows), "facilities_year": "2025", "facilities_source": "KOSIS 보건복지부 보건소·보건지소·보건진료소 수(TX_117191104)"}
(ROOT / "data/units.json").write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
from collections import Counter
print("상태:", Counter(u["status"] for u in units), "| 세부 보유 시군구:", sum(1 for u in units if u["has_subs"]))
print("시도별 보건기관(전국):", fac.get("계") or fac.get("전국") or list(fac.items())[:1])
