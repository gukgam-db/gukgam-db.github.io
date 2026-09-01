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
ERA_FROM = 2024         # 현 대수(제22대) 시작 연도 — 이 이후가 "지금 물을 사람"이다


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


SHARE_UP, SHARE_DOWN = 0.25, -0.25   # 비중 기준이라 건수 기준보다 문턱을 낮게 둔다


def trend(series, years, totals):
    """최신 연도 비중을 이전 연도들의 평균 비중과 비교해 상승/하락 판정.

    반드시 '그해 전체 질의 중 비중'으로 비교한다. 건수로 보면 전체 질의량이
    늘어난 것(복지부는 2020년 822건 → 2025년 1410건, +56%)에 휩쓸려
    제자리인 주제까지 전부 '늘고 있음'으로 찍힌다.

    비교 기준이 최신 연도인 이유: 전반기/후반기 평균 비교는 "2024년 정점 후
    2025년 반토막"(의사인력 132→63건)도 후반기 평균이 높다는 이유로
    '늘고 있음 +179%'로 찍었다. 국감 대비의 질문은 "요즘도 이걸 묻는가"이므로
    가장 최근 국감의 비중이 기준이어야 한다.

    반환: (방향, 비중 증감률) — 방향이 None이어도 증감률은 돌려줘서
    화면이 빈칸 대신 '변화 없음'을 숫자와 함께 보여줄 수 있게 한다.
    """
    vals = [series.get(y, 0) for y in years]
    if sum(vals) < 8 or len(years) < 4:
        return None, None            # 표본 부족 — 판정하지 않는다
    shares = [(series.get(y, 0) / totals[y]) if totals.get(y) else 0.0 for y in years]
    base = sum(shares[:-1]) / (len(shares) - 1)   # 최신 연도 제외한 평균 비중
    new = shares[-1]
    if base == 0:
        return ("up", None) if new > 0 else (None, None)
    r = (new - base) / base
    return ("up" if r >= SHARE_UP else ("down" if r <= SHARE_DOWN else None)), round(r, 3)


def main():
    if not FIND_YEARS:
        raise SystemExit("findings-*.json 이 없습니다")
    cur, prev = FIND_YEARS[-1], (FIND_YEARS[-2] if len(FIND_YEARS) > 1 else None)

    F = {y: (load("findings-%d.json" % y) or {}).get("items", []) for y in FIND_YEARS}
    SUMM = (load("summaries.json") or {}).get("items", {})
    # summaries 의 when 은 PDF 본문에서 긁은 값이라 "불출석을 양해하였다는" 같은
    # 문장이 들어오는 경우가 있다. 회의 날짜는 회의록 메타데이터(API)를 기준으로 잡는다.
    URL2DATE = {m["url"]: m.get("date") for m in (load("minutes.json") or {}).get("items", [])
                if m.get("url")}
    # 회의록은 제21대부터 쌓여 있어 누적만 세면 이미 위원이 아닌 사람이 상위에 온다.
    # 국감 대비는 "지금 우리를 물을 사람"을 알아야 하므로 현 위원으로 좁힌다.
    CUR_MEM = {m["name"] for m in (load("members.json") or {}).get("items", []) if m.get("name")}

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

        # ── 분류 신뢰도 구성 — 사이트 전체 평균(추정 51%)만 알려주면 기관별
        # 편차가 감춰진다(질병청은 확실이 76%). 기관 화면에 그 기관 수치를 보인다.
        conf = collections.Counter(i.get("key_conf") or "none" for i in items_cur)

        # ── 소관 부서별 배분
        dept = collections.Counter(i["dept"] for i in items_cur if i.get("dept"))

        # ── 분류별 건수 + 작년에도 지적된 주제인지
        keys_prev = {i.get("key") for i in items_prev if i.get("key")}
        keys = collections.Counter(i["key"] for i in items_cur if i.get("key"))
        by_key = [{"key": k, "n": v, "repeat": k in keys_prev} for k, v in keys.most_common()]

        # ── 성격별 건수 (2축) — 성격이 2축(key2)으로 잡혔거나 1축(key) 자체가 성격인 항목
        NATURE = {"조직·인력", "처우·노무", "예산·재정", "정보시스템·데이터", "연구·R&D",
                  "통계·실태조사", "관리·감독", "법령·제도개선", "홍보·교육", "사업운영·성과"}
        keys2 = collections.Counter(
            (i.get("key2") or (i.get("key") if i.get("key") in NATURE else None))
            for i in items_cur)
        keys2.pop(None, None)
        by_key2 = [{"key": k, "n": v} for k, v in keys2.most_common()]

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


        # ── 감사일 이력 — "우리 기관은 언제 감사받나"
        # 국정감사계획서(감사일정×피감기관 표)는 첨부파일이라 아직 파싱하지 않는다.
        # 대신 지난 회의록에 붙은 피감기관 정보로 실제 감사받은 날을 되짚는다.
        # 국감 일정은 해마다 시기가 거의 고정이라 이것만으로도 준비 시점을 잡을 수 있다.
        days, seen = [], set()
        for url_, rec_ in (SUMM or {}).items():
            if rec_.get("kind") != "minutes":
                continue
            tg = rec_.get("targets") or []
            if not any(agency in t for t in tg):
                continue
            d_ = URL2DATE.get(url_)
            if not d_:   # 메타데이터에 없으면 본문 표기로 보완
                m = re.search(r"(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일", rec_.get("when") or "")
                d_ = "%s-%02d-%02d" % (m.group(1), int(m.group(2)), int(m.group(3))) if m else None
            if not d_ or d_ in seen:
                continue
            seen.add(d_)
            days.append({"date": d_, "with": [t for t in tg if agency not in t][:4]})
        days.sort(key=lambda x: x["date"])

        rec = {
            "count": {str(y): counts[y].get(agency, 0) for y in FIND_YEARS},
            "rank": ranked.index(agency) + 1,
            "rank_of": len(ranked),
            "act": dict(act.most_common()),
            "conf": {"high": conf.get("high", 0), "low": conf.get("low", 0), "none": conf.get("none", 0)},
            "dept": [{"dept": d, "n": n} for d, n in dept.most_common(20)],
            "by_key": by_key[:20],
            "by_key2": by_key2[:10],
            "repeat_key_n": sum(1 for k in by_key if k["repeat"]),
            "repeats": repeats,
            "audit_days": days,
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
                yr_tot = collections.Counter(int(q["year"]) for q in qa if q.get("year"))
                tr = []
                for tp, ser in mat.items():
                    s = {y: ser.get(y, 0) for y in yrs}
                    d, delta = trend(s, yrs, yr_tot)
                    tr.append({"topic": tp, "series": s, "total": sum(s.values()),
                               "dir": d, "share_delta": delta})
                tr.sort(key=lambda x: -x["total"])
                rec["qa_years"] = yrs
                rec["topics"] = tr[:12]
                cum = collections.Counter(); rec_c = collections.Counter()
                for q in qa:
                    nm = q.get("member")
                    if not nm or (CUR_MEM and nm not in CUR_MEM):
                        continue
                    cum[nm] += 1
                    if int(q.get("year") or 0) >= ERA_FROM:
                        rec_c[nm] += 1
                # 현 대수 질의 수를 우선, 같으면 누적 순 — 예측력이 있는 쪽을 앞세운다
                rec["members"] = [{"name": n, "recent": rec_c.get(n, 0), "n": cum[n]}
                                  for n in sorted(cum, key=lambda x: (-rec_c.get(x, 0), -cum[x]))][:8]
                rec["members_era_from"] = ERA_FROM
                rec["members_note"] = "현 위원 기준"
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
