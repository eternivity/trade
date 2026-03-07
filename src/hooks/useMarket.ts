'use client'
import { useEffect, useRef, useCallback, useState } from 'react'
import { useStore } from '@/lib/store'

export function useMarket(query?: string) {
  const { setPairs, setSolPrice, pairs } = useStore()
  const [isLoading, setIsLoading] = useState(true)
  const timerRef = useRef<NodeJS.Timeout>()

  const load = useCallback(async () => {
    try {
      const url = query ? `/api/market?q=${encodeURIComponent(query)}` : '/api/market'
      const r = await fetch(url)
      const d = await r.json()
      if (d.pairs) setPairs(d.pairs)
      if (d.solPrice) setSolPrice(d.solPrice)
    } catch (e) { console.error('Market load error', e) } finally { setIsLoading(false) }
  }, [query, setPairs, setSolPrice])

  useEffect(() => {
    load()
    timerRef.current = setInterval(load, 30_000)
    return () => clearInterval(timerRef.current)
  }, [load])

  return { pairs, isLoading, refresh: load, reload: load }
}
