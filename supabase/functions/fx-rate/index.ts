// 한국수출입은행 환율(AP01) 프록시 — 하루 1회만 외부 호출, 나머지는 DB 캐시
// 시크릿: KOREAEXIM_API_KEY
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders, json } from '../_shared/cors.ts'
import { getSecret } from '../_shared/secret.ts'

interface Row { cur_unit: string; deal_bas_r: string; result: number }

function kstDate(offsetDays = 0): string {
  const d = new Date(Date.now() + 9 * 3600 * 1000 + offsetDays * 86400000)
  return d.toISOString().slice(0, 10)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const key = await getSecret(db, 'KOREAEXIM_API_KEY')
  if (!key) return json({ error: 'KOREAEXIM_API_KEY not set' }, 500)
  const today = kstDate()
  const { data: hit } = await db.from('fx_cache').select('payload').eq('day', today).maybeSingle()
  if (hit?.payload) return json(hit.payload)

  // 주말·공휴일엔 당일 고시가 없으므로 최근 7일을 거꾸로 훑는다
  for (let back = 0; back < 7; back++) {
    const day = kstDate(-back).replaceAll('-', '')
    const url = `https://oapi.koreaexim.go.kr/site/program/financial/exchangeJSON?authkey=${key}&searchdate=${day}&data=AP01`
    try {
      const r = await fetch(url)
      const rows = (await r.json()) as Row[]
      if (!Array.isArray(rows) || rows.length === 0) continue
      const rate = (unit: string) => {
        const row = rows.find((x) => x.cur_unit === unit)
        return row ? Number(row.deal_bas_r.replaceAll(',', '')) : NaN
      }
      const payload = {
        usdKrw: rate('USD'),
        jpyKrw: rate('JPY(100)'),
        cnyKrw: rate('CNH'),
        eurKrw: rate('EUR'),
        date: kstDate(-back),
        source: 'koreaexim',
      }
      if (Number.isNaN(payload.usdKrw)) continue
      await db.from('fx_cache').upsert({ day: today, payload })
      return json(payload)
    } catch (e) {
      console.error('fx fetch failed', day, e)
    }
  }
  return json({ error: 'no rate available' }, 502)
})
