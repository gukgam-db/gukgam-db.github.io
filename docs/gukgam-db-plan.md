# 국정감사 자료 DB 구축 기획서

> 목표: 매년 국정감사에서 오가는 자료(요구자료·제출자료·서면답변·결과보고서·회의록 등)를 한곳에 모은
> 검색 가능한 DB를 만들고, **보건복지부·질병관리청·심평원 등 보건복지위원회 소관기관은 별도 트랙으로 구분**하여
> 깊이 있게 수집·조회할 수 있게 한다.

작성일: 2026-08-17 · 대상 리포: `soonryu74.github.io` (GitHub Pages 정적 사이트 + GitHub Actions 자동수집 패턴 재사용)

---

## 1. 배경과 목표

국정감사(매년 정기회 기간, 통상 10월)는 상임위원회별로 피감기관을 감사하며, 그 과정에서 다음 자료가 생산된다.

| 자료 유형 | 생산 주체 | 공개 여부 |
|---|---|---|
| ① 국정감사 계획서·피감기관 목록 | 각 상임위 | 공개 |
| ② 요구자료 목록(의원실 → 기관) | 의원실/위원회 | **원문은 대부분 비공개** (목록·건수 일부 공개, 기관 도서관에 소장되는 경우 있음) |
| ③ 제출자료·업무보고 자료 | 피감기관 | 기관별 사전정보공표로 상당수 공개 |
| ④ 서면질의 답변서 | 피감기관 | 기관별 공개 + 국회도서관 전자자료 |
| ⑤ 국정감사 회의록 | 국회사무처 | 공개 (Open API 존재) |
| ⑥ 국정감사 결과보고서 | 각 상임위 | 공개 (Open API 존재) |
| ⑦ 시정·처리요구 및 처리결과 보고 | 위원회/기관 | 공개 |

**핵심 현실 체크:** "국회의원들이 요구했던 자료"의 원문 전체(②)는 시스템으로 일괄 공개되지 않는다.
따라서 DB의 뼈대는 **공개 API가 있는 ⑤⑥ + 기관이 스스로 공개하는 ③④⑦**로 잡고,
②는 목록 수준 수집 + 정보공개청구(정보공개포털 open.go.kr)로 보완하는 전략을 쓴다.
(예: 국민건강보험공단 전문도서관에는 회기별 "국정감사 요구자료" 묶음이 소장되어 있음 → 기관 도서관/자료실이 우회 소스가 됨)

### 목표
1. 국정감사 관련 공개 자료의 **통합 메타데이터 DB** (연도·대수·위원회·기관·자료유형·원문링크)
2. **보건복지 트랙 별도 구분**: 보건복지부 + 소속기관(질병관리청 등) + 산하 공공기관(심평원·건보공단 등)을
   전용 필터·전용 페이지로 심층 수집
3. 정적 사이트에서 동작하는 **검색/필터 UI** (서버 불필요, 기존 리포 패턴 그대로)

---

## 2. 데이터 소스 정리

### 2.1 국회 공식 (전 위원회 공통 — DB의 뼈대)

| 소스 | 내용 | 접근 방법 |
|---|---|---|
| [열린국회정보 Open API](https://open.assembly.go.kr/portal/openapi/main.do) | 국정감사 결과보고서, 위원회 회의록, 의원 정보 등 | 무료 API 키 발급 (JSON/XML) |
| [공공데이터포털 – 국정감사결과보고서](https://www.data.go.kr/data/15126116/openapi.do) | 국회사무처 제공, 결과보고서 메타데이터 | LINK형 → 열린국회정보로 연결, XML |
| [공공데이터포털 – 국정감사 회의록](https://www.data.go.kr/data/15126142/openapi.do) | 국정감사 회의록 | 동일 |
| [국정감사·조사 정보시스템](https://likms.assembly.go.kr/inspections/main.do) | 연도별 일정·피감기관·계획서·결과보고서 원문 | 크롤링 (API 없음) |
| [국회회의록 시스템](https://likms.assembly.go.kr/record/) | 2025.3월부터 XML 기반 회의록 | 크롤링/다운로드 |
| [국회도서관(NANET)](https://dl.nanet.go.kr/) | "국정감사 서면질의 답변서" 전자자료 등 | 검색·수동 수집 |

### 2.2 보건복지 트랙 전용 (기관별 사전정보공표·자료실)

| 기관 | 구분 | 주요 공개물 |
|---|---|---|
| [보건복지부](https://www.mohw.go.kr) | 부처 | 국정감사 업무보고 자료(사전정보공표), 서면답변, 시정처리결과 |
| [질병관리청](https://www.kdca.go.kr) | 복지부 소속 외청 | 업무보고·서면답변 (사전정보공표) |
| [건강보험심사평가원(심평원)](https://www.hira.or.kr) | 산하 공공기관 | 서면질의 답변서 (홈페이지 게시) |
| 국민건강보험공단 | 산하 공공기관 | 서면답변 + **전문도서관에 회기별 요구자료 소장** |
| 국민연금공단, 한국보건산업진흥원, 국립암센터 등 | 산하 공공기관 | 기관별 자료실/사전정보공표 |

> 식품의약품안전처(총리 소속)도 보건복지위 피감기관이므로 보건복지 트랙에 포함할지 선택 필요 → **포함 권장** (위원회 기준으로 트랙을 정의하면 자연스럽게 포함됨).

### 2.3 트랙 정의 원칙

트랙은 "부처 소속" 기준이 아니라 **상임위원회(보건복지위원회) 피감기관 기준**으로 정의한다.
피감기관 목록은 매년 국정감사·조사 정보시스템의 계획서에서 갱신한다.

---

## 3. 데이터 모델 (스키마)

정적 사이트이므로 물리적으로는 JSON 파일이지만, 논리 스키마를 먼저 고정한다.

### 3.1 기관 마스터 `data/gukgam/agencies.json`

```json
{
  "id": "hira",
  "name": "건강보험심사평가원",
  "short": "심평원",
  "type": "public_org",            // ministry | agency(소속기관) | public_org(산하) | etc
  "parent": "mohw",                 // 계층: 심평원 → 복지부
  "committee": "보건복지위원회",
  "track": "health",                // ★ 보건복지 트랙 구분자. 그 외는 "general"
  "homepage": "https://www.hira.or.kr",
  "audit_years": [2023, 2024, 2025]
}
```

### 3.2 자료 레코드 `data/gukgam/docs-{연도}.json` (연도별 샤딩)

```json
{
  "id": "2025-hira-0012",
  "year": 2025,
  "assembly": 22,                   // 대수
  "committee": "보건복지위원회",
  "agency_id": "hira",
  "doc_type": "written_answer",     // plan | request_list | submission | briefing |
                                    // written_answer | minutes | result_report | followup
  "title": "2025년 국정감사 서면질의 답변서",
  "member": null,                   // 질의 의원 (파싱 가능한 경우)
  "party": null,
  "date": "2025-11-20",
  "source": "hira_website",         // 수집 출처 식별자
  "source_url": "https://www.hira.or.kr/...",
  "file_type": "pdf",               // pdf | hwp | hwpx | html
  "file_url": "https://...",
  "text_extracted": false,          // Phase 4에서 본문 추출 여부
  "tags": ["비급여", "실손보험"]
}
```

### 3.3 인덱스 `data/gukgam/index.json`
연도·위원회·트랙별 건수 요약. 첫 화면 통계와 필터 UI 초기화용.

**용량 전략:** 메타데이터만 저장(원문은 링크). 연도별 샤딩으로 파일당 수백 KB 유지.
전문검색이 필요해지는 Phase 4에서 SQLite + sql.js(브라우저 로딩) 또는 연도별 검색 인덱스(lunr/minisearch) 도입.

---

## 4. 아키텍처

기존 리포의 `silgeorae.yml`/`news.yml` 패턴을 그대로 확장한다.

```
GitHub Actions (cron)
 ├─ scripts/gukgam/fetch_assembly.py   ← 열린국회정보/공공데이터포털 API (결과보고서·회의록)
 ├─ scripts/gukgam/fetch_inspections.py← likms 국정감사·조사 시스템 크롤링 (계획서·피감기관)
 ├─ scripts/gukgam/fetch_health.py     ← 복지부/질병청/심평원/건보공단 게시판 크롤링 (보건복지 트랙)
 └─ scripts/gukgam/build_index.py      ← 정합성 검사 + index.json 생성
        ↓ 변경 시 자동 커밋
 data/gukgam/*.json
        ↓ GitHub Pages
 gukgam.html        (전체 DB: 연도·위원회·기관·유형 필터 + 검색)
 gukgam-health.html (★보건복지 전용: 기관 계층 트리 + 심층 필터)
```

- **스케줄:** 평시 주 1회, 국감 시즌(9~12월) 매일 새벽. cron 두 개로 분리.
- **시크릿:** `ASSEMBLY_API_KEY` (열린국회정보), `DATA_GO_KR_KEY` (기존 시크릿 재사용 가능)
- **크롤링 예절:** robots.txt 준수, 요청 간격 1~2초, User-Agent 명시, 원문 파일은 저장하지 않고 링크만(저작권·용량 안전 — 뉴스 수집기와 동일 원칙. 공공저작물은 공공누리 유형 확인 후 필요 시 캐시).

### 화면 기획

**`gukgam.html` (통합 DB)**
- 상단: 연도 탭(2019~현재) + 통계 카드(총 자료 수 / 위원회 수 / 기관 수)
- 필터: 위원회 / 기관 / 자료유형 / 키워드
- 목록: [연도] [위원회] [기관] [유형 배지] 제목 → 원문 링크
- 보건복지 트랙 자료엔 전용 배지 + `gukgam-health.html` 링크

**`gukgam-health.html` (보건복지 전용)**
- 기관 계층 트리: 보건복지부 ─ 소속기관(질병관리청…) ─ 산하기관(심평원·건보공단·연금공단…) ─ 기타 피감기관(식약처…)
- 기관 선택 → 연도별 자료 타임라인 (업무보고 → 회의록 → 서면답변 → 결과보고서 → 처리결과 순 스토리라인)
- 연도 간 비교: 같은 기관의 작년/올해 지적사항·처리결과 나란히 보기 (Phase 3)

---

## 5. 단계별 로드맵

| Phase | 내용 | 산출물 |
|---|---|---|
| **1. 뼈대** (1~2일 작업) | 열린국회정보 API 키 발급 → 국정감사 결과보고서·회의록 메타데이터 수집 (21~22대, 2020~현재) + 기관 마스터 수작업 작성(복지위 피감기관 우선) | `fetch_assembly.py`, `agencies.json`, `docs-*.json`, 기본 `gukgam.html` |
| **2. 보건복지 트랙** | 복지부·질병청·심평원·건보공단 사전정보공표/자료실 크롤러. 게시판 구조가 제각각이므로 기관별 어댑터 방식 | `fetch_health.py`, `gukgam-health.html` |
| **3. 자동화·확장** | GitHub Actions cron 가동, likms 크롤러로 매년 피감기관 자동 갱신, 타 위원회로 확대 | `gukgam.yml` 워크플로 |
| **4. 심화** | PDF/HWP 본문 추출(pdfplumber, hwp5txt) → 키워드 태깅·전문검색, 의원별 질의 파싱, 연도별 지적사항 추적 | 검색 인덱스, 태그 |
| **5. 보완** | 비공개 요구자료: 정보공개청구 결과물 수동 등록 UI(admin.html 확장) + 국회도서관/기관 도서관 소장자료 링크 | 수동 등록 파이프라인 |

**Phase 1 완료 기준(MVP):** "2024년 보건복지위 국정감사"를 선택하면 결과보고서·회의록 원문 링크와 복지부/질병청/심평원 서면답변(수동 시드 10건)이 한 화면에 나온다.

---

## 6. 리스크와 대응

| 리스크 | 대응 |
|---|---|
| 의원실 요구자료 원문 비공개 | 뼈대는 공개자료로. 요구자료는 목록화 + 정보공개청구 + 기관 도서관 소장본 링크로 보완. "전부 가져오기"는 불가능함을 UI에 명시 |
| HWP/HWPX 파일 다수 | Phase 1~3은 메타데이터+링크만. 본문 추출은 Phase 4에서 hwp5txt/pyhwp로 |
| 기관 게시판 개편으로 크롤러 파손 | 기관별 어댑터 분리 + Actions 실패 알림 + 수집 건수 급감 감지 |
| API가 LINK형(문서 가이드 기반)이라 스펙 확인 필요 | Phase 1 착수 시 열린국회정보에서 실제 엔드포인트·필드 확정 후 스키마 미세조정 |
| 데이터 용량 증가 | 연도별 샤딩 + 메타데이터만 저장. 100MB 근접 시 별도 데이터 리포 분리 |

---

## 7. Phase 1 구현 현황 (2026-08-17)

구현 완료: `scripts/gukgam/fetch_assembly.py`, `data/gukgam/`(agencies·seed-health·reports·minutes·index),
`gukgam.html`(통합 DB), `gukgam-health.html`(보건복지 트랙), `.github/workflows/gukgam.yml`.

확인된 실제 API 엔드포인트 (`https://open.assembly.go.kr/portal/openapi/{서비스명}`):

| 서비스명 | 데이터 | 요청 인자 | 응답 필드 |
|---|---|---|---|
| `AUDITREPORTRESULT` | 국정감사 결과보고서 | RPT_YR, RPT_TTL | RPT_YR, CMIT_NM, RPT_TTL, PDF/HWP_DWLD_URL |
| `AUDITREPORTVISIBILITY` | 시정 및 처리 요구사항 결과보고서 | RPT_YR, RPT_TTL | 위와 동일 |
| `VCONFAPIGCONFLIST` | 국정감사 회의록 | **ERACO(필수, 예: 제22대)**, CMIT_CD | CONF_ID, SESS, DGR, CONF_DT, CMIT_NM, DOWN_URL |
| `VCONFATTATBLIST` | 시정조치 결과보고서 목록 | CONF_ID, ERACO | CONF_ID, FILE_CN, DOWN_URL (Phase 3 예정) |

- 키 없이 호출 시 샘플(5건/호출)만 반환 → 전체 수집은 `ASSEMBLY_API_KEY` 필요. 수집기는 샘플 모드에서 full 데이터를 덮어쓰지 않음.
- likms 국정감사·조사 시스템 내부 API(`/inspections/getAtbFileList.do` POST)로 피감기관 목록·위원회 게시판 파일을 키 없이 얻을 수 있음을 확인(보건복지위 committee_id=10009) → Phase 3 크롤러 소스.

## 8. 바로 다음 할 일

1. [열린국회정보](https://open.assembly.go.kr/portal/openapi/main.do) 회원가입 → API 키 발급 → 리포 시크릿 `ASSEMBLY_API_KEY` 등록
2. 보건복지위 피감기관 목록(2024·2025) 확정 → `agencies.json` 초안 작성
3. Phase 1 수집 스크립트 + `gukgam.html` 구현 (별도 세션에서 "국정감사 DB Phase 1 구현해줘"로 진행)
