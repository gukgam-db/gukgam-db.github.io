// 방문 스탬프 — 브라우저 저장소(localStorage)에 보관
const KEY = 'korea-now:stamps'

export interface Stamp {
  spotId: string
  at: string   // ISO
}

export function loadStamps(): Stamp[] {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Stamp[]) : []
  } catch {
    return []
  }
}

export function hasStamp(spotId: string): boolean {
  return loadStamps().some((s) => s.spotId === spotId)
}

export function addStamp(spotId: string): Stamp[] {
  const list = loadStamps()
  if (list.some((s) => s.spotId === spotId)) return list
  const next = [...list, { spotId, at: new Date().toISOString() }]
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    /* 사생활 보호 모드 등에서 저장 실패해도 화면은 유지 */
  }
  return next
}

export function removeStamp(spotId: string): Stamp[] {
  const next = loadStamps().filter((s) => s.spotId !== spotId)
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    /* 무시 */
  }
  return next
}
