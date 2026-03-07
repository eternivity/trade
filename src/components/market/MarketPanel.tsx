'use client'
import { useState, useMemo } from 'react'
import { useMarket } from '@/hooks/useMarket'
import { useLivePrices } from '@/hooks/useLivePrices'
import type { TokenPair } from '@/types'

const fmtN = (n: number) => {
  if (!n) return '—'
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`
  return `$${n.toFixed(2)}`
}
const fmtPrice = (p: number) => {
  if (!p) return '—'
  if (p < 0.000001) return `$${p.toExponential(3)}`
  if (p < 0.0001)   return `$${p.toFixed(9)}`
  if (p < 0.01)     return `$${p.toFixed(7)}`
  if (p < 1)        return `$${p.toFixed(5)}`
  return `$${p.toFixed(4)}`
}

type SortKey = 'vol' | 'ch5m' | 'mc' | 'liq' | 'new'

// Fiyat değişimini kısa süreli görsel olarak vurgular
function FlashPrice({ value, addr }: { value: string; addr: string }) {
  return <span className="mono font-medium tabular-nums">{value}</span>
}

export function MarketPanel({ onTrade }: { onTrade: (p: TokenPair) => void }) {
  const { pairs, isLoading, refresh } = useMarket()
  const [sort, setSort]   = useState<SortKey>('vol')
  const [query, setQuery] = useState('')

  // Piyasadaki tüm token'ların canlı fiyatları — her 1s'de poll, sunucu cache'den cevaplar
  const tokenAddrs = useMemo(() => pairs.map(p => p.baseToken.address), [pairs])
  const livePrices = useLivePrices(tokenAddrs, 1000)

  const stats = useMemo(() => {
    const changes = pairs.map(p => p.priceChange?.m5 ?? 0)
    return {
      total:  pairs.length,
      topVol: Math.max(...pairs.map(p => p.volume?.h24 ?? 0), 0),
      ups:    changes.filter(c => c > 0).length,
      dns:    changes.filter(c => c < 0).length,
    }
  }, [pairs])

  const sorted = useMemo(() => {
    let data = pairs.filter(p =>
      !query ||
      p.baseToken?.symbol?.toLowerCase().includes(query.toLowerCase()) ||
      p.baseToken?.name?.toLowerCase().includes(query.toLowerCase())
    )
    return [...data].sort((a, b) => {
      if (sort === 'vol')  return (b.volume?.h24 ?? 0)    - (a.volume?.h24 ?? 0)
      if (sort === 'ch5m') return (b.priceChange?.m5 ?? 0) - (a.priceChange?.m5 ?? 0)
      if (sort === 'mc')   return (b.marketCap ?? 0)       - (a.marketCap ?? 0)
      if (sort === 'liq')  return (b.liquidity?.usd ?? 0)  - (a.liquidity?.usd ?? 0)
      if (sort === 'new')  return (b.pairCreatedAt ?? 0)   - (a.pairCreatedAt ?? 0)
      return 0
    })
  }, [pairs, sort, query])

  const SORTS: { key: SortKey; label: string }[] = [
    { key: 'vol',  label: 'Hacim'     },
    { key: 'ch5m', label: '5dk Trend' },
    { key: 'mc',   label: 'Piyasa D.' },
    { key: 'liq',  label: 'Likidite'  },
    { key: 'new',  label: 'Yeni'      },
  ]

  return (
    <div className="space-y-4 w-full min-w-0">

      {/* Stats kartları */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Toplam Token', val: stats.total, color: 'var(--cyan)',  icon: '◉' },
          { label: 'En Yüksek Hacim', val: fmtN(stats.topVol), color: 'var(--text)', icon: '📈' },
          { label: 'Yükselenler', val: `${stats.ups}`, color: 'var(--green)', icon: '▲' },
          { label: 'Düşenler',    val: `${stats.dns}`, color: 'var(--red)',   icon: '▼' },
        ].map(s => (
          <div key={s.label} className="card p-4">
            <div className="text-[11px] text-[var(--muted)] mb-2 flex items-center gap-1.5">
              <span>{s.icon}</span>{s.label}
            </div>
            <div className="text-xl font-bold mono" style={{ color: s.color }}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Sort butonları */}
        <div className="flex items-center bg-[var(--bg2)] rounded-lg p-0.5 gap-0.5">
          {SORTS.map(b => (
            <button
              key={b.key}
              onClick={() => setSort(b.key)}
              className={`px-3 py-1.5 rounded-md text-[11px] font-medium transition-all ${
                sort === b.key
                  ? 'bg-[var(--bg3)] text-[var(--text)]'
                  : 'text-[var(--muted)] hover:text-[var(--text)]'
              }`}
            >{b.label}</button>
          ))}
        </div>

        {/* Arama */}
        <div className="relative flex-1 min-w-[160px] max-w-xs">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)] text-xs">🔍</span>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Token ara…"
            className="w-full bg-[var(--bg2)] border border-[var(--border)] text-[var(--text)] pl-8 pr-3 py-2 rounded-lg text-[12px] outline-none focus:border-[var(--border2)] transition-colors placeholder:text-[var(--muted2)]"
          />
        </div>

        {/* Yenile */}
        <button
          onClick={() => refresh()}
          className="btn btn-outline ml-auto"
          title="Yenile"
        >⟳ Yenile</button>
      </div>

      {/* Tablo — mobilde yatay kaydırma, sayfa genişliği sabit */}
      <div className="card overflow-hidden w-full">
        <div className="table-scroll w-full min-w-0">
          <div className="min-w-[640px] sm:min-w-0">
            {/* Header */}
            <div className="grid grid-cols-[32px_2fr_1fr_90px_90px_1fr_88px] gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 border-b border-[var(--border)] text-[10px] font-semibold tracking-wider text-[var(--muted2)] uppercase">
              <span>#</span>
              <span>Token</span>
              <span>Fiyat</span>
              <span>5dk</span>
              <span>1sa</span>
              <span>Hacim 24s</span>
              <span></span>
            </div>

            {/* Rows */}
            {isLoading ? (
          <div className="flex flex-col items-center py-16 gap-3">
            <div className="w-7 h-7 rounded-full border-2 border-[var(--border2)] border-t-[var(--cyan)] spin" />
            <div className="text-[12px] text-[var(--muted)]">Veriler yükleniyor…</div>
          </div>
        ) : sorted.length === 0 ? (
          <div className="py-12 text-center text-[13px] text-[var(--muted)]">Sonuç bulunamadı.</div>
        ) : (
          sorted.map((p, i) => {
            const sym        = p.baseToken?.symbol || '?'
            const basePrice  = parseFloat(p.priceUsd || '0')
            const livePrice  = livePrices[p.baseToken.address] ?? basePrice
            const price      = livePrice || basePrice
            const ch5   = p.priceChange?.m5 ?? 0
            const ch1h  = p.priceChange?.h1 ?? 0
            const img   = p.info?.imageUrl
            return (
              <div
                key={p.pairAddress}
                onClick={() => onTrade(p)}
                className="trow grid grid-cols-[32px_2fr_1fr_90px_90px_1fr_88px] gap-2 sm:gap-3 px-3 sm:px-4 py-3 border-b border-[var(--border)] last:border-0 items-center min-w-0"
              >
                <span className="text-[11px] text-[var(--muted2)] mono">{i + 1}</span>

                {/* Token */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center text-[12px] font-bold text-black"
                    style={{ background: 'linear-gradient(135deg, #9945FF, #14F195)' }}>
                    {img
                      ? <img src={img} alt={sym} className="w-full h-full object-cover"
                          onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                      : sym[0]}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold text-white truncate">{sym}</div>
                    <div className="text-[10px] text-[var(--muted2)] mono truncate">
                      {p.baseToken?.address?.slice(0, 6)}…{p.baseToken?.address?.slice(-4)}
                    </div>
                  </div>
                </div>

                {/* Fiyat */}
                <div className="text-[12px] mono font-medium">{fmtPrice(price)}</div>

                {/* 5dk */}
                <span className={`badge ${ch5 >= 0 ? 'badge-up' : 'badge-down'}`}>
                  {ch5 >= 0 ? '▲' : '▼'} {Math.abs(ch5).toFixed(2)}%
                </span>

                {/* 1sa */}
                <span className={`badge ${ch1h >= 0 ? 'badge-up' : 'badge-down'}`}>
                  {ch1h >= 0 ? '▲' : '▼'} {Math.abs(ch1h).toFixed(2)}%
                </span>

                {/* Hacim */}
                <div className="text-[12px] mono text-[var(--muted)]">{fmtN(p.volume?.h24 ?? 0)}</div>

                {/* Trade butonu */}
                <button
                  onClick={e => { e.stopPropagation(); onTrade(p) }}
                  className="px-3 py-2 sm:py-1.5 rounded-lg bg-[var(--cyan-bg)] border border-[rgba(20,241,149,0.25)] text-[var(--cyan)] text-[11px] font-semibold hover:bg-[var(--cyan)] hover:text-black transition-all min-h-[40px] sm:min-h-0"
                >Trade →</button>
              </div>
            )
          })
        )}
          </div>
        </div>
      </div>
    </div>
  )
}
