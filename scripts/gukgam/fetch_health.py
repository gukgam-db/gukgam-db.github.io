#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
국정감사 자료 DB — 보건복지 트랙 기관 크롤러 (Phase 2, 키 불필요)
- 각 기관이 스스로 공개하는 국정감사 자료(업무보고·서면답변 등)의 게시물 링크를 수집합니다.
- 기관별 게시판 구조가 제각각이라 '어댑터' 방식: AGENCIES 설정에 검증된 게시판만 활성화.
  새 기관을 붙일 때는 목록 URL과 행 추출 패턴만 추가하면 됩니다.
- 원문 파일은 저장하지 않고 게시물 링크만 수집(누적 merge, url 기준 중복 제거).

실행: python3 scripts/gukgam/fetch_health.py
출력: data/gukgam/health-agency-docs.json
"""
import os, re, json, time, datetime
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, "data", "gukgam", "health-agency-docs.json")
UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) gukgam-db collector"}

# 어댑터 설정: 검증된 게시판만 활성화 (2026-08 실측)
# row_pattern: (링크, 제목) 2개 그룹을 뽑는 정규식. 제목에 국정감사 키워드가 있는 행만 채택.
AGENCIES = [
    {
        "agency_id": "mohw",
        "source": "복지부 사전정보공표",
        "base": "https://www.mohw.go.kr",
        # '국정감사 업무보고 자료' 카테고리(list_no=355595) 하위 게시물 목록
        "list_url": "https://www.mohw.go.kr/board.es?mid=a10107010100&bid=0037&act=list&list_no=355595&list_depth=1",
        "row_pattern": r'<a[^>]+href="([^"]*act=view[^"]*)"[^>]*>\s*([^<]{4,90})',
    },
    # TODO(질병청 kdca): 사전정보공표 내 국정감사 게시판 URL 확인 후 추가 (menu.es 구조가 자주 개편됨)
    # TODO(심평원 hira): 서면질의 답변서 게시판(bbsDummy pgmid) 확인 후 추가
    # TODO(건보공단 nhis): 국회제출자료 게시판 확인 후 추가
]

KEYWORDS = ("국정감사", "국감")

# 보건복지위원회 공식 게시판 (health.na.go.kr) — 계획서·결과보고서·과거 요구자료·시정처리
NA_BASE = "https://health.na.go.kr"
NA_BOARDS = [
    ("BCMT2002", "2000030", "복지위 게시판(계획서)"),
    ("BCMT2003", "2000031", "복지위 게시판(결과보고서)"),
    ("BCMT2004", "2000030", "복지위 게시판(과거자료)"),
    ("BCMT2005", "2000032", "복지위 게시판(시정처리)"),
]

# 제목 괄호 속 기관명 → agency_id (과거 명칭 포함)
AGENCY_ALIAS = {
    "보건복지부": "mohw", "보건복지가족부": "mohw", "질병관리청": "kdca", "질병관리본부": "kdca",
    "국립보건원": "nih", "국립보건연구원": "nih", "식품의약품안전처": "mfds", "식품의약품안전청": "mfds",
    "국민건강보험공단": "nhis", "국민연금공단": "nps", "국민연금관리공단": "nps",
    "건강보험심사평가원": "hira", "한국보건산업진흥원": "khidi", "국립암센터": "ncc",
    "국립중앙의료원": "nmc", "대한적십자사": "redcross",
}


def na_doc_type(title):
    t = title or ""
    if "요구자료" in t:
        return "request_list"
    if "처리결과" in t or "시정" in t:
        return "followup"
    if "결과보고서" in t:
        return "result_report"
    if "계획서" in t:
        return "plan"
    if "업무보고" in t or "업무현황" in t:
        return "briefing"
    return "reference"


def na_year(title):
    m = re.search(r"(19\d{2}|20\d{2})", title or "")
    if m:
        return int(m.group(1))
    m = re.search(r"['’](\d{2})", title or "")
    if m:
        y = int(m.group(1))
        return 1900 + y if y > 50 else 2000 + y
    return None


def na_agency(title):
    for m in re.findall(r"\(([^)]{2,20})\)", title or ""):
        for k, v in AGENCY_ALIAS.items():
            if k in m:
                return v
    return None


def fetch_url(url):
    req = urllib.request.Request(url, headers=UA)
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                return r.read().decode("utf-8", errors="ignore")
        except Exception:
            time.sleep(2 * (attempt + 1))
    return ""


def crawl_na_boards():
    """복지위 공식 게시판 순회 — 국정감사 관련 게시물(요구자료·계획서·결과보고서·시정처리) 수집."""
    out = []
    for board, menu, label in NA_BOARDS:
        seen_page = set()
        for page in range(1, 16):
            html = fetch_url(f"{NA_BASE}/cmmit/bbs/{board}/list.do?menuNo={menu}&pageIndex={page}")
            rows = re.findall(r'href="([^"]*?/bbs/' + board + r'/view\.do[^"]*)"[^>]*>\s*([^<]{4,90})', html)
            new = 0
            for href, title in rows:
                title = title.strip()
                url = (NA_BASE + href.replace("&amp;", "&")) if href.startswith("/") else href.replace("&amp;", "&")
                if url in seen_page or not any(k in title for k in KEYWORDS):
                    continue
                seen_page.add(url)
                out.append({
                    "year": na_year(title),
                    "agency_id": na_agency(title),
                    "doc_type": na_doc_type(title),
                    "title": title,
                    "source": label,
                    "url": url,
                })
                new += 1
            if not rows or new == 0 and page > 2:
                break
            time.sleep(1)
        print(f"[{label}] 누적 {sum(1 for o in out if o['source']==label)}건")
    return out


def doc_type(title):
    t = title or ""
    if "서면" in t and "답변" in t:
        return "written_answer"
    if "업무보고" in t or "업무현황" in t:
        return "briefing"
    if "결과보고서" in t:
        return "result_report"
    if "요구자료" in t:
        return "request_list"
    return "reference"


def year_of(title):
    m = re.search(r"(20\d{2})", title or "")
    return int(m.group(1)) if m else None


def crawl(cfg):
    req = urllib.request.Request(cfg["list_url"], headers=UA)
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                html = r.read().decode("utf-8", errors="ignore")
            break
        except Exception as e:
            if attempt < 2:
                time.sleep(3 * (attempt + 1))
            else:
                print(f"[{cfg['agency_id']}] 목록 수집 실패: {e}")
                return []
    out = []
    for href, title in re.findall(cfg["row_pattern"], html):
        title = title.strip()
        if not any(k in title for k in KEYWORDS):
            continue
        url = href.replace("&amp;", "&")
        if url.startswith("/"):
            url = cfg["base"] + url
        out.append({
            "year": year_of(title),
            "agency_id": cfg["agency_id"],
            "doc_type": doc_type(title),
            "title": title,
            "source": cfg["source"],
            "url": url,
        })
    print(f"[{cfg['agency_id']}] {len(out)}건 수집")
    return out


def main():
    items, seen = [], set()
    if os.path.exists(OUT):
        try:
            with open(OUT, encoding="utf-8") as f:
                items = json.load(f).get("items", [])
            seen = {i.get("url") for i in items}
        except Exception:
            items, seen = [], set()
    before = len(items)
    for cfg in AGENCIES:
        for row in crawl(cfg):
            if row["url"] in seen:
                continue
            seen.add(row["url"])
            items.append(row)
        time.sleep(1)
    for row in crawl_na_boards():
        if row["url"] in seen:
            continue
        seen.add(row["url"])
        items.append(row)
    items.sort(key=lambda x: (-(x["year"] or 0), x["agency_id"] or "~"))
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump({"updated": datetime.date.today().isoformat(), "items": items}, f, ensure_ascii=False, indent=1)
    print(f"완료: 신규 {len(items) - before}건, 누적 {len(items)}건")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
