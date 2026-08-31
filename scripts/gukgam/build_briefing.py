#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
국정감사 자료 DB — 기관별 국감 브리핑 집계기

자료 '목록'만으로는 "그래서 우리가 뭘 준비해야 하나"에 답이 안 된다.
이미 수집된 지적사항·회의록 Q&A를 기관 단위로 미리 집계해 두 층을 만든다.

  기관장·국장용 — 올해 지적 몇 건인지, 작년 대비 늘었는지, 몇 위인지,
                 같은 주제로 몇 년째 맞고 있는지, 계획 제출 부담이 얼마인지,
                 어떤 주제가 뜨고 지는지, 누가 주로 묻는지
  실무자용     — 반복 지적 원문 대조, 소관 부서별 배분, 요구 강도순 우선순위

브라우저에서 돌리면 Q&A 파일만 10MB라 느리므로 빌드 때 계산해 둔다.

실행: python3 scripts/gukgam/build_briefing.py
출력: data/gukgam/briefing.json
"""
import os, io, json, re, datetime, collections

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA = os.path.join(ROOT, "data", "gukgam")
OUT = os.path.join(DATA, "briefing.json")

# 지적사항이 있는 연도 (findings-YYYY.json)
FIND_YEARS = sorted(
    int(m.group(1))
    for m in (re.match(r"findings-(\d{4})\.json$", f) for f in os.listdir(DATA))
    if m
)
# 기관별 Q&A 파일 — 주제 추세와 질의 의원을 뽑는다
QA_FILES = {
    "질병관리청": ["kdca-qa.json"],
    "식품의약품안전처": ["mfds-qa.json"],
    "보건복지부": ["mohw-qa-%d.json" % y for y in range(2020, 2026)],
}
MIN_ITEMS = 15          # 이보다 적은 기관은 브리핑을 만들지 않는다(표본 부족)
REPEAT_SIM = 0.30       # 반복 지적으로 볼 문장 유사도(주제어 기준)
TOP_REPEAT = 25         # 기관당 반복 지적 보관 수


def load(name):
    p = os.path.join(DATA, name)
    if not os.path.exists(p):
        return None
    with io.open(p, encoding="utf-8") as f:
        return json.load(f)


WORD = re.compile(r"[^가-힣A-Za-z0-9]+")

# 시정요구는 어투가 정형화돼 있어("~ 방안을 마련할 것") 이 말들을 그대로 두면
# 주제가 전혀 달라도 유사도가 올라간다. 주제어만 남기고 요구 어투는 뺀다.
STOP = {
    "마련", "마련할", "수립", "수립할", "검토", "검토할", "개선", "개선할", "확대", "확대할",
    "강화", "강화할", "노력", "노력할", "점검", "점검할", "관리할", "제고", "추진", "추진할",
    "방안", "대책", "계획", "필요", "위하여", "위한", "위해", "있도록", "관련", "등의", "통해",
    "적극", "조속", "지속", "체계", "방지", "확보", "도록",
}


def toks(t):
    """조사·어미 차이를 흡수하려고 어간 근사(뒤 1글자 제거)를 함께 넣는다."""
    ws = [w for w in WORD.sub(" ", t).split() if len(w) >= 2]
    s = set(ws) | {w[:-1] for w in ws if len(w) >= 4}
    return s - STOP


def jaccard(a, b):
    if not a or not b:
        return 0.0
    i = len(a & b)
    return i / (len(a) + len(b) - i)


def trend(series, years):
    """앞 절반 대비 뒤 절반 평균으로 상승/하락 판정. 표본이 적으면 판정하지 않는다."""
    vals = [series.get(y, 0) for y in years]
    if sum(vals) < 8 or len(years) < 4:
        return None
    h = len(years) // 2
    old = sum(vals[:h]) / h
    new = sum(vals[h:]) / (len(years) - h)
    if old == 0 and new == 0:
        return None
    if old == 0:
        return "up"
    r = (new - old) / old
    return "up" if r >= 0.4 else ("down" if r <= -0.4 else None)


def main():
    if not FIND_YEARS:
        raise SystemExit("findings-*.json 이 없습니다")
    cur, prev = FIND_YEARS[-1], (FIND_YEARS[-2] if len(FIND_YEARS) > 1 else None)

    F = {y: (load("findings-%d.json" % y) or {}).get("items", []) for y in FIND_YEARS}

    # 기관별 지적 건수 / 순위
    counts = {y: collections.Counter(i.get("agency") or "" for i in F[y]) for y in FIND_YEARS}
    counts[cur].pop("", None)
    ranked = [a for a, _ in counts[cur].most_common()]

    out_ag = {}
    for agency in ranked:
        items_cur = [i for i in F[cur] if i.get("agency") == agency]
        if len(items_cur) < MIN_ITEMS:
            continue
        items_prev = [i for i in F[prev] if i.get("agency") == agency] if prev else []

        # ── 요구 강도 (계획 제출 부담)
        act = collections.Counter(i.get("act") or "그 밖" for i in items_cur)

        # ── 소관 부서별 배분
        dept = collections.Counter(i["dept"] for i in items_cur if i.get("dept"))

        # ── 분류별 건수 + 작년에도 지적된 주제인지
        keys_prev = {i.get("key") for i in items_prev if i.get("key")}
        keys = collections.Counter(i["key"] for i in items_cur if i.get("key"))
        by_key = [{"key": k, "n": v, "repeat": k in keys_prev} for k, v in keys.most_common()]

        # ── 반복 지적 (문장 단위) — 작년 원문과 나란히 보여 주기 위함
        idx = [(toks(i["text"]), i) for i in items_prev]
        repeats = []
        for i in items_cur:
            t = toks(i["text"])
            best_s, best_j = 0.0, None
            for t0, j in idx:
                s = jaccard(t, t0)
                if s > best_s:
                    best_s, best_j = s, j
            if best_s >= REPEAT_SIM and best_j is not None:
                repeats.append({
                    "sim": round(best_s, 2),
                    # 0.85 이상은 사실상 같은 문장 — 기관장이 가장 먼저 봐야 할 건
                    "level": "same" if best_s >= 0.85 else ("near" if best_s >= 0.45 else "like"),
                    "key": i.get("key") or "",
                    "act": i.get("act") or "",
                    "dept": i.get("dept") or "",
                    "prev": best_j["text"],
                    "cur": i["text"],
                })
        repeats.sort(key=lambda x: -x["sim"])
        repeats = repeats[:TOP_REPEAT]

        rec = {
            "count": {str(y): counts[y].get(agency, 0) for y in FIND_YEARS},
            "rank": ranked.index(agency) + 1,
            "rank_of": len(ranked),
            "act": dict(act.most_common()),
            "dept": [{"dept": d, "n": n} for d, n in dept.most_common(20)],
            "by_key": by_key[:20],
            "repeat_key_n": sum(1 for k in by_key if k["repeat"]),
            "repeats": repeats,
        }

        # ── 주제 추세·질의 의원 (Q&A가 있는 기관만)
        files = QA_FILES.get(agency)
        if files:
            qa = []
            for fn in files:
                d = load(fn)
                if d:
                    qa += d.get("items", [])
            if qa:
                yrs = sorted({int(q["year"]) for q in qa if q.get("year")})
                mat = collections.defaultdict(collections.Counter)
                for q in qa:
                    y = q.get("year")
                    for tp in (q.get("topics") or []):
                        mat[tp][int(y)] += 1
                tr = []
                for tp, ser in mat.items():
                    s = {y: ser.get(y, 0) for y in yrs}
                    tr.append({"topic": tp, "series": s, "total": sum(s.values()),
                               "dir": trend(s, yrs)})
                tr.sort(key=lambda x: -x["total"])
                rec["qa_years"] = yrs
                rec["topics"] = tr[:12]
                rec["members"] = [{"name": n, "n": c} for n, c in
                                  collections.Counter(q.get("member") or "" for q in qa
                                                      if q.get("member")).most_common(8)]
                rec["qa_total"] = len(qa)
        out_ag[agency] = rec

    out = {
        "updated": datetime.date.today().isoformat(),
        "cur_year": cur,
        "prev_year": prev,
        "years": FIND_YEARS,
        "total_cur": len(F[cur]),
        "note": "지적사항·회의록 Q&A를 기관 단위로 집계한 브리핑 데이터. "
                "반복 지적은 작년 지적과 문장 유사도 %.2f 이상인 건." % REPEAT_SIM,
        "agencies": out_ag,
    }
    with io.open(OUT, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
    kb = os.path.getsize(OUT) / 1024
    print("완료: 기관 %d개 / %.0fKB" % (len(out_ag), kb))
    for a in ranked[:8]:
        if a in out_ag:
            r = out_ag[a]
            print("   %-16s %s건 (%d위) · 반복주제 %d · 반복문장 %d"
                  % (a[:16], r["count"][str(cur)], r["rank"], r["repeat_key_n"], len(r["repeats"])))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
