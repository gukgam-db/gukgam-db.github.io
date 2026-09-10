# -*- coding: utf-8 -*-
"""만성질환 예방·관리 지식베이스 병합: scratchpad/ncd_*.json → data/ncd.json"""
import json, glob, re, sys, time
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
SRC = sys.argv[1] if len(sys.argv) > 1 else "/tmp/claude-0/-home-user-soonryu74-github-io/e16f7b4f-1860-59c2-9e17-e9d4583aa91f/scratchpad"
D = json.loads((ROOT / "data/dataset.json").read_text(encoding="utf-8"))
NAMES = {i["name"] for i in D["indicators"]}
ALIAS = {"고혈압 치료율": "고혈압 진단 경험자의 치료율", "당뇨병 치료율": "당뇨병 진단 경험자의 치료율", "고혈압 진단 경험률": "고혈압 진단 경험률(30세 이상)",
         "당뇨병 진단 경험률": "당뇨병 진단 경험률(30세 이상)", "저작불편호소율": "저작불편호소율(65세 이상)", "비만율": "비만율(자가보고)",
         "우울감 경험률": "연간 우울감 경험률", "미충족의료율": "연간 미충족의료율", "보건기관 이용률": "연간 보건기관 이용률", "음주운전 경험률": "연간 음주운전 경험률",
         "체중조절 시도율": "연간 체중조절 시도율", "비누, 손 세정제 사용률": "비누·손세정제 사용률", "심근경색 조기증상 인지율": "심근경색증 조기증상 인지율"}
AREAS = D["domains"] + ["공통"]
LEVEL_ORDER = {"global": 0, "regional": 1, "national": 2, "sido": 3}
SIDO_NORM = {"강원도": "강원특별자치도", "전라북도": "전북특별자치도", "서울": "서울특별시", "부산": "부산광역시", "대구": "대구광역시", "인천": "인천광역시",
             "광주": "광주광역시", "대전": "대전광역시", "울산": "울산광역시", "세종": "세종특별자치시", "경기": "경기도", "강원": "강원특별자치도", "충북": "충청북도",
             "충남": "충청남도", "전북": "전북특별자치도", "전남": "전라남도", "경북": "경상북도", "경남": "경상남도", "제주": "제주특별자치도"}
def fix_ind(n):
    n = (n or "").strip(); n = ALIAS.get(n, n)
    if n in NAMES: return n
    for k in NAMES:   # 느슨한 포함 매칭
        if n and (n in k or k in n) and len(n) >= 4: return k
    return None
docs, entries, notes, stats = [], [], [], {}
for f in sorted(glob.glob(f"{SRC}/ncd_*.json")):
    try: j = json.loads(open(f, encoding="utf-8").read())
    except Exception as e: notes.append(f"{Path(f).name}: JSON 파싱 실패 {e}"); continue
    lvl = j.get("level", "national"); src_id = j.get("id", Path(f).stem)
    for d in j.get("documents", []): docs.append({**d, "level": lvl, "src": src_id})
    n_ok = 0
    for e in j.get("entries", []):
        linked = sorted({x for x in (fix_ind(n) for n in e.get("linked_indicators", [])) if x})
        area = e.get("area") if e.get("area") in AREAS else "공통"
        sido = e.get("sido") or j.get("sido"); sido = SIDO_NORM.get(sido, sido) if sido else None
        entries.append({"id": f"{src_id}-{len(entries)}", "level": lvl, "sido": sido if lvl == "sido" else None, "area": area,
                        "goal": e.get("goal", ""), "target": e.get("target"), "strategies": e.get("strategies", [])[:6],
                        "interventions": e.get("interventions", [])[:8], "linked": linked, "source": e.get("source", ""), "url": e.get("url", "")})
        n_ok += 1
    stats[src_id] = n_ok
    notes += [f"{src_id}: {n}" for n in j.get("notes", [])]
entries.sort(key=lambda e: (LEVEL_ORDER.get(e["level"], 9), e["sido"] or "", AREAS.index(e["area"])))
out = {"generated": time.strftime("%Y-%m-%d"), "documents": docs, "entries": entries, "notes": notes, "stats": stats,
       "levels": {"global": "국제 · WHO 글로벌 NCD 액션플랜", "regional": "서태평양 · WHO WPRO 지역 액션플랜", "national": "국가 · HP2030 · 국가 만성질환 사업", "sido": "시도 · 지역보건의료계획"}}
(ROOT / "data/ncd.json").write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
by_lvl = {}
for e in entries: by_lvl[e["level"]] = by_lvl.get(e["level"], 0) + 1
print("entries:", len(entries), by_lvl, "| docs:", len(docs), "| 연결된 지표 수:", len({x for e in entries for x in e["linked"]}), "| stats:", stats)
