#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
국정감사 자료 DB — 질병관리청 국감 질의·답변(Q&A) 추출기
- 보건복지위 국정감사 회의록(제21~22대)에서 위원 발언과 질병관리청장·차장의 답변을
  짝지어 연도별·위원별·주제별 Q&A 데이터로 만듭니다.
- 채택 기준: ① 위원 발언에 질병청 키워드가 있거나 ② 바로 다음 발언자가 질병청 답변자인 경우.
- 처리한 회의록(conf_id)은 기록해 증분 처리합니다.

실행: python3 scripts/gukgam/build_kdca_qa.py   (의존성: pypdf, 키 불필요)
출력: data/gukgam/kdca-qa.json
"""
import os, re, io, json, time, datetime, hashlib
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA = os.path.join(ROOT, "data", "gukgam")
OUT = os.path.join(DATA, "kdca-qa.json")
UA = {"User-Agent": "Mozilla/5.0 (gukgam-db collector)"}
ERAS = ("제21대", "제22대")  # 질병관리청은 2020.9 출범(21대~)

KDCA_KW = ("질병관리청", "질병청", "질병관리본부", "방대본", "방역대책본부", "KDCA")
# 발언자 마커 두 형태를 모두 처리: "◯남인순 위원", "◯위원장 박주민"
SPEAKER = re.compile(
    r"◯\s*(?:(위원장|간사)\s*([가-힣]{2,4})"
    r"|([가-힣]{2,12}?)\s*(위원장|위원|청장|차장|장관|처장|원장|이사장|본부장|실장|국장|과장|서기관|진술인|참고인|증인)\s*([가-힣]{2,4})?)")


def parse_mark(m):
    """마커 매치 → (name, role). '◯위원장 박주민'은 name=박주민, role=위원장."""
    if m.group(1):
        return (m.group(2) or "", m.group(1))
    return (m.group(3) or "", m.group(4) or "")

TOPICS = {
    "감염병 대응": ["감염병", "코로나", "팬데믹", "방역", "엠폭스", "결핵", "인플루엔자", "홍역"],
    "백신·예방접종": ["백신", "예방접종", "접종률", "이상반응"],
    "백신 폐기·수급": ["폐기", "수급", "비축"],
    "만성·희귀질환": ["만성질환", "희귀질환", "당뇨", "고혈압", "심뇌혈관"],
    "조직·인력": ["인력", "결원", "조직", "정원", "역학조사관", "처우"],
    "예산·재정": ["예산", "불용", "집행", "결산", "기금"],
    "연구개발": ["연구개발", "R&D", "국립보건연구원", "치료제 개발", "임상"],
    "정보시스템": ["시스템", "전산", "데이터", "정보화"],
    "검역·해외유입": ["검역", "해외유입", "입국"],
    "피해보상": ["피해보상", "이상사례", "인과성"],
    "지역·지자체 협력": ["지자체", "보건소", "권역"],
    "미래 팬데믹 대비": ["신종", "대비", "훈련", "비상"],
}


def load(name):
    with open(os.path.join(DATA, name), encoding="utf-8") as f:
        return json.load(f)


PDF_CACHE = os.environ.get("GUKGAM_PDF_CACHE", "/tmp/gukgam-pdfcache")


def pdf_bytes(url):
    """PDF 원문을 받아온다. 서버가 연결을 끊는 일이 잦아 재시도 + 디스크 캐시."""
    import time
    os.makedirs(PDF_CACHE, exist_ok=True)
    path = os.path.join(PDF_CACHE, hashlib.md5(url.encode()).hexdigest() + ".pdf")
    if os.path.exists(path) and os.path.getsize(path) > 1000:
        with open(path, "rb") as f:
            return f.read()
    last = None
    for i in range(5):
        try:
            req = urllib.request.Request(url, headers=UA)
            with urllib.request.urlopen(req, timeout=180) as r:
                buf = r.read()
            if len(buf) > 1000:
                with open(path, "wb") as f:
                    f.write(buf)
                return buf
            last = RuntimeError("too small: %d bytes" % len(buf))
        except Exception as e:          # noqa: BLE001
            last = e
        time.sleep(2 ** i)
    raise last


def pdf_text(url):
    from pypdf import PdfReader
    reader = PdfReader(io.BytesIO(pdf_bytes(url)))
    return "\n".join((p.extract_text() or "") for p in reader.pages)


def clean(s, limit=420):
    s = re.sub(r"-\s*\d+\s*-", " ", s)          # 페이지 번호
    s = re.sub(r"\s+", " ", s).strip()
    if len(s) > limit:
        cut = s[:limit]
        p = max(cut.rfind("."), cut.rfind("?"), cut.rfind("다 "))
        s = (cut[:p + 1] if p > limit * 0.5 else cut) + " …"
    return s


def topics_of(text):
    hits = []
    for label, kws in TOPICS.items():
        c = sum(text.count(k) for k in kws)
        if c:
            hits.append((label, c))
    hits.sort(key=lambda x: -x[1])
    return [h[0] for h in hits[:3]]


def extract(text, date):
    marks = []
    for m in SPEAKER.finditer(text):
        name, role = parse_mark(m)
        marks.append((m.start(), m.end(), name, role))
    items = []
    for i, (pos, endpos, name, role) in enumerate(marks):
        if role not in ("위원", "위원장"):
            continue
        end = marks[i + 1][0] if i + 1 < len(marks) else len(text)
        q = text[endpos:end]
        nxt = marks[i + 1] if i + 1 < len(marks) else None
        # "◯질병관리청장 지영미"는 name='질병관리'+role='청장'으로 잡히므로 합쳐서 판정
        nxt_is_kdca = bool(nxt) and (nxt[2] + nxt[3]).startswith("질병관리청")
        has_kw = any(k in q for k in KDCA_KW)
        if not (has_kw or nxt_is_kdca):
            continue
        answer = ""
        # 이어지는 질병청 답변(연속 구간 병합, 최대 3발언)
        j, taken = i + 1, 0
        while j < len(marks) and taken < 3:
            npos, nend, nname, nrole = marks[j]
            if (nname + nrole).startswith("질병관리청"):
                seg_end = marks[j + 1][0] if j + 1 < len(marks) else len(text)
                answer += " " + text[nend:seg_end]
                taken += 1
                j += 1
            elif taken == 0 and nrole in ("위원", "위원장"):
                break
            else:
                break
        qc = clean(q)
        if len(qc) < 40:  # 의사진행 발언 등 잡음 제거
            continue
        if qc.count("…") > 3 or qc.count(".") > len(qc) * 0.2:  # 말줄임·점선 위주 잡음 제거
            continue
        items.append({
            "date": date, "year": int(date[:4]),
            "member": name,
            "q": qc,
            "a": clean(answer) if answer.strip() else "",
            "topics": topics_of(q + " " + answer),
        })
    return items


def main():
    minutes = [x for x in load("minutes.json")["items"]
               if "보건복지" in x["committee"] and x["era"] in ERAS and x.get("url")]
    state = {"processed": [], "items": []}
    if os.path.exists(OUT):
        try:
            state = json.load(open(OUT, encoding="utf-8"))
        except Exception:
            pass
    processed = set(state.get("processed", []))
    items = state.get("items", [])

    new = 0
    for mt in sorted(minutes, key=lambda x: x["date"]):
        if mt["conf_id"] in processed:
            continue
        try:
            text = pdf_text(mt["url"])
            got = extract(text, mt["date"])
            for g in got:
                g["minutes_url"] = mt["url"]
            items += got
            print(f"{mt['date']}: {len(got)}건")
        except Exception as e:
            print(f"{mt['date']} 실패: {e}")
            continue
        processed.add(mt["conf_id"])
        new += 1
        time.sleep(1)

    items.sort(key=lambda x: (x["date"], x["member"]))
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump({"updated": datetime.date.today().isoformat(),
                   "source": "보건복지위 국정감사 회의록(제21~22대) 발언 자동 추출",
                   "processed": sorted(processed), "items": items}, f, ensure_ascii=False, indent=1)
    print(f"완료: 회의록 {new}건 신규 처리, Q&A 누적 {len(items)}건")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
