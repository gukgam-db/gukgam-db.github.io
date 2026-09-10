#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
국토교통부 실거래가(구리시 41310, 아파트 매매)로 화면 데이터 재생성.
- data/complexes.js  : 갈매동 단지(카드/홍보/비교용, 평형별 상세 포함)
- data/guri-complexes.js : 구리 전체 단지(표/분석용)

실행:
  DATA_GO_KR_KEY=... python3 scripts/build_galmae_data.py        # 실데이터 수집
  LOCAL_RECORDS=data/deals.json python3 scripts/build_galmae_data.py   # 로컬 검증(수집 없이)

road/buildYear 등 수기로 정리한 메타는 기존 파일에서 최대한 보존한다.
"""
import os, re, json, datetime, sys
from collections import defaultdict, OrderedDict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LAWD = "41310"      # 구리시
NY_LAWD = "41360"   # 남양주시 (별내 추출용)
BASE = "https://apis.data.go.kr/1613000/RTMSDataSvcAptTrade/getRTMSDataSvcAptTrade"
GALMAE = "갈매동"

def _arr_from_js(path):
    if not os.path.exists(path): return []
    s = open(path, encoding="utf-8").read()
    m = re.search(r"=\s*(\[.*\]);", s, re.S)
    return json.loads(m.group(1)) if m else []

def load_meta():
    """기존 파일에서 단지명 -> {road, buildYear} 보존용 메타."""
    meta = {}
    for path in ("data/complexes.js", "data/guri-complexes.js"):
        for c in _arr_from_js(os.path.join(ROOT, path)):
            name = c.get("name")
            if not name: continue
            m = meta.setdefault(name, {})
            if c.get("road") and not m.get("road"): m["road"] = c["road"]
            if c.get("buildYear") and not m.get("buildYear"): m["buildYear"] = str(c["buildYear"])
    return meta

def _force_ipv4():
    """data.go.kr가 IPv6에서 응답을 안 줘서 타임아웃 나는 문제 회피(IPv4 우선)."""
    import socket
    if getattr(socket, "_ipv4_patched", False): return
    orig = socket.getaddrinfo
    def v4(host, *a, **k):
        res = orig(host, *a, **k)
        v = [r for r in res if r[0] == socket.AF_INET]
        return v or res
    socket.getaddrinfo = v4
    socket._ipv4_patched = True

def fetch_records(key, lawd=LAWD, sgg_name="구리시"):
    import urllib.request, urllib.parse, time
    import xml.etree.ElementTree as ET
    _force_ipv4()
    def fetch_xml(url):
        last = None
        for attempt in range(3):            # 최대 3회 재시도 (실패 시 빠르게 포기)
            try:
                req = urllib.request.Request(url, headers={"User-Agent": "galmae-budongsan/1.0"})
                with urllib.request.urlopen(req, timeout=20) as r:
                    return ET.fromstring(r.read().decode("utf-8"))
            except Exception as e:
                last = e
                if attempt < 2: time.sleep(2 * (attempt + 1))
        raise last
    def txt(item, *names):
        for n in names:
            e = item.find(n)
            if e is not None and e.text: return e.text.strip()
        return ""
    today = datetime.date.today()
    months, y, m = [], today.year, today.month
    for _ in range(12):
        months.append(f"{y}{m:02d}")
        m -= 1
        if m == 0: y, m = y-1, 12
    recs = []
    for ym in months:
        q = urllib.parse.urlencode({"serviceKey": key, "LAWD_CD": lawd, "DEAL_YMD": ym,
                                    "numOfRows": "1000", "pageNo": "1"}, safe="%")
        try:
            root = fetch_xml(f"{BASE}?{q}")
        except Exception as e:
            print(f"[{ym}] 수집 실패: {e}"); continue
        for it in root.iter("item"):
            if txt(it, "cdealType", "해제여부") == "O":  # 해제(취소)된 거래 제외
                continue
            amt = txt(it, "dealAmount", "거래금액").replace(",", "")
            if not amt.isdigit(): continue
            yy, mm, dd = txt(it,"dealYear","년"), txt(it,"dealMonth","월"), txt(it,"dealDay","일")
            if not (yy and mm and dd): continue
            # 전용면적은 소수1자리 보존 — 정수 반올림 시 84.6㎡가 85로 올라
            # 국민주택규모(85㎡ 이하) 세금 분기점을 흐리는 것을 방지
            try: area = round(float(txt(it, "excluUseAr", "전용면적")), 1)
            except: area = 0
            fl = txt(it, "floor", "층")
            road_nm = txt(it, "roadNm")
            bonbun = txt(it, "roadNmBonbun").lstrip("0")
            recs.append({
                "dong": txt(it, "umdNm", "법정동"),
                "name": txt(it, "aptNm", "아파트"),
                "price": int(amt), "area": area,
                "floor": int(fl) if fl.isdigit() else fl,
                "date": f"{yy}-{int(mm):02d}-{int(dd):02d}",
                "buildYear": txt(it, "buildYear", "건축년도"),
                "gtype": txt(it, "dealingGbn") or "중개거래",
                "road": (f"{sgg_name} {txt(it,'umdNm')} {road_nm} {bonbun}".strip()
                         if road_nm and bonbun else ""),
            })
    return recs

def agg_common(recs):
    """단지 하나에 대한 공통 지표."""
    by_area = defaultdict(list)
    for r in recs: by_area[r["area"]].append(r)
    mn = min(recs, key=lambda r: r["price"])
    mx = max(recs, key=lambda r: r["price"])
    latest = max(recs, key=lambda r: r["date"])
    return by_area, mn, mx, latest

def rich_card(dong, name, recs, meta, cutoff):
    """카드/상세용 풍부한 단지 데이터(평형별·최저최고·회복률·도로명 포함)."""
    by_area, mn, mx, latest = agg_common(recs)
    areas = sorted(by_area.keys())
    m = meta.get(name, {})
    by_year = (m.get("buildYear") or next((r["buildYear"] for r in recs if r.get("buildYear")), "") or "")
    road = m.get("road") or next((r["road"] for r in recs if r.get("road")), "")
    recent3m = sum(1 for r in recs if r["date"] >= cutoff)
    # 회복률·게이지는 '최근 거래된 평형' 기준으로 계산(서로 다른 평형을 섞은 오독 방지)
    lar = by_area[latest["area"]]
    lat_hi = max(lar, key=lambda r: r["price"])
    lat_lo = min(lar, key=lambda r: r["price"])
    byArea = []
    for a in areas:
        ar = by_area[a]
        amn = min(ar, key=lambda r: r["price"]); amx = max(ar, key=lambda r: r["price"])
        alat = max(ar, key=lambda r: r["date"])
        byArea.append(OrderedDict([("area", a), ("n", len(ar)),
            ("min", amn["price"]), ("max", amx["price"]),
            ("lp", alat["price"]), ("lf", alat["floor"]), ("ld", alat["date"]),
            ("hp", round(alat["price"] / amx["price"] * 100) if amx["price"] else 0)]))
    return OrderedDict([
        ("name", name), ("dong", dong), ("buildYear", by_year), ("areas", areas), ("road", road),
        ("count", len(recs)), ("recent3m", recent3m),
        ("min", mn["price"]), ("minDate", mn["date"]),
        ("max", mx["price"]), ("maxDate", mx["date"]),
        ("highPct", round(latest["price"] / lat_hi["price"] * 100) if lat_hi["price"] else 0),
        ("latHi", lat_hi["price"]), ("latLo", lat_lo["price"]), ("latHiDate", lat_hi["date"]),
        ("latest", OrderedDict([("area", latest["area"]), ("floor", latest["floor"]),
            ("price", latest["price"]), ("date", latest["date"]),
            ("gtype", latest.get("gtype", "중개거래"))])),
        ("byArea", byArea),
    ])

def build_rich(records, meta):
    """별내 등 특정 지역 전체를 카드/상세용 풍부한 데이터로."""
    cutoff = (datetime.date.today() - datetime.timedelta(days=92)).isoformat()
    groups = defaultdict(list)
    for r in records:
        if r["name"] and r["price"] > 0:
            groups[(r["dong"], r["name"])].append(r)
    out = [rich_card(dong, name, recs, meta, cutoff) for (dong, name), recs in groups.items()]
    out.sort(key=lambda d: -d["count"])
    return out

def build(records, meta):
    cutoff = (datetime.date.today() - datetime.timedelta(days=92)).isoformat()
    groups = defaultdict(list)
    for r in records:
        if r["name"] and r["price"] > 0:
            groups[(r["dong"], r["name"])].append(r)

    guri, galmae = [], []
    for (dong, name), recs in groups.items():
        by_area, mn, mx, latest = agg_common(recs)
        areas = sorted(by_area.keys())
        m = meta.get(name, {})
        by_year = (m.get("buildYear")
                   or next((r["buildYear"] for r in recs if r.get("buildYear")), "") or "")
        # 도로명주소 — 지도 핀을 이름검색이 아닌 '정확한 주소'로 찍기 위함
        road = m.get("road") or next((r["road"] for r in recs if r.get("road")), "")
        # 회복률·게이지 기준: 최근 거래된 평형의 최저~최고(평형 혼합 오독 방지)
        lar = by_area[latest["area"]]
        lat_hi = max(lar, key=lambda r: r["price"])
        lat_lo = min(lar, key=lambda r: r["price"])
        # 구리 전체(표/분석·지도용) — 핵심 필드 + 주소
        guri.append(OrderedDict([
            ("dong", dong), ("name", name), ("count", len(recs)),
            ("min", mn["price"]), ("max", mx["price"]),
            ("latHi", lat_hi["price"]), ("latLo", lat_lo["price"]), ("latHiDate", lat_hi["date"]),
            ("highPct", round(latest["price"] / lat_hi["price"] * 100) if lat_hi["price"] else 0),
            ("latest", OrderedDict([("price", latest["price"]), ("area", latest["area"]),
                                    ("floor", latest["floor"]), ("date", latest["date"])])),
            ("areas", areas), ("buildYear", by_year), ("road", road),
        ]))
        # 갈매동(카드/홍보/비교용) — 상세 필드
        if dong == GALMAE:
            galmae.append(rich_card(dong, name, recs, meta, cutoff))

    guri.sort(key=lambda d: -d["count"])
    galmae.sort(key=lambda d: -d["count"])
    return guri, galmae

def write_js(guri, galmae):
    with open(os.path.join(ROOT, "data/guri-complexes.js"), "w", encoding="utf-8") as f:
        f.write("/* 구리시 아파트 단지별 매매 실거래가 집계 (국토부 실거래가 공개시스템, 최근 1년) */\n")
        f.write("const GURI = " + json.dumps(guri, ensure_ascii=False) + ";\n")
    with open(os.path.join(ROOT, "data/complexes.js"), "w", encoding="utf-8") as f:
        f.write("/* 갈매동 아파트 단지 실거래가(국토부 실거래가 공개시스템, 최근1년 매매) — 평형별 상세 포함 */\n")
        f.write("const COMPLEXES = " + json.dumps(galmae, ensure_ascii=False) + ";\n")

def write_byeollae(byeollae):
    with open(os.path.join(ROOT, "data/byeollae-complexes.js"), "w", encoding="utf-8") as f:
        f.write("/* 남양주 별내 아파트 단지별 매매 실거래가 집계 (국토부 실거래가 공개시스템, 최근 1년) */\n")
        f.write("const BYEOLLAE = " + json.dumps(byeollae, ensure_ascii=False) + ";\n")

def main():
    meta = load_meta()
    local = os.environ.get("LOCAL_RECORDS")
    if local:
        records = json.load(open(os.path.join(ROOT, local), encoding="utf-8"))
        records = [r for r in records if r.get("type", "매매") == "매매"]
        print(f"[local] {len(records)}건으로 검증")
        ny_records = []
    else:
        key = os.environ.get("DATA_GO_KR_KEY")
        if not key:
            print("::warning::DATA_GO_KR_KEY 없음 — 건너뜀"); return 0
        try:
            records = fetch_records(key, LAWD, "구리시")
        except Exception as e:
            print(f"::warning::국토부 API 응답 지연으로 이번 실행은 건너뜁니다(기존 데이터 유지): {e}"); return 0
        print(f"[api] 구리 수집 {len(records)}건")
        if len(records) < 100:
            print("::warning::수집이 적어 이번 실행은 건너뜁니다(기존 데이터 유지·안전장치)."); return 0
        try:
            ny_records = fetch_records(key, NY_LAWD, "남양주시")
        except Exception as e:
            print(f"::warning::남양주 수집 지연 — 별내는 건너뜁니다: {e}"); ny_records = []
        print(f"[api] 남양주 수집 {len(ny_records)}건")

    guri, galmae = build(records, meta)
    if not local:
        gset = {d["dong"] for d in guri}
        if GALMAE not in gset or len(galmae) < 3:
            print("::warning::갈매동 데이터 부족 — 이번 실행 건너뜀(기존 데이터 유지·안전장치)."); return 0
    write_js(guri, galmae)
    print(f"완료: 구리 {len(guri)}단지 / 갈매동 {len(galmae)}단지")

    # 남양주 → 별내만 추출해서 별도 파일 (구리 스타일 목록)
    byeollae_recs = [r for r in ny_records if "별내" in r.get("dong", "")]
    if byeollae_recs:
        byeollae = build_rich(byeollae_recs, meta)
        write_byeollae(byeollae)
        print(f"완료: 별내 {len(byeollae)}단지")
    else:
        print("별내 거래 없음/미수집 — byeollae 파일 유지")
    return 0

if __name__ == "__main__":
    sys.exit(main())
