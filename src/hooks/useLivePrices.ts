'use client'
import { useEffect, useState, useRef } from 'react'

/**
 * Verilen token adresleri için sunucu taraflı rate-limited cache üzerinden
 * canlı fiyat çeker. Client her `intervalMs`'de bir /api/prices'a istek atar;
 * sunucu DexScreener'a en fazla 1/1.1s çağrı yapar (60 req/dk limiti aşılmaz).
 *
 * Portföy  (≤10 token): saniyede 1 güncelleme  → her poll'da taze veri
 * Piyasa   (~40 token): 4 saniyede 1 güncelleme → 4 batch × 1.1s rate limit
 */
export function useLivePrices(
  addresses: string[],
  intervalMs = 1000
): Record<string, number> {
  const [prices, setPrices] = useState<Record<string, number>>({})
  const timerRef = useRef<NodeJS.Timeout>()
  const key = [...addresses].sort().join(',')

  useEffect(() => {
    if (!key) return

    const poll = async () => {
      try {
        const res = await fetch(`/api/prices?tokens=${key}`, { cache: 'no-store' })
        const d   = await res.json()
        if (d.prices) setPrices(prev => ({ ...prev, ...d.prices }))
      } catch { /* sessiz — eski fiyatlar kalır */ }
    }

    poll()
    timerRef.current = setInterval(poll, intervalMs)
    return () => clearInterval(timerRef.current)
  }, [key, intervalMs])

  return prices
}
