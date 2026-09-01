#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
국정감사 자료 DB — 국정감사계획서 파서
- 위원회가 채택한 국정감사계획서 PDF에서 감사기간·대상기관·일자별 감사일정을
  구조화한다. 계획서의 일정은 '확정' 일정이라, 회의록에서 역산한 감사일이나
  의사일정 API의 추정과 달리 그대로 인용할 수 있다.
- 계획서는 열린국회정보 API에 없어서(결과보고서·처리결과보고서만 제공)
  연 1회 수동으로 PDF를 받아 실행한다. 변경본이 나오면 변경본으로 다시 실행.

실행: GUKGAM_PLAN_PDF=계획서.pdf python3 scripts/gukgam/build_plan.py
      GUKGAM_PLAN_URL="https://..." python3 scripts/gukgam/build_plan.py
출력: data/gukgam/plan-{연도}.json
의존성: pypdf
"""
import os, re, io, json, datetime
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA = os.path.join(ROOT, "data", "gukgam")
DOW = "월화수목금토일"


def pdf_text():
    from pypdf import PdfReader
    path = os.environ.get("GUKGAM_PLAN_PDF", "").strip()
    url = os.environ.get("GUKGAM_PLAN_URL", "").strip()
    if path:
        buf, src = io.open(path, "rb").read(), os.path.basename(path)
    elif url:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (gukgam-db collector)"})
        with urllib.request.urlopen(req, timeout=120) as r:
            buf, src = r.read(), url
    else:
        raise SystemExit("GUKGAM_PLAN_PDF(로컬 파일) 또는 GUKGAM_PLAN_URL 필요")
    reader = PdfReader(io.BytesIO(buf))
    return "\n".join((p.extract_text() or "") for p in reader.pages), src


def section(full, start, end):
    """목차에도 같은 제목이 나오므로 마지막 출현(본문) 기준으로 자른다."""
    i = full.rfind(start)
    j = full.rfind(end)
    if i < 0 or j < 0 or j <= i:
        raise SystemExit("'%s'~'%s' 섹션을 찾지 못함 — 계획서 양식이 바뀌었는지 확인" % (start, end))
    return full[i:j]


def parse_period(full, year):
    sec = section(full, "2. 감사기간", "3. 감사 대상기관")
    m = re.search(r"(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일.*?~\s*(?:(\d{4})년\s*)?(\d{1,2})월\s*(\d{1,2})일", sec, re.S)
    if not m:
        raise SystemExit("감사기간을 찾지 못함: %r" % sec[:200])
    y1 = int(m.group(1))
    y2 = int(m.group(4) or y1)
    start = datetime.date(y1, int(m.group(2)), int(m.group(3)))
    end = datetime.date(y2, int(m.group(5)), int(m.group(6)))
    md = re.search(r"\[(\d+)일간\]", sec)
    return {"start": start.isoformat(), "end": end.isoformat(),
            "days": int(md.group(1)) if md else (end - start).days + 1}


def parse_targets(full):
    sec = section(full, "3. 감사 대상기관", "4. 감사반 편성")
    groups, cur, prev_n = [], [], 0
    for line in sec.split("\n"):
        m = re.match(r"^\s*(\d+)\.\s*(.+?)\s*$", line)
        if not m:
            continue
        n, name = int(m.group(1)), m.group(2)
        # 기관 목록은 1부터 순차 번호다. 그 밖의 '숫자.' 줄(섹션 제목 '3. 감사
        # 대상기관…' 등)이 목록으로 새지 않게, 1로 시작하거나 직전+1인 줄만 받는다.
        if n == 1:
            if cur:                  # 번호가 다시 1부터 → 다음 그룹(본회의 승인)
                groups.append(cur); cur = []
        elif n != prev_n + 1 or not cur:
            continue
        cur.append(name); prev_n = n
    if cur:
        groups.append(cur)
    total = None
    mt = re.search(r"총\s*(\d+)\s*개", sec)
    if mt:
        total = int(mt.group(1))
    return {"total": total,
            "committee_selected": groups[0] if groups else [],
            "plenary_approved": groups[1] if len(groups) > 1 else []}


def parse_schedule(full, year):
    sec = section(full, "5. 감사일정", "6. 감사요령")
    days, day, sess = [], None, None

    def close_sess():
        nonlocal sess
        if sess is None:
            return
        raw = re.sub(r"\s+", " ", " ".join(sess["_buf"])).strip()
        del sess["_buf"]
        if "자료정리" in raw:
            sess["kind"] = "rest"
        else:
            # 여러 줄 기관 목록 뒤에 장소가 한 줄로 따로 오거나(국회),
            # 한 줄 행이면 맨 끝 토큰이 장소다(국회/전주/남원 — 짧고 쉼표 없음)
            toks = raw.rsplit(" ", 1)
            if len(toks) == 2 and len(toks[1]) <= 4 and "," not in toks[1] and "(" not in toks[1]:
                raw, sess["place"] = toks[0], toks[1]
            sess["kind"] = "시찰" if "시찰" in raw else ("종합감사" if "종합감사" in raw else "감사")
            sess["targets"] = [t.strip() for t in raw.split(",") if t.strip()]
        sess = None

    for line in sec.split("\n"):
        line = line.strip()
        if not line or re.match(r"^-\s*\d+\s*-$", line) or line.startswith("일 자"):
            continue
        m = re.match(r"^(\d{1,2})\.\s*(\d{1,2})\.\((%s)\)\s*(.*)$" % "|".join(DOW), line)
        if m:
            close_sess()
            day = {"date": datetime.date(year, int(m.group(1)), int(m.group(2))).isoformat(),
                   "dow": m.group(3), "sessions": []}
            days.append(day)
            line = m.group(4).strip()
            if not line:
                continue
        if day is None:
            continue
        mt = re.match(r"^(\d{1,2}:\d{2})\s*(.*)$", line)
        if mt:
            close_sess()
            sess = {"time": mt.group(1), "place": None, "note": None, "_buf": []}
            day["sessions"].append(sess)
            if mt.group(2).strip():
                sess["_buf"].append(mt.group(2).strip())
            continue
        if "자료정리" in line:
            close_sess()
            day["sessions"].append({"time": None, "kind": "rest"})
            continue
        if sess is not None:
            if line.startswith(("*", "※")):
                sess["note"] = ((sess["note"] + " ") if sess["note"] else "") + line.lstrip("*※ ").strip()
            elif sess["note"] is not None and not (len(line) <= 4 and "," not in line):
                # '*배석' 같은 주석 뒤에 이어지는 기관 나열은 주석의 목록이다
                # (예: 식약처 감사일의 배석기관들 — 피감기관 목록에 섞이면 안 됨).
                # 단 마지막의 장소 한 줄(국회 등)은 본 행 몫이라 제외.
                sess["note"] += " " + line
            else:
                sess["_buf"].append(line)
    close_sess()
    if len(days) < 5:
        raise SystemExit("감사일정 파싱 실패(%d일) — 계획서 양식 확인 필요" % len(days))
    return days


def main():
    full, src = pdf_text()
    my = re.search(r"(\d{4})년도\s*국정감사계획서", full)
    year = int(os.environ.get("GUKGAM_PLAN_YEAR") or (my.group(1) if my else 0))
    if not year:
        raise SystemExit("연도를 찾지 못함 — GUKGAM_PLAN_YEAR 지정 필요")

    period = parse_period(full, year)
    targets = parse_targets(full)
    schedule = parse_schedule(full, year)

    # 자체 검증 — 틀린 확정 일정을 사이트에 올리는 일이 없도록 여기서 걸러낸다
    if targets["total"] is not None:
        got = len(targets["committee_selected"]) + len(targets["plenary_approved"])
        if got != targets["total"]:
            raise SystemExit("대상기관 수 불일치: 표기 %d개 vs 추출 %d개" % (targets["total"], got))
    audit_days = [d for d in schedule if any(s.get("kind") in ("감사", "종합감사", "시찰") for s in d["sessions"])]
    for d in schedule:
        if not (period["start"] <= d["date"] <= period["end"]):
            raise SystemExit("일정 날짜 %s가 감사기간(%s~%s) 밖" % (d["date"], period["start"], period["end"]))

    out = {
        "updated": datetime.date.today().isoformat(),
        "year": year,
        "committee": "보건복지위원회",
        "source": src,
        "period": period,
        "targets": targets,
        "schedule": schedule,
    }
    path = os.path.join(DATA, "plan-%d.json" % year)
    with io.open(path, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=1)

    print("완료: %d년 계획서 → %s" % (year, os.path.basename(path)))
    print("  감사기간 %s ~ %s (%d일간) · 대상기관 %d개 · 감사일 %d일"
          % (period["start"], period["end"], period["days"],
             len(targets["committee_selected"]) + len(targets["plenary_approved"]), len(audit_days)))
    for d in audit_days:
        for s in d["sessions"]:
            if s.get("kind") == "rest":
                continue
            print("  %s(%s) %s %s @%s" % (d["date"], d["dow"], s.get("time") or "-",
                                          ", ".join(s.get("targets", []))[:44], s.get("place") or "-"))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
