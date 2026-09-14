// 거리 계산과 표시 형식

export function distanceKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371
  const dLat = toRad(bLat - aLat)
  const dLng = toRad(bLng - aLng)
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(s))
}

function toRad(d: number) {
  return (d * Math.PI) / 180
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`
  if (km < 10) return `${km.toFixed(1)} km`
  return `${Math.round(km)} km`
}

// 도보 시간(분). 시속 4.5km 기준
export function walkMinutes(km: number): number {
  return Math.round((km / 4.5) * 60)
}

// 원 → "₩3,000" / "Free"
export function formatKrw(won: number): string {
  if (won === 0) return 'Free'
  return `₩${won.toLocaleString('en-US')}`
}

export const SEOUL_CENTER = { lat: 37.5665, lng: 126.978 }
