import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('userId')
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })
  const db = createServerClient()
  const { data, error } = await db.from('alarms').select('*').eq('user_id', userId).order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ alarms: data })
}

export async function POST(req: Request) {
  const { userId, alarm } = await req.json()
  const db = createServerClient()
  const { data, error } = await db.from('alarms').insert({
    user_id: userId, symbol: alarm.symbol, token_addr: alarm.tokenAddr,
    direction: alarm.direction, target_price: alarm.targetPrice, triggered: false,
  }).select()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ alarm: data?.[0] })
}

export async function PATCH(req: Request) {
  const { alarmId } = await req.json()
  const db = createServerClient()
  await db.from('alarms').update({ triggered: true, triggered_at: new Date().toISOString() }).eq('id', alarmId)
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  const db = createServerClient()
  await db.from('alarms').delete().eq('id', id)
  return NextResponse.json({ ok: true })
}
