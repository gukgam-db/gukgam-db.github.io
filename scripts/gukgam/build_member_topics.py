#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
국정감사 자료 DB — 의원별 관심 분야·발언량 추출기
- 제22대 보건복지위 국정감사 회의록 PDF에서 의원별 발언을 분리하고,
  보건복지 도메인 키워드 사전으로 관심 분야를 집계합니다. (근거: 실제 국감 발언)
- 처리한 회의록(conf_id)은 기록해 두고 새 회의록만 증분 처리합니다.

실행: python3 scripts/gukgam/build_member_topics.py   (의존성: pypdf, 키 불필요)
출력: data/gukgam/member-topics.json
"""
import os, re, io, json, time, datetime
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA = os.path.join(ROOT, "data", "gukgam")
OUT = os.path.join(DATA, "member-topics.json")
UA = {"User-Agent": "Mozilla/5.0 (gukgam-db collector)"}
ERA = os.environ.get("GUKGAM_ERA", "제22대")

# 관심 분야 사전: 표시명 → 매칭 키워드들 (발언 원문에서 등장 횟수 집계)
TOPICS = {
    "건강보험·수가": ["건강보험", "건보", "수가", "급여화", "비급여"],
    "실손보험": ["실손"],
    "의사인력·의대정원": ["의대 정원", "의대정원", "의사 인력", "전공의", "전문의"],
    "필수·지역의료": ["필수의료", "지역의료", "의료취약", "분만", "소아과", "소아청소년과"],
    "공공·응급의료": ["공공의료", "응급의료", "응급실", "권역외상"],
    "간호·간병": ["간호사", "간호법", "간병", "간호조무"],
    "국민연금": ["국민연금", "연금개혁", "기초연금"],
    "저출산·모자보건": ["저출산", "출산율", "출생아", "난임", "산후조리"],
    "보육·아동": ["어린이집", "보육", "아동학대", "아동수당", "입양"],
    "노인돌봄·요양": ["장기요양", "요양원", "요양병원", "노인돌봄", "경로당", "치매"],
    "장애인": ["장애인"],
    "빈곤·기초생활": ["기초생활", "수급자", "빈곤", "복지사각", "긴급복지"],
    "정신건강·자살예방": ["정신건강", "자살", "정신질환", "정신병원", "트라우마"],
    "마약": ["마약", "펜타닐", "필로폰"],
    "감염병·방역": ["감염병", "코로나", "방역", "팬데믹", "결핵", "엠폭스"],
    "백신·예방접종": ["백신", "예방접종"],
    "희귀질환·암": ["희귀질환", "중증질환", "암환자", "항암"],
    "의약품·제약": ["의약품", "제약", "신약", "약가", "품절약"],
    "식품안전": ["식품안전", "식중독", "위생", "해썹", "HACCP"],
    "의료기기·화장품": ["의료기기", "화장품"],
    "비대면진료·의료IT": ["비대면진료", "원격의료", "의료데이터", "전자처방"],
    "의료사고·분쟁": ["의료사고", "의료분쟁", "의료소송"],
    "담배·음주": ["담배", "흡연", "전자담배", "음주"],
    "연구개발·바이오": ["연구개발", "R&D", "바이오", "임상시험"],
    "예산·재정": ["예산", "불용", "집행률", "결산", "기금"],
}


def load(name):
    with open(os.path.join(DATA, name), encoding="utf-8") as f:
        return json.load(f)


def pdf_text(url):
    from pypdf import PdfReader
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=120) as r:
        reader = PdfReader(io.BytesIO(r.read()))
    return "\n".join((p.extract_text() or "") for p in reader.pages)


def main():
    members = {m["name"] for m in load("members.json")["items"]}
    minutes = [x for x in load("minutes.json")["items"]
               if "보건복지" in x["committee"] and x["era"] == ERA and x.get("url")]

    state = {"processed": [], "members": {}}
    if os.path.exists(OUT):
        try:
            state = json.load(open(OUT, encoding="utf-8"))
        except Exception:
            pass
    processed = set(state.get("processed", []))
    acc = state.get("members", {})  # name → {turns, dates, chars, counts{}}

    new = 0
    for mt in minutes:
        if mt["conf_id"] in processed:
            continue
        try:
            text = pdf_text(mt["url"])
        except Exception as e:
            print(f"{mt['conf_id']} ({mt['date']}) 실패: {e}")
            continue
        # 발언 분리: ◯이름 위원(장) 마커 → 다음 마커 전까지가 해당 의원 발언
        marks = [(m.start(), m.group(1)) for m in re.finditer(r"◯\s*([가-힣]{2,4})\s*위원장?", text)]
        for i, (pos, name) in enumerate(marks):
            if name not in members:
                continue
            end = marks[i + 1][0] if i + 1 < len(marks) else len(text)
            speech = text[pos:end]
            a = acc.setdefault(name, {"turns": 0, "dates": [], "counts": {}})
            a["turns"] += 1
            if mt["date"] not in a["dates"]:
                a["dates"].append(mt["date"])
            for label, kws in TOPICS.items():
                c = sum(speech.count(k) for k in kws)
                if c:
                    a["counts"][label] = a["counts"].get(label, 0) + c
        processed.add(mt["conf_id"])
        new += 1
        print(f"처리: {mt['date']} ({mt['conf_id']})")
        time.sleep(1)

    # 요약 형태로 정리
    out_members = {}
    for name, a in acc.items():
        top = sorted(a["counts"].items(), key=lambda x: -x[1])[:6]
        out_members[name] = {
            "turns": a["turns"],
            "days": len(a["dates"]),
            "topics": [{"t": t, "c": c} for t, c in top],
            "counts": a["counts"],
            "dates": sorted(a["dates"]),
        }
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump({"updated": datetime.date.today().isoformat(), "era": ERA,
                   "source": f"{ERA} 보건복지위 국정감사 회의록 발언 분석",
                   "processed": sorted(processed), "members": out_members},
                  f, ensure_ascii=False, indent=1)
    print(f"완료: 새 회의록 {new}건 처리, 의원 {len(out_members)}명 집계 (누적 회의록 {len(processed)}건)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
