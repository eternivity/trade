import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { getTokenPrices } from '@/lib/priceCache'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const {
    userId, tradeType, tokenAddress, tokenSymbol, tokenName, tokenImage,
    amount, priceUsd, solPrice, slippageBps, currentPosition,
  } = body

  const sb = createServerClient()
  const slip = (slippageBps || 100) / 10000

  // Sunucu taraflı anlık fiyat (rate-limited cache)
  let livePrice = priceUsd
  try {
    const prices = await getTokenPrices([tokenAddress])
    if (prices[tokenAddress] > 0) livePrice = prices[tokenAddress]
  } catch { /* UI fiyatına geri dön */ }

  const effectivePrice = tradeType === 'buy' ? livePrice * (1 + slip) : livePrice * (1 - slip)

  if (tradeType === 'buy') {
    const solAmt = amount
    const solUsd = solAmt * solPrice
    const tokens = effectivePrice > 0 ? solUsd / effectivePrice : 0

    let { data: profile } = await sb.from('profiles').select('sim_sol').eq('id', userId).maybeSingle()
    if (!profile) {
      await sb.from('profiles').insert({ id: userId, sim_sol: 2 })
      profile = { sim_sol: 2 }
    }
    if (profile.sim_sol < solAmt) {
      return NextResponse.json({ error: 'Yetersiz sim SOL bakiyesi' }, { status: 400 })
    }

    const newSimSol = profile.sim_sol - solAmt
    const prevAmt  = currentPosition?.amount ?? 0
    const prevCost = currentPosition?.avg_cost ?? 0
    const totalCost = prevCost * prevAmt + effectivePrice * tokens
    const newAmt = prevAmt + tokens
    const newAvgCost = newAmt > 0 ? totalCost / newAmt : 0

    await Promise.all([
      sb.from('profiles').update({ sim_sol: newSimSol }).eq('id', userId),
      sb.from('portfolio').upsert(
        { user_id: userId, token_address: tokenAddress, token_symbol: tokenSymbol, token_name: tokenName, token_image: tokenImage, amount: newAmt, avg_cost: newAvgCost, is_sim: true, updated_at: new Date().toISOString() },
        { onConflict: 'user_id,token_address,is_sim' }
      ),
      sb.from('trade_history').insert({
        user_id: userId, token_address: tokenAddress, token_symbol: tokenSymbol,
        trade_type: 'buy', amount: tokens, price_usd: effectivePrice,
        total_usd: solUsd, is_sim: true,
      }),
    ])

    return NextResponse.json({ ok: true, newSimSol, tokensReceived: tokens, effectivePrice, livePrice })
  }

  // Sat
  const tokenAmt = amount
  if (!currentPosition || currentPosition.amount < tokenAmt) {
    return NextResponse.json({ error: 'Yetersiz token bakiyesi' }, { status: 400 })
  }

  const tokenUsd  = tokenAmt * effectivePrice
  const solBack   = tokenUsd / solPrice
  const realizedPnl = (effectivePrice - currentPosition.avg_cost) * tokenAmt

  let { data: profile } = await sb.from('profiles').select('sim_sol').eq('id', userId).maybeSingle()
  if (!profile) {
    await sb.from('profiles').insert({ id: userId, sim_sol: 2 })
    profile = { sim_sol: 2 }
  }
  const newSimSol = profile.sim_sol + solBack
  const newAmt = currentPosition.amount - tokenAmt

  await Promise.all([
    sb.from('profiles').update({ sim_sol: newSimSol }).eq('id', userId),
    newAmt > 0.000001
      ? sb.from('portfolio').update({ amount: newAmt, updated_at: new Date().toISOString() }).eq('user_id', userId).eq('token_address', tokenAddress).eq('is_sim', true)
      : sb.from('portfolio').delete().eq('user_id', userId).eq('token_address', tokenAddress).eq('is_sim', true),
    sb.from('trade_history').insert({
      user_id: userId, token_address: tokenAddress, token_symbol: tokenSymbol,
      trade_type: 'sell', amount: tokenAmt, price_usd: effectivePrice,
      total_usd: tokenUsd, realized_pnl: realizedPnl, is_sim: true,
    }),
  ])

  return NextResponse.json({ ok: true, newSimSol, realizedPnl, solReceived: solBack })
}
