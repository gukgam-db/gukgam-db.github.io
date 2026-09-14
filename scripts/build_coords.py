#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
단지 좌표 미리 계산 → data/complex-coords.js
- 카카오 로컬 REST API로 각 단지의 좌표를 구해 시드로 저장합니다.
- 도로명주소(road)가 있으면 주소검색, 없으면 '구/동 + 단지명' 키워드검색.
- 지도(jido-search)는 이 시드를 먼저 읽어 런타임 지오코딩을 생략합니다(느림·실패 방지).
실행: KAKAO_REST_KEY=<카카오 REST 키> python3 scripts/build_coords.py
  ※ REST 키는 카카오 개발자센터 > 내 애플리케이션 > 앱 키의 'REST API 키'(JS 키와 다름).
"""
import os, re, json, time, urllib.parse, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "data")
OUT = os.path.join(DATA, "complex-coords.js")

# 영업지역 경계(잘못된 좌표 필터)
LAT_MIN, LAT_MAX = 37.50, 37.75
LON_MIN, LON_MAX = 127.00, 127.30

KAKAO_ADDR = "https://dapi.kakao.com/v2/local/search/address.json"
KAKAO_KW   = "https://dapi.kakao.com/v2/local/search/keyword.json"


def load_js_array(path):
    s = open(path, encoding="utf-8").read()
    s = s[s.find("["):s.rfind("]") + 1]
    return json.loads(s)


def collect():
    """{단지명: {'road':..., 'dong':..., 'region':...}} — 세 데이터 파일 병합(이름 기준 중복 제거)."""
    items = {}
    specs = [("data/complexes.js", "guri"), ("data/guri-complexes.js", "guri"),
             ("data/byeollae-complexes.js", "by")]
    for fname, region in specs:
        p = os.path.join(ROOT, fname)
        if not os.path.exists(p):
            continue
        try:
            arr = load_js_array(p)
        except Exception as e:
            print(f"skip {fname}: {e}"); continue
        for c in arr:
            n = (c.get("name") or "").strip()
            if not n:
                continue
            road = (c.get("road") or "").strip()
            dong = (c.get("dong") or "").strip()
            cur = items.get(n)
            if cur is None:
                items[n] = {"road": road, "dong": dong, "region": region}
            else:
                if road and not cur["road"]:
                    cur["road"] = road
                if dong and not cur["dong"]:
                    cur["dong"] = dong
    return items


def http_json(url, key):
    req = urllib.request.Request(url, headers={
        "Authorization": "KakaoAK " + key,
        "User-Agent": "galmae-budongsan/1.0",
    })
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.loads(r.read().decode("utf-8"))


def pick(docs):
    for d in docs:
        try:
            la = float(d.get("y")); lo = float(d.get("x"))
        except (TypeError, ValueError):
            continue
        if LAT_MIN <= la <= LAT_MAX and LON_MIN <= lo <= LON_MAX:
            return round(la, 6), round(lo, 6)
    return None


def geocode(name, info, key):
    # 1) 도로명주소 검색
    if info["road"]:
        try:
            q = urllib.parse.urlencode({"query": info["road"]})
            d = http_json(f"{KAKAO_ADDR}?{q}", key)
            hit = pick(d.get("documents", []))
            if hit:
                return hit
        except Exception as e:
            print(f"  addr err {name}: {e}")
    # 2) 키워드(구/동 + 단지명)
    region_kw = "남양주시 별내" if info["region"] == "by" else "구리시 " + (info["dong"] or "")
    for q in (region_kw + " " + name, name + " 아파트"):
        try:
            u = urllib.parse.urlencode({"query": q, "size": "5"})
            d = http_json(f"{KAKAO_KW}?{u}", key)
            hit = pick(d.get("documents", []))
            if hit:
                return hit
        except Exception as e:
            print(f"  kw err {name}: {e}")
        time.sleep(0.2)
    return None


def _prev_count():
    try:
        s = open(OUT, encoding="utf-8").read()
        m = re.search(r"window\.COORDS\s*=\s*(\{.*\})\s*;", s, re.S)
        return len(json.loads(m.group(1))) if m else 0
    except Exception:
        return 0


def main():
    key = os.environ.get("KAKAO_REST_KEY")
    if not key:
        print("::warning::KAKAO_REST_KEY 없음 — 좌표 시드 생성을 건너뜁니다(기존 유지)."); return 0
    items = collect()
    print(f"대상 단지 {len(items)}개")
    out, miss = {}, []
    for i, (name, info) in enumerate(sorted(items.items()), 1):
        hit = geocode(name, info, key)
        if hit:
            out[name] = [hit[0], hit[1]]
        else:
            miss.append(name)
        if i % 20 == 0:
            print(f"  ...{i}/{len(items)} (성공 {len(out)})")
        time.sleep(0.12)  # 카카오 호출 간격
    prev = _prev_count()
    if len(out) < 30 and prev >= 100:
        print(f"::warning::좌표 수집 급감({len(out)}<이전 {prev}) — 이번 갱신 건너뜀."); return 0
    with open(OUT, "w", encoding="utf-8") as f:
        f.write("/* 단지 좌표 미리 계산본 (카카오 로컬 REST). 지도가 런타임 지오코딩 없이 즉시 핀을 찍습니다. */\n")
        f.write("window.COORDS = " + json.dumps(out, ensure_ascii=False, sort_keys=True) + ";\n")
    print(f"완료: 좌표 {len(out)}개 저장 → data/complex-coords.js")
    if miss:
        print(f"미확인 {len(miss)}개(런타임 지오코딩+localStorage로 보완): {', '.join(miss[:15])}"
              + (" ..." if len(miss) > 15 else ""))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
