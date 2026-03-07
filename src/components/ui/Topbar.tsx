'use client'
import { useStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'
import { useEffect } from 'react'

function getOrCreateDeviceId(): string {
  try {
    let id = localStorage.getItem('mt_device_id')
    if (!id) { id = crypto.randomUUID(); localStorage.setItem('mt_device_id', id) }
    return id
  } catch { return crypto.randomUUID() }
}

export function Topbar() {
  const { simSOL, setSimSOL, setUserId, solPrice } = useStore()

  useEffect(() => {
    const init = async () => {
      let userId: string | null = null
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        userId = session.user.id
      } else {
        const { data } = await supabase.auth.signInAnonymously()
        userId = data?.user?.id ?? null
      }
      if (!userId) userId = getOrCreateDeviceId()
      setUserId(userId)
      try {
        const res = await fetch('/api/init', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId }) })
        const d = await res.json()
        if (d.sim_sol !== undefined) setSimSOL(d.sim_sol)
      } catch { /* sessiz */ }
    }
    init()
  }, [setSimSOL, setUserId])

  return (
    <header className="sticky top-0 z-50 min-h-[52px] sm:h-14 w-full min-w-0 flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-2 border-b border-[var(--border)] bg-[rgba(13,17,23,0.92)] backdrop-blur-xl flex-wrap">
      {/* Site adı — logo yok */}
      <div className="min-w-0 flex-shrink-0">
        <div className="text-[12px] sm:text-[13px] font-bold tracking-wide text-white truncate">TradeSim</div>
        <div className="text-[9px] sm:text-[10px] text-[var(--muted2)] -mt-0.5 hidden sm:block">Solana Sim DEX</div>
      </div>

      <div className="w-px h-5 sm:h-6 bg-[var(--border)] flex-shrink-0 hidden sm:block" />

      {/* Sim badge — mobilde sadece ikon + kısa */}
      <div className="flex items-center px-2 sm:px-3 py-1.5 rounded-lg bg-[rgba(245,158,11,0.08)] border border-[rgba(245,158,11,0.2)] flex-shrink-0">
        <span className="text-[var(--yellow)] text-[11px] font-semibold">⚡</span>
        <span className="hidden sm:inline text-[var(--yellow)] text-[11px] font-semibold ml-1">Simülasyon</span>
        <span className="hidden md:inline text-[var(--muted2)] text-[10px] ml-1">Modu</span>
      </div>

      {/* Sim bakiye */}
      <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg bg-[var(--yellow-bg)] border border-[rgba(245,158,11,0.2)] flex-shrink-0">
        <span className="text-[var(--yellow)] text-[10px] sm:text-[11px] font-mono font-semibold">{simSOL.toFixed(2)} SOL</span>
        <span className="text-[9px] sm:text-[10px] text-[var(--muted)] font-mono">(${(simSOL * solPrice).toFixed(2)})</span>
      </div>

      {/* Canlı dot */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <div className="w-1.5 h-1.5 rounded-full bg-[var(--green)] animate-blink" />
        <span className="text-[9px] sm:text-[10px] text-[var(--muted)] font-medium hidden sm:inline">CANLI FİYATLAR</span>
      </div>

      {/* Sağ — açıklama */}
      <div className="ml-auto hidden lg:flex items-center gap-1.5 text-[10px] text-[var(--muted2)]">
        <span>Gerçek fiyatlar</span>
        <span className="text-[var(--border)]">·</span>
        <span>Simüle portföy</span>
        <span className="text-[var(--border)]">·</span>
        <span>Risk yok</span>
      </div>
    </header>
  )
}
