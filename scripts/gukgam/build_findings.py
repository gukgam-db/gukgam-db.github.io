#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
국정감사 자료 DB — 결과보고서 지적사항 추출기 (Phase 3)
- 보건복지위원회 국정감사 결과보고서 PDF에서 '시정 및 처리요구사항' 섹션을 파싱해
  기관·부서별 지적/요구 항목을 구조화합니다. (2024년 보고서 기준 1,500여 건)
- 답변 대비 워크북(gukgam-prep.html)의 '작년 지적사항 전수 목록' 데이터가 됩니다.

실행: python3 scripts/gukgam/build_findings.py            # 기본: 최신 연도
      GUKGAM_YEAR=2023 python3 scripts/gukgam/build_findings.py
      # Open API에 아직 없는 보고서는 PDF 주소를 직접 지정:
      GUKGAM_YEAR=2025 GUKGAM_PDF_URL="https://..." python3 scripts/gukgam/build_findings.py
의존성: pypdf (pip install pypdf) — 연 1회 수동/디스패치 실행 용도
출력: data/gukgam/findings-{연도}.json
"""
import os, re, io, json, datetime
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA = os.path.join(ROOT, "data", "gukgam")
COMMITTEE = os.environ.get("GUKGAM_COMMITTEE", "보건복지위원회")


def find_report():
    with open(os.path.join(DATA, "reports.json"), encoding="utf-8") as f:
        rows = json.load(f)["items"]
    cand = [r for r in rows if r["committee"] == COMMITTEE and r["doc_type"] == "result_report" and r.get("pdf")]
    want = os.environ.get("GUKGAM_YEAR")
    if want:
        cand = [r for r in cand if str(r["year"]) == want]
    cand.sort(key=lambda r: -(r["year"] or 0))
    if not cand:
        raise SystemExit(f"{COMMITTEE} 결과보고서를 reports.json에서 찾지 못함")
    return cand[0]


def pdf_text(url):
    from pypdf import PdfReader
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (gukgam-db collector)"})
    with urllib.request.urlopen(req, timeout=120) as r:
        buf = io.BytesIO(r.read())
    reader = PdfReader(buf)
    return "\n".join((p.extract_text() or "") for p in reader.pages)


# 지적사항 분류는 두 축이다.
#  ① 주제(무엇에 대한 지적인가): 검역, 결핵, 연금 …            → key / key_conf
#  ② 성격(무엇을 하라는 지적인가): 예산·재정, 관리·감독 …      → key2 / key2_conf
# 예: "노숙인 결핵시설 예산 삭감 재검토" = 주제 '결핵' × 성격 '예산·재정'.
# 한 축만 쓰면 빈도 싸움에서 진 쪽 정보가 사라진다(위 예가 '결핵' 하나로만 잡혀
# 예산 문제라는 사실이 안 보이던 문제). 키워드는 앞쪽일수록 우선.
SUBJECT_KEYS = [
    ("검역", ["검역", "선박위생", "국립검역소", "공항만", "항공기 내 위생", "관능검사"]),
    ("백신·예방접종", ["백신", "예방접종", "접종률", "이상반응", "NIP", "항체 접종"]),
    ("결핵", ["결핵", "국립마산병원", "국립목포병원"]),
    ("성매개감염병", ["HIV", "에이즈", "후천성면역결핍", "매독", "성매개", "성병", "클라미디아"]),
    ("의료관련감염·항생제내성", ["의료관련감염", "감염관리", "항생제 내성", "항생제내성",
                        "다제내성", "카바페넴", "CRE", "내성균"]),
    ("호흡기감염병", ["RSV", "호흡기세포융합", "호흡기감염", "호흡기 감염", "인플루엔자", "독감",
                 "코로나", "백일해", "홍역", "수두", "폐렴", "마이코플라스마", "성홍열"]),
    ("감염병·방역", ["감염병", "방역", "역학조사", "엠폭스", "집단감염", "노로", "A형간염",
                 "말라리아", "뎅기", "쯔쯔가무시", "치쿤구니야", "수인성", "매개체", "인수공통"]),
    ("의료인력", ["의대 정원", "의대정원", "전공의", "의사 인력", "간호사", "간호인력", "의료인력"]),
    ("필수·지역의료", ["필수의료", "지역의료", "응급", "분만", "소아", "취약지", "공공병원", "지방의료원"]),
    ("건강보험", ["건강보험", "건보", "수가", "급여화", "비급여", "보장성", "요양급여"]),
    ("연금", ["국민연금", "연금개혁", "기초연금", "퇴직연금"]),
    ("장애인", ["장애인", "장애아", "탈시설", "활동지원"]),
    ("아동·보육", ["아동", "보육", "어린이집", "입양", "자립준비", "돌봄교실"]),
    ("노인·요양", ["노인", "장기요양", "요양기관", "요양병원", "치매", "경로당"]),
    ("정신건강·자살", ["정신건강", "자살", "정신질환", "중독"]),
    ("저출산·모자보건", ["저출산", "출산", "난임", "산모", "산후조리", "임신"]),
    ("빈곤·기초생활", ["기초생활", "수급자", "빈곤", "복지사각", "사각지대", "긴급복지", "부양의무자",
                    "기준중위소득", "중위소득", "자활", "노숙인", "의료급여", "고독사", "생계급여"]),
    ("지역·돌봄체계", ["지역사회", "지자체", "복지관", "사회서비스", "돌봄", "협의회", "재가"]),
    ("국제협력·ODA", ["ODA", "국제협력", "해외사무소", "국제기구", "재외"]),
    ("의약품·마약류", ["의약품", "마약", "제약", "약가", "품절약", "임상시험"]),
    ("식품·의료기기", ["식품", "식중독", "의료기기", "화장품", "위생"]),
]

NATURE_KEYS = [
    ("조직·인력", ["정원", "인력", "결원", "충원", "조직", "직급", "채용", "고용", "위원 위촉",
                "위원회 구성", "전문성", "겸직", "산하기관", "기관장"]),
    ("처우·노무", ["처우", "임금", "수당", "근로", "괴롭힘", "갑질", "성비위", "복무", "노동"]),
    ("예산·재정", ["예산", "불용", "집행률", "국고", "재정", "기금", "출연금", "결산"]),
    ("정보시스템·데이터", ["시스템", "전산", "데이터", "정보화", "개인정보", "보안"]),
    ("연구·R&D", ["연구", "R&D", "임상연구", "학술"]),
    ("통계·실태조사", ["실태조사", "통계", "현황 파악", "전수조사"]),
    ("관리·감독", ["점검", "관리·감독", "감독", "부정수급", "위반", "제재", "환수"]),
    ("법령·제도개선", ["법률", "법령", "시행령", "제도개선", "입법", "지침", "제도적", "제도화",
                   "매뉴얼", "가이드라인", "기준 마련", "체계 마련"]),
    ("홍보·교육", ["홍보", "교육", "안내", "캠페인", "인식개선"]),
    ("사업운영·성과", ["사업", "운영", "성과", "실효성", "지원 확대", "협업", "대책"]),
]

# 1축(key)은 종전과 똑같이 주제+성격 통합 목록에서 최빈 분류를 고른다
# (기존 화면·집계·번호 체계와 호환). 2축(key2)은 성격 목록만 따로 본다.
FIND_KEYS = SUBJECT_KEYS + NATURE_KEYS

# 소관이 분명한 분류는 키워드 빈도와 무관하게 먼저 확정한다.
# 예: 검역은 국립검역소 소관이라 본문에 '감염병'이 여러 번 나와도 검역으로 잡아야
# 실무 배분이 맞고, '항공기 내 위생'처럼 '위생' 한 단어 때문에 식품·의료기기로
# 새는 것도 막힌다.
# 감염병 계열은 병원체·질환명이 나오면 그것이 곧 소관이므로, '예산·재정'이나
# '관리·감독' 같은 성격 분류가 단어 수로 이기지 않도록 여기서 먼저 확정한다.
# (예: "산후조리원 신생아 RSV 집단감염"이 '산후조리' 2회 때문에 저출산·모자보건으로
#  가던 문제, "노숙인 결핵시설 예산 삭감"이 예산·재정으로만 잡히던 문제)
# 순서가 곧 우선순위다. 접종 도입 요구는 백신, 질환 관리·감시 요구는 질환 분류로 간다.
PRIORITY_KEYS = [
    ("검역", ["검역", "선박위생", "국립검역소", "공항만", "항공기 내 위생", "관능검사"]),
    # 신종·고위험 감염병은 백신이 소재로 언급돼도 주제는 감염병 대비다.
    # ("조류인플루엔자 백신 … 제1급 니파바이러스 대비를 철저히 할 것")
    ("감염병·방역", ["니파", "신종감염병", "신종 감염병", "제1급", "1급 감염병",
                 "고위험병원체", "인수공통"]),
    ("백신·예방접종", ["백신", "예방접종", "접종률", "이상반응", "NIP", "항체 접종"]),
    ("결핵", ["결핵", "국립마산병원", "국립목포병원"]),
    ("성매개감염병", ["HIV", "에이즈", "후천성면역결핍", "매독", "성매개", "성병", "클라미디아"]),
    ("의료관련감염·항생제내성", ["의료관련감염", "감염관리", "항생제 내성", "항생제내성",
                        "다제내성", "카바페넴", "CRE", "내성균"]),
    ("호흡기감염병", ["RSV", "호흡기세포융합", "호흡기감염", "호흡기 감염", "인플루엔자", "독감",
                 "코로나", "백일해", "홍역", "수두", "폐렴", "마이코플라스마", "성홍열"]),
    ("감염병·방역", ["감염병", "방역", "역학조사", "엠폭스", "집단감염", "노로", "A형간염",
                 "말라리아", "뎅기", "쯔쯔가무시", "치쿤구니야", "수인성", "매개체", "인수공통"]),
]

# 요구 강도 (답변 부담이 다르므로 별도 표시)
ACT_RULES = [
    ("마련·수립", ["마련할 것", "수립할 것", "마련하고", "수립하고"]),
    ("개선", ["개선할 것", "개선방안", "개선 방안", "정비할 것", "보완할 것"]),
    ("검토", ["검토할 것", "검토하고", "재검토"]),
    ("확대·강화", ["확대할 것", "강화할 것", "제고할 것", "확충"]),
    ("점검·관리", ["점검할 것", "관리할 것", "감독할 것", "확인할 것", "조치할 것"]),
    ("노력", ["노력할 것"]),
]


# 지적사항을 부를 이름 — 부서 배분·자료요구 회신에서 "몇 번 건"으로 지목하려면
# 안정적인 번호가 있어야 한다. 결과보고서는 확정 문서라 본문 등장 순서가 바뀌지
# 않으므로, 연도·기관별 등장 순번을 번호로 쓴다.
AGENCY_SHORT = {
    "보건복지부": "복지부", "질병관리청": "질병청", "식품의약품안전처": "식약처",
    "국민건강보험공단": "건보공단", "건강보험심사평가원": "심평원",
    "국민연금공단": "연금공단", "한국보건산업진흥원": "보산진",
    "한국사회보장정보원": "사보정원", "한국보건복지인재원": "인재원",
    "한국노인인력개발원": "노인인력원", "한국장애인개발원": "장애인개발원",
    "아동권리보장원": "아동권리원", "대한적십자사": "적십자",
    "대한결핵협회": "결핵협회", "국립암센터": "암센터",
}


def short_agency(name):
    n = (name or "").strip()
    if n in AGENCY_SHORT:
        return AGENCY_SHORT[n]
    for suf in ("주식회사", "재단법인", "사단법인"):
        n = n.replace(suf, "")
    return n[:6] or "기타"


def assign_ids(items, year):
    """연도·기관별 등장 순번으로 번호를 매긴다. 예: 2025-질병청-014"""
    seq = {}
    for it in items:
        a = short_agency(it.get("agency"))
        seq[a] = seq.get(a, 0) + 1
        it["no"] = seq[a]
        it["id"] = "%s-%s-%03d" % (year, a, seq[a])
    return items


def rank_keys(text, keys):
    """키워드 빈도 순위 → (최빈 분류, 신뢰도 high|low) 또는 (None, None)"""
    ranked = sorted(((sum(text.count(k) for k in kws), label) for label, kws in keys),
                    key=lambda x: -x[0])
    if not ranked or ranked[0][0] == 0:
        return None, None
    top = ranked[0][0]
    second = ranked[1][0] if len(ranked) > 1 else 0
    # 근거가 2회 이상이고 2위와 벌어져야 '확실'로 본다
    return ranked[0][1], ("high" if (top >= 2 and top > second) else "low")


def classify(text):
    """지적사항 → (주제 key, 요구 강도 act, 주제 신뢰도, 성격 key2, 성격 신뢰도)"""
    # 분류와 함께 '얼마나 믿을 만한가'를 같이 낸다.
    # 근거가 한 단어뿐인 분류가 전체의 절반이라, 이를 확실한 분류와 똑같이
    # 선명하게 보여주면 오분류 하나가 사이트 전체의 신뢰를 깎는다.
    best, conf = None, None
    for label, kws in PRIORITY_KEYS:
        if any(k in text for k in kws):
            best, conf = label, "high"      # 소관이 분명한 우선규칙
            break
    if best is None:
        best, conf = rank_keys(text, FIND_KEYS)
    # 2축(성격): 성격 목록만 따로 센다. 1축이 이미 같은 성격 분류로 잡혔으면
    # 같은 말을 두 번 붙이는 셈이라 비워 둔다.
    best2, conf2 = rank_keys(text, NATURE_KEYS)
    if best2 == best:
        best2, conf2 = None, None
    act = None
    for label, kws in ACT_RULES:
        if any(k in text for k in kws):
            act = label
            break
    return best, act, conf, best2, conf2


def parse(text):
    # 목차가 아닌 본문 섹션(마지막 출현) 기준
    starts = [m.start() for m in re.finditer(r"시정 및 처리요구사항", text)]
    if not starts:
        raise SystemExit("'시정 및 처리요구사항' 섹션을 찾지 못함")
    sec = text[starts[-1]:]
    sec = re.sub(r"-\s*\d+\s*-", " ", sec)  # 페이지 번호 제거

    items, group, agency, dept, topic = [], "", "", "", ""
    buf = None

    def flush():
        nonlocal buf
        if buf is not None:
            t = re.sub(r"\s+", " ", buf).strip()
            if len(t) > 8:
                key, act, conf, key2, conf2 = classify(t)
                items.append({"group": group, "agency": agency, "dept": dept, "topic": topic,
                              "key": key, "key_conf": conf, "key2": key2, "key2_conf": conf2,
                              "act": act, "text": t})
        buf = None

    for raw in sec.split("\n"):
        line = raw.strip()
        if not line:
            continue
        m = re.match(r"^[가-하]\.\s*(.{2,30}?)\s*소관", line)
        if m:
            flush(); group = m.group(1).strip(); agency = dept = topic = ""
            continue
        m = re.match(r"^\d+\)\s*(.{2,40})$", line)
        if m:
            flush(); agency = m.group(1).strip(); dept = topic = ""
            continue
        m = re.match(r"^\(\d+\)\s*(.{2,60})$", line)
        if m:
            flush(); dept = m.group(1).strip(); topic = ""
            continue
        m = re.match(r"^《\s*(.+?)\s*》", line)
        if m:
            flush(); topic = m.group(1).strip()
            continue
        if line.startswith("○"):
            flush(); buf = line.lstrip("○").strip()
            continue
        if buf is not None:  # 줄바꿈으로 잘린 항목 이어붙이기
            buf += " " + line
    flush()
    return items


def main():
    direct = os.environ.get("GUKGAM_PDF_URL", "").strip()
    if direct:
        rpt = {"year": int(os.environ.get("GUKGAM_YEAR", "0")) or None,
               "committee": COMMITTEE, "pdf": direct}
        if not rpt["year"]:
            raise SystemExit("GUKGAM_PDF_URL 사용 시 GUKGAM_YEAR 필수")
    else:
        rpt = find_report()
    print(f"대상: {rpt['year']}년 {rpt['committee']} 결과보고서")
    items = assign_ids(parse(pdf_text(rpt["pdf"])), rpt["year"])
    out = {
        "updated": datetime.date.today().isoformat(),
        "year": rpt["year"],
        "committee": rpt["committee"],
        "source_pdf": rpt["pdf"],
        "items": items,
    }
    path = os.path.join(DATA, f"findings-{rpt['year']}.json")
    with open(path, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
    agencies = sorted({i["agency"] for i in items if i["agency"]})
    print(f"완료: {len(items)}건 추출, 기관 {len(agencies)}곳 → {os.path.basename(path)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
