# -*- coding: utf-8 -*-
"""
핵심 5개 지표 전체 시계열 수집 → 대시보드용 JSON (3단계)

검증(1·2단계) 통과한 표에서 2008~최신 전 연도 시도 단위 시계열을 수집해
prototype/dashboard_template.html 의 __DATA__ 스키마로 변환한다.

산출물: data/core_series_raw.json  (원본 응답 축약본, 감사용)
        data/dashboard_data.json   (템플릿 주입용)

사용법: KOSIS_API_KEY 설정 후  python scripts/kosis_fetch_core.py
"""
import os, json, time, sys
from pathlib import Path

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
    sys.exit("KOSIS_API_KEY가 없습니다")

BASE_DATA = "https://kosis.kr/openapi/Param/statisticsParameterData.do"
PACE = 4.0

# 1차 검증에서 확정한 표. bad=True 는 "낮을수록 양호"
CORE = [
    ("현재흡연율",      "101", "DT_1YL21001E",  "%", True,  2008),
    ("고위험음주율",    "101", "DT_1YL20291E",  "%", True,  2008),
    ("걷기실천율",      "177", "DT_H_EX_WALK",  "%", False, 2008),
    ("비만율(자가보고)", "177", "DT_H_OBE_OBE",  "%", True,  2008),
    ("우울감경험률",    "177", "DT_117075_H_MENTAL_DEPRESS_SYM", "%", True, 2017),
]

SIDO_ORDER = ["서울", "부산", "대구", "인천", "광주", "대전", "울산", "세종",
              "경기", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주"]
FULL2SHORT = {"서울특별시": "서울", "부산광역시": "부산", "대구광역시": "대구", "인천광역시": "인천",
              "광주광역시": "광주", "대전광역시": "대전", "울산광역시": "울산", "세종특별자치시": "세종",
              "경기도": "경기", "강원특별자치도": "강원", "강원도": "강원", "충청북도": "충북",
              "충청남도": "충남", "전북특별자치도": "전북", "전라북도": "전북", "전라남도": "전남",
              "경상북도": "경북", "경상남도": "경남", "제주특별자치도": "제주", "제주도": "제주"}

session = requests.Session()


def get_json(params, tries=7):
    last = None
    for i in range(tries):
        try:
            r = session.get(BASE_DATA, params=params, timeout=120)
            j = r.json()
            time.sleep(PACE)
            return j
        except (requests.ConnectionError, requests.Timeout, ValueError) as e:
            last = e
            time.sleep(min(240, 15 * (2 ** i)))
    raise RuntimeError(f"재시도 소진: {last}")


def fetch_series(org, tbl, y0, y1):
    """전 연도 데이터. 행수 제한 대비 연도 구간을 절반씩 나눠 재시도."""
    base = {"method": "getList", "apiKey": API_KEY, "format": "json", "jsonVD": "Y",
            "orgId": org, "tblId": tbl, "itmId": "ALL", "prdSe": "Y",
            "startPrdDe": str(y0), "endPrdDe": str(y1)}
    for objs in ({"objL1": "ALL"}, {"objL1": "ALL", "objL2": "ALL"},
                 {"objL1": "ALL", "objL2": "ALL", "objL3": "ALL"}):
        j = get_json(dict(base, **objs))
        if isinstance(j, list) and j:
            return j
        # 요청 초과(err 20 등)면 구간 분할
        if isinstance(j, dict) and j.get("err") in ("20", "40") and y1 > y0:
            mid = (y0 + y1) // 2
            return fetch_series(org, tbl, y0, mid) + fetch_series(org, tbl, mid + 1, y1)
    raise RuntimeError(f"{tbl}: {json.dumps(j, ensure_ascii=False)[:160]}")


def pick_item(rows):
    """항목(ITM)이 여럿이면 조율(%)을 우선, 다음으로 표준화율."""
    items = sorted({r.get("ITM_NM", "") for r in rows})
    for want in ("조율", "율", "표준화율"):
        for it in items:
            if want in it and "표준오차" not in it and "응답자" not in it:
                return it
    return items[0]


def main():
    end_year = 2025
    raw_summary = {}
    indicators = {}
    for name, org, tbl, unit, bad, y0 in CORE:
        print(f"수집: {name} ({tbl}) {y0}–{end_year}")
        rows = fetch_series(org, tbl, y0, end_year)
        item = pick_item(rows)
        # (연도, 시도) → 값. 시군구 행은 시도명이 아니므로 자동 배제
        grid = {}
        for r in rows:
            if r.get("ITM_NM") != item:
                continue
            sido = FULL2SHORT.get((r.get("C1_NM") or "").strip())
            if not sido:
                continue
            try:
                grid[(r["PRD_DE"][:4], sido)] = round(float(r["DT"]), 1)
            except (ValueError, TypeError, KeyError):
                continue
        years = sorted({y for (y, _) in grid})
        sido_series = {}
        for s in SIDO_ORDER:
            sido_series[s] = [grid.get((y, s)) for y in years]
        national = []
        for y in years:
            col = sorted(v for s in SIDO_ORDER if (v := grid.get((y, s))) is not None)
            national.append(round(col[len(col) // 2], 1) if col else None)
        indicators[name] = {"unit": unit, "bad": bad, "years": [int(y) for y in years],
                            "item": item, "source_tbl": tbl,
                            "national": national, "sido": sido_series}
        raw_summary[name] = {"tbl": tbl, "item": item, "rows_fetched": len(rows),
                             "years": f"{years[0]}–{years[-1]}" if years else "-",
                             "cells": len(grid)}
        print(f"  항목='{item}' 연도 {len(years)}개, 셀 {len(grid)}개")

    out = {"generated": time.strftime("%Y-%m-%d"), "sido": SIDO_ORDER,
           "indicators": indicators}
    (DATA / "dashboard_data.json").write_text(
        json.dumps(out, ensure_ascii=False), encoding="utf-8")
    (DATA / "core_series_raw.json").write_text(
        json.dumps(raw_summary, ensure_ascii=False, indent=2), encoding="utf-8")
    print("완료 → data/dashboard_data.json")


if __name__ == "__main__":
    main()
