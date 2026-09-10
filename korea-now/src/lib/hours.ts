// 한국 시간(Asia/Seoul) 기준 영업 여부 판단
import type { Spot } from '../types'

export function nowInSeoul(): Date {
  // 브라우저 시간대와 무관하게 한국 시각의 "벽시계" 값을 얻는다
  const s = new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' })
  return new Date(s)
}

export type OpenStatus =
  | { state: 'open'; closesAt: string }
  | { state: 'closed-today'; reason: string }
  | { state: 'closed-now'; opensAt: string }
  | { state: 'always' }

export function openStatus(spot: Spot, now: Date = nowInSeoul()): OpenStatus {
  const day = now.getDay()
  if (spot.closedDays.includes(day)) {
    return { state: 'closed-today', reason: `Closed on ${DAY_NAMES[day]}s` }
  }
  if (!spot.hours) return { state: 'always' }
  const cur = now.getHours() * 60 + now.getMinutes()
  const open = toMin(spot.hours.open)
  const close = toMin(spot.hours.close)
  if (cur >= open && cur < close) return { state: 'open', closesAt: spot.hours.close }
  return { state: 'closed-now', opensAt: spot.hours.open }
}

function toMin(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export function closedDaysLabel(spot: Spot): string {
  if (spot.closedDays.length === 0) return spot.closedNote ?? 'Open daily'
  const names = spot.closedDays.map((d) => DAY_NAMES[d] + 's').join(', ')
  return spot.closedNote ? `${names} · ${spot.closedNote}` : names
}
