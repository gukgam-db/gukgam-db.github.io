#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
국정감사 자료 DB — 국감 하이라이트 카드 생성
- 복지부·질병청 Q&A 데이터를 감사일 단위로 묶어 '그날의 하이라이트'를 뽑습니다.
  (최다 질의 주제, 최다 발언 위원, 대표 질의 인용, 피감기관, 질의 수)
- 메인 페이지의 썸네일 카드 데이터가 됩니다. 실제 영상 캡처가 아니라
  회의록 데이터 기반 요약 카드입니다.

실행: python3 scripts/gukgam/build_highlights.py  (키 불필요)
출력: data/gukgam/highlights.json
"""
import re, os, json, glob, datetime, collections

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA = os.path.join(ROOT, "data", "gukgam")
OUT = os.path.join(DATA, "highlights.json")
MAX_CARDS = 14


def load(name):
    with open(os.path.join(DATA, name), encoding="utf-8") as f:
        return json.load(f)


def tidy_quote(q, limit=110):
    """인용문은 문장 단위로 — 앞머리 조각('…니다. 청장님,')은 떼고, 끝은 마지막 완결 문장에서 자른다."""
    s = re.sub(r"\s+", " ", q or "").strip()
    m = re.match(r"^[^.?!]{0,25}[.?!]\s+", s)          # 25자 안에 문장이 끝나면 앞 조각으로 본다
    if m and len(s) - m.end() > 40:
        s = s[m.end():]
    if len(s) > limit:
        cut = s[:limit]
        p = max(cut.rfind(". "), cut.rfind("? "), cut.rfind("다 "), cut.rfind("요 "))
        s = (cut[:p + 1] if p > limit * 0.45 else cut).rstrip() + "…"
    return s


def main():
    qa = load("kdca-qa.json")["items"]
    for p in sorted(glob.glob(os.path.join(DATA, "mohw-qa-2*.json"))):
        with open(p, encoding="utf-8") as f:
            qa += json.load(f)["items"]
    if os.path.exists(os.path.join(DATA, "mfds-qa.json")):      # 식약처 감사일도 같은 기준으로 센다
        qa += load("mfds-qa.json")["items"]
    summaries = load("summaries.json")["items"]
    members = {m["name"]: m for m in load("members.json")["items"]}

    by_day = collections.defaultdict(list)
    for i in qa:
        by_day[i["date"]].append(i)

    cards = []
    for date, items in by_day.items():
        if len(items) < 12:  # 소규모 회의 제외
            continue
        topics = collections.Counter(t for i in items for t in (i.get("topics") or []))
        mems = collections.Counter(i["member"] for i in items)
        # 대표 질의: 답변이 있고 가장 긴 질의
        best = max((i for i in items if i.get("a")), key=lambda x: len(x["q"]), default=items[0])
        url = items[0].get("minutes_url", "")
        s = summaries.get(url) or {}
        targets = s.get("targets") or []
        top_topic = topics.most_common(1)[0][0] if topics else ""
        top3m = [n for n, _ in mems.most_common(3)]
        photo = next((members[n]["photo"] for n in top3m if n in members and members[n].get("photo")), "")
        cards.append({
            "date": date, "year": int(date[:4]),
            "n": len(items),
            "targets": targets[:3],
            "top_topic": top_topic,
            "topics": [t for t, _ in topics.most_common(3)],
            "top_members": top3m,
            "photo": photo,
            "quote": tidy_quote(best["q"]),
            "quote_member": best["member"],
            "minutes_url": url,
        })
    cards.sort(key=lambda c: c["date"], reverse=True)
    cards = cards[:MAX_CARDS]
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump({"updated": datetime.date.today().isoformat(),
                   "note": "감사일별 자동 요약 카드(영상 캡처 아님). 큰 글씨 = 그날 질의에서 가장 많이 언급된 주제, 사진 = 그날 질의 횟수 상위 위원, 인용 = 답변이 붙은 질의 중 가장 긴 것의 앞부분, 발언 수 = 회의록에서 짝지은 질의·답변 건수.",
                   "items": cards}, f, ensure_ascii=False, indent=1)
    print(f"완료: 하이라이트 카드 {len(cards)}장 ({cards[-1]['date']} ~ {cards[0]['date']})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
