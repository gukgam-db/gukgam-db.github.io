# Korea Now — 공공 API 검증 노트

> 검증일 2026-09-05 · 앱: `korea-now/` · 각 절 끝의 **검증 상태** 표기를 믿고 쓸 것. UNVERIFIED 항목은 실제 키로 호출해 보고 확정한다.
> 앱 반영 상태: 서울 실시간(1절) → `supabase/functions/seoul-congestion`, TourAPI(2절) → `tour-search`, 환율(4절) → `fx-rate`, 전국 예측 집중률(6-1절) → `tour-congestion`(함수만 준비, 화면 연동은 areaCd 체계 확인 후).


검증 방법: 공식 문서 페이지 WebFetch/curl 스크래핑 + 실제 엔드포인트에 더미 키로 호출하여 존재/응답 형식/CORS 헤더 확인.
표기: **검증됨** = 1차 출처에서 직접 확인 / **부분검증** = 일부만 확인(나머지는 통념·2차 출처) / **UNVERIFIED** = 확인 못함.

---

## 1. 서울시 실시간 도시데이터 (citydata / citydata_ppltn)

### 공식 문서
- 열린데이터광장 데이터셋: https://data.seoul.go.kr/dataList/OA-21778/F/1/datasetView.do (실시간 인구데이터, 서비스명 `citydata_ppltn`)
- 통합 도시데이터: https://data.seoul.go.kr/dataList/OA-21285/F/1/datasetView.do (서비스명 `citydata`)
- 영문 실시간 인구데이터: https://data.seoul.go.kr/dataList/OA-22270/F/1/datasetView.do (서비스명 UNVERIFIED — 페이지에서 확인 실패)
- Open API 가이드: https://data.seoul.go.kr/together/guide/useGuide.do
- 인증키 신청: https://data.seoul.go.kr/together/mypage/actkeyMain.do
- 시각화 페이지: https://data.seoul.go.kr/SeoulRtd/
- 공공데이터포털 미러(LINK형): https://www.data.go.kr/data/15146353/openapi.do (인구), https://www.data.go.kr/data/15146211/openapi.do (도시데이터)

### URL 패턴 (검증됨 — 가이드 페이지의 `[Base URL]/[인증키]/[파일타입]/[서비스명]/[START]/[END]/[파라미터]` 구조)
```
http://openapi.seoul.go.kr:8088/{KEY}/json/citydata_ppltn/1/5/{AREA_NM 또는 AREA_CD}
http://openapi.seoul.go.kr:8088/{KEY}/json/citydata/1/5/{AREA_NM 또는 AREA_CD}
샘플키 예: http://openapi.seoul.go.kr:8088/sample/json/citydata_ppltn/1/5/광화문·덕수궁
```
- 파일타입: `xml`, `xmlf`, `xls`, `json` (가이드 페이지 원문).
- 공식 주의사항(페이지 원문): "실시간 인구데이터 API는 한 번에 1개 장소씩만 호출 가능합니다", "장소명 OR 장소코드 중 택1 하여 호출이 가능합니다", "샘플key를 통해서는 주요 121장소 중 '광화문·덕수궁' 지역만 조회 가능합니다".
- AREA_NM에 `·`(U+00B7)가 포함된 곳이 많으므로 반드시 `encodeURIComponent` 필요.

### 핫스팟 장소 목록 (검증됨 — SeoulRtd 내부 API `https://data.seoul.go.kr/SeoulRtd/api/hotspot-category?page=1&category=전체보기&count=200` 응답 total=121, 2026-09-05 조회)
공식 파일: 데이터셋 페이지 첨부 "서울시 주요 121장소 목록.xlsx", "서울시 주요 121장소 영역.zip"(shp), "실시간 도시데이터 매뉴얼.pdf" (다운로드는 폼 POST `//datafile.seoul.go.kr/bigfile/iot/inf/nio_download.do` — 브라우저에서 클릭 필요).
AREA_CD(POI001~) ↔ 이름 매핑은 xlsx에만 있음(여기서는 미확보 → **UNVERIFIED**). 이름으로 호출하면 코드 불필요.

- 관광특구(7): 강남 MICE 관광특구, 동대문 관광특구, 명동 관광특구, 이태원 관광특구, 잠실 관광특구, 종로·청계 관광특구, 홍대 관광특구
- 고궁·문화유산(5): 경복궁, 광화문·덕수궁, 보신각, 서울 암사동 유적, 창덕궁·종묘
- 발달상권(28): DDP(동대문디자인플라자), DMC(디지털미디어시티), 가락시장, 가로수길, 광장(전통)시장, 김포공항, 남대문시장, 노량진, 덕수궁길·정동길, 북창동 먹자골목, 북촌한옥마을, 서촌, 성수카페거리, 송리단길·호수단길, 신촌 스타광장, 압구정로데오거리, 여의도, 연남동, 영등포 타임스퀘어, 용리단길, 이태원 앤틱가구거리, 익선동, 인사동, 잠실롯데타워·석촌호수, 창동 신경제 중심지, 청담동 명품거리, 청량리 제기동 일대 전통시장, 해방촌·경리단길
- 공원(33): 강서한강공원, 고척돔, 광나루한강공원, 광화문광장, 국립중앙박물관·용산가족공원, 난지한강공원, 남산공원, 노들섬, 뚝섬한강공원, 망원한강공원, 반포한강공원, 보라매공원, 북서울꿈의숲, 서대문독립공원, 서리풀공원·몽마르뜨공원, 서울대공원, 서울숲공원, 송현녹지광장, 아차산, 안양천, 양화한강공원, 어린이대공원, 여의도한강공원, 여의서로, 올림픽공원, 월드컵공원, 응봉산, 이촌한강공원, 잠실종합운동장, 잠실한강공원, 잠원한강공원, 청계산, 홍제폭포
- 인구밀집지역(48): 가산디지털단지역, 강남역, 건대입구역, 고덕역, 고속터미널역, 교대역, 구로디지털단지역, 구로역, 군자역, 대림역, 동대문역, 뚝섬역, 미아사거리역, 발산역, 사당역, 삼각지역, 서울대입구역, 서울식물원·마곡나루역, 서울역, 선릉역, 성신여대입구역, 수유역, 숭례문, 시의회 앞, 신논현역·논현역, 신도림역, 신림역, 신정네거리역, 신촌·이대역, 쌍문역, 양재역, 역삼역, 연신내역, 오목교역·목동운동장, 왕십리역, 용산역, 이태원역, 잠실새내역, 잠실역, 장지역, 장한평역, 천호역, 총신대입구(이수)역, 충정로역, 합정역, 혜화역, 홍대입구역(2호선), 회기역

(참고: 위 내부 API는 좌표 `x`=위도, `y`=경도가 뒤바뀐 이름으로 내려옴. 비공식이므로 앱에서 직접 의존 금지.)

### 응답 필드 (부분검증)
Open API 탭의 출력값 표는 동적 로딩이라 스크래핑 실패. 아래는 통용되는 필드명이며, SeoulRtd 내부 API에서 `MALE_PPLTN_RATE`, `FEMALE_PPLTN_RATE`, 혼잡도 4단계(여유/보통/약간 붐빔/붐빔), 12시간 과거+12시간 예측 구조는 확인됨.
```json
{"SeoulRtd.citydata_ppltn":[{
  "AREA_NM":"광화문·덕수궁","AREA_CD":"POI009",
  "AREA_CONGEST_LVL":"보통","AREA_CONGEST_MSG":"사람들이 몰려있을 수 있지만 크게 붐비지는 않아요...",
  "AREA_PPLTN_MIN":"36000","AREA_PPLTN_MAX":"38000",
  "MALE_PPLTN_RATE":"46.8","FEMALE_PPLTN_RATE":"53.2",
  "PPLTN_RATE_0":"..","PPLTN_RATE_10":"6.5","PPLTN_RATE_20":"24.8", ... "PPLTN_RATE_70":"..",
  "RESNT_PPLTN_RATE":"19.7","NON_RESNT_PPLTN_RATE":"80.3",
  "REPLACE_YN":"N","PPLTN_TIME":"2026-09-05 21:20",
  "FCST_YN":"Y",
  "FCST_PPLTN":[{"FCST_TIME":"2026-09-05 22:00","FCST_CONGEST_LVL":"여유","FCST_PPLTN_MIN":"16000","FCST_PPLTN_MAX":"18000"}, ...]
}]}
```
- 혼잡도 단계 정의(검증됨, guide.do 원문): "주요 121장소의 혼잡 정도를 붐빔, 약간 붐빔, 보통, 여유 4단계로 산출".
- 갱신주기(검증됨): 실시간 인구 5분, 도로소통 5분, 대중교통 5분, 날씨 10분, 문화행사 1일. 과거 데이터 제공 불가(API to API 방식).
- `citydata`(통합)는 `LIVE_PPLTN_STTS`, `ROAD_TRAFFIC_STTS`, `SUB_STTS`, `BUS_STN_STTS`, `PRK_STTS`, `SBIKE_STTS`, `WEATHER_STTS`, `CHARGER_STTS`, `EVENT_STTS` 등의 하위 객체 — 필드명 UNVERIFIED(매뉴얼 PDF 참조).

### 인증키 / 제한 (검증됨)
- 절차: 열린데이터광장 회원가입 → 로그인 → 인증키 신청 페이지(`actkeyMain.do`)에서 신청 → 즉시 발급(공식 FAQ: "신청하시면 바로 발급됩니다").
- 제한: 1회 호출 최대 1,000건(START/END 범위). 실시간 지하철 API만 하루 1,000건 제한 명시. citydata에 대한 일일 호출 상한은 문서에 명시 없음(**UNVERIFIED**). 무제한 사용 원하면 "활용사례(갤러리)에 인증키와 함께 콘텐츠를 등록".
- 라이선스: 공공누리 1유형(출처표시).

### HTTPS / CORS (부분검증)
- 공식 문서·데이터셋 페이지 모두 `http://openapi.seoul.go.kr:8088` 만 안내. HTTPS 엔드포인트 문서화 없음. 본 환경에서는 프록시 문제로 직접 접속 불가 → 실측 **UNVERIFIED**. 2차 출처(개발자 커뮤니티)에서도 "HTTPS 페이지에서 mixed content로 차단" 사례가 반복됨.
- CORS 헤더 실측 불가. 결론: **GitHub Pages(HTTPS)에서 브라우저 직접 호출은 사실상 불가** → 서버리스 프록시(Cloudflare Worker / Vercel / Netlify Function) 경유 필수. 프록시에서 키 은닉 + 1분 캐시 권장.

검증 상태: **부분검증** (URL 패턴·121장소·갱신주기·키 절차 검증됨 / 응답 필드·HTTPS·CORS·일일 상한 미확인)

---

## 2. 한국관광공사 TourAPI 4.0 영문 서비스 — `EngService2`

### 공식 문서
- 공공데이터포털: https://www.data.go.kr/data/15101753/openapi.do ("한국관광공사_영문 관광정보서비스_GW", 최종 수정 2026-02-26)
- 관광콘텐츠랩(TourAPI 포털): https://api.visitkorea.or.kr/ (SPA — 공지/가이드는 로그인 후 열람)

### 베이스 URL / 오퍼레이션 (검증됨 — 문서 페이지 스크래핑 + 더미 키 실호출)
```
https://apis.data.go.kr/B551011/EngService2/{operation}
```
| operation | 용도 | 실호출 결과 |
|---|---|---|
| areaCode2 | 지역코드 | 존재(키 오류 30) |
| ldongCode2 | 법정동코드 (areaCode 대체, 신규) | 존재 |
| lclsSystmCode2 | 분류체계코드 (cat1/2/3 대체, 신규) | 존재 |
| categoryCode2 | 서비스분류코드(구) | 존재 |
| areaBasedList2 | 지역기반 목록 | 존재 |
| locationBasedList2 | 위치기반(mapX, mapY, radius≤20000m) | 존재 |
| searchKeyword2 | 키워드검색 | 존재 |
| searchFestival2 | 행사(eventStartDate 필수) | 존재 |
| searchStay2 | 숙박 | 문서 존재(호출 타임아웃, 재확인 필요) |
| detailCommon2 | 공통 상세(overview, homepage, mapx/mapy, firstimage) | 존재 |
| detailIntro2 | 소개정보(이용시간/요금 등, contentTypeId 필수) | 존재 |
| detailInfo2 | 반복정보 | 존재 |
| detailImage2 | 이미지목록 | 존재 |
| areaBasedSyncList2 | 동기화 목록(showflag) | 문서 존재 |
- **`EngService1`은 폐기됨**: `.../EngService1/areaCode1` 호출 시 `NO_OPENAPI_SERVICE_ERROR (returnReasonCode 12, "해당 오픈API 서비스가 없거나 폐기됨")`. 반드시 `EngService2` + `*2` 오퍼레이션 사용.

### 필수/공통 파라미터 (검증됨 — 문서 원문)
- `serviceKey`(필수, "공공데이터포털에서 받은 인증키" — URL 인코딩된 키 그대로 붙이기), `MobileOS`(필수: `IOS`, `AND`, `WIN`, `ETC`), `MobileApp`(필수, 앱명), `_type=json`(기본 XML), `numOfRows`, `pageNo`, `arrange`(A=제목순, C=수정일순, D=생성일순, E=거리순 / 대표이미지 있는 것만: O, Q, R, S), `contentTypeId`, `lDongRegnCd`/`lDongSignguCd`(법정동), `lclsSystm1/2/3`(분류체계), `modifiedtime`(YYYYMMDD).
- 문서에 `areaCode`, `sigunguCode`, `cat1/2/3`는 "미사용항목(삭제예정)"으로 표기 → 신규 개발은 `lDong*`, `lclsSystm*` 사용.

### contentTypeId (영문 서비스, 검증됨 — 문서 원문 "관광타입(75:레포츠, 76:관광지, 77:교통, 78:문화시설, 79:쇼핑, 80:숙박, 82:음식점, 85:축제)")
76 관광지 · 78 문화시설 · 85 축제공연행사 · 75 레포츠 · 80 숙박 · 79 쇼핑 · 82 음식점 · 77 교통

### detailIntro2 응답 필드 (검증됨 — 문서 스키마) — **주의: 관광지(76)에는 usefee 없음**
- 관광지(76): `usetime`(이용시간), `restdate`(쉬는날), `infocenter`, `parking`, `opendate`, `useseason`, `accomcount`, `expguide`, `expagerange` — **입장료 필드 없음** (요금은 `detailInfo2` 반복정보나 `overview` 텍스트에만 있을 수 있음).
- 문화시설(78): `usefee`(이용요금), `usetimeculture`(이용시간), `restdateculture`, `parkingfee`, `spendtime`, `scale`, `infocenterculture`, `accomcountculture`, `parkingculture`.
- 축제(85): `usetimefestival`(문서상 "이용요금"), `eventstartdate`, `eventenddate`, `playtime`, `eventplace`, `program`, `agelimit`, `bookingplace`, `discountinfofestival`, `spendtimefestival`, `subevent`, `placeinfo`, `eventhomepage`.
- 음식점(82): `opentimefood`(영업시간), `restdatefood`, `firstmenu`, `treatmenu`, `seat`, `parkingfood`, `reservationfood`, `smoking`, `lcnsno`.
- 쇼핑(79): `opentime`, `restdateshopping`, `saleitem`, `fairday`, `shopguide`, `parkingshopping`, `restroom`.
- 숙박(80): `checkintime`, `checkouttime`, `roomcount`, `roomtype`, `reservationurl`, `pickup`, `foodplace`, `chkcooking`.
- 레포츠(75): `usefeeleports`(입장료), `usetimeleports`, `reservation`, `scaleleports` 등.

### detailCommon2 주요 응답 필드 (검증됨)
`contentid`, `contenttypeid`, `title`, `addr1`, `addr2`, `zipcode`, `tel`, `homepage`, `overview`, `firstimage`(약 500×333), `firstimage2`(약 150×100), `mapx`(WGS84 경도), `mapy`(WGS84 위도), `mlevel`, `lDongRegnCd`, `lDongSignguCd`, `lclsSystm1/2/3`, `createdtime`, `modifiedtime`, `cpyrhtDivCd`(Type1 출처표시 / Type3 변경금지).

### 샘플 요청/응답
```
GET https://apis.data.go.kr/B551011/EngService2/locationBasedList2?serviceKey={KEY}&MobileOS=ETC&MobileApp=KoreaTrip&_type=json&mapX=126.9780&mapY=37.5665&radius=2000&contentTypeId=76&arrange=E&numOfRows=20&pageNo=1
```
```json
{"response":{"header":{"resultCode":"0000","resultMsg":"OK"},
 "body":{"items":{"item":[{"contentid":"264337","contenttypeid":"76","title":"Gyeongbokgung Palace (경복궁)",
   "addr1":"161 Sajik-ro, Jongno-gu, Seoul","mapx":"126.9769...","mapy":"37.5788...","dist":"1234.5",
   "firstimage":"http://tong.visitkorea.or.kr/cms/resource/...jpg","tel":"","cpyrhtDivCd":"Type3"}]},
  "numOfRows":20,"pageNo":1,"totalCount":57}}}
```
(응답 항목 값은 예시; 구조는 data.go.kr 스키마 기준. 키 오류 시 루트가 `OpenAPI_ServiceResponse.cmmMsgHeader`로 바뀌므로 파서에서 분기 필요 — 실호출로 검증됨.)

### 키 발급 / 쿼터 (검증됨 — 문서 원문)
- data.go.kr 회원가입 → 해당 API 페이지 "활용신청" → **개발계정: 자동승인, 일일 트래픽 1,000건** ("개발단계 : 자동승인 / 운영단계 : 심의승인", "운영계정: 활용사례 등록시 신청하면 트래픽 증가 가능").
- 신규 발급 키는 데이터포털 안내상 활성화까지 수 시간~1일 지연 가능(통념, **부분검증**).

### HTTPS / CORS (검증됨 — 실측)
- HTTPS 지원(`https://apis.data.go.kr`, HSTS 헤더 포함).
- 실측 응답 헤더: `Access-Control-Allow-Origin: https://example.com` (요청 Origin 반영), `Vary: Origin` → **브라우저 직접 호출 가능**. 단 정적 사이트에서는 serviceKey가 노출되므로 (1) 개발계정 1,000건/일 소진 위험, (2) 키 도용 위험 → 프록시 경유 + 캐시 권장.

검증 상태: **검증됨** (베이스URL·오퍼레이션·파라미터·contentTypeId·필드·쿼터·CORS 모두 1차 확인; searchStay2 호출만 재확인 필요)

---

## 3. 박물관·미술관 입장료 데이터

### 3-1. 전국박물관미술관정보표준데이터 (data.go.kr 표준데이터) — **가장 실용적**
- 문서: https://www.data.go.kr/data/15017323/standard.do (표준데이터), https://www.data.go.kr/data/15017323/openapi.do (Open API)
- 엔드포인트(검증됨 — 더미 키 호출 시 `SERVICE_KEY_IS_NOT_REGISTERED_ERROR` 반환, HTTP 403):
```
https://api.data.go.kr/openapi/tn_pubr_public_museum_artgr_info_api?serviceKey={KEY}&pageNo=1&numOfRows=100&type=json
```
- 항목(검증됨, 표준 항목명 원문): 시설명, 박물관미술관구분, 소재지도로명주소, 소재지지번주소, 위도, 경도, 운영기관전화번호, 운영기관명, 운영홈페이지, 편의시설정보, 평일관람시작시각, 평일관람종료시각, 공휴일관람시작시각, 공휴일관람종료시각, 휴관정보, **어른관람료, 청소년관람료, 어린이관람료, 관람료기타정보**, 박물관미술관소개, 교통안내정보, 관리기관전화번호, 관리기관명.
- API 영문 필드명(부분검증 — data.go.kr 표준데이터 관례; 페이지 스크래핑 실패): `fcltyNm`, `fcltyType`(구분), `rdnmadr`, `lnmadr`, `latitude`, `longitude`, `phoneNumber`, `institutionNm`, `homepageUrl`, `convenientFcltyInfo`, `weekdayOperOpenHhmm`, `weekdayOperColseHhmm`, `holidayOperOpenHhmm`, `holidayOperCloseHhmm`, `closedDayInfo`, `adultAdmsnFee`, `youthAdmsnFee`, `childAdmsnFee`, `admsnFeeEtc`(또는 `admsnFeeInfo`), `museumIntrcn`, `trfcGuidInfo`, `institutionPhoneNumber`, `institutionNm`, `referenceDate`, `instt_code`. → 실제 키 발급 후 첫 응답으로 필드명 확정 필요.
- 메타: 갱신주기 연간, 최종수정 2026-09-03, 제공기관 212개 지자체, 포맷 XLS/XML/JSON/RDF/CSV. 파일 다운로드도 가능(약 1,000여 건 규모, 정적 JSON으로 번들링 추천).
- 결측 문제: 지자체 입력 데이터라 관람료가 빈 문자열/"무료"/"0"/"성인 3,000원" 등 혼재, 국립박물관(문체부 직속)은 지자체 관리 대상이 아니라 **누락**될 수 있음(국립중앙박물관 등은 별도 하드코딩 필요). 좌표 결측·오기 존재.
- CORS(검증됨 — 실측): `api.data.go.kr`도 `Access-Control-Allow-Origin` 반영 헤더 반환 → 브라우저 호출 가능.
- 쿼터: 표준데이터 API 기본 개발계정 1,000건/일(통념, **부분검증**).

### 3-2. TourAPI EngService2 detailIntro2 — 문화시설(78) `usefee`
- 영문 텍스트로 요금 제공(예: "Adults 3,000 won / Free for..."). 영문 앱에는 가장 직접적. 단 관광지(76)에는 usefee 없음(위 2절). 값이 자유 텍스트 + 결측 많음.

### 3-3. 문화공공데이터광장 (culture.go.kr)
- https://www.culture.go.kr/data/openapi/openapiView.do?id=196&category=D&gubun=A 등 — 페이지가 503으로 응답(2026-09-05) → **UNVERIFIED**. 검색 결과상 동일한 지자체 박물관·미술관 정보(관람료 포함)를 별도 키로 제공. 3-1과 중복이므로 우선순위 낮음.
- 한국문화정보원_한눈에보는문화정보조회서비스: https://www.data.go.kr/data/15138937/openapi.do (전시·공연 중심, 가격 필드 있음) — 상세 **UNVERIFIED**.

권장: 3-1 파일을 빌드 타임에 받아 정적 JSON으로 번들 + 국립박물관 수동 보강 + 영문 요금은 TourAPI 78 `usefee`로 보완.

검증 상태: **부분검증** (엔드포인트·항목명·CORS 검증됨 / 영문 필드명·쿼터 미확인)

---

## 4. 한국수출입은행 환율 API (AP01)

- 공식 문서: https://www.koreaexim.go.kr/ir/HPHKIR020M01?apino=2&viewtype=C (인증키 신청도 이 페이지 → 회원가입 후 "인증키 신청")
- data.go.kr 미러: https://www.data.go.kr/data/3068846/openapi.do (LINK형, 자동승인)
- 엔드포인트(검증됨 — 실호출, 2026-09-05):
```
GET https://oapi.koreaexim.go.kr/site/program/financial/exchangeJSON?authkey={KEY}&searchdate=20260905&data=AP01
```
- 도메인 변경 공지(검증됨): 2025-06-25부로 `oapi.koreaexim.go.kr`, 기존 `www.koreaexim.go.kr` 병행 운영 종료(문서상 2026-04-30). **반드시 oapi 사용.**
- 파라미터: `authkey`(필수), `searchdate`(선택, YYYYMMDD 또는 YYYY-MM-DD, 미지정 시 당일), `data`(필수: AP01 환율 / AP02 대출금리 / AP03 국제금리).
- 응답 필드(검증됨): `result`(1 성공, 2 DATA코드 오류, 3 인증코드 오류, 4 일일제한횟수 마감), `cur_unit`(USD, JPY(100), CNH, EUR ...), `cur_nm`, `ttb`(송금받을때), `tts`(송금보낼때), `deal_bas_r`(매매기준율), `bkpr`(장부가격), `yy_efee_r`, `ten_dd_efee_r`, `kftc_deal_bas_r`, `kftc_bkpr`.
- 실측 오류 응답(키 오류): `[{"result":3,"cur_unit":null,"ttb":null,...,"cur_nm":null}]` — 오류도 HTTP 200 + 배열 1개로 옴.
- 정상 응답 예(구조 검증됨):
```json
[{"result":1,"cur_unit":"USD","ttb":"1,335.12","tts":"1,362.08","deal_bas_r":"1,348.6","bkpr":"1,348","yy_efee_r":"0","ten_dd_efee_r":"0","kftc_bkpr":"1,348","kftc_deal_bas_r":"1,348.6","cur_nm":"미국 달러"}, ...]
```
  값은 콤마 포함 문자열 → `parseFloat(v.replace(/,/g,''))`. `JPY(100)`, `IDR(100)` 등은 100단위 기준.
- 제한/주의(검증됨 — 문서 원문): 일 1,000건; "영업일 11시 전후로 업데이트"; 비영업일(주말·공휴일) 또는 당일 11시 이전 조회 시 **빈 배열/null** → 직전 영업일로 되돌려 재조회하는 폴백 필요(최대 5~7일 루프).
- CORS(검증됨 — 실측): 응답에 `Access-Control-Allow-Origin` 헤더 **없음** → 브라우저 직접 호출 불가. 프록시 경유 + 하루 1회 캐시(1,000건/일 제한 대비) 필수. HTTPS 지원.

검증 상태: **검증됨**

---

## 5. 외국인용 지도

### 5-1. Google Maps Platform (검증됨)
- 요금: https://mapsplatform.google.com/pricing/ , https://developers.google.com/maps/billing-and-pricing/pricing
- 2025-03-01부로 $200 크레딧 폐지 → SKU별 월 무료 호출: **Essentials 10,000 / Pro 5,000 / Enterprise 1,000**. Maps JavaScript API Dynamic Maps(Essentials) 월 10,000 로드 무료, 초과 $7.00/1,000(10만 건 이하 구간). Places Autocomplete 등도 SKU별 10,000 무료.
- 요구사항: 프로젝트에 **결제 계정 필수** + API 키(HTTP referrer 제한 권장). 키가 프론트에 노출되는 구조라 referrer 제한이 유일한 방어.
- 한국 지도데이터 반출(검증됨): 2026-02-27 국토지리정보원 협의체가 Google의 1:5,000 지도 반출을 **조건부 승인**(국내 서버 처리, 군사시설 삭제, 좌표 표시 제한, 국내 책임자 상주, 정부 사전검증). 2026-08-27 Google이 "full-functioning Google Maps capabilities... includes turn-by-turn directions" 준비 발표(한국 파트너십 매니저 채용). **출시일 미정, 2026-09 현재 도보/자동차 턴바이턴 내비 미지원.**
- 현재 실제 동작(부분검증 — 2차 출처 다수 일치): 지도 표시·장소 검색·리뷰·**대중교통 길찾기는 정상**, 도보·자동차 경로는 미제공/불완전. Directions/Routes API로 한국 내 `mode=transit`은 동작, `walking`/`driving`은 `ZERO_RESULTS` 가능성 높음 → 앱에서는 transit만 사용하거나 도보는 직선거리 표기.

### 5-2. Leaflet + OpenStreetMap 타일 (검증됨)
- 타일 정책: https://operations.osmfoundation.org/policies/tiles/
- 무료·키 불필요. 요구사항(원문): "Send a clear, unique User-Agent string"(웹은 유효한 `Referer` 필요), 저작권 표시 필수("Show OpenStreetMap licence attribution clearly on the map"), 대량 선다운로드/오프라인 금지, `Cache-Control: no-cache` 금지, 캐시 헤더 준수.
- 한계: 기본 `tile.openstreetmap.org` 타일은 `name` 태그(한글) 기준 렌더링 → **영문 라벨 아님**. 영문 라벨 필요 시 다국어 타일 제공자 사용:
  - CARTO Voyager/Positron: 무료 티어 월 5,000,000 타일, **2025년 이후 API 키 필수**, 라스터 PNG는 단계적 폐지 예고 → 벡터 타일(MapLibre) 권장. 저작권 CARTO+OSM 표기.
  - MapTiler / OpenMapTiles: 무료 플랜 있음, `name:en` 표기 가능, 키 필요.
  - 대안: Leaflet 위에 자체 마커/툴팁을 영문으로 렌더링하고 배경 타일은 한글 그대로 두는 절충안(OSM 정책 위반 없음).
- 라이브러리: `https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js` (아티팩트 CDN 허용 목록 내). 타일 이미지는 CSP상 외부 이미지가 차단되는 환경(Claude 아티팩트)에서는 표시 불가 — GitHub Pages 배포에서는 문제 없음.

### 5-3. Kakao Map JS SDK (검증됨)
- 문서: https://developers.kakao.com/docs/latest/ko/kakaomap/common , https://apis.map.kakao.com/web/guide/ , 쿼터: https://developers.kakao.com/docs/latest/ko/getting-started/quota
- 포함: `<script src="//dapi.kakao.com/v2/maps/sdk.js?appkey={JavaScript키}&libraries=services,clusterer"></script>`
- 절차: developers.kakao.com 앱 생성 → [플랫폼 키] JavaScript 키 → **Web 플랫폼 사이트 도메인 등록 필수**("등록된 사이트 도메인에서만 지도API를 사용할 수 있기 때문에 반드시 등록") → GitHub Pages 도메인(`https://soonryu74.github.io`) 등록.
- 쿼터(2026 정책, 원문): Map Web SDK 일 300,000건 무료, 로컬 REST(키워드/주소) 일 100,000건, 길찾기(대중교통/도보/자전거) 일 1,000건, 전체 월 3,000,000건. **"Kakao Map APIs provide free quotas only to the first app activated per developer account"** (2026-07-21 시행), 두 번째 앱부터/초과분은 Biz Wallet 연결 후 과금(2026-02-02~12-31 80% 할인: SDK 0.1원/건, 장소검색 2원/건, 길찾기 10원/건).
- **영문 라벨: 미지원** (검증됨 — Kakao DevTalk 공식 답변: 2019-04 "현재 지도 영문 API에 대해서는 지원 계획이 잡혀 있지 않습니다", 2024-10-28 "아직까지는 SDK로 영문지원을 제공할 계획은 없는 것으로 알고 있습니다"). 외국인 대상 앱의 기본 지도로는 부적합. 로컬 REST API도 한글 입출력 위주.

권장 조합: 기본 Leaflet + 영문 벡터/라스터 타일(CARTO 또는 MapTiler 키) — 무료·키 노출 위험 낮음. 길찾기는 Google Maps 딥링크(`https://www.google.com/maps/dir/?api=1&destination=lat,lng&travelmode=transit`)로 외부 이동. Google JS API는 월 1만 로드 이내면 무료지만 결제계정 등록 부담.

검증 상태: **검증됨** (Google 현행 도보/자동차 동작 여부만 부분검증)

---

## 6. 서울 외 전국 관광지 혼잡도(실시간/예측) API

### 6-1. 한국관광공사_관광지 집중률 방문자 추이 예측 정보 — **유일한 전국 단위 공개 API** (검증됨)
- 문서: https://www.data.go.kr/data/15128555/openapi.do (등록 2024-06-12, 최종수정 2026-05-19, 개발계정 1,000건/일, 자동승인, JSON+XML)
- 엔드포인트(검증됨 — 문서 스크래핑):
```
https://apis.data.go.kr/B551011/TatsCnctrRateService/tatsCnctrRatedList?serviceKey={KEY}&MobileOS=ETC&MobileApp=KoreaTrip&_type=json&numOfRows=100&pageNo=1&areaCd=11&signguCd=11110
```
- 요청 파라미터(검증됨): `serviceKey`, `MobileOS`, `MobileApp`, `_type`, `numOfRows`, `pageNo`, `areaCd`(지역코드, 필수), `signguCd`(시군구코드, 필수), `tAtsNm`(관광지명, 옵션). (areaCd/signguCd 형식은 TourAPI 지역코드 체계 — 법정동 코드인지 구 areaCode인지 **UNVERIFIED**, 매뉴얼 zip "개방 데이터 활용 매뉴얼(관광지 집중률 방문자 추이 예측 정보)v4.1.zip" 참조.)
- 응답 필드(검증됨): `header{resultCode,resultMsg}`, `body{items{item[{baseYmd(기준연월일), areaCd, areaNm, signguCd, signguNm, tAtsNm(관광지명), cnctrRate(집중률)}]}, numOfRows, pageNo, totalCount}`.
- 의미(문서 원문): KT 이동통신 데이터 기반, 2018년 이후 방문 패턴 ML 학습, **"향후 30일간의 관광지 방문자의 집중률"**, 가장 붐비는 시점을 100으로 하는 상대지표. 평일/공휴일/휴가시즌 반영. **실시간이 아니라 일 단위 예측**.
- 앱 활용: 관광지별 "오늘/이번 주 붐빔 지수"로 표시(예: cnctrRate ≥70 붐빔, 40~70 보통, <40 여유 — 임계값은 자체 정의). 한글 관광지명이라 영문 매핑 테이블 필요.

### 6-2. 한국관광 데이터랩 (datalab.visitkorea.or.kr) (부분검증)
- 웹 대시보드(지역별 방문자수, 관광지 혼잡 예측 시각화)는 로그인 후 열람용. 프로그램 API는 data.go.kr의 "한국관광공사_빅데이터_지역별 방문자수_GW"(https://www.data.go.kr/data/15101972/openapi.do , 광역/기초지자체 일별 방문자수, 최종수정 2026-05-13) 및 "관광지별 연관 관광지 정보"(https://www.data.go.kr/data/15128560/openapi.do) 뿐 → 지역 단위 통계이지 관광지 실시간 혼잡도 아님.

### 6-3. 부산·제주 (검증됨 — 검색 결과 기준)
- 부산: "부산광역시_부산명소정보 서비스"(https://www.data.go.kr/data/15063481/openapi.do) — 운영시간·이용요금 등 정적 정보. 실시간 혼잡도 API **없음**.
- 제주: 제주데이터허브(https://www.jejudatahub.net/)에 관광지 기본정보·통신사 유동인구 통계는 있으나 실시간/예측 혼잡도 공개 API **없음**.
- 인천공항 혼잡도 예측, 서울 지하철 혼잡도 등은 관광지가 아님.

결론: 전국 실시간 혼잡도 공개 API는 **없음**. 서울 121곳은 서울시 실시간(1절), 그 외 지역은 6-1의 30일 예측 집중률로 대체.

검증 상태: **검증됨** (6-1 엔드포인트·필드 1차 확인 / areaCd 코드 체계만 미확인)

---

## 종합 권고 (앱 아키텍처 관점)
| 데이터 | API | 브라우저 직접 호출 | 프록시 필요 이유 |
|---|---|---|---|
| 서울 실시간 혼잡 | citydata_ppltn | 불가(HTTP only, CORS 미확인) | mixed content + 키 은닉 |
| 관광지 목록/상세 | EngService2 | 가능(CORS OK) | 키 노출·1,000건/일 보호용으로 권장 |
| 박물관 요금 | tn_pubr_public_museum_artgr_info_api | 가능(CORS OK) | 정적 JSON 번들이 더 나음 |
| 환율 | koreaexim AP01 | 불가(CORS 없음) | 하루 1회 캐시 |
| 전국 혼잡 예측 | TatsCnctrRateService | 미확인(apis.data.go.kr와 동일 게이트웨이 → 가능 추정) | 일 1회 캐시 |
| 지도 | Leaflet+영문 타일 / Google JS | 가능 | — |

프록시 1개(Cloudflare Worker 무료 10만 req/일)로 위 4종을 라우팅하고, KV/캐시로 서울 60초·환율 24시간·집중률 24시간 TTL을 두면 개발계정 쿼터 내에서 운영 가능.
