#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
소상공인시장진흥공단 상가(상권)정보 수집 → data/sangga-stores.js
- '반경(storeListInRadius)' 조회로 갈매·별내·구리 상권 클러스터를 중심점마다 훑어 병합.
- 브라우저는 이 파일만 읽어 반경 내 업종분포·유해업소·경쟁도를 계산합니다(라이브 호출 없음).
실행: DATA_GO_KR_KEY=<서비스키(인코딩형)> python3 scripts/build_sangga.py
"""
import os, json, socket, datetime, time, re
import urllib.request, urllib.parse

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# API 경로 후보 (계정 버전에 따라 sdsc2 또는 sdsc). 첫 성공 응답에 고정.
BASE_CANDIDATES = [
    "https://apis.data.go.kr/B553077/api/open/sdsc2/storeListInRadius",
    "https://apis.data.go.kr/B553077/api/open/sdsc/storeListInRadius",
]

# 상권 클러스터 중심점 (반경 1500m로 훑음) — 갈매·별내·구리·다산 커버
# ※ 갈매지구 실제 좌표는 경도 127.11~127.12대. (이전 127.14대 값은 별내/담터로 잘못 찍혀
#    갈매 핵심 상권이 통째로 누락됐었음 — 경춘북로 252 등)
CENTERS = [
    ("갈매남부", 37.6280, 127.1150),   # 푸르지오·6단지·와이시티·스타힐스
    ("갈매중부", 37.6340, 127.1185),   # 갈매역·아이파크·한라비발디·이룸넘버원
    ("갈매북부", 37.6410, 127.1235),   # 이스트힐·나인힐스 북측
    ("별내역",   37.6479, 127.1503),
    ("별내북",   37.6570, 127.1495),
    ("별내동편", 37.6540, 127.1600),
    ("다산",     37.6120, 127.1520),
    ("구리역",   37.6035, 127.1400),
    ("인창동",   37.6110, 127.1360),
]
RADIUS = 1500  # m

# 영업지역 경계(최종 안전 필터)
LAT_MIN, LAT_MAX = 37.585, 37.690
LON_MIN, LON_MAX = 127.090, 127.205

_base = {"url": None}  # 성공한 base 고정

def force_ipv4():
    if getattr(socket, "_v4", False): return
    orig = socket.getaddrinfo
    socket.getaddrinfo = lambda h,*a,**k: [r for r in orig(h,*a,**k) if r[0]==socket.AF_INET] or orig(h,*a,**k)
    socket._v4 = True

def http_json(url):
    req = urllib.request.Request(url, headers={"User-Agent": "galmae-budongsan/1.0"})
    with urllib.request.urlopen(req, timeout=45) as r:
        return json.loads(r.read().decode("utf-8"))

def api_get(params):
    """base 후보를 순회하며 첫 성공 응답을 사용. 성공 base는 고정."""
    q = urllib.parse.urlencode(params, safe="%")
    bases = [_base["url"]] if _base["url"] else BASE_CANDIDATES
    last = None
    for base in bases:
        url = f"{base}?{q}"
        for attempt in range(4):
            try:
                data = http_json(url)
                _base["url"] = base
                return data
            except Exception as e:
                last = e
                # 400 등 요청형식 오류는 재시도 무의미 → 다음 base로
                if "400" in str(e) or "404" in str(e): break
                if attempt < 3: time.sleep(2*(attempt+1))
    raise last

def extract(data):
    body = (data or {}).get("body") or (data or {}).get("response", {}).get("body") or {}
    items = body.get("items")
    if items is None: return [], body
    if isinstance(items, dict): items = items.get("item", [])
    if isinstance(items, dict): items = [items]
    return (items or []), body

def num(v):
    try: return float(v)
    except Exception: return None

def collect_center(key, name, cy, cx):
    got, page, total = [], 1, None
    while True:
        params = {"serviceKey": key, "radius": str(RADIUS), "cx": f"{cx}", "cy": f"{cy}",
                  "type": "json", "numOfRows": "1000", "pageNo": str(page)}
        try:
            data = api_get(params)
        except Exception as e:
            print(f"[{name}] {page}p 수집 실패: {e}"); break
        items, body = extract(data)
        if page == 1:
            total = body.get("totalCount")
            hdr = (data or {}).get("header") or (data or {}).get("response", {}).get("header") or {}
            print(f"[{name}] base={_base['url'].split('/open/')[-1]} totalCount={total} "
                  f"resultCode={hdr.get('resultCode')} {hdr.get('resultMsg','')}")
            if items:
                print(f"[{name}] sample keys: {sorted(list(items[0].keys()))[:18]}")
        if not items: break
        got.extend(items)
        try: tc = int(total)
        except Exception: tc = None
        if tc is not None and len(got) >= tc: break
        if len(items) < 1000: break
        page += 1
        if page > 50: break
    return got

def _prev_count(path):
    """기존 data 파일의 count를 읽어 직전 수집량을 파악(급감 방지용)."""
    try:
        s = open(path, encoding="utf-8").read()
        m = re.search(r'"count"\s*:\s*(\d+)', s)
        return int(m.group(1)) if m else 0
    except Exception:
        return 0

def main():
    force_ipv4()
    key = os.environ.get("DATA_GO_KR_KEY")
    if not key:
        print("::warning::DATA_GO_KR_KEY 없음 — 건너뜀"); return 0

    kept, seen = [], set()
    lcls_count = {}
    for name, cy, cx in CENTERS:
        rows = collect_center(key, name, cy, cx)
        added = 0
        for it in rows:
            la = num(it.get("lat")); lo = num(it.get("lon"))
            if la is None or lo is None: continue
            if not (LAT_MIN <= la <= LAT_MAX and LON_MIN <= lo <= LON_MAX): continue
            bid = it.get("bizesId")
            if bid and bid in seen: continue
            if bid: seen.add(bid)
            l = (it.get("indsLclsNm") or "").strip()
            m = (it.get("indsMclsNm") or "").strip()
            s = (it.get("indsSclsNm") or "").strip()
            kept.append({
                "n": (it.get("bizesNm") or "").strip(),
                "l": l, "m": m, "s": s,
                "la": round(la, 6), "lo": round(lo, 6),
                "r": (it.get("rdnmAdr") or it.get("lnoAdr") or "").strip(),
            })
            lcls_count[l] = lcls_count.get(l, 0) + 1
            added += 1
        print(f"[{name}] 신규 {added}건 (누적 {len(kept)})")

    path = os.path.join(ROOT, "data/sangga-stores.js")
    prev = _prev_count(path)
    # 안전장치: 절대 하한 + 직전 대비 급감(비율) 방지 → 부분 수집으로 기존 데이터를 덮어쓰지 않음
    if len(kept) < 50:
        print(f"::warning::상가 수집이 너무 적어({len(kept)}건) — 이번 갱신을 건너뜁니다(기존 데이터 유지)."); return 0
    if prev >= 200 and len(kept) < prev * 0.7:
        print(f"::warning::상가 수집이 직전({prev}건) 대비 급감({len(kept)}건, 70% 미만) — 이번 갱신을 건너뜁니다(기존 데이터 유지)."); return 0

    kept.sort(key=lambda r: (r["l"], r["m"], r["n"]))
    out = {
        "updated": datetime.date.today().isoformat(),
        "count": len(kept),
        "bbox": {"latMin": LAT_MIN, "latMax": LAT_MAX, "lonMin": LON_MIN, "lonMax": LON_MAX},
        "byLcls": dict(sorted(lcls_count.items(), key=lambda x: -x[1])),
        "stores": kept,
    }
    with open(path, "w", encoding="utf-8") as f:
        f.write("/* 소상공인시장진흥공단 상가(상권)정보 — 갈매·별내·구리 영업지역 (반경조회 병합) */\n")
        f.write("window.SANGGA = " + json.dumps(out, ensure_ascii=False) + ";\n")
    print(f"완료: 상가 {len(kept)}건 저장 → data/sangga-stores.js")
    print("대분류 분포:", out["byLcls"])
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
