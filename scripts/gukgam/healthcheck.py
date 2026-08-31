#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
국정감사 자료 DB — 데이터 자가 점검

지금까지 발견된 오류는 전부 사람 눈에 먼저 걸렸다: 감사일 한 해 누락,
전임 의원이 '주로 묻는 위원' 상위, 추세가 전부 '늘고 있음', 식약처 소스
통째 누락, 오분류. 이 스크립트는 그런 유형의 이상 징후를 빌드 때마다
자동으로 잡아 healthcheck.json 으로 남긴다.

원칙
- 점검은 '틀렸다'가 아니라 '사람이 봐야 한다'를 찾는다. 자동 수정은 하지 않는다.
- 빌드를 깨지 않는다(항상 exit 0). 경고는 워크플로 로그와 JSON에 남는다.
- 각 규칙은 실제로 났던 사고에서 왔다. 규칙 옆에 어떤 사고였는지 적는다.

실행: python3 scripts/gukgam/healthcheck.py
출력: data/gukgam/healthcheck.json (+ stdout 요약)
"""
import os, io, json, re, datetime, collections

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA = os.path.join(ROOT, "data", "gukgam")
OUT = os.path.join(DATA, "healthcheck.json")


def load(name):
    p = os.path.join(DATA, name)
    if not os.path.exists(p):
        return None
    with io.open(p, encoding="utf-8") as f:
        return json.load(f)


FINDINGS = []      # {"level": "warn"|"info", "code": str, "msg": str}


def flag(level, code, msg):
    FINDINGS.append({"level": level, "code": code, "msg": msg})


# ──────────────────────────────────────────────────────────────────
def check_audit_days(briefing):
    """사고: summaries의 when 파싱 실패로 질병청 2025년 감사일이 3일 → 1일로 보임.
    같은 기관에서 어떤 해만 감사일 수가 절반 이하로 꺼지면 수집 누락을 의심한다."""
    for ag, rec in (briefing.get("agencies") or {}).items():
        by_year = collections.Counter(d["date"][:4] for d in rec.get("audit_days") or [])
        if len(by_year) < 3:
            continue
        counts = sorted(by_year.values())
        typical = counts[len(counts) // 2]          # 중앙값
        for y, n in sorted(by_year.items()):
            if typical >= 2 and n * 2 < typical:
                flag("warn", "audit-days-drop",
                     "%s: %s년 감사일이 %d일뿐 (다른 해는 보통 %d일) — 회의록 피감기관 추출 누락 의심"
                     % (ag, y, n, typical))


def check_members_current(briefing, members):
    """사고: 회의록이 21대부터 쌓여 '주로 묻는 위원' 상위 5명이 전부 전임 의원.
    브리핑에 현 위원 아닌 이름이 남아 있으면 집계 필터가 풀린 것이다."""
    cur = {m["name"] for m in (members.get("items") or []) if m.get("name")}
    if not cur:
        flag("warn", "members-empty", "members.json 이 비어 있어 현 위원 검증 불가")
        return
    for ag, rec in (briefing.get("agencies") or {}).items():
        bad = [m["name"] for m in rec.get("members") or [] if m.get("name") not in cur]
        if bad:
            flag("warn", "member-not-current",
                 "%s: '주로 묻는 위원'에 현 위원이 아닌 이름 — %s" % (ag, ", ".join(bad)))


def check_trend_bias(briefing):
    """사고: 추세를 건수로 판정해 전체 질의량 증가에 휩쓸려 8개 중 6개가 '늘고 있음'.
    판정된 주제의 70% 이상이 한 방향이면 정규화가 깨진 것을 의심한다."""
    for ag, rec in (briefing.get("agencies") or {}).items():
        dirs = [t.get("dir") for t in rec.get("topics") or [] if t.get("dir")]
        if len(dirs) >= 4:
            for d, label in (("up", "늘고 있음"), ("down", "줄고 있음")):
                r = dirs.count(d) / len(dirs)
                if r >= 0.7:
                    flag("warn", "trend-one-sided",
                         "%s: 판정된 주제 %d개 중 %.0f%%가 '%s' — 총량 변화에 휩쓸렸는지 확인"
                         % (ag, len(dirs), 100 * r, label))


def check_yearly_volume(files_by_year, label):
    """사고: 식약처 Q&A가 가이드북에서 통째로 빠짐. 연도별 수집량이 전년의
    절반 이하로 꺼지면 소스 누락·파싱 실패를 의심한다."""
    # 과거 전환(예: 코로나 종식으로 질병청 질의가 2023년부터 실제로 감소)은 이미
    # 사람이 확인한 이력이다. 매 빌드마다 다시 짖으면 경고가 무뎌지므로,
    # 새로 수집되는 최신 연도 전환만 본다.
    years = sorted(files_by_year)
    if len(years) < 2:
        return
    a, b = years[-2], years[-1]
    na, nb = files_by_year[a], files_by_year[b]
    if na >= 50 and nb * 2 < na:
        flag("warn", "volume-drop",
             "%s: %s년 %d건 → %s년 %d건 (절반 이하) — 수집 누락 의심" % (label, a, na, b, nb))


def check_classification(findings_by_year):
    """사고: 오분류 다수(RSV·HIV·검역·조류인플루엔자). 자동 수정은 불가하지만
    구성 급변은 잡을 수 있다: 전년에 있던 분류가 올해 0건이면 규칙이 깨진 신호."""
    years = sorted(findings_by_year)
    if len(years) < 2:
        return
    prev_y, cur_y = years[-2], years[-1]
    prev_keys = collections.Counter(i.get("key") for i in findings_by_year[prev_y] if i.get("key"))
    cur_keys = {i.get("key") for i in findings_by_year[cur_y] if i.get("key")}
    for k, n in prev_keys.items():
        if n >= 8 and k not in cur_keys:
            flag("warn", "key-vanished",
                 "분류 '%s': %s년 %d건 → %s년 0건 — 분류 규칙 변경으로 사라졌는지 확인" % (k, prev_y, n, cur_y))
    # 신뢰도 구성은 참고 정보로 남긴다 (절반이 추정인 것은 알려진 한계)
    cur_items = findings_by_year[cur_y]
    conf = collections.Counter(i.get("key_conf") or "none" for i in cur_items)
    n = len(cur_items) or 1
    flag("info", "conf-mix",
         "%s년 분류 신뢰도: 확실 %d(%.0f%%) · 추정 %d(%.0f%%) · 미분류 %d(%.0f%%)"
         % (cur_y, conf["high"], 100 * conf["high"] / n,
            conf["low"], 100 * conf["low"] / n, conf["none"], 100 * conf["none"] / n))


def check_ids(findings_by_year):
    """사고 예방: 번호(2025-질병청-014)는 인용에 쓰이므로 중복·누락은 치명적."""
    for y, items in findings_by_year.items():
        ids = [i.get("id") for i in items]
        missing = sum(1 for x in ids if not x)
        dup = len([x for x in ids if x]) - len({x for x in ids if x})
        if missing:
            flag("warn", "id-missing", "%s년 지적사항 %d건에 번호 없음" % (y, missing))
        if dup:
            flag("warn", "id-duplicate", "%s년 지적사항 번호 중복 %d건" % (y, dup))


def check_freshness():
    """사고 예방: 워크플로 단계 하나가 조용히 실패하면 그 파일만 낡는다."""
    today = datetime.date.today()
    for name in ("briefing.json", "guides.json", "members.json", "schedule.json",
                 "highlights.json", "member-topics.json"):
        d = load(name)
        if not d:
            flag("warn", "file-missing", "%s 없음" % name)
            continue
        u = d.get("updated")
        if not u:
            continue
        try:
            age = (today - datetime.date.fromisoformat(u)).days
        except ValueError:
            continue
        if age > 21:
            flag("warn", "stale", "%s 갱신이 %d일 전(%s) — 워크플로 단계 실패 의심" % (name, age, u))


def main():
    findings_by_year = {}
    for f in os.listdir(DATA):
        m = re.match(r"findings-(\d{4})\.json$", f)
        if m:
            findings_by_year[int(m.group(1))] = (load(f) or {}).get("items", [])

    briefing = load("briefing.json") or {}
    members = load("members.json") or {}

    check_audit_days(briefing)
    check_members_current(briefing, members)
    check_trend_bias(briefing)
    check_classification(findings_by_year)
    check_ids(findings_by_year)
    check_freshness()
    check_yearly_volume({y: len(v) for y, v in findings_by_year.items()}, "지적사항")
    for src, fn in (("질병청 Q&A", "kdca-qa.json"), ("식약처 Q&A", "mfds-qa.json")):
        d = load(fn)
        if d:
            byy = collections.Counter(int(q["year"]) for q in d.get("items", []) if q.get("year"))
            check_yearly_volume(dict(byy), src)

    warns = [f for f in FINDINGS if f["level"] == "warn"]
    out = {
        "updated": datetime.date.today().isoformat(),
        "warn_n": len(warns),
        "info_n": len(FINDINGS) - len(warns),
        "note": "데이터 자가 점검 결과. 경고는 '틀렸다'가 아니라 '사람이 봐야 한다'는 뜻이다. "
                "각 규칙은 실제 발견됐던 오류 유형에서 왔다.",
        "findings": FINDINGS,
    }
    with io.open(OUT, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=1)

    print("자가 점검: 경고 %d건 / 참고 %d건" % (out["warn_n"], out["info_n"]))
    for x in FINDINGS:
        print("  [%s] %s" % ("경고" if x["level"] == "warn" else "참고", x["msg"]))
    return 0    # 점검이 빌드를 깨지는 않는다


if __name__ == "__main__":
    raise SystemExit(main())
