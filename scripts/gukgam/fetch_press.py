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
# 보건복지위 소관인지 가르는 낱말. 처음에는 '의약품'만 넣어 두어 '현대약품'·'항바이러스제'·
# '똑똑플란트치과' 같은 복지위 쟁점 기사가 무관한 기사로 밀려났다. 실제로 걸러진 것을 보고 넓혔다.
HEALTH = re.compile(r"보건|복지|의료|의대|의사|간호|약사|약국|약값|약가|약품|약배송|필수약|제약|의약|신약|임상|허가|"
                    r"치과|한의|간병|보건소|병원|환자|감염병|바이러스|백신|예방접종|방역|검역|연금|건강보험|건보|심평원|"
                    r"국민건강|돌봄|요양|치매|정신건강|응급|저출생|저출산|장애인|휠체어|마약|식품|식약|카페인|건강기능|"
                    r"담배|금연|자살|출산|난임|보육|아동|노인|질병|희귀질환|헌혈|혈액|장기기증|산부인과|소아|전공의|비만")
# 일정 안내 기사는 쟁점이 아니다
NOTICE = re.compile(r"오늘의\s*(국회)?\s*(주요)?\s*일정|주요\s*일정|일정\]|국회일정")
# 의원실이 국감 자료로 낸 기사의 표지. 같은 내용을 어떤 매체는 '[2026국감]'을 달아 쓰고
# 어떤 매체는 '남인순 "…697건 적발"'로 쓴다. 뒤쪽은 제목에 국감이 없어 통째로 빠졌다.
DATA_CUE = re.compile(r"\d+\s*(건|명|억|만|%|배)|적발|지적|미흡|부실|급증|급감|최근\s*\d+\s*년|\d+년간|현황|실태|집계|분석 결과|자료에 따르면|제출받")

# 소관 사업·통계 — 제목에 '국감'이 없어도 10월 국감장에 그대로 올라오는 기사들이다.
# '질병관리청 국정감사'로 검색하면 안 잡힌다. 국민건강영양조사 결과 발표(최근 14일 47건)와
# 고혈압·당뇨병 등록관리사업 예산 삭감(29건)이 통째로 빠져 있던 것이 이 때문이다.
# (주제, 구글 검색어, 제목 확인) — 구글이 느슨하게 맞춘 기사를 제목으로 한 번 더 거른다.
# 검색어만 믿으면 '2030은 담배·지방 늘고' 같은 받아쓰기 수십 건이 한꺼번에 들어온다.
TOPIC_QUERIES = [
    ("국민건강영양조사", "국민건강영양조사", r"국민건강영양조사|건강영양조사"),
    ("만성질환·고당사업", "고혈압 당뇨병 등록관리사업", r"고혈압|당뇨|고·당|고당\s*사업|만성질환\s*(관리|통합|등록)"),
    ("만성질환·고당사업", "질병관리청 만성질환 관리사업", r"고혈압|당뇨|고·당|고당\s*사업|만성질환\s*(관리|통합|등록)"),
    ("예방접종", "질병관리청 예방접종", r"예방접종|접종률|백신"),
    ("감염병 대응", "질병관리청 감염병 방역", r"감염병|방역|유행|확산|엠폭스|홍역|결핵"),
    ("검역·해외유입", "질병관리청 검역 해외유입", r"검역|해외유입"),
    ("연구·R&D", "국립보건연구원 연구개발", r"국립보건연구원|연구개발|바이오빅데이터"),
    ("건강보험", "건강보험 보장성 보험료", r"건강보험|건보|보험료|수가|급여"),
    ("의료인력", "의대 정원 전공의", r"의대\s*정원|전공의|의사\s*인력|필수의료"),
    ("연금", "국민연금 기금 개혁", r"국민연금|연금개혁|기초연금"),
    ("돌봄·요양", "장기요양 돌봄 요양병원", r"장기요양|요양|돌봄|치매"),
    ("저출생·아동", "저출생 보육 아동학대", r"저출생|저출산|보육|아동학대|어린이집"),
    ("의약품·마약류", "식약처 의약품 마약류", r"의약품|마약|약가|품절약|제약"),
]
TOPIC_RE = {}
for _t, _q, _rx in TOPIC_QUERIES:
    TOPIC_RE.setdefault(_t, re.compile(_rx))
# 주제 검색은 그물이 넓어 국감 재료가 아닌 것이 함께 걸려 온다. 네 갈래로 걷어낸다.
# 지자체 행정 기사 — 제목이 '○○시,' 꼴로 시작한다. 국회 국감 대상이 아니다.
T_LOCAL = re.compile(r"(?:^|[…\"'”’]\s*)[가-힣]{2,8}(?:시|군|구|도)\s*[,，]|[가-힣]{2,5}(?:시장|군수|구청장|도지사)\b")
# 민간 보험·기업 기사 — '건강보험'으로 검색하면 생명보험사 상품 기사가 쏟아진다
T_BIZ = re.compile(r"생명보험|손해보험|보험사|설계사|해약환급금|종신|변액|수익성|건전성|영업\s*확대|주가|상장|"
                   r"코스닥|코스피|실적|매출|신상품|출시|무·해지|GA\s*채널|GA\s*영업|車|자동차보험|간병보험")
# 행사 안내 — 개최·위촉·협약은 쟁점이 아니라 일정이다
T_EVENT = re.compile(r"개최|개청|출범식|기념식|위촉|임명|협약|공모|캠페인|세미나|포럼|심포지엄|토론회|간담회|"
                     r"발대식|수상|시상|선정됐|우수기관|표창")
# 계도성 보도자료 받아쓰기 — '주의 당부', '예방수칙'
T_CALM = re.compile(r"주의보|주의해야|주의 ?당부|예방법|예방수칙|행동수칙|당부|안내합니다|권고합니다|알아두|꿀팁|\[카드뉴스\]")
# 국감 재료의 표지 — 예산·제도가 흔들리거나, 숫자로 따질 거리가 있거나, 조사 결과가 나왔을 때
T_CUE = re.compile(r"삭감|감액|증액|중단|끊|폐지|개편|축소|확대|신설|동결|인상|인하|반발|우려|논란|지적|비판|"
                   r"요구|촉구|부실|미흡|사각지대|급증|급감|고갈|적발|위반|실태|현황|분석|점검|문제|지연|저조|"
                   r"미달|뒷걸음|악화|결과\s*(?:발표|공개)|\d+\s*(?:건|명|억|만|%|배|곳|개국|개소)|\d+\s*년간|"
                   r"최근\s*\d+\s*년|단독")


SOURCE_SKIP = re.compile(r"브런치|brunch|blog|티스토리|tistory|네이버\s*포스트|유튜브|youtube|채널")


def topic_reject(t, src=""):
    """소관 사업 기사를 뺄 이유 — 뺀 까닭을 이름으로 남겨야 나중에 손볼 수 있다."""
    if src and SOURCE_SKIP.search(src): return "블로그"
    if TOPIC_SKIP.search(t): return "잡기사"
    if T_LOCAL.search(t):    return "지자체"
    if T_BIZ.search(t):      return "민간기업"
    if T_EVENT.search(t):    return "행사안내"
    if T_CALM.search(t):     return "계도성"
    if not T_CUE.search(t):  return "쟁점표지없음"
    return None


def story_key(t):
    """제목에서 두 글자 이상 한글 토막만 뽑는다 — 같은 보도자료를 받아쓴 기사끼리 겹친다."""
    return set(w for w in re.findall(r"[가-힣]{2,}", t or ""))


SAME_STORY = 3   # 토막 세 개가 겹치면 같은 사건으로 본다
TOPIC_CAP = 5        # 주제당 몇 건까지 — 같은 보도자료 받아쓰기로 카드가 묻히지 않게
TOPIC_DAYS = 21      # 소관 사업 기사는 60일까지 끌고 갈 값어치가 없다(쟁점이 빨리 식는다)
# 기사도 아니고 쟁점도 아닌 것들
TOPIC_SKIP = re.compile(r"도의회|시의회|군의회|구의회|의정대상|수상|부고|인사말|채용|공모|협약\s*체결|카드뉴스|포토|주가|코스닥|코스피|"
                        r"칼럼|기고|사설|오피니언|복지상식|\[[^\]]*의\s[^\]]*\]")   # 칼럼·연재물은 기사가 아니다

AGENCY = [("질병관리청", ["질병관리청", "질병청"]), ("보건복지부", ["보건복지부", "복지부"]), ("식품의약품안전처", ["식품의약품안전처", "식약처"]),
          ("국민건강보험공단", ["건강보험공단", "건보공단"]), ("국민연금공단", ["국민연금공단", "연금공단"]), ("건강보험심사평가원", ["심사평가원", "심평원"])]


# 제목 끝에 남은 매체 도메인 — '… - auto-today.co.kr'
DOMAIN_TAIL = re.compile(r"\s+-\s+([A-Za-z0-9][A-Za-z0-9.\-]*\.[A-Za-z]{2,}(?:\.[A-Za-z]{2,})?)\s*$")


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
        # 매체 이름에 붙임표가 있으면('wikileaks-kr.org', 'auto-today.co.kr') 위 규칙이
        # 안 걸려 제목에 도메인이 그대로 남는다. RSS가 알려 준 매체명과 도메인 꼴을 따로 뗀다.
        if src and title.endswith(" - " + src):
            title = title[: -(len(src) + 3)].strip()
        md = DOMAIN_TAIL.search(title)
        if md:
            title = title[: md.start()].strip()
            src = src or md.group(1)
        # 매체 이름이 두 번 붙기도 한다('… - 조선비즈 - Chosunbiz'). 한글/영문 매체명이
        # 겹쳐 붙은 경우까지 한 번 더 뗀다 — 공백 없는 짧은 꼬리만.
        m2 = re.match(r"^(.{15,})\s+-\s+(\S{2,12})$", title)
        if m2:
            title = m2.group(1).strip()
        # 일부 매체는 제목 끝에 '> 뉴스' 같은 게시판 경로를 달아 보낸다
        title = re.sub(r"\s*[>|]\s*(뉴스|기사|홈)\s*$", "", title).strip()
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
    queries += [("topic:" + t, q) for t, q, _ in TOPIC_QUERIES]
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
            if kind.startswith("topic:"):
                t = kind[6:]
                # 제목이 실제로 그 주제를 담고 있을 때만 소관 사업 기사로 본다
                if TOPIC_RE[t].search(a["title"]) and not topic_reject(a["title"], a.get("source", "")):
                    found[k].setdefault("_topics", [])
                    if t not in found[k]["_topics"]:
                        found[k]["_topics"].append(t)
        time.sleep(0.8)
    now_kst = datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=9)))   # 러너 시간대와 무관하게 KST
    today = now_kst.date()
    old = load("press.json").get("items", [])
    merged = {norm(a["title"])[:60]: a for a in old if a.get("first_seen") and (today - datetime.date.fromisoformat(a["first_seen"])).days <= KEEP_DAYS}
    new = 0
    for k, a in found.items():
        t = a["title"]
        a["score"] = relevance(a, members)
        if a["score"] >= 2:
            a["track"] = track(a)
            a.pop("topic", None)
        elif a.get("_topics"):
            # 제목에 국감이 없어도 소관 사업·통계 기사는 국감 재료다 — 다만 국감 기사와
            # 섞지 않고 track을 달리해 화면에서 따로 보여 준다.
            a["track"] = "소관사업"
            a["topic"] = a["_topics"][0]
        else:
            continue              # 제목에 국감이 없고 요약에만 스치듯 있는 기사는 뺀다
        a["agencies"] = [name for name, kws in AGENCY if any(w in t for w in kws)]
        a["members"] = [n for n in members if n in t]
        if k in merged:
            merged[k].update({x: a[x] for x in ("agencies", "members", "date", "source", "url", "track", "topic") if a.get(x)})
        else:
            a["first_seen"] = today.isoformat()
            merged[k] = a
            new += 1
    # 구글은 같은 기사를 제목만 늘려 또 준다('…개선' / '…개선 김예지·국민의힘, 소아…').
    # 한쪽 제목이 다른 쪽의 머리면 같은 기사로 묶고 짧은 쪽(원 제목)을 남긴다.
    # 쌓아 둔 것까지 함께 훑어야 예전에 들어온 중복도 없어진다.
    dkeys = sorted(merged, key=len)
    dropped = 0
    for i, ka in enumerate(dkeys):
        if ka not in merged or len(ka) < 20:
            continue
        for kb in dkeys[i + 1:]:
            if kb in merged and kb != ka and kb.startswith(ka):
                # 처음 본 날은 이른 쪽을 남긴다 — 60일 보관이 중복 때문에 늘어나지 않게
                if merged[kb].get("first_seen", "9999") < merged[ka].get("first_seen", "9999"):
                    merged[ka]["first_seen"] = merged[kb]["first_seen"]
                del merged[kb]
                dropped += 1
    items = sorted(merged.values(), key=lambda x: (x.get("date") or x["first_seen"]), reverse=True)
    # 소관 사업 기사는 같은 보도자료를 여러 매체가 받아써 수십 건이 된다.
    # 주제당 최근 TOPIC_CAP건, TOPIC_DAYS일까지만 남겨 국감 기사를 밀어내지 않게 한다.
    seen_topic, seen_story, kept = {}, {}, []
    for a in items:
        if a.get("track") == "소관사업":
            tp = a.get("topic") or "기타"
            try:
                age = (today - datetime.date.fromisoformat(a.get("date") or a["first_seen"])).days
            except Exception:
                age = 0
            if age > TOPIC_DAYS or seen_topic.get(tp, 0) >= TOPIC_CAP:
                continue
            # 같은 보도자료를 열 곳이 받아쓰면 한 주제가 그 사건 하나로 다 찬다.
            # 이미 담은 기사와 낱말이 많이 겹치면 건너뛴다(먼저 담은 쪽이 더 최신이다).
            k = story_key(a["title"])
            if any(len(k & prev) >= SAME_STORY for prev in seen_story.get(tp, [])):
                continue
            seen_story.setdefault(tp, []).append(k)
            seen_topic[tp] = seen_topic.get(tp, 0) + 1
        kept.append(a)
    items = kept
    for a in items:
        a.pop("queries", None); a.pop("_desc", None); a.pop("_topics", None)
        # 제목에 '국감'만 있고 보건복지와 닿는 데가 없는 기사(법사위 증인 공방, 과방위 플랫폼
        # 국감, 국감 정국 전망 따위)가 절반을 넘는다. 버리지는 않되 화면에서 뒤로 미룬다.
        # 쌓아 둔 기사까지 저장할 때마다 다시 센다 — 한 번 적어 두면 낱말을 넓혀도 옛 값이 남고,
        # 그날 다시 안 잡힌 기사는 표시가 아예 없는 채로 남는다(실제로 163건이 그랬다).
        a["health"] = bool(a.get("agencies") or a.get("members") or HEALTH.search(a.get("title") or ""))
    with io.open(OUT, "w", encoding="utf-8") as f:
        json.dump(clean_deep({"updated": today.isoformat(), "updated_at": now_kst.strftime("%Y-%m-%d %H:%M"), "window": WINDOW,
                   "note": "구글 뉴스 검색 기반 최근 기사. 언론 보도 기준이며 의원실 보도자료 원문이 아님. "
                           "track='국정감사'·'대정부질문'은 위원 이름·기관명에 '국정감사'를 붙여 검색해 제목에 국감이 들어간 기사. "
                           "track='소관사업'은 제목에 국감이 없어도 국감 재료가 되는 소관 사업·통계 기사를 주제별로 따로 모은 것으로, "
                           "같은 보도자료 받아쓰기가 쌓이지 않게 주제당 %d건·%d일까지만 남긴다. "
                           "health=false는 제목에 국감은 있으나 보건복지와 닿는 낱말·기관·위원이 없는 기사(다른 상임위·국감 일반)로, 버리지 않고 뒤로 미룬다. "
                           "기관·위원·주제 분류는 모두 제목 키워드 자동." % (TOPIC_CAP, TOPIC_DAYS),
                   "count": len(items), "items": items}), f, ensure_ascii=False, indent=1)
    by_ag = {}
    for a in items:
        for g in a["agencies"] or ["기타"]:
            by_ag[g] = by_ag.get(g, 0) + 1
    by_tp = {}
    for a in items:
        if a.get("track") == "소관사업":
            by_tp[a.get("topic") or "기타"] = by_tp.get(a.get("topic") or "기타", 0) + 1
    print("  제목이 겹쳐 묶은 중복 %d건" % dropped)
    print("완료: 기사 %d건 (신규 %d) · 기관별 %s · 위원 언급 %d건" % (len(items), new, by_ag, sum(1 for a in items if a["members"])))
    print("  소관 사업 %d건 · 주제별 %s" % (sum(by_tp.values()), by_tp))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
