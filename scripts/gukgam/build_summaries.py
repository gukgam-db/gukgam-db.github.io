#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
국정감사 자료 DB — 문서 요약 추출기 (보건복지 트랙)
- 원문 PDF를 열지 않고도 카드에서 핵심 내용을 볼 수 있도록, PDF에서 요약 정보를 추출합니다.
    · 회의록: 피감사기관 / 일시 / 장소 / 쪽수  (제21·22대 보건복지위)
    · 결과보고서: 감사기간 / 대상기관 / 시정·처리요구 건수 / 기관별 최다 지적  (보건복지위 전 연도)
- 이미 요약된 URL은 건너뛰는 증분 방식 → 스케줄 실행 시 새 회의록만 처리됩니다.
- PDF는 메모리에서만 처리하고 저장하지 않습니다.

실행: python3 scripts/gukgam/build_summaries.py   (의존성: pypdf)
출력: data/gukgam/summaries.json  ({원문URL: 요약} 맵)
"""
import os, re, io, json, time, datetime
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA = os.path.join(ROOT, "data", "gukgam")
OUT = os.path.join(DATA, "summaries.json")
UA = {"User-Agent": "Mozilla/5.0 (gukgam-db collector)"}
MINUTE_ERAS = ("제21대", "제22대")


def load(name):
    with open(os.path.join(DATA, name), encoding="utf-8") as f:
        return json.load(f)["items"]


def pdf_reader(url):
    from pypdf import PdfReader
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=120) as r:
        return PdfReader(io.BytesIO(r.read()))


def squeeze(s):
    return re.sub(r"\s+", " ", s or "").strip()


def summarize_minutes(url):
    r = pdf_reader(url)
    head = "\n".join((r.pages[i].extract_text() or "") for i in range(min(3, len(r.pages))))
    out = {"kind": "minutes", "pages": len(r.pages)}
    m = re.search(r"피감사기관\s*([^\n]+)", head)
    if m:
        out["targets"] = [squeeze(a) for a in m.group(1).split("|") if squeeze(a)]
    m = re.search(r"일\s*시\s*([^\n]+)", head)
    if m:
        out["when"] = squeeze(m.group(1))
    m = re.search(r"장\s*소\s*([^\n]+)", head)
    if m:
        out["where"] = squeeze(m.group(1))
    return out


def summarize_report(url):
    r = pdf_reader(url)
    full = "\n".join((p.extract_text() or "") for p in r.pages)
    out = {"kind": "report", "pages": len(r.pages)}
    # 첫 출현은 목차인 경우가 많으므로, 날짜/기관명이 실제로 나오는 매치를 채택
    for m in re.finditer(r"감사기간(.{0,300}?)(?:3\.|감사 ?대상기관)", full, re.S):
        d = re.findall(r"(20\d{2})\s*\.\s*(\d{1,2})\s*\.\s*(\d{1,2})", m.group(1))
        if d:
            out["period"] = " ~ ".join(f"{y}.{mo}.{dd}" for y, mo, dd in d[:2])
            break
    for m in re.finditer(r"감사 ?대상기관(.{0,3000}?)(?:4\.|감사실시 ?경과)", full, re.S):
        names = re.findall(r"[가-힣]{2,20}(?:부|처|청|공단|공사|진흥원|센터|의료원|재단|협회|보장원|개발원|정보원|인재원|중재원|시험원|연구원|은행|기증원|적십자사)", m.group(1))
        uniq = [n for n in dict.fromkeys(names) if n not in ("국회사무처",)]
        if len(uniq) >= 2:
            out["target_count"] = len(uniq)
            out["targets"] = uniq[:8]
            break
    starts = [s.start() for s in re.finditer(r"시정 및 처리요구사항", full)]
    if starts:
        sec = full[starts[-1]:]
        out["demand_count"] = sec.count("○")
        counts, agency = {}, ""
        for line in sec.split("\n"):
            line = line.strip()
            am = re.match(r"^\d+\)\s*(.{2,40})$", line)
            if am:
                agency = am.group(1).strip()
            elif line.startswith("○") and agency:
                counts[agency] = counts.get(agency, 0) + 1
        top = sorted(counts.items(), key=lambda x: -x[1])[:5]
        if top:
            out["top_agencies"] = [{"name": k, "count": v} for k, v in top]
    return out


def main():
    summaries = {}
    if os.path.exists(OUT):
        try:
            with open(OUT, encoding="utf-8") as f:
                summaries = json.load(f).get("items", {})
        except Exception:
            summaries = {}
    before = len(summaries)

    jobs = []
    for x in load("minutes.json"):
        if "보건복지" in x["committee"] and x["era"] in MINUTE_ERAS and x.get("url"):
            jobs.append(("minutes", x["url"]))
    for x in load("reports.json"):
        if "보건복지" in x["committee"] and x["doc_type"] == "result_report" and x.get("pdf"):
            jobs.append(("report", x["pdf"]))

    done = fail = 0
    for kind, url in jobs:
        if url in summaries:
            continue
        try:
            summaries[url] = summarize_minutes(url) if kind == "minutes" else summarize_report(url)
            done += 1
            print(f"[{kind}] OK ({summaries[url].get('pages')}p) {url[-40:]}")
        except Exception as e:
            fail += 1
            print(f"[{kind}] 실패 {url[-40:]}: {e}")
        # 진행분 수시 저장 (중단 대비)
        with open(OUT, "w", encoding="utf-8") as f:
            json.dump({"updated": datetime.date.today().isoformat(), "items": summaries}, f, ensure_ascii=False, indent=1)
        time.sleep(1)
    print(f"완료: 신규 {done}건 요약 (실패 {fail}), 누적 {len(summaries)}건 (기존 {before})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
