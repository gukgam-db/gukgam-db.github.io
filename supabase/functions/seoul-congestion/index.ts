// 서울시 실시간 도시데이터(citydata_ppltn) 프록시
// - 키(SEOUL_API_KEY)는 Supabase 시크릿에만 둔다
// - 같은 지역은 5분 동안 DB 캐시를 재사용해 호출량을 아낀다
// 요청: POST { areas: ["경복궁", "명동 관광특구"] }
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders, json } from '../_shared/cors.ts'
import { getSecret } from '../_shared/secret.ts'

const TTL_MS = 5 * 60 * 1000

interface Fcst { FCST_TIME: string; FCST_CONGEST_LVL: string; FCST_PPLTN_MIN: string; FCST_PPLTN_MAX: string }
interface Ppltn {
  AREA_NM: string
  AREA_CONGEST_LVL: string
  AREA_PPLTN_MIN: string
  AREA_PPLTN_MAX: string
  PPLTN_TIME: string
  FCST_PPLTN?: Fcst[]
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })


  let areas: string[] = []
  try {
    const body = await req.json()
    areas = Array.isArray(body?.areas) ? body.areas.slice(0, 40) : []
  } catch {
    /* body 없음 */
  }
  if (areas.length === 0) return json({ error: 'areas[] required' }, 400)

  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const key = await getSecret(db, 'SEOUL_API_KEY')
  if (!key) return json({ error: 'SEOUL_API_KEY not set' }, 500)
  const { data: cached } = await db.from('congestion_cache').select('area, payload, fetched_at').in('area', areas)
  const now = Date.now()
  const fresh = new Map<string, unknown>()
  for (const row of cached ?? []) {
    if (now - new Date(row.fetched_at).getTime() < TTL_MS) fresh.set(row.area, row.payload)
  }

  const results: unknown[] = []
  const toStore: { area: string; payload: unknown; fetched_at: string }[] = []

  await Promise.all(
    areas.map(async (area) => {
      if (fresh.has(area)) {
        results.push(fresh.get(area))
        return
      }
      try {
        const url = `http://openapi.seoul.go.kr:8088/${key}/json/citydata_ppltn/1/5/${encodeURIComponent(area)}`
        const r = await fetch(url)
        const j = await r.json()
        // 응답 최상위 키는 "SeoulRtd.citydata_ppltn" (버전에 따라 다를 수 있어 유연하게 찾는다)
        const list: Ppltn[] | undefined = j['SeoulRtd.citydata_ppltn'] ?? Object.values(j).find((v) => Array.isArray(v)) as Ppltn[] | undefined
        const p = list?.[0]
        if (!p) throw new Error('empty response for ' + area)
        const payload = {
          area,
          level: p.AREA_CONGEST_LVL,
          min: Number(p.AREA_PPLTN_MIN),
          max: Number(p.AREA_PPLTN_MAX),
          time: p.PPLTN_TIME,
          forecast: (p.FCST_PPLTN ?? []).map((f) => ({
            time: f.FCST_TIME,
            level: f.FCST_CONGEST_LVL,
            min: Number(f.FCST_PPLTN_MIN),
            max: Number(f.FCST_PPLTN_MAX),
          })),
        }
        results.push(payload)
        toStore.push({ area, payload, fetched_at: new Date().toISOString() })
      } catch (e) {
        console.error('seoul fetch failed', area, e)
      }
    }),
  )

  if (toStore.length) await db.from('congestion_cache').upsert(toStore)
  return json({ results })
})
