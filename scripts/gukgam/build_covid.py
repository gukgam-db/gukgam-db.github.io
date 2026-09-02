#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
국정감사 자료 DB — 코로나19·팬데믹 대비 5년 기록 집계 (질병관리청)

질병청 국감 Q&A(2020~)와 결과보고서 지적사항에서 코로나19 관련 건만 골라
"질문이 어떻게 옮겨갔나(대응→백신→피해보상→검증·대비)"와 "아직 살아있는
질문"을 한 화면에 담기 위한 데이터를 만든다. 2026 국감의 코로나 질의는
'그때 뭐 했나'가 아니라 '5년 지났는데 준비됐나'로 나온다.

판별은 키워드다. '코로나·COVID'가 직접 나오면 확실, '팬데믹·거리두기·격리'
같은 주변어만 있으면 추정으로 표시한다(사이트 공통 원칙: 근거 강도를 숨기지 않는다).

실행: python3 scripts/gukgam/build_covid.py
출력: data/gukgam/covid.json
"""
import os, io, re, json, ast, datetime, collections

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA = os.path.join(ROOT, "data", "gukgam")

STRONG = re.compile(r"코로나|COVID|코비드|Covid")
WEAK = re.compile(r"팬데믹|거리두기|확진자|자가격리|격리 해제|격리해제|PCR|재택치료|방역패스|자가진단키트|자가검사키트|mRNA|감염병 대유행|대유행 대비|신종감염병 대유행")

# 코로나 안에서의 세부 주제 — 앞쪽이 우선(동률이면 앞이 이김). 병명이 아니라 '무엇을 묻는가'다.
THEMES = [
    ("피해보상", ["피해보상", "인과성", "보상금", "위로금", "보상 신청", "피해 보상", "이상반응 보상"]),
    ("백신·접종", ["백신", "접종", "mRNA", "폐기", "수급", "이상반응", "항체", "부스터", "콜드체인"]),
    ("병상·치료", ["병상", "중환자", "치료제", "팍스로비드", "재택치료", "생활치료센터", "의료진", "의료인력", "음압"]),
    ("방역·검사", ["거리두기", "확진자", "역학조사", "격리", "PCR", "검사", "진단키트", "방역패스", "QR", "동선", "마스크", "입국"]),
    ("검증·평가", ["백서", "검증", "평가", "감사원", "JEE", "합동외부평가", "교훈", "복기", "재점검"]),
    ("미래 팬데믹 대비", ["신종감염병", "팬데믹 대비", "대유행 대비", "비축", "중장기", "국산 백신", "백신 개발", "플랫폼", "감염병 병상", "대비"]),
    ("정보·데이터", ["시스템", "데이터", "통계", "앱", "전산", "정보"]),
    ("조직·인력·예산", ["예산", "인력", "조직", "정원", "승격", "재정", "기금"]),
]
THEME_ORDER = [t for t, _ in THEMES] + ["방역·대응 종합"]
# 연도 서사 — 지배 주제로 한 줄
NARR = {
    "방역·검사": "확진자·검사·거리두기 — 대응 그 자체를 물었다",
    "병상·치료": "병상·치료제·의료인력 — 대응 역량을 물었다",
    "백신·접종": "백신 수급·접종·이상반응 — 백신이 쟁점이었다",
    "피해보상": "접종 피해보상 — 사후 책임을 물었다",
    "검증·평가": "대응 검증·백서·평가 — 복기를 요구했다",
    "미래 팬데믹 대비": "다음 팬데믹 대비 — 준비됐는지를 물었다",
    "정보·데이터": "정보시스템·데이터 — 기록과 통계를 물었다",
    "조직·인력·예산": "조직·인력·예산 — 청의 체력을 물었다",
    "방역·대응 종합": "방역·대응 전반",
}


def load(name):
    p = os.path.join(DATA, name)
    if not os.path.exists(p):
        return None
    with io.open(p, encoding="utf-8") as f:
        return json.load(f)


def clean(s):
    s = re.sub(r"\s+", " ", s or "").strip()
    return s.lstrip(",.·;: ").strip()


def theme_of(text):
    best, bn = None, 0
    for label, kws in THEMES:
        n = sum(text.count(k) for k in kws)
        if n > bn:
            best, bn = label, n
    return best or "방역·대응 종합"


def covid_conf(text):
    if STRONG.search(text):
        return "high"
    if WEAK.search(text):
        return "low"
    return None


def topics_of(q):
    t = q.get("topics")
    if isinstance(t, str):
        try:
            t = ast.literal_eval(t)
        except Exception:
            t = []
    return t or []


def main():
    qa = (load("kdca-qa.json") or {}).get("items", [])
    members = {m["name"]: m for m in (load("members.json") or {}).get("items", []) if m.get("name")}

    items, total_by_year = [], collections.Counter()
    for q in qa:
        y = str(q.get("year") or "")[:4]
        if not y:
            continue
        total_by_year[y] += 1
        text = (q.get("q") or "") + " " + (q.get("a") or "")
        conf = covid_conf(text)
        if not conf:
            continue
        items.append({
            "year": y, "date": q.get("date"), "member": q.get("member"),
            "party": (members.get(q.get("member")) or {}).get("party"),
            "theme": theme_of(text), "conf": conf,
            "q": clean(q.get("q"))[:400], "a": clean(q.get("a"))[:400],
            "url": q.get("minutes_url"), "topics": topics_of(q),
        })
    items.sort(key=lambda x: (x["year"], x.get("date") or "", x["member"] or ""))

    # ── 연도별
    years = []
    for y in sorted(total_by_year):
        ys = [i for i in items if i["year"] == y]
        th = collections.Counter(i["theme"] for i in ys)
        dom = th.most_common(1)[0][0] if th else None
        # 대표 질의: 확실 판정 + 질문 길이가 답변 가능한 수준(60자↑) 중 앞 3건, 위원 중복 없이
        seen, samples = set(), []
        for i in sorted(ys, key=lambda x: (x["conf"] != "high", -len(x["q"]))):
            if i["member"] in seen or len(i["q"]) < 60:
                continue
            seen.add(i["member"]); samples.append({k: i[k] for k in ("member", "party", "q", "theme", "conf", "url", "date")})
            if len(samples) == 3:
                break
        years.append({
            "year": y, "n": len(ys), "total": total_by_year[y],
            "share": round(len(ys) / total_by_year[y], 3) if total_by_year[y] else 0,
            "themes": dict(th.most_common()), "dominant": dom,
            # 서사는 데이터가 쓴다: 상위 주제 2개를 그대로 적는다 (내가 지어낸 한 줄은 과장이 된다)
            "label": (" · ".join("%s %d건" % kv for kv in th.most_common(2)) if th else "코로나 질의 없음"),
            "hint": NARR.get(dom, "") if dom else "",
            "samples": samples,
        })

    # ── 세부 주제별 (연도 분포 + 최근 예시)
    themes = []
    for t in THEME_ORDER:
        ts = [i for i in items if i["theme"] == t]
        if not ts:
            continue
        byy = collections.Counter(i["year"] for i in ts)
        latest = max(ts, key=lambda x: (x["year"], x.get("date") or ""))
        themes.append({"theme": t, "n": len(ts), "by_year": dict(sorted(byy.items())),
                       "years": sorted(byy), "latest": {k: latest[k] for k in ("year", "member", "q", "url")}})
    themes.sort(key=lambda x: -x["n"])

    # ── 반복 질의: 3개 연도 이상 등장한 주제 — 연도별 예시 1건씩(확실 우선)
    repeats = []
    for t in themes:
        if len(t["years"]) < 3:
            continue
        ex = []
        for y in t["years"]:
            cands = sorted([i for i in items if i["theme"] == t["theme"] and i["year"] == y and len(i["q"]) >= 40],
                           key=lambda x: (x["conf"] != "high", -len(x["q"])))
            if cands:
                c = cands[0]; ex.append({"year": y, "member": c["member"], "q": c["q"][:180], "url": c["url"]})
        repeats.append({"theme": t["theme"], "years": t["years"], "n": t["n"], "examples": ex})

    # ── 아직 살아있는 질문: 최근 2개 연도 결과보고서의 질병청 코로나 관련 지적
    fy = sorted(int(m.group(1)) for f in os.listdir(DATA) for m in [re.match(r"findings-(\d{4})\.json$", f)] if m)
    live = []
    for y in fy[-2:]:
        for i in (load("findings-%d.json" % y) or {}).get("items", []):
            if "질병관리청" not in (i.get("agency") or ""):
                continue
            conf = covid_conf(i["text"])
            if not conf:
                continue
            live.append({"id": i.get("id"), "year": y, "text": i["text"], "act": i.get("act"),
                         "dept": i.get("dept"), "theme": theme_of(i["text"]), "conf": conf})

    # ── 위원별 (현 위원만) — 국감 대비는 '지금 우리를 물을 사람'을 알아야 한다
    mem = []
    for name, m in members.items():
        ms = [i for i in items if i["member"] == name]
        if not ms:
            continue
        th = collections.Counter(i["theme"] for i in ms)
        recent = [i for i in ms if int(i["year"]) >= 2024]
        last = max(ms, key=lambda x: (x["year"], x.get("date") or ""))
        mem.append({"name": name, "party": m.get("party"), "duty": m.get("duty"), "photo": m.get("photo"),
                    "n": len(ms), "recent": len(recent), "years": sorted({i["year"] for i in ms}),
                    "themes": [k for k, _ in th.most_common(3)],
                    "last": {"year": last["year"], "q": last["q"][:160], "url": last["url"]}})
    mem.sort(key=lambda x: (-x["recent"], -x["n"]))

    latest = years[-1] if years else None
    out = {
        "updated": datetime.date.today().isoformat(),
        "note": "질병관리청 국감 회의록 Q&A와 결과보고서 지적사항 중 코로나19 관련 건. "
                "'코로나·COVID'가 직접 나오면 확실, 팬데믹·거리두기·격리 등 주변어만 있으면 추정으로 표시. "
                "세부 주제는 키워드 기반 자동 분류.",
        "kpi": {
            "qa_n": len(items), "qa_all": sum(total_by_year.values()),
            "qa_high": sum(1 for i in items if i["conf"] == "high"),
            "years": [y["year"] for y in years if y["n"]],
            "peak_year": max(years, key=lambda y: y["share"])["year"] if years else None,
            "peak_share": max((y["share"] for y in years), default=0),
            "latest_year": latest["year"] if latest else None, "latest_share": latest["share"] if latest else 0,
            "live_n": len(live), "members_n": len(mem),
        },
        "years": years, "themes": themes, "repeats": repeats, "live": live, "members": mem, "items": items,
    }
    with io.open(os.path.join(DATA, "covid.json"), "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
    k = out["kpi"]
    print("완료: 코로나 Q&A %d건(확실 %d) / 전체 %d · 지적 %d건 · 현 위원 %d명 · 정점 %s년 %.0f%% → %s년 %.0f%%"
          % (k["qa_n"], k["qa_high"], k["qa_all"], k["live_n"], k["members_n"], k["peak_year"], 100 * k["peak_share"],
             k["latest_year"], 100 * k["latest_share"]))
    for y in years:
        print("  %s: %3d/%3d %s · %s" % (y["year"], y["n"], y["total"], dict(list(y["themes"].items())[:3]), y["label"]))
    print("  반복 주제:", ", ".join("%s(%s)" % (r["theme"], "·".join(r["years"])) for r in repeats))
    print("  현 위원:", ", ".join("%s %d(최근 %d)" % (m["name"], m["n"], m["recent"]) for m in mem[:8]))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
