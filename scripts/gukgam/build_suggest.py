#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
국정감사 자료 DB — 통합 검색 연관어(자동완성) 사전

검색창에 몇 글자만 쳐도 색인에 실제로 있는 온전한 단어가 아래에 뜨게 한다. 없는 말(예: SFTS)은
사전에도 없으므로 "이 자료에는 없다"는 신호가 된다.
출처: 위원 발언 전체 색인(remarks-*.json)의 단어 문서빈도, 위원 이름(rosters), 주제 분류명, 기관명.
형태소 분석기 없이 조사만 떼는 거친 방식이라 상위 빈도어만 남긴다.
출력: data/gukgam/suggest.json  {"terms":[[단어, 건수, 종류], ...]}  종류: w=단어 m=위원 t=주제 a=기관
"""
import os, io, re, json, glob, collections, datetime, sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA = os.path.join(ROOT, "data", "gukgam")
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

JOSA = re.compile(r"(으로부터|에서는|에게는|으로는|에서도|한테|께서|부터|까지|에서|에게|으로|이나|이라|라고|처럼|만큼|보다|마저|조차|은|는|이|가|을|를|의|에|도|와|과|로|만)$")
BAD_END = set("다서게데지고면요죠께냐니나며든")
STOP = set("""지금 이런 그런 이렇게 그렇게 그래서 그런데 우리 저희 가지 부분 문제 대한 위원님 장관님 청장님 이것 때문 다음 사실 생각 말씀 한번 존경하 그리
이게 어떻게 정도 관련 경우 대해 위해 통해 이번 여러 정말 아까 제가 저는 근데 그거 이거 무슨 어떤 지난 오늘 하나 얘기 답변 질의 질문 위원 의원 국회
국정감사 국감 정부 기관 여기 거기 그것 저것 이제 계속 항상 다시 아직 이미 많이 조금 더욱 특히 그냥 바로 전혀 모두 하는 되는 있는 없는 같은 통한 위한
관한 따른 그러 있지 있습니 있는데 있다 된다 해서 주시기 바랍니다 니다 위해서 대해서 그러니까 그리고 그러면 그런지 이런지 것이 것은 것을 것도 수가 수는
수를 우리나라 대한민국 보건복지 보건복지부 보건복지위원회 위원장 장관 차관 청장 처장 원장 이사장 본부장 국장 과장 말씀드리 말씀드 드리겠습니 하겠습니
하고 했고 하면 되면 그때 이때 저기 뭐냐 그런데도 그러나 하지만 근거 내용 상황 현재 이후 이전 당시 자료 결과 관련해서 대해서는 그러면서 한다는 된다는
것으로 것이다 있다는 없다는 부탁드리 부탁 감사합니다 감사 네네 아니 아닙니 아니라 아니고 물론 역시 약간 상당히 굉장히 너무 매우 아주 가장 제일 진짜 별로
사람 사람들 국민 국민들 여러분 자체 전체 일부 각각 서로 함께 대로 만큼 정도로 이상 이하 미만 초과 이내 동안 사이 중에 앞으로 뒤에 위에 아래 안에 밖에""".split())


def load(name, default=None):
    p = os.path.join(DATA, name)
    if not os.path.exists(p):
        return default
    with open(p, encoding="utf-8") as f:
        return json.load(f)


def ok(w):
    if len(w) < 2 or len(w) > 12 or w.isdigit() or w in STOP:
        return False
    if w[-1] in BAD_END and not re.search(r"[A-Za-z0-9]$", w):
        return False
    if re.search(r"(니다|습니|세요|십시오|는데|해서|하고|해요|에요|겠습|였습|했습|입니|이라는|라는|한다|된다|하는|되는)$", w):
        return False
    return True


def main():
    df = collections.Counter()
    for p in sorted(glob.glob(os.path.join(DATA, "remarks-20*.json"))):
        for it in load(os.path.basename(p), {}).get("items", []):
            seen = set()
            for w in re.findall(r"[가-힣A-Za-z0-9·]{2,14}", it.get("text", "")):
                w = JOSA.sub("", w)
                if ok(w):
                    seen.add(w)
            df.update(seen)
    terms = {}
    for w, c in df.items():
        if c >= 4:
            terms[w] = [c, "w"]
    # 위원 이름 — 연도별 명단 합산(발언 수)
    ro = load("rosters.json", {}) or {}
    names = collections.Counter()
    for y in ro.get("years", []):
        for m in y.get("members", []):
            names[m["name"]] += m.get("turns", 0)
    for m in (load("members.json", {}) or {}).get("items", []):
        names[m["name"]] += 0
    for n, c in names.items():
        terms[n] = [max(c, df.get(n, 0)), "m"]
    # 주제 분류명·기관명
    labels = set()
    try:
        import build_findings as F
        labels |= set(F.SUBJECT_KEYS.keys() if isinstance(F.SUBJECT_KEYS, dict) else [k[0] if isinstance(k, (list, tuple)) else k for k in F.SUBJECT_KEYS])
    except Exception:
        pass
    for mod in ("build_kdca_qa", "build_mohw_qa", "build_mfds_qa"):
        try:
            M = __import__(mod)
            labels |= set(M.TOPICS.keys())
            for kws in M.TOPICS.values():
                labels |= set(k for k in kws if len(k) >= 2)
        except Exception:
            pass
    for t in labels:
        c = df.get(t, 0) or sum(v for k, v in df.items() if t in k)
        if c:
            terms[t] = [c, "t"]
    for a in ((load("briefing.json", {}) or {}).get("agencies", {}) or {}).keys():
        terms[a] = [max(df.get(a, 0), 1), "a"]
    rows = sorted(([w, v[0], v[1]] for w, v in terms.items()), key=lambda x: -x[1])[:8000]
    with io.open(os.path.join(DATA, "suggest.json"), "w", encoding="utf-8") as f:
        json.dump({"updated": datetime.date.today().isoformat(),
                   "note": "통합 검색 연관어 — 위원 발언 색인에 실제로 있는 단어(문서빈도 4 이상)·위원 이름·주제 분류·기관명. 건수는 그 말이 나온 발언 수.",
                   "terms": rows}, f, ensure_ascii=False, separators=(",", ":"))
    print("완료: 연관어 %d개 (단어 %d · 위원 %d · 주제 %d · 기관 %d)" % (
        len(rows), sum(1 for r in rows if r[2] == "w"), sum(1 for r in rows if r[2] == "m"),
        sum(1 for r in rows if r[2] == "t"), sum(1 for r in rows if r[2] == "a")))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
