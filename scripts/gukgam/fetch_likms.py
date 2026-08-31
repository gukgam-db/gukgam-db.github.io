#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
국정감사 자료 DB — likms 위원회 게시판 수집기 (키 불필요)
- 국정감사·조사 정보시스템(likms.assembly.go.kr/inspections)의 위원회 게시판 '최신 파일 목록'을 수집합니다.
- Open API에 아직 없는 최신(예: 2025년도) 결과보고서·시정처리결과·업무보고 파일이 올라오는 곳입니다.
- 이 엔드포인트는 최신 게시물 위주로만 반환하므로, 실행할 때마다 새 항목을 기존 파일에
  누적(merge)합니다. 스케줄 실행이 반복되면 시간이 지나며 아카이브가 쌓입니다.
- 원문 파일은 저장하지 않고 다운로드 링크만 수집합니다.

실행: python3 scripts/gukgam/fetch_likms.py   (키 불필요)
출력: data/gukgam/likms-bulletins.json (누적)
"""
import os, re, json, time, datetime
import urllib.request, urllib.parse

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, "data", "gukgam", "likms-bulletins.json")
URL = "https://likms.assembly.go.kr/inspections/getAtbFileList.do"
MAX_PAGES = 5  # 3페이지부터 1페이지가 반복 반환되는 것을 실측 확인 (10건/페이지 고정)


def fetch_page(page):
    data = urllib.parse.urlencode({
        "page": page, "maxSize": 10, "fromYear": 2000, "toYear": datetime.date.today().year,
        "committeeName": "전체", "audittypeCdb": "전체", "committee_id": "", "committee_name": "", "year": "",
    }).encode()
    req = urllib.request.Request(URL, data=data, headers={
        "User-Agent": "Mozilla/5.0 (gukgam-db collector)",
        "X-Requested-With": "XMLHttpRequest",
    })
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                return json.loads(r.read().decode("utf-8"))
        except Exception as e:
            if attempt < 2:
                time.sleep(3 * (attempt + 1))
            else:
                print(f"page {page} 실패: {e}")
    return None


def doc_type(title):
    t = title or ""
    if "시정" in t or "처리요구" in t or "처리결과" in t:
        return "followup"
    if "결과보고서" in t:
        return "result_report"
    if "계획서" in t:
        return "plan"
    if "업무보고" in t or "업무현황" in t:
        return "briefing"
    if "서면" in t and "답변" in t:
        return "written_answer"
    return "reference"


def audit_year(title, posted):
    m = re.search(r"(20\d{2})\s*년도?", title or "")
    if m:
        return int(m.group(1))
    # 제목에 연도가 없으면 게시연도 - 1 (국감 다음 해에 게시되는 관행)
    try:
        return int((posted or "")[:4]) - 1
    except ValueError:
        return None


def main():
    # 기존 수집분 로드 → 새 항목만 추가 (누적 아카이브)
    items, seen = [], set()
    if os.path.exists(OUT):
        try:
            with open(OUT, encoding="utf-8") as f:
                items = json.load(f).get("items", [])
            seen = {i.get("article_no") for i in items}
        except Exception:
            items, seen = [], set()
    before, total = len(items), None
    for page in range(1, MAX_PAGES + 1):
        d = fetch_page(page)
        if not d:
            break
        total = d.get("totalCount") or total
        rows = d.get("bulletinList") or []
        if not rows:
            break
        for r in rows:
            key = r.get("articleNo")
            if key in seen:
                continue
            seen.add(key)
            title = (r.get("title") or "").strip()
            base = r.get("fileDownUrl") or ""
            names = [n for n in (r.get("fileNameList") or "").split("^") if n]
            ids = [i for i in (r.get("fileIdList") or "").split("^") if i]
            files = [{"name": n, "url": base + i} for n, i in zip(names, ids)] if base else []
            items.append({
                "article_no": key,
                "year": audit_year(title, r.get("updateDate")),
                "committee": (r.get("committeeName") or "").strip(),
                "doc_type": doc_type(title),
                "title": title,
                "posted": r.get("updateDate") or "",
                "files": files,
            })
        time.sleep(1)
    items.sort(key=lambda x: (-(x["year"] or 0), x["committee"]))
    out = {"updated": datetime.date.today().isoformat(), "source": "likms.assembly.go.kr/inspections", "items": items}
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
    hb = sum(1 for i in items if "보건복지" in i["committee"])
    print(f"완료: 신규 {len(items) - before}건 추가, 누적 {len(items)}건 (보건복지위 {hb}건)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
