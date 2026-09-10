# -*- coding: utf-8 -*-
"""권고 방법론 적용 결과: 표준화율 · 3년 이동평균 · 100인 패널 가중 · 도시/군 리그 · 결과지표 분리"""
import json, sys
sys.path.insert(0, str(__import__("pathlib").Path(__file__).parent))
from rank_sensitivity import D, R, IDX, SGG, IND, DOM, val, pct_scores, domain_scores, composite, ranks, spearman, EQ
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent

PANEL = {"흡연": 13.4, "음주": 11.2, "신체활동": 11.4, "식생활·비만": 10.8, "정신건강": 12.8, "구강건강": 4.2, "만성질환": 16.3, "예방·안전": 8.8, "의료이용": 11.1}
# 패널 다수 권고: 결과·유병 성격 지표는 결정요인 점수에서 제외 (진단 경험률 → 검진 편향, 보건기관 이용률 → 중립)
EXCLUDE = {"DT_HYPER_DOCTOR", "DT_DIA_DOCTOR", "DT_NECE_CLINIC", "DT_117075_H_HEALTHY"}  # 건강생활실천율은 흡연·음주·걷기 합성지표(이중계산)

def pct_scores_ex(item, year, smooth):
    ps = pct_scores(item, year, smooth)
    for c in ps:
        for k in list(ps[c]):
            if k in EXCLUDE: del ps[c][k]
    return ps

kind = lambda r: "구(대도시)" if r["n"].endswith("구") else ("군" if r["n"].endswith("군") else "시")
ps = pct_scores_ex("std", 2025, 3); ds = domain_scores(ps)
comp_panel = composite(ds, PANEL); comp_eq = composite(ds, EQ)
r_panel, r_eq = ranks(comp_panel), ranks(comp_eq)
lines = ["# 권고 방법론 적용 결과 (2023–2025 3년 평균 · 표준화율 · 결과지표 제외)", ""]
lines.append(f"- 패널 가중 vs 균등 가중 순위 Spearman: {spearman(r_panel, r_eq):.3f}")
lines.append(f"- 산출 대상 시군구: {len(comp_panel)}개")
# 리그별 상위
lines += ["", "## 리그별 상위 10 (패널 가중)"]
league = {"도시(구·시)": [r for r in SGG if kind(r) != "군"], "군": [r for r in SGG if kind(r) == "군"]}
for name, members in league.items():
    s = sorted([(comp_panel[r["c"]], r) for r in members if r["c"] in comp_panel], key=lambda x: -x[0])
    lines.append(f"### {name} (n={len(s)})")
    for i, (v, r) in enumerate(s[:10], 1):
        best = max(ds[r["c"]].items(), key=lambda x: x[1])
        lines.append(f"{i}. {r['s']} {r['n']} — {v:.1f}점 (강점 영역: {best[0]} {best[1]:.0f})")
# 영역별 1위 (리그별)
lines += ["", "## 영역별 1위 (리그별, 패널 가중과 무관)"]
for d in DOM:
    row = []
    for name, members in league.items():
        s = sorted([(ds[r["c"]].get(d), r) for r in members if r["c"] in ds and ds[r["c"]].get(d) is not None], key=lambda x: -x[0])
        if s: row.append(f"{name}: {s[0][1]['s']} {s[0][1]['n']}({s[0][0]:.0f})")
    lines.append(f"- {d}: " + " · ".join(row))
# 등급 분포 (백분위 기반 5등급 예시)
lines += ["", "## 등급 배지 예시 (리그 내 백분위): 플래티넘 상위 10% · 골드 25% · 실버 50% · 나머지 비공개"]
for name, members in league.items():
    s = sorted([comp_panel[r["c"]] for r in members if r["c"] in comp_panel], reverse=True); n = len(s)
    lines.append(f"- {name}: 플래티넘 {n//10}곳(≥{s[n//10-1]:.1f}) · 골드 {n//4 - n//10}곳 · 실버 {n//2 - n//4}곳")
out = "\n".join(lines); (ROOT / "data/rank_recommended.md").write_text(out, encoding="utf-8"); print(out)
