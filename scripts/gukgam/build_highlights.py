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
import os, re, json, glob, datetime, collections

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA = os.path.join(ROOT, "data", "gukgam")
OUT = os.path.join(DATA, "highlights.json")
MAX_CARDS = 14


def load(name):
    with open(os.path.join(DATA, name), encoding="utf-8") as f:
        return json.load(f)


def main():
    qa = load("kdca-qa.json")["items"]
    for p in sorted(glob.glob(os.path.join(DATA, "mohw-qa-2*.json"))):
        with open(p, encoding="utf-8") as f:
            qa += json.load(f)["items"]
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
            "quote": (best["q"][:110] + "…") if len(best["q"]) > 110 else best["q"],
            "quote_member": best["member"],
            "minutes_url": url,
        })
    cards.sort(key=lambda c: c["date"], reverse=True)
    cards = cards[:MAX_CARDS]
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump({"updated": datetime.date.today().isoformat(),
                   "note": "회의록 질의 데이터 기반 자동 요약 카드 (영상 캡처 아님)",
                   "items": cards}, f, ensure_ascii=False, indent=1)
    print(f"완료: 하이라이트 카드 {len(cards)}장 ({cards[-1]['date']} ~ {cards[0]['date']})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
