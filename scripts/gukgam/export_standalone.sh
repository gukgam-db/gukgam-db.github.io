#!/usr/bin/env bash
# 국정감사 DB를 독립 GitHub Pages 사이트로 내보내기
#
# 부동산 사이트(soonryu74.github.io)는 그대로 두고, 국정감사 부분만
# 별도 조직 리포(<org>.github.io)로 옮기기 위한 번들을 만든다.
#
# 사용법: bash scripts/gukgam/export_standalone.sh [출력경로]
#         기본 출력: ../gukgam-standalone
set -euo pipefail

SRC="$(cd "$(dirname "$0")/../.." && pwd)"
OUT="${1:-$SRC/../gukgam-standalone}"

rm -rf "$OUT"
mkdir -p "$OUT/data" "$OUT/scripts" "$OUT/.github/workflows"

# 페이지 (상대경로만 쓰므로 그대로 복사하면 동작)
cp "$SRC"/gukgam*.html "$OUT/"
# 첫 화면 = 통합 DB
cp "$SRC/gukgam.html" "$OUT/index.html"

# 데이터·수집 스크립트·자동 갱신 워크플로
cp -r "$SRC/data/gukgam" "$OUT/data/gukgam"
cp -r "$SRC/scripts/gukgam" "$OUT/scripts/gukgam"
cp "$SRC/.github/workflows/gukgam.yml" "$OUT/.github/workflows/gukgam.yml"

# Jekyll 빌드 없이 정적 파일 그대로 서빙
touch "$OUT/.nojekyll"

cat > "$OUT/README.md" <<'MD'
# 국정감사 자료 DB

보건복지위원회 국정감사 자료를 모아 검색·분석하는 정적 사이트입니다.

| 페이지 | 내용 |
|---|---|
| `index.html` (= `gukgam.html`) | 통합 DB — 통합검색·하이라이트·연대기·국회일정·위원 프로필·자료 목록 |
| `gukgam-health.html` | 보건복지 트랙 — 기관 지도·위원·기관별 자료 |
| `gukgam-mohw.html` | 보건복지부 국감 Q&A |
| `gukgam-kdca.html` | 질병관리청 국감 Q&A |
| `gukgam-mfds.html` | 식품의약품안전처 국감 Q&A |
| `gukgam-covid.html` | 코로나19·팬데믹 대비 — 질병청 국감 5년 기록 |
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
MD

echo "완료: $OUT"
echo "파일 $(find "$OUT" -type f | wc -l)개 / $(du -sh "$OUT" | cut -f1)"
