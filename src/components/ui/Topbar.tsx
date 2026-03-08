'use client'
import { useStore } from '@/lib/store'
import { useAuth } from '@/hooks/useAuth'
import { useEffect } from 'react'

export function Topbar() {
  const { user, signOut } = useAuth()
  const { simSOL, setSimSOL, setUserId, solPrice } = useStore()

  useEffect(() => {
    if (!user?.id) {
      setUserId(null)
      return
    }
    setUserId(user.id)
    const init = async () => {
      try {
        const res = await fetch('/api/init', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id }) })
        const d = await res.json()
        if (d.sim_sol !== undefined) setSimSOL(d.sim_sol)
      } catch { /* sessiz */ }
    }
    init()
  }, [user?.id, setSimSOL, setUserId])

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

      {/* Kullanıcı + Çıkış */}
      <div className="ml-auto flex items-center gap-2">
        {user?.email && (
          <span className="text-[10px] sm:text-[11px] text-[var(--muted)] truncate max-w-[120px] sm:max-w-[180px]" title={user.email}>
            {user.email}
          </span>
        )}
        <button
          type="button"
          onClick={() => signOut()}
          className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium border border-[var(--border2)] text-[var(--muted)] hover:border-[var(--red)] hover:text-[var(--red)] transition-colors"
        >
          Çıkış
        </button>
      </div>
    </header>
  )
}
