// API 키 읽기: 환경변수(Edge Function Secrets) → 없으면 app_secrets 테이블
import type { SupabaseClient } from 'jsr:@supabase/supabase-js@2'

export async function getSecret(db: SupabaseClient, name: string): Promise<string> {
  const env = Deno.env.get(name)
  if (env) return env
  const { data } = await db.from('app_secrets').select('value').eq('name', name).maybeSingle()
  return data?.value ?? ''
}
