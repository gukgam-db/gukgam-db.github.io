#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
국정감사 자료 DB — 국회 주요 일정 수집기
- 열린국회정보 '국회일정 통합 API'(ALLSCHEDULE)에서 앞으로 35일치 일정을 받아
  국정감사·본회의·위원회(보건복지위/예결위/법사위 구분) 일정을 추려 저장합니다.
  (의장단 동정·의원실 행사 등은 제외)

실행: ASSEMBLY_API_KEY=키 python3 scripts/gukgam/fetch_schedule.py
출력: data/gukgam/schedule.json
"""
import os, json, time, datetime
import urllib.request, urllib.parse

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, "data", "gukgam", "schedule.json")
KEY = os.environ.get("ASSEMBLY_API_KEY", "").strip()
UA = {"User-Agent": "Mozilla/5.0 (gukgam-db collector)"}
DAYS = int(os.environ.get("GUKGAM_SCHED_DAYS", "35"))
HTTP_TIMEOUT = int(os.environ.get("GUKGAM_HTTP_TIMEOUT", "30"))
# 35일치를 하루씩 호출하므로, 서버가 죽어 있으면 (타임아웃 30초 x 3회) x 35일 = 약 55분을
# 그대로 낭비한다. 연속 N회 실패하면 남은 날짜 호출을 건너뛴다(서킷 브레이커).
MAX_CONSEC_FAIL = int(os.environ.get("GUKGAM_MAX_CONSEC_FAIL", "3"))
NET = {"consec_fail": 0, "down": False, "any_fail": False}


def call(date_str):
    q = {"Type": "json", "pIndex": 1, "pSize": 100, "SCH_DT": date_str}
    if KEY:
        q["KEY"] = KEY
    url = "https://open.assembly.go.kr/portal/openapi/ALLSCHEDULE?" + urllib.parse.urlencode(q)
    req = urllib.request.Request(url, headers=UA)
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=HTTP_TIMEOUT) as r:
                d = json.loads(r.read().decode("utf-8"))
            NET["consec_fail"] = 0
            body = d.get("ALLSCHEDULE")
            if body:
                return body[1].get("row", [])
            # 본문이 없으면 데이터 없음(INFO-200) 또는 오류. 오류는 실패로 계산해야
            # 기존 schedule.json 을 0건으로 덮어쓰는 사고를 막을 수 있다.
            code = (d.get("RESULT") or {}).get("CODE", "?")
            if code != "INFO-200":
                print(f"[ALLSCHEDULE {date_str}] 응답 오류: {code}")
                NET["any_fail"] = True
            return []
        except Exception as e:
            if attempt < 2:
                time.sleep(2)
            else:
                print(f"[ALLSCHEDULE {date_str}] 호출 실패: {e}")
                NET["any_fail"] = True
                NET["consec_fail"] += 1
                if NET["consec_fail"] >= MAX_CONSEC_FAIL:
                    NET["down"] = True
                    print(f"※ 연속 {MAX_CONSEC_FAIL}회 호출 실패 → open.assembly.go.kr 접속 불가로 판단, 남은 날짜를 건너뜁니다.")
    return []


def classify(r):
    """관심 일정 분류. 해당 없으면 None."""
    cn = (r.get("SCH_CN") or "") + " " + (r.get("CONF_DIV") or "")
    cmit = r.get("CMIT_NM") or ""
    kind = r.get("SCH_KIND") or ""
    if "국정감사" in cn or "국정감사" in kind:
        return "국정감사"
    if "보건복지" in cmit or "보건복지위" in cn:
        return "보건복지위"
    if "본회의" in cn or kind == "본회의":
        return "본회의"
    if kind == "위원회" or cmit:  # 그 외 모든 위원회 회의 (결산·예산 심사 포함)
        if "예산결산" in cmit:
            return "예결위"
        if "법제사법" in cmit:
            return "법사위"
        return "위원회"
    return None


def main():
    if not KEY:
        print("※ ASSEMBLY_API_KEY 미설정 → 샘플 범위만 수집될 수 있음")
    today = datetime.date.today()
    items, seen = [], set()
    for i in range(DAYS):
        if NET["down"]:
            break
        d = (today + datetime.timedelta(days=i)).isoformat()
        for r in call(d):
            cat = classify(r)
            if not cat:
                continue
            key = (r.get("SCH_DT"), r.get("SCH_TM"), r.get("SCH_CN"))
            if key in seen:
                continue
            seen.add(key)
            items.append({
                "date": r.get("SCH_DT") or d,
                "time": r.get("SCH_TM") or "",
                "cat": cat,
                "content": (r.get("SCH_CN") or "").strip(),
                "committee": r.get("CMIT_NM") or "",
                "sess": r.get("CONF_SESS") or "",
                "dgr": r.get("CONF_DGR") or "",
                "place": r.get("EV_PLC") or "",
            })
        time.sleep(0.4)
    items.sort(key=lambda x: (x["date"], x["time"]))
    # 호출 실패로 0건이 된 경우 기존 일정을 덮어쓰지 않는다(진짜 0건과 구분).
    if not items and NET["any_fail"] and os.path.exists(OUT):
        print("수집 0건(호출 실패) → 기존 schedule.json 유지(덮어쓰지 않음)")
        return 1
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump({"updated": today.isoformat(), "horizon_days": DAYS, "items": items}, f, ensure_ascii=False, indent=1)
    print(f"완료: {DAYS}일 범위에서 관련 일정 {len(items)}건 저장")
    return 1 if NET["any_fail"] and not items else 0


if __name__ == "__main__":
    raise SystemExit(main())
