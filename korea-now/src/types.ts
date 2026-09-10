// 앱 전체에서 쓰는 타입 정의

export type Category =
  | 'palace'      // 궁궐
  | 'museum'      // 박물관·미술관
  | 'landmark'    // 랜드마크·전망대
  | 'market'      // 전통시장
  | 'shopping'    // 쇼핑 거리
  | 'nature'      // 자연·공원
  | 'village'     // 마을·거리
  | 'temple'      // 사찰
  | 'beach'       // 해변

export type Region =
  | 'seoul' | 'busan' | 'jeju' | 'gyeongju' | 'incheon' | 'jeonju' | 'gangwon' | 'gyeonggi' | 'suwon'

export interface Spot {
  id: string
  name: string            // 영어 이름
  nameKo: string          // 한국어 이름 (택시 기사에게 보여주기용)
  category: Category
  region: Region
  lat: number
  lng: number
  fee: {
    adult: number         // 원 단위. 0 = 무료
    note?: string         // 할인·무료 조건 (예: 한복 착용 시 무료)
  }
  hours?: { open: string; close: string }   // "09:00" 형식, 마지막 입장은 note에
  hoursNote?: string
  closedDays: number[]    // 0=일 ... 6=토. 빈 배열 = 연중무휴
  closedNote?: string     // 예: "Closed on Lunar New Year"
  cardOk: boolean         // 카드 결제 가능 여부(입장·대부분 상점)
  english: 'good' | 'some' | 'little'   // 영어 안내 수준
  seoulArea?: string      // 서울시 실시간 도시데이터 AREA_NM (서울만)
  lDong?: { area: string; signgu: string }   // 법정동 시도·시군구 코드 (관광공사 30일 예측용)
  ktoName?: string        // 관광공사 예측 데이터의 관광지명이 nameKo와 다를 때 지정
  station?: { name: string; nameEn: string; lines: string[]; walkMin: number }   // 가장 가까운 지하철역 (서울)
  popularity: 1 | 2 | 3 | 4 | 5   // 데모 혼잡도 계산용 (5=항상 붐빔)
  tags: string[]
  tip: string             // 한 줄 현지 팁
  feeCheckedAt: string    // 입장료 확인일 (YYYY-MM)
}

export type CongestionLevel = 'relaxed' | 'normal' | 'busy' | 'crowded'

export interface ForecastSlot {
  time: string            // ISO 문자열 (Asia/Seoul 기준 시각)
  level: CongestionLevel
  min: number
  max: number
}

export interface Congestion {
  level: CongestionLevel
  min: number
  max: number
  updatedAt: string
  forecast: ForecastSlot[]
  source: 'seoul-live' | 'kto-forecast' | 'demo'
  daily?: DailyRate[]     // 관광공사 30일 예측 (서울 외)
}

export interface DailyRate {
  date: string            // YYYYMMDD
  rate: number            // 0~100, 가장 붐비는 날 = 100
}

export interface FxRate {
  usdKrw: number
  jpyKrw: number   // 100엔 기준
  cnyKrw: number
  eurKrw: number
  date: string
  source: 'koreaexim' | 'demo'
}
