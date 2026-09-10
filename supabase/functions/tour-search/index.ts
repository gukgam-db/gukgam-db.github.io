// 한국관광공사 TourAPI(영문) 프록시 — 위치 기반 주변 관광지 검색
// 시크릿: TOUR_API_KEY (data.go.kr 일반 인증키, 디코딩 값)
// 요청: POST { lat, lng, radius?: m(기본 2000), contentTypeId?: string }
// 응답은 24시간 DB 캐시(반경 100m·타입 단위)
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders, json } from '../_shared/cors.ts'
import { getSecret } from '../_shared/secret.ts'

const TTL_MS = 24 * 3600 * 1000
// 서비스 버전은 docs/korea-now-api.md 검증 결과에 맞춰 조정
const BASE = Deno.env.get('TOUR_API_BASE') ?? 'https://apis.data.go.kr/B551011/EngService2'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  let lat = 0, lng = 0, radius = 2000, contentTypeId = ''
  try {
    const b = await req.json()
    lat = Number(b.lat); lng = Number(b.lng)
    radius = Math.min(Number(b.radius) || 2000, 20000)
    contentTypeId = String(b.contentTypeId ?? '')
  } catch { /* 무시 */ }
  if (!lat || !lng) return json({ error: 'lat/lng required' }, 400)

  const cacheKey = `loc:${lat.toFixed(3)},${lng.toFixed(3)}:${radius}:${contentTypeId}`
  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const key = await getSecret(db, 'TOUR_API_KEY')
  if (!key) return json({ error: 'TOUR_API_KEY not set' }, 500)
  const { data: hit } = await db.from('tour_cache').select('payload, fetched_at').eq('key', cacheKey).maybeSingle()
  if (hit && Date.now() - new Date(hit.fetched_at).getTime() < TTL_MS) return json(hit.payload)

  const params = new URLSearchParams({
    serviceKey: key,
    MobileOS: 'ETC',
    MobileApp: 'KoreaNow',
    _type: 'json',
    mapX: String(lng),
    mapY: String(lat),
    radius: String(radius),
    numOfRows: '30',
    pageNo: '1',
    arrange: 'E',   // 거리순(대표이미지 있는 것 우선은 'S')
  })
  if (contentTypeId) params.set('contentTypeId', contentTypeId)

  try {
    const r = await fetch(`${BASE}/locationBasedList2?${params}`)
    const j = await r.json()
    const items = j?.response?.body?.items?.item ?? []
    const payload = {
      items: (Array.isArray(items) ? items : [items]).map((it: Record<string, string>) => ({
        contentId: it.contentid,
        contentTypeId: it.contenttypeid,
        title: it.title,
        addr: it.addr1,
        lat: Number(it.mapy),
        lng: Number(it.mapx),
        dist: Number(it.dist),
        image: it.firstimage || it.firstimage2 || null,
        tel: it.tel || null,
      })),
    }
    await db.from('tour_cache').upsert({ key: cacheKey, payload, fetched_at: new Date().toISOString() })
    return json(payload)
  } catch (e) {
    console.error('tour fetch failed', e)
    return json({ error: 'tour api failed' }, 502)
  }
})
