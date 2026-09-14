# -*- coding: utf-8 -*-
"""건강수명 산출 검증: (1) 시도 단위에서 사망자·인구로 직접 만든 생명표의 e0 vs 통계청 시도 생명표 e0,
(2) 시군구 값 분포·극단값, (3) 시군구 건강수명과 주관적 건강인지율·기대수명의 상관."""
import json, sys, collections
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
import build_hle as B          # 모듈 로드 시 산출까지 수행됨
from lifetable import chiang_lifetable

H = json.loads((B.ROOT / "data" / "hle.json").read_text(encoding="utf-8"))
print("\n[1] 시도: 직접 생명표 e0 vs 통계청 e0 (2023 중심 3년 합산 vs 2023 시도 생명표)")
diffs = []
for sc, nm in B.STAT_SIDO.items():
    pl = B.pooled({sc}, 2023)
    if not pl: continue
    D, P, _ = pl
    lt = chiang_lifetable(B.AGES_SGG, D, P)
    code = next(r["c"] for r in B.DS["regions"] if r["l"] == "sido" and r["s"] == nm)
    off = H["regions"].get(code, {}).get("y", {}).get("2023", {}).get("le")
    if off: diffs.append(lt["e"][0] - off); print(f"  {nm:3s} 직접 {lt['e'][0]:.2f}  통계청 {off:.2f}  차이 {lt['e'][0]-off:+.2f}")
if diffs: print(f"  평균 차이 {sum(diffs)/len(diffs):+.2f}, 최대 |차이| {max(abs(d) for d in diffs):.2f}")

print("\n[2] 시군구 분포 (최신 중심연도)")
rows = [(c, max(v["y"]), v["y"][max(v["y"])]) for c, v in H["regions"].items() if len(c) >= 5]
if rows:
    les = sorted(r[2]["le"] for r in rows); hles = sorted(r[2]["hle"] for r in rows)
    print(f"  n={len(rows)}  기대수명 {les[0]:.1f}~{les[-1]:.1f} (중앙 {les[len(les)//2]:.1f})  건강수명 {hles[0]:.1f}~{hles[-1]:.1f} (중앙 {hles[len(hles)//2]:.1f})")
    name = {r["c"]: f'{r["s"]} {r["n"]}' for r in B.DS["regions"]}
    top = sorted(rows, key=lambda r: -r[2]["hle"])[:5]; bot = sorted(rows, key=lambda r: r[2]["hle"])[:5]
    print("  상위:", [(name[c], y, r["hle"]) for c, y, r in top]); print("  하위:", [(name[c], y, r["hle"]) for c, y, r in bot])
    import statistics
    x = [r[2]["hle"] for r in rows]; y1 = [r[2]["le"] for r in rows]; y2 = [r[2]["good"] for r in rows]
    print(f"  상관(건강수명, 기대수명) {statistics.correlation(x, y1):.3f}  상관(건강수명, 주관적 건강인지율) {statistics.correlation(x, y2):.3f}")
