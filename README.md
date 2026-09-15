# 국정감사 자료 DB

보건복지위원회 국정감사 자료를 모아 검색·분석하는 정적 사이트입니다.

| 페이지 | 내용 |
|---|---|
| `index.html` (= `gukgam.html`) | 통합 DB — 통합검색·하이라이트·연대기·국회일정·위원 프로필·자료 목록 |
| `gukgam-health.html` | 보건복지 트랙 — 기관 지도·위원·기관별 자료 |
| `gukgam-mohw.html` | 보건복지부 국감 Q&A |
| `gukgam-kdca.html` | 질병관리청 국감 Q&A |
| `gukgam-mfds.html` | 식품의약품안전처 국감 Q&A |
| `gukgam-prep.html` | 답변 대비 워크북 — 지적사항 전수·예상질의·리허설 |
| `gukgam-guide.html` | 의원별 답변 가이드북 |

## 데이터 출처
열린국회정보 Open API(국회사무처), 국회회의록시스템, 국정감사·조사 정보시스템,
보건복지위원회 홈페이지, 각 기관 사전정보공표. 원문 저작권은 각 생산기관에 있으며
이 사이트는 메타데이터와 원문 링크만 제공합니다.

## 자동 갱신
`.github/workflows/gukgam.yml` 이 매주(국감 시즌 9~12월은 매일) 실행되어
`data/gukgam/` 을 갱신하고 자동 커밋합니다.
저장소 Settings → Secrets → Actions 에 `ASSEMBLY_API_KEY` (열린국회정보 인증키)가 필요합니다.
