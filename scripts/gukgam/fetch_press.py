#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
국정감사 자료 DB — 국감 관련 최근 보도 수집 (구글 뉴스 RSS, 키 불필요)

의원실 보도자료는 한곳에 모이지 않고, 이슈가 되는 건 언론이 받아쓴 기사다. 그래서
'위원 이름 + 국정감사'와 '기관명 + 국정감사'로 구글 뉴스를 매일 검색해 최근 기사를 모은다.
본회의 대정부질문도 함께 찾는다 — 연 네 차례뿐이고 보건복지는 '교육사회문화' 분야 하루라
회의록을 따로 수집할 값어치는 없지만, 그날 나온 쟁점은 예상 질의의 재료가 되기 때문이다.
- 중복: 제목 정규화(공백·기호 제거)로 묶는다
- 분류: 제목·요약의 키워드로 기관(질병청/복지부/식약처/복지위)과 언급 위원을 붙인다
- 누적: press.json에 60일치 유지 (같은 기사는 처음 본 날 기준)
한계: 기사로 안 받아진 보도자료는 잡히지 않는다. 언론 보도 기준이지 보도자료 원문이 아니다.
출력: data/gukgam/press.json
"""
import os, io, re, json, time, datetime, email.utils, urllib.request, urllib.parse
import xml.etree.ElementTree as ET
from textclean import clean_deep   # 국회 자료에 섞여 오는 HTML 엔티티를 저장 전에 푼다

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA = os.path.join(ROOT, "data", "gukgam")
OUT = os.path.join(DATA, "press.json")
UA = {"User-Agent": "Mozilla/5.0 (gukgam-db collector)"}
KEEP_DAYS = 60
WINDOW = os.environ.get("GUKGAM_PRESS_WINDOW", "14d")

# 언론은 '대정부질문'과 '대정부 질문'을 섞어 쓴다
INTERP = re.compile(r"대정부\s*질문")
# 대정부질문 기사 중 보건복지와 무관한 것(외교·경제·정치 분야)을 걸러 내는 주제어
HEALTH = re.compile(r"보건|복지|의료|의대|의사|간호|약사|제약|병원|환자|감염병|백신|예방접종|방역|검역|연금|건강보험|"
                    r"돌봄|요양|치매|정신건강|응급|저출생|저출산|장애인|마약|식품|의약품|담배|자살")
# 일정 안내 기사는 쟁점이 아니다
NOTICE = re.compile(r"오늘의\s*(국회)?\s*(주요)?\s*일정|주요\s*일정|일정\]|국회일정")
# 의원실이 국감 자료로 낸 기사의 표지. 같은 내용을 어떤 매체는 '[2026국감]'을 달아 쓰고
# 어떤 매체는 '남인순 "…697건 적발"'로 쓴다. 뒤쪽은 제목에 국감이 없어 통째로 빠졌다.
DATA_CUE = re.compile(r"\d+\s*(건|명|억|만|%|배)|적발|지적|미흡|부실|급증|급감|최근\s*\d+\s*년|\d+년간|현황|실태|집계|분석 결과|자료에 따르면|제출받")

AGENCY = [("질병관리청", ["질병관리청", "질병청"]), ("보건복지부", ["보건복지부", "복지부"]), ("식품의약품안전처", ["식품의약품안전처", "식약처"]),
          ("국민건강보험공단", ["건강보험공단", "건보공단"]), ("국민연금공단", ["국민연금공단", "연금공단"]), ("건강보험심사평가원", ["심사평가원", "심평원"])]


def load(name):
    p = os.path.join(DATA, name)
    if not os.path.exists(p):
        return {}
    with open(p, encoding="utf-8") as f:
        return json.load(f)


def norm(t):
    return re.sub(r"[\s\W_]+", "", (t or "").lower())


def fetch_rss(q):
    url = "https://news.google.com/rss/search?" + urllib.parse.urlencode({"q": q + " when:" + WINDOW, "hl": "ko", "gl": "KR", "ceid": "KR:ko"})
    for attempt in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=25) as r:
                return ET.fromstring(r.read())
        except Exception as e:
            if attempt == 2:
                print("  실패 %s: %s" % (q, e))
            time.sleep(2)
    return None


def items_of(root):
    out = []
    if root is None:
        return out
    for it in root.iter("item"):
        title = (it.findtext("title") or "").strip()
        link = (it.findtext("link") or "").strip()
        pub = it.findtext("pubDate") or ""
        src = it.findtext("source") or ""
        try:
            d = email.utils.parsedate_to_datetime(pub).astimezone(datetime.timezone(datetime.timedelta(hours=9))).date().isoformat()
        except Exception:
            d = ""
        # 구글 뉴스 제목은 '제목 - 매체' 꼴
        m = re.match(r"^(.*)\s+-\s+([^-]{2,30})$", title)
        if m and not src:
            title, src = m.group(1).strip(), m.group(2).strip()
        elif m:
            title = m.group(1).strip()
        desc = re.sub(r"<[^>]+>", " ", it.findtext("description") or "")
        if title and link:
            out.append({"title": title, "url": link, "date": d, "source": src.strip(), "_desc": desc})
    return out


def relevance(a, members):
    """국감 관련도 — 제목에 국정감사/국감/복지위가 있으면 확실, 요약에만 있으면 약함. 위원·기관 이름이 더해지면 가산.
    구글 검색은 '국정감사'를 느슨하게 맞춰 연금·예산·인사 기사가 섞여 들어오므로 여기서 거른다."""
    t, d = a["title"], a.get("_desc", "")
    sc = 0
    if re.search(r"도의회|시의회|군의회|구의회|의정대상|수상", t): return 0   # 지방의회·시상 기사는 국회 국감이 아니다
    if NOTICE.search(t): return 0                                              # '오늘의 국회일정' 류는 안내지 쟁점이 아니다
    if re.search(r"국정감사|국감|보건복지위|복지위", t): sc += 2
    elif re.search(r"국정감사|국감|보건복지위", d): sc += 1
    elif INTERP.search(t):
        # 대정부질문은 네 분야로 나눠 하루씩 한다. 보건복지와 닿는 기사만 남긴다.
        sc += 1
        if any(w in t for _, kws in AGENCY for w in kws) or HEALTH.search(t) or HEALTH.search(d): sc += 1
    if any(w in t for _, kws in AGENCY for w in kws): sc += 1
    if any(n in t for n in members): sc += 1
    # 제목에 위원 이름과 수치·적발 같은 자료 표지가 함께 있으면 의원실 국감 자료 기사로 본다.
    # 단순 논평('남인순 의원 "청신호"')은 표지가 없어 걸리지 않는다.
    if sc < 2 and any(n in t for n in members) and DATA_CUE.search(t): sc = 2
    return sc


def track(a):
    """이 기사가 국정감사 것인지 대정부질문 것인지 — 예상 질의 도구에서 출처를 구분해 보이기 위해서다."""
    t = a["title"]
    if INTERP.search(t): return "대정부질문"
    if re.search(r"국정감사|국감", t): return "국정감사"
    return ""    


def main():
    members = [m["name"] for m in load("members.json").get("items", []) if m.get("name")]
    queries = [("agency", "보건복지위원회 국정감사"), ("agency", "질병관리청 국정감사"), ("agency", "보건복지부 국정감사"), ("agency", "식약처 국정감사"),
               ("agency", "질병관리청 국감 자료"), ("agency", "복지위 국감 증인"),
               ("interp", "대정부질문 보건복지"), ("interp", "대정부질문 교육사회문화"),
               ("interp", "대정부질문 의료"), ("interp", "대정부질문 연금"),
               ("interp", "대정부질문 돌봄"), ("interp", "대정부질문 의대")]
    queries += [("member", '"%s" 국정감사' % n) for n in members]
    found = {}
    for kind, q in queries:
        for a in items_of(fetch_rss(q)):
            k = norm(a["title"])[:60]
            if not k:
                continue
            if k not in found:
                a["queries"] = []
                found[k] = a
            found[k]["queries"].append(q)
        time.sleep(0.8)
    now_kst = datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=9)))   # 러너 시간대와 무관하게 KST
    today = now_kst.date()
    old = load("press.json").get("items", [])
    merged = {norm(a["title"])[:60]: a for a in old if a.get("first_seen") and (today - datetime.date.fromisoformat(a["first_seen"])).days <= KEEP_DAYS}
    new = 0
    for k, a in found.items():
        t = a["title"]
        a["score"] = relevance(a, members)
        if a["score"] < 2:            # 제목에 국감이 없고 요약에만 스치듯 있는 기사는 뺀다
            continue
        a["agencies"] = [name for name, kws in AGENCY if any(w in t for w in kws)]
        a["members"] = [n for n in members if n in t]
        a["track"] = track(a)
        if k in merged:
            merged[k].update({x: a[x] for x in ("agencies", "members", "date", "source", "url", "track") if a.get(x)})
        else:
            a["first_seen"] = today.isoformat()
            merged[k] = a
            new += 1
    items = sorted(merged.values(), key=lambda x: (x.get("date") or x["first_seen"]), reverse=True)
    for a in items:
        a.pop("queries", None); a.pop("_desc", None)
    with io.open(OUT, "w", encoding="utf-8") as f:
        json.dump(clean_deep({"updated": today.isoformat(), "updated_at": now_kst.strftime("%Y-%m-%d %H:%M"), "window": WINDOW,
                   "note": "구글 뉴스 검색(위원 이름·기관명 + 국정감사, 그리고 본회의 대정부질문) 기반 최근 기사. 언론 보도 기준이며 의원실 보도자료 원문이 아님. "
                           "기관·위원 분류와 국정감사/대정부질문 구분(track)은 제목 키워드 자동.",
                   "count": len(items), "items": items}), f, ensure_ascii=False, indent=1)
    by_ag = {}
    for a in items:
        for g in a["agencies"] or ["기타"]:
            by_ag[g] = by_ag.get(g, 0) + 1
    print("완료: 기사 %d건 (신규 %d) · 기관별 %s · 위원 언급 %d건" % (len(items), new, by_ag, sum(1 for a in items if a["members"])))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
