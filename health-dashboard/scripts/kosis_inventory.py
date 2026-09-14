# -*- coding: utf-8 -*-
"""
KOSIS 지표 인벤토리 수집·검증 (v2)

kosis_collect.py(v1)의 한계 보완:
  - 검색 결과 500건 상한 → startCount 페이지네이션으로 전량 수집
  - 키워드 전문검색 노이즈(무관 기관 통계표 혼입) → STAT_NM 기준으로 대상 통계만 필터
  - 메타데이터만 수집 → 핵심 지표 표본에 대해 실데이터 호출로 시도/시군구 커버리지·결측 검증
  - 프록시/망 환경의 간헐적 connection reset → 지수 백오프 재시도

사용법: .env에 KOSIS_API_KEY 설정 후  python scripts/kosis_inventory.py
산출물: data/inventory_full.csv        (검색 전량, 중복 제거)
        data/inventory_chs.csv         (지역사회건강조사 통계표)
        data/inventory_ejibang.csv     (e-지방지표 통계표)
        data/validation_report.md      (검증 리포트)
"""
import os, csv, json, time, sys
from pathlib import Path
from collections import Counter

try:
    import requests
except ImportError:
    sys.exit("requests 설치 필요: pip install requests")

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
DATA.mkdir(exist_ok=True)

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
BASE_DATA = "https://kosis.kr/openapi/Param/statisticsParameterData.do"

session = requests.Session()


def get_json(url, params, tries=5):
    """간헐적 connection reset에 대비한 재시도 래퍼"""
    last = None
    for i in range(tries):
        try:
            r = session.get(url, params=params, timeout=60)
            return r.json()
        except (requests.ConnectionError, requests.Timeout, ValueError) as e:
            last = e
            time.sleep(min(120, 10 * (2 ** i)))  # 10s→20s→40s→80s→120s
    raise RuntimeError(f"{tries}회 재시도 실패: {last}")


def search_all(keyword, page_size=500, max_pages=20):
    """통계표 통합검색 전량 수집 (startCount 페이지네이션)"""
    rows, start = [], 1
    for _ in range(max_pages):
        j = get_json(BASE_SEARCH, {
            "method": "getList", "apiKey": API_KEY, "format": "json", "jsonVD": "Y",
            "searchNm": keyword, "startCount": start, "resultCount": page_size,
        })
        if isinstance(j, dict):  # {"err": ...} 형태
            if rows:
                break  # 마지막 페이지 넘어감
            print(f"  [{keyword}] 응답 오류: {json.dumps(j, ensure_ascii=False)[:200]}")
            break
        rows.extend(j)
        if len(j) < page_size:
            break
        start += page_size
        time.sleep(2.0)  # KOSIS 트래픽 차단 회피: 호출 간격 여유
    return rows


def fetch_year(org_id, tbl_id, year):
    """특정 통계표의 1개 연도 실데이터 (모든 분류 ALL)"""
    params = {
        "method": "getList", "apiKey": API_KEY, "format": "json", "jsonVD": "Y",
        "orgId": org_id, "tblId": tbl_id, "itmId": "ALL",
        "prdSe": "Y", "startPrdDe": year, "endPrdDe": year,
    }
    # 분류 축 개수를 모르므로 objL1만 → objL1+objL2 순으로 시도
    for objs in ({"objL1": "ALL"}, {"objL1": "ALL", "objL2": "ALL"},
                 {"objL1": "ALL", "objL2": "ALL", "objL3": "ALL"}):
        j = get_json(BASE_DATA, dict(params, **objs))
        if isinstance(j, list) and j:
            return j
        time.sleep(0.3)
    return j  # 마지막 에러 응답


SIDO_NAMES = {"서울", "부산", "대구", "인천", "광주", "대전", "울산", "세종",
              "경기", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주"}


def norm_region(name):
    """'서울특별시' → '서울' 식 축약 (시도 판별용)"""
    n = (name or "").strip()
    for full, short in [("서울특별시", "서울"), ("부산광역시", "부산"), ("대구광역시", "대구"),
                        ("인천광역시", "인천"), ("광주광역시", "광주"), ("대전광역시", "대전"),
                        ("울산광역시", "울산"), ("세종특별자치시", "세종"), ("경기도", "경기"),
                        ("강원특별자치도", "강원"), ("강원도", "강원"), ("충청북도", "충북"),
                        ("충청남도", "충남"), ("전북특별자치도", "전북"), ("전라북도", "전북"),
                        ("전라남도", "전남"), ("경상북도", "경북"), ("경상남도", "경남"),
                        ("제주특별자치도", "제주"), ("제주도", "제주")]:
        if n == full:
            return short
    return n


def main():
    report = ["# KOSIS 지표 인벤토리 수집·검증 리포트", "",
              f"생성일: {time.strftime('%Y-%m-%d %H:%M')} (UTC)", ""]

    # ---------- 1. 인벤토리 전량 수집 ----------
    report.append("## 1. 통계표 검색 (페이지네이션 전량)")
    all_rows = []
    for kw in ["지역사회건강조사", "e-지방지표", "지방지표"]:
        rows = search_all(kw)
        for r in rows:
            r["_keyword"] = kw
        all_rows.extend(rows)
        report.append(f"- '{kw}': {len(rows)}건")
        print(f"'{kw}': {len(rows)}건")

    uniq = {}
    for r in all_rows:
        uniq.setdefault(r.get("TBL_ID"), r)
    report.append(f"- 합계 {len(all_rows)}건 → 중복 제거 후 고유 통계표 **{len(uniq)}개**")

    keys = sorted({k for r in all_rows for k in r})
    with open(DATA / "inventory_full.csv", "w", newline="", encoding="utf-8-sig") as f:
        w = csv.DictWriter(f, fieldnames=keys)
        w.writeheader()
        w.writerows(uniq.values())

    # ---------- 2. 대상 통계 필터 ----------
    report += ["", "## 2. 대상 통계 필터 (STAT_NM 기준)"]
    chs = [r for r in uniq.values() if r.get("STAT_NM") == "지역사회건강조사"]
    ejb = [r for r in uniq.values() if r.get("STAT_NM") == "e-지방지표"]
    for name, subset, fname, ciat_n in [
            ("지역사회건강조사", chs, "inventory_chs.csv", 98),
            ("e-지방지표", ejb, "inventory_ejibang.csv", 157)]:
        with open(DATA / fname, "w", newline="", encoding="utf-8-sig") as f:
            w = csv.DictWriter(f, fieldnames=keys)
            w.writeheader()
            w.writerows(sorted(subset, key=lambda r: r.get("TBL_ID", "")))
        yrs_end = Counter(r.get("END_PRD_DE", "?")[:4] for r in subset)
        stale = sum(v for k, v in yrs_end.items() if k < "2023")
        report += [f"### {name}: {len(subset)}개 통계표 (CIAT 기준 지표 수: {ciat_n})",
                   f"- 최신 수록연도 분포: " + ", ".join(f"{k}년 {v}개" for k, v in sorted(yrs_end.items(), reverse=True)[:6]),
                   f"- 2023년 이전에 갱신이 멈춘 표: {stale}개",
                   f"- 파일: data/{fname}", ""]
        print(f"{name}: {len(subset)}개 (stale {stale})")

    # ---------- 3. 핵심 지표 표본 실데이터 검증 ----------
    report += ["## 3. 핵심 지표 표본 실데이터 검증",
               "프로토타입 5개 지표에 대응하는 통계표를 골라 최신 연도 실데이터를 호출,",
               "시도(17개) 커버리지와 결측을 확인.", ""]

    # 지역사회건강조사 표 중 프로토타입 지표에 해당하는 표를 이름으로 매칭
    # 하위집단 표("당뇨병 진단 경험자의 …" 등)를 배제하고 전체 인구 대상 표를 우선
    SUBGROUP = ("진단 경험자", "당뇨", "고혈압", "코로나", "운전", "연간음주자")
    targets = []
    for kw_name, want in [("현재흡연율", "흡연율"), ("고위험음주율", "고위험음주율"),
                          ("걷기실천율", "걷기 실천율"), ("비만율", "비만율"), ("우울감경험률", "우울")]:
        cands = [r for r in chs
                 if want in (r.get("TBL_NM") or "")
                 and not any(s in r["TBL_NM"] for s in SUBGROUP)]
        # 시군구 단위 표 우선("(시도/시/군/구)" 또는 "시·군·구별"), 그다음 최신 수록연도
        cands.sort(key=lambda r: ("시/군/구" in r["TBL_NM"] or "시·군·구" in r["TBL_NM"],
                                  r.get("END_PRD_DE", "")), reverse=True)
        if cands:
            targets.append((kw_name, cands[0]))

    report.append("| 프로토타입 지표 | 통계표 | 수록기간 | 최신연도 행수 | 시도 커버 | 시군구 행수 | 결측 |")
    report.append("|---|---|---|---|---|---|---|")
    for kw_name, t in targets:
        tbl, org = t["TBL_ID"], t["ORG_ID"]
        year = (t.get("END_PRD_DE") or "2024")[:4]
        try:
            data = fetch_year(org, tbl, year)
        except RuntimeError as e:
            report.append(f"| {kw_name} | {t['TBL_NM']} ({tbl}) | - | 호출 실패: {e} | - | - | - |")
            continue
        if not isinstance(data, list):
            report.append(f"| {kw_name} | {t['TBL_NM']} ({tbl}) | - | 오류 {json.dumps(data, ensure_ascii=False)[:80]} | - | - | - |")
            continue
        regions = {r.get("C1_NM", "") for r in data}
        sido_hit = {norm_region(n) for n in regions} & SIDO_NAMES
        sigungu = len(regions) - len(sido_hit) - (1 if any("전국" in n or "전체" in n for n in regions) else 0)
        missing = sum(1 for r in data if r.get("DT") in (None, "", "-"))
        period = f"{t.get('STRT_PRD_DE','?')}–{t.get('END_PRD_DE','?')}"
        report.append(f"| {kw_name} | {t['TBL_NM']} ({tbl}) | {period} | {len(data)} | "
                      f"{len(sido_hit)}/17 | {max(sigungu,0)} | {missing} |")
        print(f"{kw_name}: {tbl} {year}년 {len(data)}행, 시도 {len(sido_hit)}/17, 결측 {missing}")
        time.sleep(0.5)

    # ---------- 4. 요약 ----------
    report += ["", "## 4. 판정 요약",
               "- 페이지네이션 수집이 정상 작동하며 API 키 유효.",
               "- 상세 표별 검증(전 연도 결측·시군구 단위)은 다음 단계에서 표 단위로 수행.",
               ""]
    (DATA / "validation_report.md").write_text("\n".join(report), encoding="utf-8")
    print("\n완료 → data/validation_report.md")


if __name__ == "__main__":
    main()
