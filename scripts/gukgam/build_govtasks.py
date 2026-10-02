#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
국정감사 자료 DB — 현 정부 국정과제 중 보건복지위 소관만 추려 담기

왜 필요한가: 위원들은 국정과제를 들어 묻는다. 보건복지위 국감 회의록에서 '국정과제'는
2012년 이후 226번 나오고, 정권 첫해에 몰린다(2017년 25건, 2022년 36건, 2025년 36건,
정권 말인 2021년은 1건). 질의 꼴은 둘뿐이다 — "국정과제인데 시기도 목표도 없다",
"공약엔 있는데 국정과제에선 빠졌다". 둘 다 원문을 펴 놓고 따지는 질의라, 답변을 쓰는
자리에 과제목표·주요내용 원문이 있어야 쓸모가 있다.

번호를 어떻게 믿는가: 정책브리핑 국정과제 페이지의 과제마다 상세 PDF 링크가 달려 있고
파일명이 govVision_83.pdf 꼴로 과제 번호를 품는다. 줄 짝을 맞춰 세는 대신 그 번호를 쓴다.
(실제로 줄 짝맞추기로 세면 괄호가 둘인 과제 하나 때문에 부처가 한 칸 밀린다.)

넣지 않는 것: 공약. 국정과제는 국무회의에서 확정한 정부 공식 문서이고 공약은 아니다.
위원이 둘을 견줘 묻더라도 그 대비는 우리가 하지 않는다. 원문과 출처만 둔다. 평가·논평 없음.

출력: data/gukgam/gov-tasks.json
의존성: pypdf
"""
import os, io, re, json, time, datetime, urllib.request

from textclean import clean_deep

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA = os.path.join(ROOT, "data", "gukgam")
OUT = os.path.join(DATA, "gov-tasks.json")
CACHE = os.environ.get("GUKGAM_GOVTASK_CACHE", "/tmp/gukgam-govtasks")
LIST_URL = "https://www.korea.kr/govVision/"
PDF_URL = "https://www.korea.kr/pdf/govVision/21th/govVision_%d.pdf"
UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                    "(KHTML, like Gecko) Chrome/120 Safari/537.36",
      "Referer": LIST_URL}

TOTAL = 123                      # 이재명정부 123대 국정과제
GOALS = ["국민이 하나되는 정치", "세계를 이끄는 혁신경제", "모두가 잘사는 균형성장",
         "기본이 튼튼한 사회", "국익 중심의 외교안보"]
GOAL_STRATEGIES = [3, 5, 4, 8, 3]   # 국정목표별 전략 수 (합 23)

# 소관과 '닿음'을 가르는 까닭:
# 국정과제 원문은 소관을 표지에 부처로만 적는다('복지부'). 123개 과제 본문을 다 훑어도
# '질병관리청'·'식품의약품안전처'라는 말은 한 번도 나오지 않는다. 그러니 그 둘을 소관이라고
# 적으면 거짓이 된다. 소관은 부처 표기가 있는 복지부만 공식으로 두고, 질병청·식약처는
# '본문에 이 기관 일과 닿는 낱말이 있다'로만 적고 걸린 낱말을 함께 남긴다.
AG_CUES = [
    ("질병관리청", re.compile(r"감염병|방역|검역|예방접종|백신|결핵|만성질환|국립보건연구원|"
                           r"권역감염병|인수공통|팬데믹|건강영양조사|고혈압·당뇨")),
    ("식품의약품안전처", re.compile(r"의약품|마약류|식품안전|의료기기|화장품|임상시험|바이오의약")),
]
DEPT_OFFICIAL = {"복지부": "보건복지부"}


def fetch(url, binary=False, tries=5):
    last = None
    for i in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=90) as r:
                b = r.read()
            if binary:
                if b[:4] != b"%PDF":
                    raise ValueError("PDF가 아님")
                return b
            return b.decode("utf-8", errors="ignore")
        except Exception as e:
            last = e
            time.sleep(2 * (i + 1))
    raise last


def pdf_bytes(no):
    """상세 PDF는 한 번 받아 디스크에 둔다 — 123개를 매번 받을 일이 아니다."""
    os.makedirs(CACHE, exist_ok=True)
    p = os.path.join(CACHE, "%d.pdf" % no)
    if os.path.exists(p) and os.path.getsize(p) > 2000:
        return io.open(p, "rb").read()
    b = fetch(PDF_URL % no, binary=True)
    io.open(p, "wb").write(b)
    return b


def pdf_text(no):
    from pypdf import PdfReader
    r = PdfReader(io.BytesIO(pdf_bytes(no)))
    return "\n".join((pg.extract_text() or "") for pg in r.pages)


def strip_tags(s):
    return [re.sub(r"\s+", " ", x).strip()
            for x in re.sub(r"<[^>]+>", "\n", s).split("\n") if x.strip() and x.strip() != ">"]


def parse_list(html):
    """과제 번호·이름은 상세 PDF 링크에서, 부처는 그 링크 뒤 텍스트의 첫 (괄호)에서."""
    AN = re.compile(r'<a\b[^>]*govVision_(\d+)\.pdf[^>]*aria-label="([^"]*?)\s*상세보기"[^>]*>', re.S)
    ms = list(AN.finditer(html))
    rows = []
    for i, m in enumerate(ms):
        end = ms[i + 1].start() if i + 1 < len(ms) else m.end() + 900
        dept = ""
        for x in strip_tags(html[m.end():end]):
            # '(국민성장펀드 100조원+α 조성)' 처럼 부제가 괄호로 먼저 오는 과제가 있다
            if x.startswith("(") and x.endswith(")") and len(x) <= 24 and "조성" not in x:
                dept = x[1:-1]
                break
        rows.append({"no": int(m.group(1)), "task": m.group(2), "dept": dept})
    rows.sort(key=lambda r: r["no"])

    # 전략·국정목표는 카드 블록 차례로 붙인다(블록당 과제 수만큼)
    blocks = re.split(r'id="card-detail(\d+)"', html)
    strat = []
    for i in range(1, len(blocks), 2):
        b = blocks[i + 1]
        nx = b.find('id="card-detail')
        if nx > 0:
            b = b[:nx]
        L = strip_tags(b)
        k = [j for j, x in enumerate(L) if re.fullmatch(r"전략\s*\d+", x)]
        if not k:
            continue
        strat.append((int(re.findall(r"\d+", L[k[0]])[0]), L[k[0] + 1],
                      len(re.findall(r"govVision_\d+\.pdf", b))))
    gi, acc, idx = 0, 0, 0
    for si, (sno, sname, cnt) in enumerate(strat):
        while gi < len(GOAL_STRATEGIES) - 1 and acc + GOAL_STRATEGIES[gi] <= si:
            acc += GOAL_STRATEGIES[gi]
            gi += 1
        for _ in range(cnt):
            if idx >= len(rows):
                break
            rows[idx].update({"goal": GOALS[gi], "strategy_no": sno, "strategy": sname})
            idx += 1
    return rows, strat


SEC = re.compile(r"◉\s*(과제목표|주요내용|기대효과)")


def parse_detail(text):
    """상세 PDF를 ◉ 머리글로 잘라 과제목표·주요내용·기대효과로 나눈다."""
    text = re.sub(r"Ⅲ\.\s*123대 국정과제\s*\d+", " ", text)
    cuts = [(m.start(), m.group(1)) for m in SEC.finditer(text)]
    out = {"goal_text": [], "detail": [], "effect": []}
    key = {"과제목표": "goal_text", "주요내용": "detail", "기대효과": "effect"}
    for i, (pos, name) in enumerate(cuts):
        end = cuts[i + 1][0] if i + 1 < len(cuts) else len(text)
        body = text[pos:end]
        body = SEC.sub(" ", body)
        items, cur = [], ""
        for ln in body.split("\n"):
            ln = ln.strip()
            if not ln:
                continue
            if ln.startswith(("•", "◦")):
                if cur:
                    items.append(cur.strip())
                cur = ln.lstrip("•◦ ").strip()
            elif ln.startswith(("-", "*", "‧", "·")) and cur:
                cur += " " + ln
            elif cur:
                cur += " " + ln
        if cur:
            items.append(cur.strip())
        out[key[name]] = [re.sub(r"\s+", " ", x) for x in items if len(x) > 4]
    return out


def main():
    rows, strat = parse_list(fetch(LIST_URL))
    nos = [r["no"] for r in rows]
    if len(rows) != TOTAL or sorted(nos) != list(range(1, TOTAL + 1)):
        raise SystemExit("과제 %d개(1~%d 연속이어야 함) — 정책브리핑 쪽 양식이 바뀌었는지 확인"
                         % (len(rows), TOTAL))
    if sum(c for _, _, c in strat) != TOTAL:
        raise SystemExit("전략별 과제 수 합이 %d (≠%d)" % (sum(c for _, _, c in strat), TOTAL))

    kept, miss = [], []
    for r in rows:
        try:
            txt = pdf_text(r["no"])
        except Exception as e:
            miss.append((r["no"], str(e)[:60]))
            continue
        flat = re.sub(r"\s+", " ", txt)
        ags = [full for short, full in DEPT_OFFICIAL.items() if short in (r.get("dept") or "")]
        touch = {}
        for name, cue in AG_CUES:
            if name in ags:
                continue
            w = sorted(set(cue.findall(flat)))
            if w:
                touch[name] = w[:6]
        if not ags and not touch:
            continue
        d = parse_detail(txt)
        if not (d["goal_text"] or d["detail"]):
            miss.append((r["no"], "본문을 나누지 못함"))
            continue
        r = dict(r)
        r["agencies"] = ags          # 부처 표기 기준 — 공식
        r["touch"] = touch           # 본문 낱말로 닿은 기관 — 소관이 아니다
        r["url"] = PDF_URL % r["no"]
        r.update(d)
        kept.append(r)

    if miss:
        print("※ 건너뛴 과제: %s" % ", ".join("%s(%s)" % m for m in miss))
    if not kept:
        raise SystemExit("보건복지위 소관 과제를 하나도 못 찾음 — 가림 규칙 확인")

    out = {
        "updated": datetime.date.today().isoformat(),
        "government": "이재명정부",
        "plan": "이재명정부 국정운영 5개년 계획 — 123대 국정과제",
        "source": "대한민국 정책브리핑 국정과제(korea.kr/govVision) 및 과제별 상세 원문 PDF",
        "source_url": LIST_URL,
        "total": TOTAL,
        "note": "123대 국정과제 가운데 보건복지위원회 일과 닿는 것만 추렸습니다. 과제 번호는 "
                "정책브리핑이 과제마다 붙여 둔 상세 PDF 파일명(govVision_번호.pdf)에서 그대로 가져온 "
                "것이고, 과제목표·주요내용·기대효과는 그 PDF 원문을 나눈 것입니다. "
                "소관(agencies)은 계획서가 과제마다 적어 둔 부처 표기를 그대로 옮긴 것입니다. "
                "다만 원문은 부처만 '복지부'로 적고 질병관리청·식품의약품안전처는 123개 과제 본문 "
                "어디에도 이름이 나오지 않으므로, 그 두 기관은 소관으로 적지 않고 본문에 그 기관 일과 "
                "닿는 낱말이 있다는 뜻의 '닿음'(touch)으로만 적고 걸린 낱말을 함께 남겼습니다. "
                "닿음은 소관이 아닙니다. 공약은 담지 않았고, 과제에 대한 평가나 논평도 넣지 않았습니다.",
        "count": len(kept),
        "items": kept,
    }
    with io.open(OUT, "w", encoding="utf-8") as f:
        json.dump(clean_deep(out), f, ensure_ascii=False, indent=1)

    print("완료: 123대 국정과제 중 보건복지위 일과 닿는 %d건 → %s" % (len(kept), os.path.basename(OUT)))
    for r in kept:
        tag = "·".join(r["agencies"]) or "-"
        if r["touch"]:
            tag += " / 닿음 " + "·".join(r["touch"])
        print("  %3d. %-40s [%s]" % (r["no"], r["task"][:40], tag))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
