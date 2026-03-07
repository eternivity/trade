import { NextResponse } from 'next/server'
import { getTokenPrices } from '@/lib/priceCache'

// Client 1.1s'de bir ister, sunucu rate-limited cache'den cevaplar
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const tokens = searchParams.get('tokens')
  if (!tokens) return NextResponse.json({ prices: {} })

  const addrs = tokens.split(',').filter(Boolean).slice(0, 50)

  try {
    const prices = await getTokenPrices(addrs)
    return NextResponse.json({ prices }, {
      headers: {
        'Cache-Control': 'no-store', // client her seferinde taze veri alsın
      },
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
