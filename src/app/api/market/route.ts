import { NextResponse } from 'next/server'
import { getTrendingSOL, searchSOL } from '@/lib/dexscreener'
import { warmCache } from '@/lib/priceCache'

export const revalidate = 30

// SOL/USDC Raydium pair — DexScreener'dan SOL fiyatı
const SOL_USDC_PAIR = 'So11111111111111111111111111111111111111112'

async function getSolPrice(): Promise<number> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 4000)
    const res = await fetch(
      `https://api.dexscreener.com/tokens/v1/solana/${SOL_USDC_PAIR}`,
      { signal: controller.signal }
    )
    clearTimeout(timeout)
    const data = await res.json()
    const price = parseFloat(Array.isArray(data) ? data[0]?.priceUsd : data?.pairs?.[0]?.priceUsd)
    return isNaN(price) || price < 1 ? 150 : price
  } catch {
    return 150
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')
  try {
    const [pairs, solPrice] = await Promise.all([
      q ? searchSOL(q) : getTrendingSOL(),
      getSolPrice(),
    ])
    // Market verisi tüm trending token fiyatlarını cache'e yazar
    warmCache(pairs)
    return NextResponse.json({ pairs, solPrice }, {
      headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' }
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
