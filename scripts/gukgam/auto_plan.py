#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
국정감사 자료 DB — 국정감사계획서 자동 탐지·파싱

계획서는 국회 공개 API에 없다. 대신 fetch_health.py가 매일 긁는 복지위 게시판(계획서) 수집 결과
(health-agency-docs.json)에서 '○○○○년도 국정감사계획서' 게시글을 찾아, 게시글 페이지의 PDF 첨부를
build_plan.py로 파싱한다. 첨부가 HWP뿐이면 파싱하지 못하므로 로그에 남기고 수동 업로드를 기다린다.

처리 기준: 기존 plan-연도.json이 없거나, 같은 연도라도 더 새 게시글(변경본, nttId가 큼)이면 다시 파싱.
build_plan의 자체 검증에 걸리면 기존 파일을 그대로 둔다.
"""
import os, re, json, sys, subprocess, urllib.request, urllib.parse

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA = os.path.join(ROOT, "data", "gukgam")
UA = {"User-Agent": "Mozilla/5.0 (gukgam-db collector)"}


def fetch(url):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read().decode("utf-8", errors="ignore")


def post_id(url):
    m = re.search(r"nttId=(\d+)", url or "")
    return int(m.group(1)) if m else 0


def find_pdf(html, base):
    """게시글 HTML에서 PDF 첨부 링크를 찾는다 — 링크 텍스트나 주소에 .pdf, 또는 파일 다운로드 주소에 pdf 표기."""
    cands = []
    for href, text in re.findall(r'<a[^>]+href="([^"]+)"[^>]*>(.*?)</a>', html, flags=re.S | re.I):
        t = re.sub(r"<[^>]+>", "", text).strip()
        h = href.replace("&amp;", "&")
        if re.search(r"\.pdf\b", t, re.I) or re.search(r"\.pdf\b", h, re.I) or ("fileDown" in h and "pdf" in (t + h).lower()):
            cands.append((h, t))
    # 계획서 본문(변경본 포함)만 — 증인 명단 같은 다른 PDF를 계획서로 오인하지 않게
    cands = [c for c in cands if "계획서" in c[1]]
    cands.sort(key=lambda x: len(x[1]))
    if not cands:
        return None, None
    h, t = cands[0]
    return (urllib.parse.urljoin(base, h), t)


def main():
    p = os.path.join(DATA, "health-agency-docs.json")
    if not os.path.exists(p):
        print("health-agency-docs.json 없음 — 게시판 수집 뒤에 실행")
        return 0
    docs = json.load(open(p, encoding="utf-8")).get("items", [])
    plans = []
    for d in docs:
        t = d.get("title") or ""
        m = re.search(r"(20\d\d)년도?\s*국정감사\s*계획서", t)
        if d.get("doc_type") == "plan" and m and "명단" not in t and "증인" not in t:
            plans.append((int(m.group(1)), post_id(d.get("url")), d))
    if not plans:
        print("계획서 게시글 없음")
        return 0
    plans.sort(reverse=True)
    year, nid, d = plans[0]
    out = os.path.join(DATA, "plan-%d.json" % year)
    if os.path.exists(out):
        cur = json.load(open(out, encoding="utf-8"))
        if cur.get("source_post") == nid or (cur.get("source_post") is None and year <= 2025):
            print("%d년 계획서 이미 반영(게시글 %s) — 건너뜀" % (year, nid))
            return 0
    url = (d.get("url") or "").strip()
    print("계획서 게시글 발견: %s (%d년, 게시글 %s)" % (d.get("title"), year, nid))
    try:
        html = fetch(url)
    except Exception as e:
        print("게시글 페이지 실패: %s" % e)
        return 0
    pdf, label = find_pdf(html, url)
    if not pdf:
        print("PDF 첨부 없음(HWP만 있을 수 있음) — 수동 업로드(plan_url 입력 또는 PDF) 필요")
        return 0
    print("PDF 첨부: %s (%s)" % (label, pdf))
    env = dict(os.environ, GUKGAM_PLAN_URL=pdf, GUKGAM_PLAN_YEAR=str(year), GUKGAM_PLAN_POST=str(nid))
    r = subprocess.run([sys.executable, os.path.join(os.path.dirname(os.path.abspath(__file__)), "build_plan.py")], env=env)
    if r.returncode != 0:
        print("계획서 파싱 실패(자체 검증) — 기존 파일 유지, 양식 확인 필요")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
