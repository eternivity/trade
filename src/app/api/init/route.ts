import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  const { userId } = await req.json()
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

  const db = createServerClient()

  // Upsert: profil varsa dokunma, yoksa oluştur (service role ile RLS bypass)
  await db
    .from('profiles')
    .upsert({ id: userId, sim_sol: 2 }, { onConflict: 'id', ignoreDuplicates: true })

  const { data, error } = await db
    .from('profiles')
    .select('sim_sol')
    .eq('id', userId)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ sim_sol: data.sim_sol })
}
