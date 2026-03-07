import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('userId')
  const isSim = searchParams.get('sim') === 'true'
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

  const db = createServerClient()

  const [{ data: positions, error }, { data: histData }] = await Promise.all([
    db.from('portfolio')
      .select('*')
      .eq('user_id', userId)
      .eq('is_sim', isSim)
      .gt('amount', 0),
    db.from('trade_history')
      .select('realized_pnl')
      .eq('user_id', userId)
      .eq('is_sim', isSim)
      .eq('trade_type', 'sell'),
  ])

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const realizedPnl = (histData ?? []).reduce((sum, t) => sum + (t.realized_pnl ?? 0), 0)

  return NextResponse.json({ positions: positions ?? [], realizedPnl })
}
