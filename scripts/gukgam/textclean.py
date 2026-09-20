#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
국정감사 자료 DB — 수집한 글자 다듬기

국회 Open API와 게시판이 내려주는 글자에는 HTML 엔티티가 그대로 섞여 있다.
'17&middot;21&middot;22대 국회의원' 같은 것이다. 화면에서는 값을 이스케이프해서
찍으므로 엔티티가 풀리지 않고 '&middot;' 라는 글자 그대로 보인다.
블로그 주소의 '&amp;' 도 같은 이유로 링크가 깨진다.

고치는 자리는 화면이 아니라 수집기다. 한 번 풀어서 저장하면 모든 화면이 함께 낫는다.
필드를 하나씩 손대면 새 필드가 생길 때마다 같은 일이 반복되므로, 저장 직전에
dict·list 를 통째로 훑어 모든 글자에 적용한다.

쓰는 법:
    from textclean import clean_deep
    json.dump(clean_deep(out), f, ensure_ascii=False, indent=1)
"""
import html
import re

# 줄바꿈 없는 빈칸(U+00A0)·너비 없는 글자는 눈에 안 보이면서 검색과 줄바꿈을 망친다
INVISIBLE = {
    " ": " ",   # NBSP
    "​": "",    # ZERO WIDTH SPACE
    "‌": "",    # ZERO WIDTH NON-JOINER
    "‍": "",    # ZERO WIDTH JOINER
    "﻿": "",    # BOM
}
_ENTITY = re.compile(r"&(?:[a-zA-Z][a-zA-Z0-9]{1,10}|#\d{2,6}|#[xX][0-9a-fA-F]{2,6});")


def clean_text(s):
    """HTML 엔티티를 풀고 보이지 않는 글자를 치운다. 엔티티가 없으면 건드리지 않는다."""
    if not isinstance(s, str) or not s:
        return s
    if _ENTITY.search(s):
        # 두 번 감싸인 경우('&amp;middot;')까지 푼다. 더 풀 것이 없으면 멈춘다.
        for _ in range(3):
            t = html.unescape(s)
            if t == s:
                break
            s = t
    for bad, good in INVISIBLE.items():
        if bad in s:
            s = s.replace(bad, good)
    return s


def clean_deep(obj):
    """dict·list 안의 모든 글자에 clean_text 를 적용한다(열쇠 이름도 포함)."""
    if isinstance(obj, str):
        return clean_text(obj)
    if isinstance(obj, dict):
        return {clean_text(k): clean_deep(v) for k, v in obj.items()}
    if isinstance(obj, (list, tuple)):
        return [clean_deep(v) for v in obj]
    return obj


if __name__ == "__main__":
    # 자가 점검 — 실제 자료에서 나온 것들
    cases = [
        ("17&middot;21&middot;22대 국회의원(인천 서구갑)", "17·21·22대 국회의원(인천 서구갑)"),
        ("경남 산청&middot;함양&middot;거창&middot;합천", "경남 산청·함양·거창·합천"),
        ("https://blog.naver.com/x?a=1&amp;b=2", "https://blog.naver.com/x?a=1&b=2"),
        ("&amp;middot;", "·"),                      # 두 번 감싸인 경우
        ("보건복지위원회", "보건복지위원회"),          # 멀쩡한 글자는 그대로
        ("가 나", "가 나"),                     # 보이지 않는 빈칸
    ]
    bad = 0
    for src, want in cases:
        got = clean_text(src)
        ok = got == want
        bad += 0 if ok else 1
        print("%s  %r → %r" % ("통과" if ok else "실패", src, got))
    print("깊이 적용:", clean_deep({"a": ["17&middot;21대", {"b": "x&amp;y"}]}))
    raise SystemExit(1 if bad else 0)
