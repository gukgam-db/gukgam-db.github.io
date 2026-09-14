# -*- coding: utf-8 -*-
"""
대시보드 빌드 진입점: React(Vite) 앱을 빌드해 health-dashboard/index.html 을 갱신한다.

파이프라인:  scripts/kosis_fetch_core.py  →  data/dashboard_data.json
             scripts/build_dashboard.py   →  app/ 빌드 → index.html (단일 파일)

사용법: python scripts/build_dashboard.py   (최초 1회 app/ 에서 npm install 필요)
"""
import json, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
data_path = ROOT / "data" / "dashboard_data.json"
app = ROOT / "app"

if not data_path.exists():
    sys.exit("data/dashboard_data.json 없음 — 먼저 scripts/kosis_fetch_core.py 실행")
if not (app / "node_modules").exists():
    sys.exit("app/node_modules 없음 — 먼저  cd app && npm install")

# 데이터 무결성 확인: 지표별 시도 17개, 연도-값 길이 일치
data = json.loads(data_path.read_text(encoding="utf-8"))
for name, d in data["indicators"].items():
    assert len(d["sido"]) == 17, f"{name}: 시도 {len(d['sido'])}개"
    n = len(d["years"])
    assert len(d["national"]) == n, f"{name}: national 길이 불일치"
    for s, vals in d["sido"].items():
        assert len(vals) == n, f"{name}/{s}: 길이 불일치"

subprocess.run(["npm", "run", "build"], cwd=app, check=True)
out = ROOT / "index.html"
print(f"생성: {out} ({out.stat().st_size:,} bytes)")
