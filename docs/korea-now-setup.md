# Korea Now — 셋업 가이드 (왕초보용)

> 앱 위치: `korea-now/` · 배포 주소: https://soonryu74.github.io/korea-now/
> 서버(Supabase)와 공공 API 키가 **없어도** 화면은 뜹니다(데모 곡선). 키를 넣으면 서울 실시간 혼잡도로 바뀝니다.

## 1. 내 컴퓨터에서 실행해 보기

Node.js 22 이상이 필요합니다. (https://nodejs.org 에서 LTS 설치)

| 단계 | Windows (PowerShell) | macOS (터미널) |
| --- | --- | --- |
| 저장소 받기 | `git clone https://github.com/soonryu74/soonryu74.github.io.git` | 동일 |
| 앱 폴더로 이동 | `cd soonryu74.github.io\korea-now` | `cd soonryu74.github.io/korea-now` |
| 필요한 부품 설치 | `npm install` | `npm install` |
| 개발 서버 켜기 | `npm run dev` | `npm run dev` |
| 브라우저에서 열기 | http://localhost:5173/korea-now/ | 동일 |
| 배포용 빌드 | `npm run build` | `npm run build` |
| 환경변수 파일 만들기 | `Copy-Item .env.example .env` | `cp .env.example .env` |

> 비유: `npm install`은 "레고 부품 상자 받기", `npm run dev`는 "조립한 걸 내 방에서 켜 보기"입니다.

`.env` 파일에 아래 두 줄을 채우면 실시간 모드가 됩니다(3번에서 얻는 값).

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...
```

## 2. 공공 API 키 발급 (무료)

### 2-1. 서울시 실시간 도시데이터 (혼잡도) — 서울 열린데이터광장
1. https://data.seoul.go.kr 회원가입 → 로그인
2. 상단 메뉴 **[인증키 신청]** → 사용 URL에 `https://soonryu74.github.io` 입력 → 신청
3. 발급된 인증키(영문+숫자 32자)를 복사해 둡니다. 즉시 사용 가능.
4. 이 키는 **브라우저에 넣지 않습니다.** Supabase 시크릿 `SEOUL_API_KEY`에만 넣습니다(3-3 참고).

### 2-2. 한국관광공사 TourAPI (영문 관광정보) — 공공데이터포털
1. https://www.data.go.kr 회원가입 → 로그인
2. 검색창에 **"한국관광공사_영문 관광정보 서비스"** 검색 → 활용신청
3. 승인되면 마이페이지 → 인증키 **Decoding(디코딩) 값**을 복사
4. Supabase 시크릿 `TOUR_API_KEY`에 넣습니다.
5. 기본 트래픽: 개발계정 하루 1,000건. 앱은 응답을 24시간 캐시하므로 충분합니다.
6. 같은 계정으로 **"한국관광공사_관광지 집중률 방문자 추이 예측 정보"**(전국 30일 붐빔 예측)도 활용신청해 두면 `tour-congestion` 함수가 같은 키로 동작합니다.

### 2-3. 한국수출입은행 환율 — 선택
1. https://www.koreaexim.go.kr/ir/HPHKIR019M01 에서 인증키 발급(회원가입 필요)
2. Supabase 시크릿 `KOREAEXIM_API_KEY`에 넣습니다. 하루 1,000건 제한, 앱은 하루 1회만 호출.

## 3. Supabase 연결

> **2026-09-06 현재 상태**: 프로젝트 `korea-now`(ref `dxhmprqfgigljgbstqrg`) 생성, 스키마 적용, Edge Function 4개 배포, 앱에 URL·공개키 연결까지 완료. **남은 건 3-3 시크릿 등록뿐.**

### 3-1. 프로젝트 만들기 — 완료
- https://supabase.com/dashboard/project/dxhmprqfgigljgbstqrg
- 무료 플랜 활성 2개 한도 때문에 `artselah`를 일시정지했습니다. 다시 켜려면 그 프로젝트 → Restore.

### 3-2. 스키마 넣기 — 완료
- 새 프로젝트를 다시 만들 때만: **SQL Editor** → `supabase/migrations/0001_init.sql` 붙여넣고 **Run**

### 3-3. 시크릿(비밀 키) 등록
> **2026-09-09 현재**: `SEOUL_API_KEY`, `TOUR_API_KEY`는 `app_secrets` 테이블에 저장 완료(함수는 환경변수 → 테이블 순으로 읽음). 남은 것: `SEOUL_SUBWAY_API_KEY`(지하철), `KOREAEXIM_API_KEY`(환율, 선택). 테이블에 넣으려면 SQL Editor에서
> `insert into app_secrets(name,value) values('SEOUL_SUBWAY_API_KEY','키') on conflict(name) do update set value=excluded.value;`
> 또, 관광지 30일 예측(`tour-congestion`)은 data.go.kr에서 **「한국관광공사_관광지 집중률 방문자 추이 예측 정보」 활용신청**이 추가로 필요합니다(같은 키로 동작, 현재 "등록되지 않은 서비스키" 응답).

- Dashboard → **Edge Functions → Secrets** 에 아래 추가 (테이블 대신 여기 넣어도 됨)

| 이름 | 값 |
| --- | --- |
| `SEOUL_API_KEY` | 2-1에서 받은 키 |
| `TOUR_API_KEY` | 2-2 디코딩 키 |
| `KOREAEXIM_API_KEY` | 2-3 키 (선택) |
| `SEOUL_SUBWAY_API_KEY` | 서울 열린데이터광장 **지하철 실시간 도착정보** 인증키 (일반 인증키와 별도 발급) |

### 3-4. Edge Function 배포 (Supabase CLI) — 완료 (코드를 고쳤을 때만 다시)

| 단계 | Windows (PowerShell) | macOS (터미널) |
| --- | --- | --- |
| CLI 설치 | `scoop install supabase` (scoop 없으면 https://scoop.sh 먼저) | `brew install supabase/tap/supabase` |
| 로그인 | `supabase login` | `supabase login` |
| 프로젝트 연결 | `supabase link --project-ref <프로젝트ref>` | 동일 |
| 함수 4개 배포 | `supabase functions deploy seoul-congestion --no-verify-jwt`<br>`supabase functions deploy fx-rate --no-verify-jwt`<br>`supabase functions deploy tour-search --no-verify-jwt`<br>`supabase functions deploy tour-congestion --no-verify-jwt` | 동일 |

> 프로젝트 ref는 Dashboard 주소 `https://supabase.com/dashboard/project/<여기>` 부분입니다.
> 저장소 루트(`soonryu74.github.io/`)에서 실행합니다. `supabase/` 폴더를 자동으로 찾습니다.

### 3-5. 앱에 URL과 공개 키 넣기 — 완료
- `korea-now/.env.production`에 들어 있습니다(공개용 키라 저장소에 있어도 됨). 로컬 개발은 `.env`에 같은 값을 복사.
- 프로젝트를 바꾸면 이 파일만 고치면 됩니다. GitHub Secrets(`KOREA_NOW_SUPABASE_URL`, `KOREA_NOW_SUPABASE_ANON_KEY`)를 등록하면 그것이 우선합니다.
- `main` 브랜치에 push 하면 `jekyll.yml` 워크플로가 앱을 빌드해 `/korea-now/`에 올립니다.

## 3-6. 홈화면에 앱 설치 (PWA)
- 배포 주소를 폰 브라우저로 열면 "홈 화면에 추가"가 뜹니다(안드로이드 Chrome은 자동 배너, 아이폰 Safari는 공유 → 홈 화면에 추가).
- 한 번 열어 두면 지하철 등 오프라인에서도 목록·요금·휴관일이 뜨고, 본 적 있는 지도 타일은 30일간 남습니다.
- 코드를 바꿔 다시 배포하면 앱이 다음 실행 때 자동 갱신됩니다(`registerType: autoUpdate`).

## 4. 동작 확인
- 앱 상단 배지가 **● LIVE**면 실시간 모드, **◐ DEMO**면 키 없이 동작 중
- 서울 스팟 상세 화면 하단에 "Live from Seoul city data, HH:MM KST"가 보이면 성공
- 실패 시 브라우저 개발자도구(F12) Console에 `[korea-now] live congestion unavailable` 메시지와 원인이 찍힙니다

## 5. 데이터 관리
- 관광지 목록·입장료: `korea-now/src/data/spots.ts` (분기마다 `feeCheckedAt` 갱신)
- 한국어 한마디·매너 팁: `korea-now/src/data/phrases.ts`
- 서울 실시간 지역명(`seoulArea`)은 서울시 API의 AREA_NM과 **글자까지 똑같아야** 합니다. 목록은 `docs/korea-now-api.md` 참고.
