#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
부동산 정책 뉴스 헤드라인 자동 수집 → data/news.json
- 구글 뉴스 RSS(공개)에서 '제목 + 출처 + 원문링크 + 날짜'만 모읍니다(저작권 안전).
- 정치 발언보다 '제도/정책(대출·세금·공급·청약)' 위주로 질의어를 구성.
실행: python3 scripts/build_news.py   (키 불필요)
"""
import os, re, json, socket, datetime, time
import urllib.request, urllib.parse
import xml.etree.ElementTree as ET

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# 실용 정책 중심 질의어 (정치 발언·인물 제외)
QUERIES = [
    "부동산 대책", "주택 공급 대책", "청약 제도 개편",
    "부동산 대출 규제 LTV DSR", "부동산 세금 개편", "전월세 정책", "재건축 재개발 정책",
]
# 노이즈/정치성 강한 제목 제외 키워드 (제도·정책 위주로, 정쟁성 기사 배제)
BLOCK = ["단독", "칼럼", "사설", "인터뷰", "속보 영상",
         "정당", "여야", "찬반", "막말", "공천", "총선", "대선", "탄핵", "고발", "논평",
         "대통령", "대통령실", "청와대", "지지율", "민심", "여론", "여론조사",
         "정권", "취임", "국정", "심판", "개각", "李", "尹",
         "국힘", "국민의힘", "민주당", "공방", "네 탓", "결의"]

def force_ipv4():
    if getattr(socket, "_v4", False): return
    orig = socket.getaddrinfo
    socket.getaddrinfo = lambda h,*a,**k: [r for r in orig(h,*a,**k) if r[0]==socket.AF_INET] or orig(h,*a,**k)
    socket._v4 = True

def fetch(q):
    url = "https://news.google.com/rss/search?q=" + urllib.parse.quote(q) + "&hl=ko&gl=KR&ceid=KR:ko"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (galmae-budongsan news)"})
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                return ET.fromstring(r.read())
        except Exception as e:
            if attempt < 2: time.sleep(2*(attempt+1))
            else: print(f"[{q}] 수집 실패: {e}")
    return None

def parse_date(s):
    for fmt in ("%a, %d %b %Y %H:%M:%S %Z", "%a, %d %b %Y %H:%M:%S GMT"):
        try: return datetime.datetime.strptime(s, fmt).strftime("%Y-%m-%d")
        except Exception: pass
    return ""

def main():
    force_ipv4()
    items, seen = [], set()
    for q in QUERIES:
        root = fetch(q)
        if root is None: continue
        for it in root.iter("item"):
            title = (it.findtext("title") or "").strip()
            link = (it.findtext("link") or "").strip()
            if not title or not link: continue
            src_el = it.find("source")
            source = (src_el.text.strip() if src_el is not None and src_el.text else "")
            # 제목 끝의 " - 언론사" 정리 + 출처 보완
            m = re.search(r"\s-\s([^-]+)$", title)
            if m and not source: source = m.group(1).strip()
            title = re.sub(r"\s-\s[^-]+$", "", title).strip()
            if any(b in title for b in BLOCK): continue
            key = re.sub(r"\s+", "", title)[:40]
            if key in seen: continue
            seen.add(key)
            items.append({"title": title, "source": source,
                          "link": link, "date": parse_date(it.findtext("pubDate") or "")})
    items.sort(key=lambda x: x["date"], reverse=True)
    items = items[:18]
    if not items:
        print("::warning::뉴스 수집 0건 — 기존 뉴스를 유지하고 건너뜁니다."); return 0
    out = {"updated": datetime.date.today().isoformat(), "items": items}
    with open(os.path.join(ROOT, "data/news.json"), "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
    print(f"완료: 뉴스 {len(items)}건 저장")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
