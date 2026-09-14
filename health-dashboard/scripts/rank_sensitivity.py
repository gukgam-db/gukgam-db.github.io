# -*- coding: utf-8 -*-
"""순위 방법론 실증 분석: 가중치 민감도 · 연도 간 안정성 · 3년 평활 효과 · 도시/군 격차 · 영역 상관"""
import json, statistics as st
from pathlib import Path
from collections import defaultdict

ROOT = Path(__file__).resolve().parent.parent
D = json.loads((ROOT / "data/dataset.json").read_text(encoding="utf-8"))
R = D["regions"]; IDX = {r["c"]: i for i, r in enumerate(R)}
SGG = [r for r in R if r["l"] == "sgg"]
IND = D["indicators"]; DOM = D["domains"]

def val(ind, item, year, code):
    if year not in ind["years"]: return None
    v = D["values"][ind["id"]][item][ind["years"].index(year)][IDX[code]]
    return None if v is None else v / 10

def pct_scores(item, year, smooth=1):
    """지표별 방향보정 백분위 (smooth=3이면 3개년 평균값으로)"""
    out = defaultdict(dict)  # code -> ind -> pct
    for ind in IND:
        if ind["bad"] is None: continue
        vals = {}
        for r in SGG:
            ys = [y for y in range(year - smooth + 1, year + 1)]
            vs = [val(ind, item, y, r["c"]) for y in ys]; vs = [v for v in vs if v is not None]
            if vs: vals[r["c"]] = sum(vs) / len(vs)
        if len(vals) < 50: continue
        arr = sorted(vals.values())
        n = len(arr)
        for c, v in vals.items():
            worse = sum(1 for p in arr if (p > v if ind["bad"] else p < v)); tie = sum(1 for p in arr if p == v)
            out[c][ind["id"]] = (worse + tie / 2) / n * 100
    return out

def domain_scores(ps):
    ds = {}
    for c, m in ps.items():
        d = {}
        for dom in DOM:
            xs = [p for i in IND if i["domain"] == dom and i["id"] in m for p in [m[i["id"]]]]
            if xs: d[dom] = sum(xs) / len(xs)
        ds[c] = d
    return ds

def composite(ds, w):
    out = {}
    for c, d in ds.items():
        tot = sum(w[k] for k in d); 
        if tot == 0: continue
        out[c] = sum(d[k] * w[k] for k in d) / tot
    return out

def ranks(score):
    s = sorted(score.items(), key=lambda x: -x[1]); return {c: i + 1 for i, (c, _) in enumerate(s)}

def spearman(r1, r2):
    ks = [k for k in r1 if k in r2]; n = len(ks)
    d2 = sum((r1[k] - r2[k]) ** 2 for k in ks); return 1 - 6 * d2 / (n * (n * n - 1))

EQ = {d: 1 for d in DOM}
CHR = {"흡연": 12, "음주": 10, "신체활동": 10, "식생활·비만": 10, "정신건강": 12, "구강건강": 4, "만성질환": 20, "예방·안전": 10, "의료이용": 12}
BEHAV = {"흡연": 18, "음주": 14, "신체활동": 14, "식생활·비만": 12, "정신건강": 12, "구강건강": 4, "만성질환": 12, "예방·안전": 8, "의료이용": 6}

rep = ["# 순위 방법론 실증 분석 (지역사회건강조사 41개 지표, 시군구)", ""]
ps25 = pct_scores("std", 2025); ds25 = domain_scores(ps25)
ps24 = pct_scores("std", 2024); ds24 = domain_scores(ps24)
ps25s = pct_scores("std", 2025, 3); ds25s = domain_scores(ps25s)
ps24s = pct_scores("std", 2024, 3); ds24s = domain_scores(ps24s)
ps25c = pct_scores("crude", 2025); ds25c = domain_scores(ps25c)

rep += ["## 1. 가중치 체계 간 순위 일치도 (2025, 표준화율)"]
schemes = {"균등": EQ, "질병부담형(만성질환·정신 강조)": CHR, "행태형(흡연·음주·신체활동 강조)": BEHAV}
rk = {k: ranks(composite(ds25, w)) for k, w in schemes.items()}
names = list(schemes)
rep.append("| | " + " | ".join(names) + " |"); rep.append("|---|" + "---|" * len(names))
for a in names:
    rep.append(f"| {a} | " + " | ".join(f"{spearman(rk[a], rk[b]):.3f}" for b in names) + " |")
big = sum(1 for c in rk["균등"] if c in rk["질병부담형(만성질환·정신 강조)"] and abs(rk["균등"][c] - rk["질병부담형(만성질환·정신 강조)"][c]) > 30)
rep.append(f"- 균등 vs 질병부담형에서 순위가 30계단 이상 바뀌는 시군구: {big}개 / {len(rk['균등'])}")
top10 = {k: set(c for c, r in v.items() if r <= 10) for k, v in rk.items()}
rep.append(f"- 상위 10위 집합의 겹침: 균등∩질병부담형 {len(top10['균등'] & top10['질병부담형(만성질환·정신 강조)'])}개, 균등∩행태형 {len(top10['균등'] & top10['행태형(흡연·음주·신체활동 강조)'])}개")

rep += ["", "## 2. 연도 간 순위 안정성 (균등가중, 표준화율)"]
r24, r25 = ranks(composite(ds24, EQ)), ranks(composite(ds25, EQ))
r24s, r25s = ranks(composite(ds24s, EQ)), ranks(composite(ds25s, EQ))
rep.append(f"- 단년도 2024→2025 순위 Spearman: {spearman(r24, r25):.3f}")
rep.append(f"- 3년 이동평균 2024→2025 순위 Spearman: {spearman(r24s, r25s):.3f}")
jump = sum(1 for c in r24 if c in r25 and abs(r24[c] - r25[c]) > 30)
jumps = sum(1 for c in r24s if c in r25s and abs(r24s[c] - r25s[c]) > 30)
rep.append(f"- 한 해 사이 30계단 이상 이동: 단년도 {jump}개 vs 3년평활 {jumps}개")
rep.append(f"- 조율 vs 표준화율 순위 일치도(2025, 균등): {spearman(ranks(composite(ds25c, EQ)), r25):.3f}")

rep += ["", "## 3. 영역 점수 간 상관 (2025, 표준화율, 시군구)"]
codes = [c for c in ds25 if len(ds25[c]) == len(DOM)]
def corr(a, b):
    xa = [ds25[c][a] for c in codes]; xb = [ds25[c][b] for c in codes]
    ma, mb = st.mean(xa), st.mean(xb)
    num = sum((x - ma) * (y - mb) for x, y in zip(xa, xb)); den = (sum((x - ma) ** 2 for x in xa) * sum((y - mb) ** 2 for y in xb)) ** .5
    return num / den if den else 0
rep.append("| | " + " | ".join(DOM) + " |"); rep.append("|---|" + "---|" * len(DOM))
for a in DOM: rep.append(f"| {a} | " + " | ".join(f"{corr(a, b):+.2f}" for b in DOM) + " |")

rep += ["", "## 4. 지역 유형별 종합점수 (균등, 2025) — 리그 분리 필요성"]
comp = composite(ds25, EQ)
def kind(r): return "구(대도시)" if r["n"].endswith("구") else ("군" if r["n"].endswith("군") else "시")
grp = defaultdict(list)
for r in SGG:
    if r["c"] in comp: grp[kind(r)].append(comp[r["c"]])
for k, v in grp.items():
    rep.append(f"- {k}: n={len(v)}, 평균 {st.mean(v):.1f}, 중앙값 {st.median(v):.1f}, 상위 30위 내 {sum(1 for c, rr in r25.items() if rr <= 30 and kind(R[IDX[c]]) == k)}개")
for dom in DOM:
    m = {k: st.mean([ds25[c][dom] for c in ds25 if kind(R[IDX[c]]) == k and dom in ds25[c]]) for k in grp}
    rep.append(f"  - {dom}: " + ", ".join(f"{k} {v:.0f}" for k, v in m.items()))

rep += ["", "## 5. 산술 vs 기하 집계 (균등, 2025)"]
geo = {}
for c, d in ds25.items():
    if len(d) == len(DOM):
        import math
        geo[c] = math.exp(sum(math.log(max(v, 1)) for v in d.values()) / len(d))
rep.append(f"- 산술 vs 기하 순위 Spearman: {spearman(ranks({c: comp[c] for c in geo}), ranks(geo)):.3f}")

(ROOT / "data/rank_sensitivity.md").write_text("\n".join(rep), encoding="utf-8")
print("\n".join(rep))
