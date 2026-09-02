#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
국정감사 자료 DB — 위원 '전 상임위 국감 기록' 추출기
- 복지위로 새로 온 위원(사보임)의 이전 상임위 국감 발언을 해당 위원회 회의록에서 추출해
  가이드북 참고 섹션 데이터로 만듭니다. (예: 이만희 위원장 — 농해수위 기록)
- RECORDS 목록에 (이름, 위원회 키워드)를 추가하면 다른 위원도 처리됩니다.
- 처리한 회의록은 위원별로 기록해 증분 처리합니다.

실행: python3 scripts/gukgam/build_extra_records.py  (의존성: pypdf, 키 불필요)
출력: data/gukgam/extra-records.json
"""
import os, re, io, json, time, datetime, collections
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA = os.path.join(ROOT, "data", "gukgam")
OUT = os.path.join(DATA, "extra-records.json")
UA = {"User-Agent": "Mozilla/5.0 (gukgam-db collector)"}
ERAS = ("제21대", "제22대")

# 추출 대상: (위원 이름, 이전 상임위 이름 키워드, 표시명)
RECORDS = [
    {"name": "이만희", "committee_kw": "농림축산식품해양수산", "committee_label": "농림축산식품해양수산위원회"},
]

SPEAKER = re.compile(
    r"◯\s*(?:(위원장|간사|참고인|진술인|증인)(?:\s*직무)?(?:\s*대리)?\s*([가-힣]{2,4})"
    r"|([가-힣]{2,12}?)\s*(위원장|위원|청장|차장|장관|차관|처장|원장|이사장|본부장|실장|국장|과장|서기관|진술인|참고인|증인)\s*([가-힣]{2,4})?)")

STOP = set("""위원 위원장 장관 차관 청장 답변 질의 말씀 생각 부분 관련 문제 정도 경우 때문 지금 오늘
이제 그냥 저희 우리 여러 이런 그런 어떤 사실 정말 굉장히 계속 대해 대한 그리고 그래서 그런데 하지만
우리나라 국민 정부 국회 국정감사 자료 요청 부탁 필요 검토 마련 얘기 어쨌든 상당히 이렇게 그렇게
가지고 가지 한번 여기 보면 내용 지난번 지난해 올해 작년 정도로 그거 이거 저거 다음 관련해서""".split())
_PARTICLE = re.compile(r"(에서|에게|으로|이라|라는|하고|까지|부터|에|를|을|은|는|이|가|도|의|로|과|와|만|요)$")


def parse_mark(m):
    if m.group(1):
        return (m.group(2) or "", m.group(1))
    return (m.group(3) or "", m.group(4) or "")


def strip_headers(text):
    """페이지 머리글('2024년도국감-농림축산식품해양수산…(2024년10월7일) 3') 제거."""
    return re.sub(r"\d{4}\s*년도\s*국감[-–ㆍ·]?[가-힣A-Za-z\s]{0,25}(\(\d{4}년\d{1,2}월\d{1,2}일\))?\s*\d*", " ", text)


def clean(s, limit=360):
    s = re.sub(r"-\s*\d+\s*-", " ", s)
    s = re.sub(r"\s+", " ", s).strip()
    if len(s) > limit:
        cut = s[:limit]
        p = max(cut.rfind("."), cut.rfind("?"))
        s = (cut[:p + 1] if p > limit * 0.5 else cut) + " …"
    return s


def norm_word(w):
    s = _PARTICLE.sub("", w)
    if len(s) < 2 or s in STOP or "국감" in s:
        return None
    if s in ("농림축산식품", "해양수산", "농림축산", "축산식품"):
        return None
    if re.search(r"(습니다|합니다|입니다|는데|은데|겠|드리|드립|해서|하면|하게|하지|시지|보시|주시|했|였|니다)", s):
        return None
    return s


def pdf_text(url):
    from pypdf import PdfReader
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=120) as r:
        reader = PdfReader(io.BytesIO(r.read()))
    return "\n".join((p.extract_text() or "") for p in reader.pages)


def main():
    with open(os.path.join(DATA, "minutes.json"), encoding="utf-8") as f:
        minutes = json.load(f)["items"]
    state = {}
    if os.path.exists(OUT):
        try:
            state = json.load(open(OUT, encoding="utf-8")).get("items", {})
        except Exception:
            pass

    for rec in RECORDS:
        name, kw = rec["name"], rec["committee_kw"]
        st = state.setdefault(name, {"committee": rec["committee_label"], "processed": [],
                                     "turns": 0, "dates": [], "term_counts": {}, "quotes": []})
        target = [x for x in minutes if kw in x["committee"] and x["era"] in ERAS and x.get("url")]
        done = set(st["processed"])
        new = 0
        for mt in sorted(target, key=lambda x: x["date"]):
            if mt["conf_id"] in done:
                continue
            try:
                text = strip_headers(pdf_text(mt["url"]))
            except Exception as e:
                print(f"{name} {mt['date']} 실패: {e}")
                continue
            marks = [(m.start(), m.end()) + parse_mark(m) for m in SPEAKER.finditer(text)]
            for i, (pos, endpos, nm, role) in enumerate(marks):
                if nm != name or role not in ("위원", "위원장", "간사"):
                    continue
                end = marks[i + 1][0] if i + 1 < len(marks) else len(text)
                q = text[endpos:end]
                st["turns"] += 1
                if mt["date"] not in st["dates"]:
                    st["dates"].append(mt["date"])
                for w in re.findall(r"[가-힣]{2,6}", q):
                    s2 = norm_word(w)
                    if s2:
                        st["term_counts"][s2] = st["term_counts"].get(s2, 0) + 1
                qc = clean(q)
                if len(qc) >= 150 and "◯" not in qc and not re.match(r"(예[.,]|알겠|네[.,]|얘기하|정리하|다음)", qc):
                    ans = ""
                    if i + 1 < len(marks) and marks[i + 1][3] in ("장관", "차관", "청장", "처장", "원장", "이사장"):
                        seg_end = marks[i + 2][0] if i + 2 < len(marks) else len(text)
                        ans = clean(text[marks[i + 1][1]:seg_end])
                    st["quotes"].append({"date": mt["date"], "q": qc, "a": ans, "minutes_url": mt["url"]})
            done.add(mt["conf_id"])
            new += 1
            print(f"{name} {mt['date']} 처리")
            time.sleep(1)
        st["processed"] = sorted(done)
        # 대표 인용은 최근순 3건만 유지, 용어는 상위 12개만
        st["quotes"] = sorted(st["quotes"], key=lambda x: (x["date"], len(x["q"])), reverse=True)[:3]
        top_terms = sorted(st["term_counts"].items(), key=lambda x: -x[1])[:12]
        st["top_terms"] = [{"w": w, "c": c} for w, c in top_terms if c >= 5]
        st["dates"].sort()
        print(f"{name}: 신규 회의록 {new}건, 누적 발언 {st['turns']}회 / {len(st['dates'])}일")

    with open(OUT, "w", encoding="utf-8") as f:
        json.dump({"updated": datetime.date.today().isoformat(),
                   "note": "복지위 신규 위원의 이전 상임위 국정감사 발언 기록 (회의록 자동 추출)",
                   "items": state}, f, ensure_ascii=False, indent=1)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
