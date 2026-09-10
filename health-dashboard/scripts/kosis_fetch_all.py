# -*- coding: utf-8 -*-
"""
v3 데이터 수집: 지역사회건강조사 시군구 단위 표(177기관, 검증 PASS) 전량 원본 수집

- 대상: data/validation_details.csv 에서 stat_nm=지역사회건강조사 · grade=PASS ·
        org_id=177 · n_regions>=100 (시군구 단위) 인 표
- 각 표의 수록기간 전체(startPrdDe~endPrdDe)를 한 번에 요청, 응답 초과 시 연도 구간 분할
- 원본은 data/raw/<TBL_ID>.json 에 저장(.gitignore 대상), 표 단위로 재개 가능
- KOSIS 트래픽 차단 대응: 호출 간격 PACE초, 차단 시 지수 백오프(최대 4분)

사용법: KOSIS_API_KEY 설정 후  python scripts/kosis_fetch_all.py
"""
import os, csv, json, time, sys
from pathlib import Path

try:
    import requests
except ImportError:
    sys.exit("requests 설치 필요: pip install requests")

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
RAW = DATA / "raw"
RAW.mkdir(parents=True, exist_ok=True)

env = ROOT / ".env"
if env.exists():
    for line in env.read_text(encoding="utf-8").splitlines():
        if "=" in line and not line.strip().startswith("#"):
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip())
API_KEY = os.environ.get("KOSIS_API_KEY")
if not API_KEY:
    sys.exit("KOSIS_API_KEY가 없습니다")

BASE_DATA = "https://kosis.kr/openapi/Param/statisticsParameterData.do"
PACE = 4.0
session = requests.Session()


def get_json(params, tries=8):
    last = None
    for i in range(tries):
        try:
            r = session.get(BASE_DATA, params=params, timeout=180)
            j = r.json()
            time.sleep(PACE)
            return j
        except (requests.ConnectionError, requests.Timeout, ValueError) as e:
            last = e
            time.sleep(min(240, 15 * (2 ** i)))
    raise RuntimeError(f"재시도 소진: {last}")


def fetch_range(org, tbl, y0, y1):
    base = {"method": "getList", "apiKey": API_KEY, "format": "json", "jsonVD": "Y",
            "orgId": org, "tblId": tbl, "itmId": "ALL", "objL1": "ALL",
            "prdSe": "Y", "startPrdDe": str(y0), "endPrdDe": str(y1)}
    j = get_json(base)
    if isinstance(j, list):
        return j
    # 요청 한도 초과 등 → 구간 분할
    if y1 > y0:
        mid = (y0 + y1) // 2
        return fetch_range(org, tbl, y0, mid) + fetch_range(org, tbl, mid + 1, y1)
    raise RuntimeError(f"{tbl} {y0}: {json.dumps(j, ensure_ascii=False)[:160]}")


def target_tables():
    rows = list(csv.DictReader(open(DATA / "validation_details.csv", encoding="utf-8-sig")))
    return sorted([r for r in rows
                   if r["stat_nm"] == "지역사회건강조사" and r["grade"] == "PASS"
                   and r["org_id"] == "177" and int(r["n_regions"]) >= 100],
                  key=lambda r: r["tbl_id"])


def main():
    targets = target_tables()
    todo = [t for t in targets if not (RAW / f"{t['tbl_id']}.json").exists()]
    print(f"대상 {len(targets)}개 표, 미수집 {len(todo)}개")
    failed = []
    for i, t in enumerate(todo, 1):
        tbl, org = t["tbl_id"], t["org_id"]
        y0, y1 = int(t["strt"][:4]), int(t["end"][:4])
        try:
            rows = fetch_range(org, tbl, y0, y1)
        except RuntimeError as e:
            print(f"[{i}/{len(todo)}] {tbl} 실패: {e}")
            failed.append(tbl)
            continue
        (RAW / f"{tbl}.json").write_text(json.dumps(rows, ensure_ascii=False), encoding="utf-8")
        print(f"[{i}/{len(todo)}] {tbl} {y0}–{y1} {len(rows)}행 → raw/{tbl}.json")
    if failed:
        print("실패:", failed)
        sys.exit(2)
    print("완료")


if __name__ == "__main__":
    main()
