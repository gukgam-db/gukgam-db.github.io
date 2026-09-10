// 서버(Supabase Edge Function) 호출 + 실패 시 데모 데이터로 자동 전환
// - 공공 API 키는 브라우저에 두지 않고 Edge Function 안에만 둔다
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Congestion, DailyRate, FxRate, Spot } from '../types'
import { demoCongestion, forecastCongestion, levelFromSeoul } from './congestion'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const supabase: SupabaseClient | null =
  SUPABASE_URL && SUPABASE_KEY ? createClient(SUPABASE_URL, SUPABASE_KEY) : null

export const isLive = supabase !== null

// Edge Function이 돌려주는 서울 실시간 혼잡도 형식
interface SeoulAreaResult {
  area: string
  level: string          // "여유" | "보통" | "약간 붐빔" | "붐빔"
  min: number
  max: number
  time: string           // "2026-09-05 15:05"
  forecast: { time: string; level: string; min: number; max: number }[]
}

const cache = new Map<string, { at: number; data: Congestion }>()
const TTL = 5 * 60 * 1000   // 5분

// 여러 스팟의 혼잡도를 한 번에 가져온다. 서울 실시간 가능 지역만 서버 호출, 나머지는 데모.
export async function fetchCongestion(spots: Spot[]): Promise<Record<string, Congestion>> {
  const out: Record<string, Congestion> = {}
  const need: string[] = []
  const now = Date.now()

  for (const s of spots) {
    if (!s.seoulArea || !supabase) {
      out[s.id] = demoCongestion(s)
      continue
    }
    const hit = cache.get(s.seoulArea)
    if (hit && now - hit.at < TTL) out[s.id] = hit.data
    else if (!need.includes(s.seoulArea)) need.push(s.seoulArea)
  }

  if (need.length && supabase) {
    try {
      const { data, error } = await supabase.functions.invoke<{ results: SeoulAreaResult[] }>('seoul-congestion', {
        body: { areas: need },
      })
      if (error) throw error
      for (const r of data?.results ?? []) {
        const c = normalizeSeoul(r)
        cache.set(r.area, { at: now, data: c })
      }
    } catch (e) {
      console.warn('[korea-now] live congestion unavailable, using demo curve', e)
    }
  }

  // 서울 실시간이 없는 곳: 관광공사 30일 예측(있으면) → 데모
  const ktoDaily = supabase ? await fetchKtoDaily(spots.filter((s) => !s.seoulArea && s.lDong)) : {}

  for (const s of spots) {
    if (out[s.id] && out[s.id].source !== 'demo') continue
    const hit = s.seoulArea ? cache.get(s.seoulArea) : undefined
    if (hit) { out[s.id] = hit.data; continue }
    const daily = ktoDaily[s.id]
    const fc = daily ? forecastCongestion(s, daily) : null
    out[s.id] = fc ?? demoCongestion(s)
  }
  return out
}

// ── 관광공사 30일 예측 (시군구 단위로 받아 관광지명으로 매칭) ──
interface KtoPayload { spots: Record<string, DailyRate[]> }
const KTO_TTL = 12 * 3600 * 1000

function ktoCacheGet(signgu: string): KtoPayload | null {
  try {
    const raw = localStorage.getItem(`korea-now:kto:${signgu}`)
    if (!raw) return null
    const { at, data } = JSON.parse(raw) as { at: number; data: KtoPayload }
    return Date.now() - at < KTO_TTL ? data : null
  } catch { return null }
}
function ktoCacheSet(signgu: string, data: KtoPayload) {
  try { localStorage.setItem(`korea-now:kto:${signgu}`, JSON.stringify({ at: Date.now(), data })) } catch { /* 무시 */ }
}

// 관광지명 매칭: 지정명(ktoName) → 정확히 → 공백·괄호·[태그] 제거 후 같음 → 포함
function matchName(nameKo: string, keys: string[], ktoName?: string): string | undefined {
  if (ktoName && keys.includes(ktoName)) return ktoName
  const norm = (x: string) => x.replace(/\s|\(.*?\)|\[.*?\]/g, '')
  const n = norm(nameKo)
  return keys.find((k) => k === nameKo)
    ?? keys.find((k) => norm(k) === n)
    ?? keys.find((k) => norm(k).includes(n) || n.includes(norm(k)))
}

async function fetchKtoDaily(spots: Spot[]): Promise<Record<string, DailyRate[]>> {
  const out: Record<string, DailyRate[]> = {}
  if (!supabase || spots.length === 0) return out
  const bySigngu = new Map<string, Spot[]>()
  for (const s of spots) {
    const g = s.lDong!.signgu
    bySigngu.set(g, [...(bySigngu.get(g) ?? []), s])
  }
  await Promise.all(
    [...bySigngu.entries()].map(async ([signgu, list]) => {
      let data = ktoCacheGet(signgu)
      if (!data) {
        try {
          const { data: d, error } = await supabase!.functions.invoke<KtoPayload>('tour-congestion', {
            body: { areaCd: list[0].lDong!.area, signguCd: signgu },
          })
          if (error || !d?.spots) return
          data = d
          ktoCacheSet(signgu, data)
        } catch (e) {
          console.warn('[korea-now] kto forecast unavailable', signgu, e)
          return
        }
      }
      const keys = Object.keys(data.spots)
      for (const s of list) {
        const k = matchName(s.nameKo, keys, s.ktoName)
        if (k) out[s.id] = data.spots[k]
      }
    }),
  )
  return out
}

function normalizeSeoul(r: SeoulAreaResult): Congestion {
  return {
    level: levelFromSeoul(r.level),
    min: r.min,
    max: r.max,
    updatedAt: seoulToIso(r.time),
    forecast: r.forecast.map((f) => ({
      time: seoulToIso(f.time),
      level: levelFromSeoul(f.level),
      min: f.min,
      max: f.max,
    })),
    source: 'seoul-live',
  }
}

// "2026-09-05 15:00" (KST) → ISO
function seoulToIso(s: string): string {
  return new Date(s.replace(' ', 'T') + ':00+09:00').toISOString()
}

// 환율 — 실패 시 데모값(표시에 "demo" 라벨)
const DEMO_FX: FxRate = { usdKrw: 1380, jpyKrw: 920, cnyKrw: 190, eurKrw: 1500, date: 'demo', source: 'demo' }

export async function fetchFx(): Promise<FxRate> {
  if (!supabase) return DEMO_FX
  try {
    const { data, error } = await supabase.functions.invoke<FxRate>('fx-rate')
    if (error || !data) throw error
    return data
  } catch (e) {
    console.warn('[korea-now] fx unavailable, using demo', e)
    return DEMO_FX
  }
}

// ── 주변 검색 (한국관광공사 TourAPI, Edge Function 경유) ──
export interface NearbyItem {
  contentId: string
  contentTypeId: string   // 76 관광지 · 78 문화시설 · 79 쇼핑 · 82 음식점 · 85 축제
  title: string
  addr: string
  lat: number
  lng: number
  dist: number            // m
  image: string | null
  tel: string | null
}

export const NEARBY_TYPES: { id: string; label: string; icon: string }[] = [
  { id: '', label: 'All', icon: '✨' },
  { id: '76', label: 'Sights', icon: '📍' },
  { id: '82', label: 'Food', icon: '🍜' },
  { id: '78', label: 'Culture', icon: '🏛️' },
  { id: '79', label: 'Shopping', icon: '🛍️' },
  { id: '85', label: 'Festivals', icon: '🎉' },
]

export async function fetchNearby(lat: number, lng: number, contentTypeId = '', radius = 2000): Promise<NearbyItem[]> {
  if (!supabase) throw new Error('offline')
  const { data, error } = await supabase.functions.invoke<{ items: NearbyItem[] }>('tour-search', {
    body: { lat, lng, radius, contentTypeId },
  })
  if (error) throw error
  return data?.items ?? []
}

// ── 서울 지하철 실시간 도착 (Edge Function 경유, 20초 캐시) ──
export interface Arrival {
  lineId: string
  line: string        // "Line 3"
  dest: string        // 종착역 (한글)
  direction: string   // 상행/하행/내선/외선
  trainLine: string   // "대화행 - 독립문방면"
  seconds: number     // 도착까지 초 (0 = 도착/정보 없음)
  msg: string         // "2분 후 (안국)"
  where: string       // 열차 현재 위치
  status: string      // arvlCd
  express: boolean
}
export interface ArrivalBoard { station: string; arrivals: Arrival[]; updatedAt: string; note?: string }

export async function fetchArrivals(station: string): Promise<ArrivalBoard> {
  if (!supabase) throw new Error('offline')
  const { data, error } = await supabase.functions.invoke<ArrivalBoard>('subway-arrival', { body: { station } })
  if (error || !data) throw error ?? new Error('no data')
  return data
}
