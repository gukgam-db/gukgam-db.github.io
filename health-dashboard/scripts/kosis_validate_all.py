# -*- coding: utf-8 -*-
"""
전체 통계표 커버리지 일괄 검증 (2단계)

inventory_chs.csv + inventory_ejibang.csv 의 모든 통계표에 대해
최신 수록연도 1개 연도의 실데이터를 호출해 지역 커버리지·결측을 확인한다.

- KOSIS 트래픽 차단 대응: 호출 간격 PACE초 + 차단 감지 시 지수 백오프(최대 4분) 재시도
- 재개 가능: 결과를 data/validation_details.jsonl 에 표 단위로 즉시 기록,
  재실행하면 이미 검증된 표는 건너뜀
- 산출물: data/validation_details.jsonl, data/validation_details.csv,
          data/validation_full_report.md

사용법: KOSIS_API_KEY 환경변수(또는 .env) 설정 후
        python scripts/kosis_validate_all.py
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

env = ROOT / ".env"
if env.exists():
    for line in env.read_text(encoding="utf-8").splitlines():
        if "=" in line and not line.strip().startswith("#"):
            k, v = line.split("=", 1)
            os.environ.setdefault(k.strip(), v.strip())

API_KEY = os.environ.get("KOSIS_API_KEY")
if not API_KEY:
    sys.exit("KOSIS_API_KEY가 없습니다 (.env 또는 환경변수)")

BASE_DATA = "https://kosis.kr/openapi/Param/statisticsParameterData.do"
PACE = 3.5          # 정상 호출 간격(초)
CKPT = DATA / "validation_details.jsonl"

session = requests.Session()


def get_json(params, tries=7):
    last = None
    for i in range(tries):
        try:
            r = session.get(BASE_DATA, params=params, timeout=90)
            j = r.json()
            time.sleep(PACE)
            return j
        except (requests.ConnectionError, requests.Timeout, ValueError) as e:
            last = e
            time.sleep(min(240, 15 * (2 ** i)))  # 차단 감지 시 길게 대기
    raise RuntimeError(f"재시도 소진: {last}")


SIDO = {"서울", "부산", "대구", "인천", "광주", "대전", "울산", "세종",
        "경기", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주"}
FULL2SHORT = {"서울특별시": "서울", "부산광역시": "부산", "대구광역시": "대구", "인천광역시": "인천",
              "광주광역시": "광주", "대전광역시": "대전", "울산광역시": "울산", "세종특별자치시": "세종",
              "경기도": "경기", "강원특별자치도": "강원", "강원도": "강원", "충청북도": "충북",
              "충청남도": "충남", "전북특별자치도": "전북", "전라북도": "전북", "전라남도": "전남",
              "경상북도": "경북", "경상남도": "경남", "제주특별자치도": "제주", "제주도": "제주"}


def validate_table(row):
    """통계표 1개: 최신 수록연도 실데이터로 커버리지·결측 확인"""
    tbl, org = row["TBL_ID"], row["ORG_ID"]
    end = (row.get("END_PRD_DE") or "")[:4]
    # 장래추계처럼 END가 미래인 표는 올해 기준으로 잘라 조회
    year = end if end.isdigit() and end <= "2026" else "2025"
    base = {"method": "getList", "apiKey": API_KEY, "format": "json", "jsonVD": "Y",
            "orgId": org, "tblId": tbl, "itmId": "ALL", "prdSe": "Y",
            "startPrdDe": year, "endPrdDe": year}
    last_err = None
    for objs in ({"objL1": "ALL"}, {"objL1": "ALL", "objL2": "ALL"},
                 {"objL1": "ALL", "objL2": "ALL", "objL3": "ALL"},
                 {"objL1": "ALL", "objL2": "ALL", "objL3": "ALL", "objL4": "ALL"}):
        j = get_json(dict(base, **objs))
        if isinstance(j, list) and j:
            regions = {r.get("C1_NM", "") for r in j}
            sido_hit = {FULL2SHORT.get(n, n) for n in regions} & SIDO
            missing = sum(1 for r in j if r.get("DT") in (None, "", "-"))
            items = {r.get("ITM_NM", "") for r in j}
            return {"tbl_id": tbl, "org_id": org, "tbl_nm": row["TBL_NM"],
                    "stat_nm": row["STAT_NM"], "year": year,
                    "strt": row.get("STRT_PRD_DE"), "end": row.get("END_PRD_DE"),
                    "rows": len(j), "n_regions": len(regions),
                    "sido_cover": len(sido_hit), "n_items": len(items),
                    "missing": missing, "miss_pct": round(missing / len(j) * 100, 1),
                    "error": ""}
        last_err = j
    return {"tbl_id": tbl, "org_id": org, "tbl_nm": row["TBL_NM"],
            "stat_nm": row["STAT_NM"], "year": year,
            "strt": row.get("STRT_PRD_DE"), "end": row.get("END_PRD_DE"),
            "rows": 0, "n_regions": 0, "sido_cover": 0, "n_items": 0,
            "missing": 0, "miss_pct": 0.0,
            "error": json.dumps(last_err, ensure_ascii=False)[:160]}


def classify(d):
    """PASS: 대시보드 즉시 사용 가능 / WARN: 조건부 / FAIL: 사용 불가"""
    if d["error"] or d["rows"] == 0:
        return "FAIL"
    stale = (d["end"] or "")[:4] < "2023"
    partial_sido = d["sido_cover"] < 17 and d["n_regions"] < 100  # 시군구 단위 표는 시도명이 없을 수 있음
    if d["miss_pct"] > 20:
        return "FAIL"
    if stale or partial_sido or d["miss_pct"] > 5:
        return "WARN"
    return "PASS"


def main():
    tables = []
    for fname in ["inventory_chs.csv", "inventory_ejibang.csv"]:
        tables += list(csv.DictReader(open(DATA / fname, encoding="utf-8-sig")))

    done = set()
    if CKPT.exists():
        for line in CKPT.read_text(encoding="utf-8").splitlines():
            try:
                done.add(json.loads(line)["tbl_id"])
            except Exception:
                pass
    todo = [t for t in tables if t["TBL_ID"] not in done]
    print(f"전체 {len(tables)}개 중 {len(done)}개 완료, {len(todo)}개 남음")

    with open(CKPT, "a", encoding="utf-8") as ck:
        for i, t in enumerate(todo, 1):
            try:
                d = validate_table(t)
            except RuntimeError as e:
                print(f"[{i}/{len(todo)}] {t['TBL_ID']} 중단: {e}")
                break  # 다음 실행에서 재개
            ck.write(json.dumps(d, ensure_ascii=False) + "\n")
            ck.flush()
            print(f"[{i}/{len(todo)}] {d['tbl_id']} rows={d['rows']} sido={d['sido_cover']} "
                  f"miss={d['miss_pct']}% {d['error'][:60]}")

    # ---------- 리포트 ----------
    details = [json.loads(l) for l in CKPT.read_text(encoding="utf-8").splitlines() if l.strip()]
    seen = {}
    for d in details:
        seen[d["tbl_id"]] = d  # 재실행 중복 제거(마지막 결과 우선)
    details = list(seen.values())
    for d in details:
        d["grade"] = classify(d)

    keys = ["grade", "stat_nm", "tbl_id", "tbl_nm", "org_id", "strt", "end", "year",
            "rows", "n_regions", "sido_cover", "n_items", "missing", "miss_pct", "error"]
    with open(DATA / "validation_details.csv", "w", newline="", encoding="utf-8-sig") as f:
        w = csv.DictWriter(f, fieldnames=keys)
        w.writeheader()
        w.writerows(sorted(details, key=lambda d: (d["stat_nm"], d["grade"], d["tbl_id"])))

    rep = ["# 전체 통계표 커버리지 검증 리포트", "",
           f"생성일: {time.strftime('%Y-%m-%d %H:%M')} (UTC) · 검증 {len(details)}/{len(tables)}개", ""]
    for stat in ["지역사회건강조사", "e-지방지표"]:
        sub = [d for d in details if d["stat_nm"] == stat]
        c = Counter(d["grade"] for d in sub)
        rep += [f"## {stat} ({len(sub)}개)",
                f"- PASS {c.get('PASS', 0)} · WARN {c.get('WARN', 0)} · FAIL {c.get('FAIL', 0)}", ""]
        fails = [d for d in sub if d["grade"] == "FAIL"]
        if fails:
            rep.append("### FAIL 목록")
            for d in fails:
                why = d["error"][:80] if d["error"] else f"결측 {d['miss_pct']}%"
                rep.append(f"- {d['tbl_id']} {d['tbl_nm']}: {why}")
            rep.append("")
        warns = [d for d in sub if d["grade"] == "WARN"]
        if warns:
            rep.append("### WARN 목록 (조건부 사용)")
            for d in warns:
                reasons = []
                if (d["end"] or "")[:4] < "2023":
                    reasons.append(f"갱신중단({(d['end'] or '?')[:4]})")
                if d["sido_cover"] < 17 and d["n_regions"] < 100:
                    reasons.append(f"시도 {d['sido_cover']}/17")
                if d["miss_pct"] > 5:
                    reasons.append(f"결측 {d['miss_pct']}%")
                rep.append(f"- {d['tbl_id']} {d['tbl_nm']}: {', '.join(reasons) or '기준 초과'}")
            rep.append("")
    rep += ["## 판정 기준",
            "- PASS: 데이터 존재 · 최신(2023+) · 시도 17/17(또는 시군구 단위 100개 지역 이상) · 결측 5% 이하",
            "- WARN: 갱신 중단, 시도 커버 부분, 결측 5~20% 중 하나 이상",
            "- FAIL: 호출 실패/데이터 없음/결측 20% 초과", ""]
    (DATA / "validation_full_report.md").write_text("\n".join(rep), encoding="utf-8")
    print(f"\n검증 {len(details)}/{len(tables)}개 → data/validation_full_report.md")
    if len(details) < len(tables):
        sys.exit(2)  # 미완료 → 러너가 재실행


if __name__ == "__main__":
    main()
