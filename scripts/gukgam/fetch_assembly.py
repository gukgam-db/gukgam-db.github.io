#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
국정감사 자료 DB — 국회 Open API 수집기 (Phase 1)
- 열린국회정보(open.assembly.go.kr) Open API에서 국정감사 자료 메타데이터를 수집합니다.
    · AUDITREPORTRESULT      국정감사 결과보고서 (연도·위원회·PDF/HWP 링크)
    · AUDITREPORTVISIBILITY  시정 및 처리 요구사항에 대한 결과보고서
    · VCONFAPIGCONFLIST      국정감사 회의록 (대수별, ERACO 필수)
- 원문 파일은 저장하지 않고 링크만 수집합니다(용량·저작권 안전).

실행: ASSEMBLY_API_KEY=발급키 python3 scripts/gukgam/fetch_assembly.py
- 키가 없으면 '샘플 모드'(호출당 5건)로 동작합니다. 파이프라인 점검용이며,
  이미 full 모드로 수집된 데이터가 있으면 샘플로 덮어쓰지 않습니다.
- API 키 발급: https://open.assembly.go.kr (무료) → 리포 시크릿 ASSEMBLY_API_KEY 등록
"""
import os, json, time, datetime
import urllib.request, urllib.parse

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT_DIR = os.path.join(ROOT, "data", "gukgam")
BASE = "https://open.assembly.go.kr/portal/openapi/"
KEY = os.environ.get("ASSEMBLY_API_KEY", "").strip()
MODE = "full" if KEY else "sample"
# 회의록 수집 대상 대수. API 데이터는 제16대(2000년)부터 존재. (환경변수로 조정 가능: GUKGAM_ERAS="제21대,제22대")
_DEFAULT_ERAS = "제16대,제17대,제18대,제19대,제20대,제21대,제22대"
ERAS = [e.strip() for e in os.environ.get("GUKGAM_ERAS", _DEFAULT_ERAS).split(",") if e.strip()]
PAGE_SIZE = 100 if KEY else 5
TODAY = datetime.date.today()


def call(service, **params):
    """API 1페이지 호출 → (rows, total). 오류·데이터 없음은 ([], 0)."""
    q = {"Type": "json", "pIndex": params.pop("pIndex", 1), "pSize": PAGE_SIZE}
    if KEY:
        q["KEY"] = KEY
    q.update(params)
    url = BASE + service + "?" + urllib.parse.urlencode(q)
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (gukgam-db collector)"})
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                data = json.loads(r.read().decode("utf-8"))
            break
        except Exception as e:
            if attempt < 2:
                time.sleep(3 * (attempt + 1))
            else:
                print(f"[{service}] 호출 실패: {e}")
                return [], 0
    if service not in data:  # {"RESULT":{"CODE":"INFO-200"...}} = 데이터 없음/오류
        code = (data.get("RESULT") or {}).get("CODE", "?")
        if code != "INFO-200":
            print(f"[{service}] 응답 오류: {code}")
        return [], 0
    head, body = data[service][0], data[service][1]
    total = head["head"][0].get("list_total_count", 0)
    return body.get("row", []), total


def fetch_all(service, **params):
    """전체 페이지 순회. 샘플 모드는 1페이지(5건)만 제공됨."""
    rows, total = call(service, pIndex=1, **params)
    out = list(rows)
    if KEY:
        page = 2
        while len(out) < total and rows:
            time.sleep(0.6)
            rows, _ = call(service, pIndex=page, **params)
            out.extend(rows)
            page += 1
    return out, total


def is_health(committee):
    return "보건복지" in (committee or "")


def collect_reports():
    """결과보고서 + 시정처리 결과보고서 → reports.json items"""
    items, seen = [], set()
    for service, doc_type in (("AUDITREPORTRESULT", "result_report"),
                              ("AUDITREPORTVISIBILITY", "followup")):
        if KEY:
            rows, total = fetch_all(service)
        else:  # 샘플 모드: 연도 필터로 연도별 5건씩이라도 확보 (데이터는 2000년부터 존재)
            rows = []
            for yr in range(TODAY.year, 1999, -1):
                r, _ = call(service, RPT_YR=str(yr))
                rows.extend(r)
                time.sleep(0.6)
            total = len(rows)
        n = 0
        for r in rows:
            key = (doc_type, r.get("RPT_YR"), r.get("CMIT_NM"), r.get("PDF_DWLD_URL"))
            if key in seen:
                continue
            seen.add(key)
            items.append({
                "year": int(r["RPT_YR"]) if (r.get("RPT_YR") or "").isdigit() else None,
                "committee": r.get("CMIT_NM") or "",
                "doc_type": doc_type,
                "title": (r.get("RPT_TTL") or "").replace("()", "").strip(),
                "pdf": r.get("PDF_DWLD_URL") or "",
                "hwp": r.get("HWP_DWLD_URL") or "",
            })
            n += 1
        print(f"[{service}] {n}건 수집 (전체 {total}건)")
    items.sort(key=lambda x: (-(x["year"] or 0), x["committee"], x["doc_type"]))
    return items


def collect_minutes():
    """국정감사 회의록(대수별) → minutes.json items"""
    items, seen = [], set()
    for era in ERAS:
        rows, total = fetch_all("VCONFAPIGCONFLIST", ERACO=era)
        n = 0
        for r in rows:
            cid = r.get("CONF_ID")
            if cid in seen:
                continue
            seen.add(cid)
            items.append({
                "conf_id": cid,
                "era": r.get("ERACO") or era,
                "sess": r.get("SESS") or "",
                "dgr": r.get("DGR") or "",
                "date": r.get("CONF_DT") or "",
                "committee": r.get("CMIT_NM") or "",
                "url": r.get("DOWN_URL") or "",
            })
            n += 1
        print(f"[VCONFAPIGCONFLIST {era}] {n}건 수집 (전체 {total}건)")
        time.sleep(0.6)
    items.sort(key=lambda x: (x["date"] or ""), reverse=True)
    return items


def save(name, payload):
    path = os.path.join(OUT_DIR, name)
    # 샘플 모드는 full 데이터를 덮어쓰지 않음
    if MODE == "sample" and os.path.exists(path):
        try:
            with open(path, encoding="utf-8") as f:
                if json.load(f).get("mode") == "full":
                    print(f"{name}: full 데이터 유지(샘플로 덮어쓰지 않음)")
                    return False
        except Exception:
            pass
    with open(path, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=1)
    print(f"{name}: {len(payload.get('items', []))}건 저장")
    return True


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    if not KEY:
        print("※ ASSEMBLY_API_KEY 미설정 → 샘플 모드(호출당 5건). 전체 수집은 키 등록 후 재실행.")
    updated = TODAY.isoformat()

    reports = collect_reports()
    minutes = collect_minutes()
    save("reports.json", {"updated": updated, "mode": MODE, "items": reports})
    save("minutes.json", {"updated": updated, "mode": MODE, "items": minutes})

    idx = {
        "updated": updated,
        "mode": MODE,
        "counts": {
            "reports": sum(1 for i in reports if i["doc_type"] == "result_report"),
            "followups": sum(1 for i in reports if i["doc_type"] == "followup"),
            "minutes": len(minutes),
        },
        "health": {
            "reports": sum(1 for i in reports if is_health(i["committee"])),
            "minutes": sum(1 for i in minutes if is_health(i["committee"])),
        },
        "years": sorted({i["year"] for i in reports if i["year"]}, reverse=True),
    }
    save("index.json", {"items": [], **idx})
    print(f"완료: 보고서 {len(reports)}건, 회의록 {len(minutes)}건 (mode={MODE})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
