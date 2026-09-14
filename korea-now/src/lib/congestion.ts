// 혼잡도 계산·변환
// 1) 서울시 실시간 도시데이터 응답 → 앱 공통 형식
// 2) 실시간 데이터가 없는 곳(서울 외, 키 미설정, 오류)은 시간대 곡선으로 데모 혼잡도를 만든다
import type { Congestion, CongestionLevel, DailyRate, ForecastSlot, Spot } from '../types'
import { nowInSeoul } from './hours'
import { openStatus } from './hours'

export const LEVEL_ORDER: CongestionLevel[] = ['relaxed', 'normal', 'busy', 'crowded']

export const LEVEL_META: Record<CongestionLevel, { label: string; color: string; bg: string; emoji: string }> = {
  relaxed: { label: 'Quiet', color: '#15803d', bg: '#dcfce7', emoji: '🟢' },
  normal: { label: 'Normal', color: '#a16207', bg: '#fef9c3', emoji: '🟡' },
  busy: { label: 'Busy', color: '#c2410c', bg: '#ffedd5', emoji: '🟠' },
  crowded: { label: 'Crowded', color: '#b91c1c', bg: '#fee2e2', emoji: '🔴' },
}

// 서울시 API의 한국어 등급 → 앱 등급
export function levelFromSeoul(ko: string): CongestionLevel {
  if (ko.includes('붐빔')) return ko.includes('약간') ? 'busy' : 'crowded'
  if (ko.includes('보통')) return 'normal'
  return 'relaxed'
}

// ── 데모 곡선 ──────────────────────────────────────────────
// 카테고리별 하루 혼잡 곡선(0~1). 인덱스 = 시(hour)
const CURVES: Record<Spot['category'], number[]> = {
  //          0    1    2    3    4    5    6    7    8    9    10   11   12   13   14   15   16   17   18   19   20   21   22   23
  palace:   [0, 0, 0, 0, 0, 0, 0, 0, .05, .25, .55, .8, .85, .9, .85, .7, .5, .3, .1, .05, 0, 0, 0, 0],
  museum:   [0, 0, 0, 0, 0, 0, 0, 0, 0, .1, .35, .6, .7, .8, .85, .8, .6, .35, .15, .1, .05, 0, 0, 0],
  landmark: [.05, .02, 0, 0, 0, 0, .02, .05, .1, .2, .35, .5, .6, .65, .7, .7, .75, .85, .95, 1, .95, .8, .5, .2],
  market:   [.05, .02, 0, 0, 0, .05, .1, .2, .3, .4, .55, .8, .95, .85, .7, .65, .7, .85, .95, .9, .7, .5, .3, .1],
  shopping: [.1, .05, .02, 0, 0, 0, 0, .02, .05, .15, .3, .45, .6, .7, .8, .85, .9, .95, 1, 1, .9, .7, .4, .2],
  nature:   [.02, 0, 0, 0, 0, .05, .15, .25, .3, .4, .55, .65, .6, .6, .65, .7, .7, .75, .7, .5, .3, .15, .05, .02],
  village:  [.05, .02, 0, 0, 0, 0, .02, .05, .1, .25, .45, .7, .85, .95, 1, .95, .85, .7, .55, .45, .3, .15, .1, .05],
  temple:   [0, 0, 0, 0, .05, .2, .3, .3, .35, .5, .7, .8, .8, .75, .7, .6, .45, .3, .1, .02, 0, 0, 0, 0],
  beach:    [.05, .02, 0, 0, 0, .05, .1, .15, .25, .4, .55, .7, .8, .85, .9, .9, .85, .8, .75, .7, .6, .45, .3, .15],
}

function levelFromScore(s: number): CongestionLevel {
  if (s < 0.3) return 'relaxed'
  if (s < 0.55) return 'normal'
  if (s < 0.8) return 'busy'
  return 'crowded'
}

// 주말·인기도 가중치를 곱한 점수 (0~1.2 정도)
function demoScore(spot: Spot, d: Date): number {
  const base = CURVES[spot.category][d.getHours()]
  const weekend = d.getDay() === 0 || d.getDay() === 6 ? 1.25 : 1
  const pop = 0.55 + spot.popularity * 0.12   // 1→0.67, 5→1.15
  return Math.min(1.2, base * weekend * pop)
}

export function demoCongestion(spot: Spot, now: Date = nowInSeoul()): Congestion {
  const cur = demoScore(spot, now)
  const scale = 300 + spot.popularity * 900   // 대략적인 인원 규모
  const forecast: ForecastSlot[] = []
  for (let i = 1; i <= 12; i++) {
    const t = new Date(now.getTime() + i * 3600 * 1000)
    t.setMinutes(0, 0, 0)
    const s = demoScore(spot, t)
    forecast.push({
      time: t.toISOString(),
      level: levelFromScore(s),
      min: Math.round((s * scale) / 100) * 100,
      max: Math.round((s * scale * 1.3) / 100) * 100,
    })
  }
  return {
    level: levelFromScore(cur),
    min: Math.round((cur * scale) / 100) * 100,
    max: Math.round((cur * scale * 1.3) / 100) * 100,
    updatedAt: now.toISOString(),
    forecast,
    source: 'demo',
  }
}

// ── 관광공사 30일 예측(집중률 0~100) → 앱 형식 ─────────────
// 집중률: 향후 30일 중 가장 붐비는 날 = 100. 일 단위라서 시간대 모양은 데모 곡선을 빌린다.
export function levelFromRate(rate: number): CongestionLevel {
  if (rate >= 70) return 'crowded'
  if (rate >= 50) return 'busy'
  if (rate >= 30) return 'normal'
  return 'relaxed'
}

export function ymdSeoul(d: Date): string {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), day = String(d.getDate()).padStart(2, '0')
  return `${y}${m}${day}`
}

export function forecastCongestion(spot: Spot, daily: DailyRate[], now: Date = nowInSeoul()): Congestion | null {
  const today = daily.find((d) => d.date === ymdSeoul(now)) ?? daily[0]
  if (!today) return null
  // 오늘 집중률로 데모 곡선의 높이를 조정: 100이면 곡선 그대로, 30이면 절반 이하
  const factor = 0.35 + (today.rate / 100) * 0.85
  const base = demoCongestion(spot, now)
  const scale = (s: number) => Math.min(1.2, s * factor)
  const scoreOf = (c: { min: number; max: number }) => c.max === 0 ? 0 : c.min / (300 + spot.popularity * 900)
  const forecast: ForecastSlot[] = base.forecast.map((f) => {
    const sc = scale(scoreOf(f))
    return { ...f, level: levelFromScore(sc), min: Math.round((sc * (300 + spot.popularity * 900)) / 100) * 100, max: Math.round((sc * (300 + spot.popularity * 900) * 1.3) / 100) * 100 }
  })
  const cur = scale(scoreOf(base))
  return {
    level: levelFromScore(Math.max(cur, today.rate >= 70 ? 0.8 : 0)),
    min: Math.round((cur * (300 + spot.popularity * 900)) / 100) * 100,
    max: Math.round((cur * (300 + spot.popularity * 900) * 1.3) / 100) * 100,
    updatedAt: now.toISOString(),
    forecast,
    source: 'kto-forecast',
    daily: daily.slice(0, 14),
  }
}

// ── 추천 시각 ──────────────────────────────────────────────
export interface BestTime {
  slot: ForecastSlot | null      // null = 앞으로 12시간 내 한산한 시간 없음
  reason: string
}

// 앞으로 12시간 안에서 "열려 있고 + 가장 한산한" 시간대를 찾는다
// 예측 슬롯 시각에 그곳이 열려 있는지
export function isOpenAt(spot: Spot, iso: string): boolean {
  const d = new Date(new Date(iso).toLocaleString('en-US', { timeZone: 'Asia/Seoul' }))
  const st = openStatus(spot, d)
  return st.state === 'open' || st.state === 'always'
}

export function bestTime(spot: Spot, c: Congestion): BestTime {
  const nowSt = openStatus(spot)
  const openNow = nowSt.state === 'open' || nowSt.state === 'always'
  if (openNow && c.level === 'relaxed') return { slot: null, reason: "It's quiet right now — go." }
  const candidates = c.forecast.filter((f) => isOpenAt(spot, f.time))
  if (candidates.length === 0) {
    return { slot: null, reason: nowSt.state === 'closed-today' ? 'Closed today — check tomorrow.' : 'Not open in the next 12 hours.' }
  }
  const quiet = candidates.find((f) => f.level === 'relaxed') ?? candidates.find((f) => f.level === 'normal')
  if (!quiet) return { slot: null, reason: 'Busy all day today — try early tomorrow.' }
  const prefix = openNow ? 'Quieter from' : 'Opens quiet at'
  return { slot: quiet, reason: `${prefix} ${hourLabel(quiet.time)}` }
}

export function hourLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', hour12: true, timeZone: 'Asia/Seoul' })
}
