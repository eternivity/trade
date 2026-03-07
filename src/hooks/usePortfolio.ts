'use client'
import useSWR from 'swr'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useStore } from '@/lib/store'
import type { Position, Trade, Alarm } from '@/types'

// ─── Portfolio ───────────────────────
export function usePortfolio(userId: string | undefined, isSim: boolean) {
  const { pairs } = useStore()
  const priceMap = Object.fromEntries(pairs.map(p => [p.baseToken.address, parseFloat(String(p.priceUsd || '0'))]))

  const { data, error, isLoading, mutate } = useSWR(
    userId ? `/api/portfolio?userId=${userId}&sim=${isSim}` : null,
    (url: string) => fetch(url).then((r) => r.json()),
    { refreshInterval: 30_000 }
  )

  // Realtime subscription
  useEffect(() => {
    if (!userId) return
    const sb = supabase
    const channel = sb
      .channel(`portfolio:${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'portfolio', filter: `user_id=eq.${userId}` }, () => mutate())
      .subscribe()
    return () => { sb.removeChannel(channel) }
  }, [userId, mutate])

  // Enrich with live prices
  const positions: Position[] = (data?.positions ?? []).map((p: Position) => {
    const currentPrice = priceMap[p.token_address] ?? 0
    const currentValue = p.amount * currentPrice
    const pnlUsd = (currentPrice - p.avg_cost) * p.amount
    const pnlPct = p.avg_cost > 0 ? ((currentPrice - p.avg_cost) / p.avg_cost) * 100 : 0
    return { ...p, current_price: currentPrice, current_value: currentValue, pnl_usd: pnlUsd, pnl_pct: pnlPct }
  })

  const totalValue = positions.reduce((s, p) => s + (p.current_value ?? 0), 0)
  const totalPnlUsd = positions.reduce((s, p) => s + (p.pnl_usd ?? 0), 0)
  const realizedPnl = data?.realizedPnl ?? 0

  return { positions, totalValue, totalPnlUsd, realizedPnl, error, isLoading, mutate }
}

// ─── Trade History ───────────────────
export function useHistory(userId: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR(
    userId ? `/api/history?userId=${userId}` : null,
    (url) => fetch(url).then((r) => r.json()),
    { revalidateOnFocus: false }
  )
  return { trades: (data?.trades ?? []) as Trade[], error, isLoading, mutate }
}

// ─── Alarms ──────────────────────────
export function useAlarms(userId: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR(
    userId ? `/api/alarms?userId=${userId}` : null,
    (url) => fetch(url).then((r) => r.json()),
    { refreshInterval: 15_000 }
  )

  // Realtime subscription
  useEffect(() => {
    if (!userId) return
    const sb = supabase
    const channel = sb
      .channel(`alarms:${userId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'alarms', filter: `user_id=eq.${userId}` }, () => mutate())
      .subscribe()
    return () => { sb.removeChannel(channel) }
  }, [userId, mutate])

  return { alarms: (data?.alarms ?? []) as Alarm[], error, isLoading, mutate }
}

// ─── Auth helper ─────────────────────
export function useUser() {
  const { data, mutate } = useSWR('auth-user', async () => {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  })

  // Listen for auth changes and refetch
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      mutate()
    })
    return () => subscription.unsubscribe()
  }, [mutate])

  return { user: data, refetch: mutate }
}
