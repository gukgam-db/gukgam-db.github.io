# -*- coding: utf-8 -*-
"""
공공데이터포털 「보건복지부_전국 지역보건의료기관 현황」 Open API 수집
(보건소·보건지소·보건진료소·건강생활지원센터 3,600여 건: 시도·시군구·기관명·상위기관·유형·주소)

준비 (.env 에 두 줄 추가):
  DATA_GO_KR_KEY=<공공데이터포털 마이페이지의 '일반 인증키(Decoding)'>
  DATA_GO_KR_ENDPOINT=https://api.odcloud.kr/api/15xxxxxxx/v1/uddi:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
     ↑ 활용신청 후 '오픈API 상세' 화면의 요청주소(uddi 포함)를 그대로 복사

사용법:  python scripts/fetch_health_facilities.py
산출물:  data/raw/health_facilities.json (원본), data/health_facilities.csv (정제), 콘솔에 유형별 집계
※ 이 API 서버(api.odcloud.kr)는 클로드 원격 환경에서 차단되어 있으므로 PC에서 실행할 것.
"""
import os, sys, json, csv, time
from pathlib import Path

try:
    import requests
except ImportError:
    sys.exit("requests 설치 필요: pip install requests")

ROOT = Path(__file__).resolve().parent.parent
env = ROOT / ".env"
if env.exists():
    for line in env.read_text(encoding="utf-8").splitlines():
        if "=" in line and not line.strip().startswith("#"):
            k, v = line.split("=", 1); os.environ.setdefault(k.strip(), v.strip())
KEY = os.environ.get("DATA_GO_KR_KEY"); URL = os.environ.get("DATA_GO_KR_ENDPOINT")
if not KEY or not URL:
    sys.exit(".env 에 DATA_GO_KR_KEY 와 DATA_GO_KR_ENDPOINT 를 설정하세요 (파일 상단 설명 참조)")

rows, page, per = [], 1, 1000
while True:
    r = requests.get(URL, params={"serviceKey": KEY, "page": page, "perPage": per, "returnType": "JSON"}, timeout=60)
    if r.status_code != 200:
        sys.exit(f"HTTP {r.status_code}: {r.text[:300]}")
    j = r.json()
    data = j.get("data", [])
    rows += data
    total = j.get("totalCount", 0)
    print(f"page {page}: {len(data)}건 (누적 {len(rows)}/{total})")
    if len(rows) >= total or not data:
        break
    page += 1; time.sleep(0.5)

(ROOT / "data/raw").mkdir(parents=True, exist_ok=True)
(ROOT / "data/raw/health_facilities.json").write_text(json.dumps(rows, ensure_ascii=False), encoding="utf-8")
if rows:
    keys = list(rows[0].keys())
    with open(ROOT / "data/health_facilities.csv", "w", newline="", encoding="utf-8-sig") as f:
        w = csv.DictWriter(f, fieldnames=keys); w.writeheader(); w.writerows(rows)
    from collections import Counter
    typ = next((k for k in keys if "유형" in k), None)
    if typ: print("유형별:", Counter(r.get(typ) for r in rows))
    print(f"완료: {len(rows)}건 → data/health_facilities.csv (컬럼: {', '.join(keys)})")
