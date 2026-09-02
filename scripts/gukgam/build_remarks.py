#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
국정감사 자료 DB — 위원 발언 전체 색인 (답변이 안 붙은 '지나간 발언' 포함)

Q&A 추출기(build_kdca_qa 등)는 기관 키워드가 있거나 그 기관 답변이 바로 붙은
발언만 남긴다. 그래서 장관에게 물었거나 청 이름 없이 말한 발언(예: SFTS 같은
질환명만 나온 발언)은 검색에서 사라졌다. 여기서는 보건복지위 국감 회의록의
위원·위원장 발언을 전부 색인해 통합 검색이 "지나간 발언"도 찾게 한다.

출력: data/gukgam/remarks-{연도}.json (연도별 분할) + remarks-index.json (연도·건수·처리 목록)
증분: 처리한 회의록(conf_id)은 index에 기록해 다음 실행에서 건너뛴다.
실행: python3 scripts/gukgam/build_remarks.py  (의존성: pypdf, 키 불필요)
"""
import os, io, re, json, time, datetime, collections, sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA = os.path.join(ROOT, "data", "gukgam")
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build_kdca_qa as K          # pdf_text · SPEAKER · parse_mark · clean 재사용

ERAS = ("제21대", "제22대")
MAXLEN = 100000                    # 사실상 전문 — 발췌(600자)로 자르면 뒷부분 질환명이 검색에서 빠진다(1차 색인에서 10%가 잘림)
FMT = 4                            # 파일 형식 버전 — 바뀌면 전체 재색인 (2: 전문 · 3: "…" 필터 비례화 · 4: 위원장대리 이름 정정)
INDEX = os.path.join(DATA, "remarks-index.json")


def answerer(name, role):
    """마커 '◯질병관리청장 지영미'는 (질병관리, 청장)으로 잘려 나온다 → '질병관리청장'으로 붙이고,
    기관명 뒤에 직위가 더 이어지면 한 칸 띄운다: 보건복지부 장관 · 질병관리청 감염병정책국장 · 식품의약품안전처장."""
    s = (name + role).strip()
    return re.sub(r"^(보건복지부|질병관리청|식품의약품안전처)(?=..)", r"\1 ", s)


def extract(text, date):
    marks = [(m.start(), m.end()) + K.parse_mark(m) for m in K.SPEAKER.finditer(text)]
    out = []
    for i, (pos, endpos, name, role) in enumerate(marks):
        if role not in ("위원", "위원장", "위원장대리"):
            continue
        if len(name) < 2 or name.startswith(("참고인", "증인", "진술인", "출석")):   # '◯참고인권영희 위원' 식 오인식은 위원이 아니다
            continue
        end = marks[i + 1][0] if i + 1 < len(marks) else len(text)
        t = K.clean(text[endpos:end], limit=MAXLEN)
        if len(t) < 30 or t.count("…") > max(3, len(t) // 150):   # 깨진 텍스트만 거른다 — 전문은 길수록 "…"가 자연히 늘어 비례 기준
            continue
        nxt = marks[i + 1] if i + 1 < len(marks) else None
        answered_by = None
        if nxt and nxt[3] not in ("위원", "위원장", "위원장대리"):
            answered_by = answerer(nxt[2], nxt[3])
        out.append({"date": date, "member": name, "role": role, "text": t,
                    "answered_by": answered_by})
    return out


def main():
    minutes = [x for x in K.load("minutes.json")["items"]
               if "보건복지" in x["committee"] and x["era"] in ERAS and x.get("url")]
    idx = {"processed": [], "years": {}}
    if os.path.exists(INDEX):
        try:
            idx = json.load(open(INDEX, encoding="utf-8"))
        except Exception:
            pass
    processed = set(idx.get("processed", []))
    by_year = {}
    urls = {}                      # 연도 → {날짜: 회의록 URL}
    rebuild = idx.get("fmt") != FMT
    if rebuild:                    # 형식이 바뀌면 처음부터 다시 (기존 파일은 무시)
        print("형식 %s → %s: 전체 재색인" % (idx.get("fmt"), FMT))
        processed = set()
        idx["years"] = {}

    def load_year(y):
        p = os.path.join(DATA, "remarks-%s.json" % y)
        if y not in by_year:
            d = json.load(open(p, encoding="utf-8")) if (os.path.exists(p) and idx.get("fmt") == FMT) else {}
            by_year[y] = d.get("items", [])
            urls[y] = d.get("urls", {})
        return by_year[y]

    new = failed = streak = 0
    for mt in sorted(minutes, key=lambda x: x["date"]):
        if mt["conf_id"] in processed:
            continue
        t0 = time.time()
        try:
            got = extract(K.pdf_text(mt["url"]), mt["date"])
        except Exception as e:
            print(f"{mt['date']} 실패 ({time.time() - t0:.0f}초): {e}")
            failed += 1
            streak += 1
            if streak >= 3:            # 회의록 서버가 죽은 날 — 47건 × 15분을 다 기다리지 않는다
                print("연속 3건 실패 → 회의록 서버 불통으로 보고 중단 (다음 실행에서 재시도)")
                break
            continue
        streak = 0
        load_year(mt["date"][:4]).extend(got)
        urls[mt["date"][:4]][mt["date"]] = mt["url"]   # 항목마다 URL을 반복 저장하지 않는다(파일 2MB 절약)
        processed.add(mt["conf_id"]); new += 1
        print(f"{mt['date']}: 발언 {len(got)}건 ({time.time() - t0:.0f}초)")
        time.sleep(1)

    if rebuild and failed:
        # 전체 재색인 중 일부 회의록을 못 받았으면 반쪽짜리를 올리지 않는다 — 기존 파일 유지, 다음 실행에서 다시 전체 시도
        print("전체 재색인 중 %d건 실패 → 이번 결과는 쓰지 않고 기존 색인 유지" % failed)
        return 0
    years = {}
    for y in sorted(set(list(by_year) + list(idx.get("years", {}).keys()))):
        items = load_year(y)
        items.sort(key=lambda x: (x["date"], x["member"]))
        with io.open(os.path.join(DATA, "remarks-%s.json" % y), "w", encoding="utf-8") as f:
            json.dump({"updated": datetime.date.today().isoformat(), "year": int(y), "fmt": FMT,
                       "urls": urls.get(y, {}), "items": items},
                      f, ensure_ascii=False, indent=0)
        years[y] = len(items)
    with io.open(INDEX, "w", encoding="utf-8") as f:
        json.dump({"updated": datetime.date.today().isoformat(), "fmt": FMT,
                   "note": "보건복지위 국감 회의록(제21~22대) 위원·위원장 발언 전체 색인(전문). 답변이 붙지 않은 발언도 포함. 회의록 URL은 연도 파일의 urls(날짜→URL).",
                   "processed": sorted(processed), "years": years}, f, ensure_ascii=False, indent=1)
    print("완료: 회의록 %d건 신규 · 연도별 발언 %s" % (new, years))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
