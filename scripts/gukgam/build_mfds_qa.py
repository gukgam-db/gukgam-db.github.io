#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
국정감사 자료 DB — 식품의약품안전처 국감 질의·답변(Q&A) 추출기
- 보건복지위 국정감사 회의록(제21~22대)에서 위원 발언과 식품의약품안전처장·차장의 답변을
  짝지어 연도별·위원별·주제별 Q&A 데이터로 만듭니다.
- 채택 기준: ① 위원 발언에 질병청 키워드가 있거나 ② 바로 다음 발언자가 식약처 답변자인 경우.
- 처리한 회의록(conf_id)은 기록해 증분 처리합니다.

실행: python3 scripts/gukgam/build_mfds_qa.py   (의존성: pypdf, 키 불필요)
출력: data/gukgam/mfds-qa.json
"""
import os, re, io, json, time, datetime, hashlib
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA = os.path.join(ROOT, "data", "gukgam")
OUT = os.path.join(DATA, "mfds-qa.json")
UA = {"User-Agent": "Mozilla/5.0 (gukgam-db collector)"}
ERAS = ("제21대", "제22대")

MFDS_KW = ("식품의약품안전처", "식약처", "처장님", "식약청")
# 발언자 마커 두 형태를 모두 처리: "◯남인순 위원", "◯위원장 박주민"
SPEAKER = re.compile(
    r"◯\s*(?:(위원장|간사)(?:\s*직무)?(?:\s*대리)?\s*([가-힣]{2,4})"   # ◯위원장대리 이수진 → (위원장, 이수진)
    r"|([가-힣]{2,12}?)\s*(위원장|위원|청장|차장|장관|처장|원장|이사장|본부장|실장|국장|과장|서기관|진술인|참고인|증인)\s*([가-힣]{2,4})?)")


def parse_mark(m):
    """마커 매치 → (name, role). '◯위원장 박주민'은 name=박주민, role=위원장."""
    if m.group(1):
        return (m.group(2) or "", m.group(1))
    return (m.group(3) or "", m.group(4) or "")

TOPICS = {
    "의약품 안전": ["의약품", "약사법", "허가", "부작용", "회수", "리콜", "제조소", "GMP"],
    "마약류 관리": ["마약", "펜타닐", "프로포폴", "향정", "졸피뎀", "오남용", "마약류통합관리"],
    "식품 안전": ["식품", "식중독", "위생", "이물", "잔류농약", "농약", "축산물", "급식"],
    "수입식품·통관": ["수입식품", "통관", "해외직구", "검사명령", "원산지"],
    "건강기능식품": ["건강기능식품", "건기식", "기능성", "표시광고"],
    "의료기기": ["의료기기", "체외진단", "임플란트", "인공지능 의료기기"],
    "화장품": ["화장품", "유해성분", "기능성화장품"],
    "임상시험·허가심사": ["임상시험", "심사", "품목허가", "신속심사", "긴급사용"],
    "첨단바이오·백신": ["첨단바이오", "세포치료", "유전자치료", "백신", "바이오의약품"],
    "온라인 불법유통": ["온라인", "불법유통", "해외 플랫폼", "테무", "알리", "광고"],
    "조직·인력": ["인력", "정원", "결원", "조직", "채용", "전문성"],
    "예산·재정": ["예산", "불용", "집행", "결산", "기금"],
    "위해평가·기준": ["위해평가", "기준규격", "잔류기준", "안전기준"],
    "제네릭·약가": ["제네릭", "복제약", "공동생동", "약가", "품절"],
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
        nxt_is_kdca = bool(nxt) and (nxt[2] + nxt[3]).startswith("식품의약품안전처")
        has_kw = any(k in q for k in MFDS_KW)
        if not (has_kw or nxt_is_kdca):
            continue
        answer = ""
        # 이어지는 질병청 답변(연속 구간 병합, 최대 3발언)
        j, taken = i + 1, 0
        while j < len(marks) and taken < 3:
            npos, nend, nname, nrole = marks[j]
            if (nname + nrole).startswith("식품의약품안전처"):
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
                   "source": "보건복지위 국정감사 회의록(제21~22대) 식약처 발언 자동 추출",
                   "processed": sorted(processed), "items": items}, f, ensure_ascii=False, indent=1)
    print(f"완료: 회의록 {new}건 신규 처리, Q&A 누적 {len(items)}건")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
