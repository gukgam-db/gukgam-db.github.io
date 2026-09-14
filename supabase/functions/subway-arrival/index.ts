// 서울 지하철 실시간 도착정보 프록시 (서울 열린데이터광장 · swopenapi)
// 시크릿: SEOUL_SUBWAY_API_KEY  (지하철 실시간 도착정보 전용 인증키)
// 요청: POST { station: "경복궁" }  (역 이름, '역' 없이)
// 응답: { station, arrivals: [{ line, lineId, dest, direction, trainLine, seconds, msg, where, status, express }] , updatedAt }
// 같은 역은 20초 동안 DB 캐시 재사용
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders, json } from '../_shared/cors.ts'
import { getSecret } from '../_shared/secret.ts'

const TTL_MS = 20 * 1000

// subwayId → 노선명(영문)
const LINE: Record<string, string> = {
  '1001': 'Line 1', '1002': 'Line 2', '1003': 'Line 3', '1004': 'Line 4', '1005': 'Line 5',
  '1006': 'Line 6', '1007': 'Line 7', '1008': 'Line 8', '1009': 'Line 9',
  '1061': 'Gyeongui-Jungang', '1063': 'Gyeongui-Jungang', '1065': 'AREX (Airport)', '1067': 'Gyeongchun',
  '1075': 'Suin-Bundang', '1077': 'Sinbundang', '1092': 'Ui-Sinseol', '1081': 'Gyeonggang', '1032': 'GTX-A',
  '1093': 'Seohae', '1094': 'Sillim',
}

interface Row {
  subwayId: string; updnLine: string; trainLineNm: string; bstatnNm: string
  barvlDt: string; arvlMsg2: string; arvlMsg3: string; arvlCd: string; btrainSttus?: string; recptnDt: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  let station = ''
  try { station = String((await req.json())?.station ?? '').trim().replace(/역$/, '') } catch { /* 무시 */ }
  if (!station) return json({ error: 'station required' }, 400)

  const cacheKey = `subway:${station}`
  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const key = await getSecret(db, 'SEOUL_SUBWAY_API_KEY')
  if (!key) return json({ error: 'SEOUL_SUBWAY_API_KEY not set' }, 500)
  const { data: hit } = await db.from('tour_cache').select('payload, fetched_at').eq('key', cacheKey).maybeSingle()
  if (hit && Date.now() - new Date(hit.fetched_at).getTime() < TTL_MS) return json(hit.payload)

  try {
    const url = `http://swopenapi.seoul.go.kr/api/subway/${key}/json/realtimeStationArrival/0/20/${encodeURIComponent(station)}`
    const r = await fetch(url)
    const j = await r.json()
    const rows: Row[] = j?.realtimeArrivalList ?? []
    if (!Array.isArray(rows) || rows.length === 0) {
      const msg = j?.message ?? j?.errorMessage?.message ?? 'no data'
      return json({ station, arrivals: [], updatedAt: new Date().toISOString(), note: String(msg) })
    }
    const arrivals = rows.map((x) => ({
      lineId: x.subwayId,
      line: LINE[x.subwayId] ?? x.subwayId,
      dest: x.bstatnNm,                      // 종착역 (한글)
      direction: x.updnLine,                 // 상행/하행/내선/외선
      trainLine: x.trainLineNm,              // "성수행 - 을지로입구방면"
      seconds: Number(x.barvlDt) || 0,       // 도착까지 초 (0 = 정보 없음/도착)
      msg: x.arvlMsg2,                       // "2분 후 (신도림)" / "[3]번째 전역"
      where: x.arvlMsg3,                     // 열차 현재 위치 역
      status: x.arvlCd,                      // 0 진입 1 도착 2 출발 3 전역출발 4 전역진입 5 전역도착 99 운행중
      express: x.btrainSttus === '급행' || x.btrainSttus === '특급',
    }))
    // 노선·방향별로 가장 가까운 것부터
    arrivals.sort((a, b) => a.line.localeCompare(b.line) || a.direction.localeCompare(b.direction) || (a.seconds || 9999) - (b.seconds || 9999))
    const payload = { station, arrivals, updatedAt: new Date().toISOString() }
    await db.from('tour_cache').upsert({ key: cacheKey, payload, fetched_at: new Date().toISOString() })
    return json(payload)
  } catch (e) {
    console.error('subway fetch failed', station, e)
    return json({ error: 'subway api failed' }, 502)
  }
})
