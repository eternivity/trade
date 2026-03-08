import { createClient, SupabaseClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Build sırasında env yoksa client oluşturma (Netlify vb.)
let _client: SupabaseClient | null = null
function getClient(): SupabaseClient {
  if (!url || !key) throw new Error('Supabase env vars (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY) not set')
  if (!_client) _client = createClient(url, key)
  return _client
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    return (getClient() as unknown as Record<string | symbol, unknown>)[prop]
  },
})

// Server-side client (API routes için)
export function createServerClient(): SupabaseClient {
  if (!url) throw new Error('NEXT_PUBLIC_SUPABASE_URL is required')
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || key
  if (!serviceKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY is required')
  return createClient(url, serviceKey)
}
