#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
국정감사 자료 DB — 보건복지부 국감 질의·답변(Q&A) 추출기
- 보건복지위 국정감사 회의록(제21~22대)에서 위원 질의와 보건복지부 장관·차관 답변을
  짝지어 연도별 Q&A 데이터로 만듭니다.
- 복지부는 질의량이 많아 연도별 파일(mohw-qa-{연도}.json)로 분할 저장하고,
  통계·연대기용 집계는 mohw-qa-index.json에 둡니다.
- 처리한 회의록(conf_id)은 인덱스에 기록해 증분 처리합니다.

실행: python3 scripts/gukgam/build_mohw_qa.py   (의존성: pypdf, 키 불필요)
출력: data/gukgam/mohw-qa-{연도}.json, data/gukgam/mohw-qa-index.json
"""
import os, re, io, json, time, datetime, hashlib
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA = os.path.join(ROOT, "data", "gukgam")
IDX = os.path.join(DATA, "mohw-qa-index.json")
UA = {"User-Agent": "Mozilla/5.0 (gukgam-db collector)"}
ERAS = ("제21대", "제22대")

AGENCY_PREFIX = "보건복지부"          # 장관·차관·제1차관 등 답변자 판정
AGENCY_KW = ("보건복지부", "복지부", "장관님")

SPEAKER = re.compile(
    r"◯\s*(?:(위원장|간사)\s*([가-힣]{2,4})"
    r"|([가-힣]{2,12}?)\s*(위원장|위원|청장|차장|장관|차관|처장|원장|이사장|본부장|실장|국장|과장|서기관|진술인|참고인|증인)\s*([가-힣]{2,4})?)")

TOPICS = {
    "건강보험·수가": ["건강보험", "건보", "수가", "급여화", "비급여", "보장성"],
    "의사인력·의대정원": ["의대 정원", "의대정원", "의사 인력", "전공의", "전문의", "의정 갈등"],
    "필수·지역의료": ["필수의료", "지역의료", "의료취약", "분만", "소아과", "소아청소년과", "응급실"],
    "공공의료": ["공공의료", "공공병원", "지방의료원"],
    "간호·간병": ["간호사", "간호법", "간병", "간호조무"],
    "연금": ["국민연금", "연금개혁", "기초연금"],
    "저출산·보육": ["저출산", "출산율", "출생아", "난임", "어린이집", "보육", "아동수당", "육아"],
    "아동·청소년": ["아동학대", "입양", "자립준비청년", "보호종료"],
    "노인·돌봄": ["장기요양", "요양원", "요양병원", "노인일자리", "경로당", "치매", "돌봄"],
    "장애인": ["장애인"],
    "빈곤·기초생활": ["기초생활", "수급자", "빈곤", "복지사각", "긴급복지", "부양의무자"],
    "정신건강·자살": ["정신건강", "자살", "정신질환", "정신병원", "마약중독"],
    "의약품·제약": ["의약품", "제약", "신약", "약가", "품절약", "마약류"],
    "바이오·R&D": ["바이오", "연구개발", "R&D", "임상"],
    "비대면·의료IT": ["비대면진료", "원격의료", "의료데이터", "의료 인공지능"],
    "의료사고·분쟁": ["의료사고", "의료분쟁", "의료소송"],
    "연말정산·재정": ["예산", "불용", "집행", "결산", "기금"],
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


def clean(s, limit=360):
    s = re.sub(r"-\s*\d+\s*-", " ", s)
    s = re.sub(r"\s+", " ", s).strip()
    if len(s) > limit:
        cut = s[:limit]
        p = max(cut.rfind("."), cut.rfind("?"))
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


def parse_mark(m):
    if m.group(1):
        return (m.group(2) or "", m.group(1))
    return (m.group(3) or "", m.group(4) or "")


def extract(text, date):
    marks = []
    for m in SPEAKER.finditer(text):
        name, role = parse_mark(m)
        marks.append((m.start(), m.end(), name, role))
    items = []
    for i, (pos, endpos, name, role) in enumerate(marks):
        if role not in ("위원", "위원장", "간사"):
            continue
        end = marks[i + 1][0] if i + 1 < len(marks) else len(text)
        q = text[endpos:end]
        nxt = marks[i + 1] if i + 1 < len(marks) else None
        nxt_is_ag = bool(nxt) and (nxt[2] + nxt[3]).startswith(AGENCY_PREFIX)
        has_kw = any(k in q for k in AGENCY_KW)
        if not (has_kw or nxt_is_ag):
            continue
        answer, j, taken = "", i + 1, 0
        while j < len(marks) and taken < 2:
            _, nend, nname, nrole = marks[j]
            if (nname + nrole).startswith(AGENCY_PREFIX):
                seg_end = marks[j + 1][0] if j + 1 < len(marks) else len(text)
                answer += " " + text[nend:seg_end]
                taken += 1
                j += 1
            else:
                break
        qc = clean(q)
        if len(qc) < 60:
            continue
        if qc.count("…") > 3 or qc.count(".") > len(qc) * 0.2:
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
    idx = {"processed": []}
    if os.path.exists(IDX):
        try:
            idx = json.load(open(IDX, encoding="utf-8"))
        except Exception:
            pass
    processed = set(idx.get("processed", []))

    # 연도별 기존 샤드 로드
    shards = {}
    new = 0
    for mt in sorted(minutes, key=lambda x: x["date"]):
        if mt["conf_id"] in processed:
            continue
        try:
            got = extract(pdf_text(mt["url"]), mt["date"])
        except Exception as e:
            print(f"{mt['date']} 실패: {e}")
            continue
        for g in got:
            g["minutes_url"] = mt["url"]
            y = g["year"]
            if y not in shards:
                p = os.path.join(DATA, f"mohw-qa-{y}.json")
                shards[y] = json.load(open(p, encoding="utf-8"))["items"] if os.path.exists(p) else []
            shards[y].append(g)
        processed.add(mt["conf_id"])
        new += 1
        print(f"{mt['date']}: {len(got)}건")
        time.sleep(1)

    today = datetime.date.today().isoformat()
    for y, items in shards.items():
        items.sort(key=lambda x: (x["date"], x["member"]))
        with open(os.path.join(DATA, f"mohw-qa-{y}.json"), "w", encoding="utf-8") as f:
            json.dump({"updated": today, "year": y, "items": items}, f, ensure_ascii=False, indent=1)

    # 인덱스(통계) 재계산: 모든 샤드 스캔
    years, stats = [], {}
    for fn in sorted(os.listdir(DATA)):
        m = re.match(r"mohw-qa-(\d{4})\.json$", fn)
        if not m:
            continue
        y = int(m.group(1))
        items = json.load(open(os.path.join(DATA, fn), encoding="utf-8"))["items"]
        years.append(y)
        stats[str(y)] = {
            "n": len(items),
            "with_answer": sum(1 for i in items if i["a"]),
            "members": len({i["member"] for i in items}),
        }
    with open(IDX, "w", encoding="utf-8") as f:
        json.dump({"updated": today, "source": "보건복지위 국정감사 회의록(제21~22대) 발언 자동 추출",
                   "processed": sorted(processed), "years": sorted(years), "stats": stats},
                  f, ensure_ascii=False, indent=1)
    total = sum(s["n"] for s in stats.values())
    print(f"완료: 회의록 {new}건 신규 처리, Q&A 누적 {total}건 (연도 {len(years)}개)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
