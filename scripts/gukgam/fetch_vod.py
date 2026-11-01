#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
국정감사 자료 DB — 영상회의록 발언자 목차 수집

왜 필요한가: 국회 회의록은 감사일로부터 보통 2~6주 뒤에 공개된다. 2026년 국감은 10월 27일
종합감사로 끝났는데 10월 29일까지도 보건복지위 회의록은 한 건도 올라오지 않았다. 그 공백
동안 '누가 언제 얼마나 질의했는지'를 알 수 있는 1차 자료는 영상회의록의 발언자 목차뿐이다.
언론 보도로 메우면 절반이 빈다 — 2026년 1일차 질병청 질의 10건 가운데 보도된 것은 4건이었다.

무엇을 가져오나: 국회가 회의에 직접 붙여 둔 목차다. 발언 순서·시각·길이·발언자·답변자가
들어 있다. 발언 내용(속기)은 목차에 없고, 이 영상들에는 자막도 없다. 그러니 이 파일은
'질의의 뼈대'이지 '질의의 내용'이 아니다. 화면에서도 그렇게 밝혀야 한다.

어떻게 가져오나(세 걸음):
  1) 인터넷의사중계 달력   calendar.asp?qdate=YYYYMM  → 위원회별 회의와 xcgcd
  2) 중계 정보             live_play.asp?xcode&xcgcd   → 영상회의록 주소(mc/ct1/ct2/ct3/no)와 종료시각
  3) 영상회의록 목차       movie.do?cmd=movieInfo      → 세션별 발언 구간

출력: data/gukgam/vod-{연도}.json
"""
import os, io, re, json, time, datetime, urllib.request

from textclean import clean_deep

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA = os.path.join(ROOT, "data", "gukgam")
UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                    "(KHTML, like Gecko) Chrome/120 Safari/537.36",
      "Referer": "https://assembly.webcast.go.kr/main/"}
CAL = "https://assembly.webcast.go.kr/main/service/calendar.asp?qdate=%s"
PLAY = "https://assembly.webcast.go.kr/main/service/live_play.asp?xcode=%s&xcgcd=%s"
INFO = ("http://w3.assembly.go.kr/main/service/movie.do?cmd=movieInfo"
        "&mc=%s&ct1=%s&ct2=%s&ct3=%s&no=%s&wv=1")
SMI = ("http://w3.assembly.go.kr/main/service/smi.do?cmd=smiList"
       "&no=%s&mc=%s&ct1=%s&ct2=%s&ct3=%s&v=20220203")
VOD = ("https://w3.assembly.go.kr/main/player.do?ref=main&wv=1"
       "&mc=%s&ct1=%s&ct2=%s&ct3=%s&no=%s")

COMMITTEE = os.environ.get("GUKGAM_VOD_COMMITTEE", "복지위")   # 달력의 짧은 위원회 이름
MONTHS = [9, 10, 11, 12]        # 국감은 9~12월에만 열린다


def fetch(url, tries=5):
    """국회 쪽 서버는 연결을 중간에 끊는 일이 잦다 — 몇 번 다시 걸어본다."""
    last = None
    for i in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60) as r:
                return r.read().decode("utf-8-sig", errors="ignore")
        except Exception as e:
            last = e
            time.sleep(2 * (i + 1))
    raise last


def jfetch(url):
    return json.loads(fetch(url))


# '소병훈 위원(더불어민주당)  질의 / 정은경 장관(보건복지부)  답변' 꼴을 쪼갠다.
# 직함을 미리 적어 두면 '기획조정실장'·'제2차관'·'위원장대리'·'병원장' 같은 것이 줄줄이 빠진다
# (처음 돌렸을 때 12건이 그렇게 샜다). 이름 뒤 괄호 앞까지를 직함으로 통째로 받는다.
PART = re.compile(r"^\s*([가-힣]{2,4})\s+([가-힣A-Za-z0-9][가-힣A-Za-z0-9·\s]{0,14}?)\s*"
                  r"\(([^)]*)\)\s*(.*)$")


def is_member(role):
    """'위원'·'위원장'·'위원장대리' 를 모두 위원으로 본다"""
    return (role or "").startswith("위원")


def parse_title(t):
    t = re.sub(r"\s+", " ", t or "").strip()
    out = []
    for chunk in t.split("/"):
        m = PART.match(chunk)
        if not m:
            continue
        out.append({"name": m.group(1), "role": m.group(2), "org": m.group(3).strip(),
                    "act": m.group(4).strip().strip(",") or ""})
    return out


def secs(t):
    p = [int(x) for x in (t or "0:0:0").split(":")]
    while len(p) < 3:
        p.insert(0, 0)
    return p[0] * 3600 + p[1] * 60 + p[2]


def captions(no, mc, c1, c2, c3):
    """세션 하나의 자막 줄. 없으면 빈 목록."""
    try:
        return jfetch(SMI % (no, mc, c1, c2, c3)).get("smiList") or []
    except Exception:
        return []


def attach_text(sess_start, sub, lines):
    """자막은 세션 영상 시작부터의 초로 찍혀 있고, 구간은 벽시계 시각을 갖는다.
    구간 시작을 세션 시작 기준 초로 바꿔 그 사이의 자막 줄을 모은다."""
    if not lines:
        return {}
    base = secs(sess_start)
    bounds = []
    for i, x in enumerate(sub):
        a = secs(x.get("realTime")) - base
        b = (secs(sub[i + 1].get("realTime")) - base) if i + 1 < len(sub) else 10 ** 9
        bounds.append((x.get("no"), a, b))
    out = {}
    for ln in lines:
        t = ln.get("start")
        if t is None:
            continue
        for no, a, b in bounds:
            if a <= t < b:
                out.setdefault(no, []).append((ln.get("cc") or "").strip())
                break
    return {k: re.sub(r"\s+", " ", " ".join(v)).strip() for k, v in out.items() if v}


def main():
    year = int(os.environ.get("GUKGAM_VOD_YEAR") or datetime.date.today().year)
    meetings = []
    for mon in MONTHS:
        try:
            cal = jfetch(CAL % ("%d%02d" % (year, mon)))
        except Exception as e:
            print("달력 %d-%02d 실패: %s" % (year, mon, e))
            continue
        for day in cal.get("xdays", []):
            for x in day.get("xlist", []):
                if x.get("xname") != COMMITTEE:
                    continue
                if "국정감사" not in (x.get("xsubj") or ""):
                    continue
                meetings.append({"date": day["xdate"], "xcode": x["xcode"], "xcgcd": x["xcgcd"],
                                 "subject": (x.get("xconf") or x.get("xsubj") or "").strip()})
        time.sleep(0.4)
    if not meetings:
        print("%d년 %s 국정감사 회의를 찾지 못했습니다 — 아직 안 열렸거나 달력 양식이 바뀜" % (year, COMMITTEE))
        return 0
    meetings.sort(key=lambda m: m["date"])

    days, skipped = [], []
    for mt in meetings:
        d = "%s-%s-%s" % (mt["date"][:4], mt["date"][4:6], mt["date"][6:])
        try:
            pl = jfetch(PLAY % (mt["xcode"], mt["xcgcd"]))
        except Exception as e:
            skipped.append((d, "중계정보 실패: %s" % str(e)[:50])); continue
        q = pl.get("qlink") or ""
        m = re.search(r"mc=(\d+).*?ct1=(\w+).*?ct2=(\w+).*?ct3=(\w+).*?no=(\d+)", q)
        if not m:
            skipped.append((d, "영상회의록 주소 없음(VOD 미등록)")); continue
        mc, c1, c2, c3, no = m.groups()
        try:
            info = jfetch(INFO % (mc, c1, c2, c3, no))
        except Exception as e:
            skipped.append((d, "목차 실패: %s" % str(e)[:50])); continue

        has_cc = str(info.get("sami") or "0").strip() not in ("", "0", "false", "False")
        segs, sessions, text = [], [], {}
        for g in info.get("movieList", []):
            sub = g.get("subList") or []
            if sub:
                sessions.append({"start": g.get("realTime"), "end": sub[-1].get("realTime"),
                                 "count": len(sub)})
            if has_cc and sub:
                # 자막은 세션마다 따로 있다 — 회의 전체 번호로 부르면 첫 세션 것만 온다
                text.update(attach_text(g.get("realTime"), sub, captions(g.get("no"), mc, c1, c2, c3)))
                time.sleep(0.3)
            for s in sub:
                who = parse_title(s.get("movieTitle"))
                segs.append({
                    "time": s.get("realTime"), "len": s.get("playTime"),
                    "secs": secs(s.get("playTime")), "no": s.get("no"),
                    "type": s.get("speakType") or "",
                    "speaker": who[0] if who else None,
                    "others": who[1:],
                    "title": re.sub(r"\s+", " ", s.get("movieTitle") or "").strip(),
                    "url": VOD % (mc, c1, c2, c3, s.get("no")),
                })
        for sg in segs:
            if sg["no"] in text:
                sg["text"] = text[sg["no"]]
        if not segs:
            skipped.append((d, "구간이 비어 있음")); continue
        days.append({
            "date": d, "subject": mt["subject"],
            "open": info.get("confOpenTime") or (sessions[0]["start"] if sessions else ""),
            "close": (pl.get("xdesc") or "").strip(),
            # sami 는 문자열 '0'/'1' 로 온다. bool('0') 은 참이라 그대로 쓰면 자막이 없는 회의를
            # '자막 있음' 으로 적게 된다 — 실제로 한 번 그렇게 틀렸다.
            "captions": has_cc,
            "caption_segments": sum(1 for sg in segs if sg.get("text")),
            "vod": VOD % (mc, c1, c2, c3, no),
            "sessions": sessions, "segments": segs,
        })
        print("  %s  구간 %3d개 · 세션 %d개 · %s" % (d, len(segs), len(sessions), mt["subject"][:40]))
        time.sleep(0.5)

    if not days:
        print("가져온 회의가 없습니다 — 기존 파일을 그대로 둡니다")
        return 0

    # 위원별 집계 — 질의 구간만 센다
    agg = {}
    for dy in days:
        for s in dy["segments"]:
            sp = s.get("speaker")
            if not sp or not is_member(sp["role"]) or s["type"] != "질의":
                continue
            a = agg.setdefault(sp["name"], {"name": sp["name"], "org": sp["org"],
                                            "n": 0, "secs": 0, "days": [], "answered_by": {}})
            a["n"] += 1; a["secs"] += s["secs"]
            if dy["date"] not in a["days"]:
                a["days"].append(dy["date"])
            for o in s["others"]:
                if is_member(o["role"]):
                    continue
                a["answered_by"][o["org"]] = a["answered_by"].get(o["org"], 0) + 1
    members = sorted(agg.values(), key=lambda x: -x["secs"])

    out = {
        "updated": datetime.date.today().isoformat(),
        "year": year, "committee": COMMITTEE,
        "source": "국회 인터넷의사중계시스템 달력 + 영상회의록시스템 발언자 목차",
        "source_url": "https://w3.assembly.go.kr/",
        "note": "국회가 회의에 직접 붙여 둔 발언자 목차입니다. 발언 순서·시각·길이·발언자·답변자가 "
                "들어 있고, <b>발언 내용(속기)은 들어 있지 않습니다</b> — 목차에 없고 이 영상들에는 "
                "자막도 없습니다. 회의록 원문은 보통 감사일로부터 2~6주 뒤에 공개되며, 공개되면 "
                "그쪽이 정본입니다. 이 파일은 그때까지의 공백을 메우는 '질의의 뼈대'입니다.",
        "days": len(days), "segments": sum(len(d["segments"]) for d in days),
        "caption_days": sum(1 for d in days if d["captions"]),
        "caption_segments": sum(d.get("caption_segments", 0) for d in days),
        "caption_note": "일부 감사일에는 국회가 붙인 AI 자막이 있어 구간마다 발언(text)을 함께 담았습니다. "
                        "자막 줄은 세션 영상 시작부터의 초로 찍혀 있고, 구간은 벽시계 시각을 가지므로 "
                        "구간 시작을 세션 기준 초로 바꿔 그 사이의 줄을 모았습니다. "
                        "맞춰진 결과는 2026년 10월 13일 자료로 검산했습니다 — 자막이 '존경하는 ○○○ 위원님' "
                        "하고 호명한 46개 구간 가운데 43개(93%)가 목차의 발언자와 같았고, 어긋난 3개는 모두 "
                        "자막 쪽 오류였습니다(권칠승을 '권칠성'으로, 김기웅을 '김교흥'으로 받아쓴 것과, "
                        "앞 구간 꼬리에 남은 호명을 집은 것). "
                        "<b>자막은 AI 받아쓰기라 이름·숫자·고유명사가 틀릴 수 있습니다.</b> 내용을 가늠하는 "
                        "데 쓰고, 인용은 회의록 원문이 공개된 뒤에 하십시오. 발언자·시각·길이는 자막이 아니라 "
                        "국회가 붙인 목차에서 온 값이라 이 오류와 무관합니다.",
        "questions": sum(m["n"] for m in members),
        "question_secs": sum(m["secs"] for m in members),
        "members": members, "items": days,
    }
    if skipped:
        out["skipped"] = [{"date": a, "why": b} for a, b in skipped]
    path = os.path.join(DATA, "vod-%d.json" % year)
    with io.open(path, "w", encoding="utf-8") as f:
        json.dump(clean_deep(out), f, ensure_ascii=False, indent=1)

    print("완료: %d년 %s 감사일 %d일 · 발언 구간 %d개 · 위원 질의 %d건 %d분 → %s"
          % (year, COMMITTEE, len(days), out["segments"], out["questions"],
             round(out["question_secs"] / 60), os.path.basename(path)))
    print("  자막(AI) 있는 감사일 %d일 · 발언이 붙은 구간 %d개"
          % (out["caption_days"], out["caption_segments"]))
    if skipped:
        print("  건너뜀: %s" % ", ".join("%s(%s)" % s for s in skipped))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
