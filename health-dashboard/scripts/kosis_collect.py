# -*- coding: utf-8 -*-
"""
KOSIS openAPI 지표 인벤토리 수집 (1단계: 발견/검증용)
사용법: .env에 KOSIS_API_KEY 설정 후  python scripts/kosis_collect.py
산출물: data/inventory_*.csv, data/collect_report.md
주의: 엔드포인트 파라미터는 KOSIS 문서 기준 초안이며, 첫 실행에서 오류가 나면
      응답을 보고 수정할 것 (Claude Code에게 오류 메시지를 보여주면 됨).
"""
import os, json, csv, time, sys
from pathlib import Path

try:
    import requests
except ImportError:
    sys.exit("requests 설치 필요: pip install requests")

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
DATA.mkdir(exist_ok=True)

# .env 로드 (python-dotenv 없이 간단 파싱)
env = ROOT / ".env"
if env.exists():
    for line in env.read_text(encoding="utf-8").splitlines():
        if "=" in line and not line.strip().startswith("#"):
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip())

API_KEY = os.environ.get("KOSIS_API_KEY")
if not API_KEY:
    sys.exit(".env에 KOSIS_API_KEY가 없습니다")

BASE_SEARCH = "https://kosis.kr/openapi/statisticsSearch.do"
BASE_LIST = "https://kosis.kr/openapi/statisticsList.do"

KEYWORDS = ["지역사회건강조사", "e-지방지표", "지방지표"]

report_lines = ["# KOSIS 수집 리포트", ""]

def search_tables(keyword):
    """통계표 통합검색"""
    params = {
        "method": "getList", "apiKey": API_KEY, "format": "json", "jsonVD": "Y",
        "searchNm": keyword, "startCount": 1, "resultCount": 500,
    }
    r = requests.get(BASE_SEARCH, params=params, timeout=30)
    report_lines.append(f"- 검색 '{keyword}': HTTP {r.status_code}, {len(r.text)} bytes")
    try:
        return r.json()
    except Exception:
        report_lines.append(f"  - JSON 파싱 실패. 응답 앞부분: {r.text[:300]}")
        return []

def main():
    all_rows = []
    for kw in KEYWORDS:
        rows = search_tables(kw)
        if isinstance(rows, dict):  # 에러 응답 형태
            report_lines.append(f"  - 응답: {json.dumps(rows, ensure_ascii=False)[:300]}")
            continue
        for row in rows:
            row["_keyword"] = kw
            all_rows.append(row)
        time.sleep(0.5)

    if all_rows:
        keys = sorted({k for r in all_rows for k in r})
        out = DATA / "inventory_tables.csv"
        with open(out, "w", newline="", encoding="utf-8-sig") as f:
            w = csv.DictWriter(f, fieldnames=keys)
            w.writeheader()
            w.writerows(all_rows)
        report_lines.append(f"\n총 {len(all_rows)}개 통계표 → {out}")
    else:
        report_lines.append("\n검색 결과 없음 — 엔드포인트/파라미터 확인 필요")

    (DATA / "collect_report.md").write_text("\n".join(report_lines), encoding="utf-8")
    print("\n".join(report_lines))

if __name__ == "__main__":
    main()
