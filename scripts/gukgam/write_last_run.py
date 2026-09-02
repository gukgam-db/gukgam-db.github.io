#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""수집 워크플로가 '돌았다'는 사실을 남긴다.

화면의 '최근 갱신'은 자료가 실제로 바뀐 날짜(index.json updated)라, 매일
점검해도 새 자료가 없으면 날짜가 멈춘 것처럼 보인다("왜 8월 31일이야").
점검 시각을 따로 적어 두면 '자료 갱신'과 '마지막 점검'을 구분해 보여줄 수 있다.
"""
import os, io, json, sys, datetime

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
now = datetime.datetime.now(datetime.timezone.utc)
kst = now + datetime.timedelta(hours=9)
out = {
    "checked": now.strftime("%Y-%m-%dT%H:%M:%SZ"),
    "checked_kst": kst.strftime("%Y-%m-%d %H:%M"),
    "source": sys.argv[1] if len(sys.argv) > 1 else "manual",
}
with io.open(os.path.join(ROOT, "data", "gukgam", "last-run.json"), "w", encoding="utf-8") as f:
    json.dump(out, f, ensure_ascii=False, indent=1)
print("last-run:", out["checked_kst"], "KST", "(" + out["source"] + ")")
