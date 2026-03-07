'use client'
import { useState } from 'react'
import { useStore } from '@/lib/store'
import { usePortfolio } from '@/hooks/usePortfolio'
import { useLivePrices } from '@/hooks/useLivePrices'
import { TradeModal } from '@/components/trade/TradeModal'
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

interface Props {
  pair: TokenPair
  onClose: () => void
}

type TimeFrame = '5m' | '15m' | '1h' | '4h' | '1d'

export function ChartView({ pair, onClose }: Props) {
  const [tf, setTf]           = useState<TimeFrame>('15m')
  const [tradeOpen, setTrade] = useState(false)
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy')

  const { userId } = useStore()
  const { positions } = usePortfolio(userId ?? undefined, true)
  const livePrices       = useLivePrices([pair.baseToken.address], 1000)

  const sym     = pair.baseToken?.symbol || '?'
  const addr    = pair.baseToken?.address || ''
  const liveP   = livePrices[addr] ?? parseFloat(pair.priceUsd || '0')
  const ch5     = pair.priceChange?.m5  ?? 0
  const ch1h    = pair.priceChange?.h1  ?? 0
  const ch24    = pair.priceChange?.h24 ?? 0
  const pos     = positions.find(p => p.token_address === addr)
  const img     = pair.info?.imageUrl

  // DexScreener embed URL — dark theme, sadece chart
  const chartUrl = `https://dexscreener.com/solana/${pair.pairAddress}?embed=1&theme=dark&info=0&trades=0&interval=${tf}`

  const TF_LIST: { key: TimeFrame; label: string }[] = [
    { key: '5m',  label: '5d'  },
    { key: '15m', label: '15d' },
    { key: '1h',  label: '1s'  },
    { key: '4h',  label: '4s'  },
    { key: '1d',  label: '1G'  },
  ]

  const stats = [
    { l: 'Hacim 24s',  v: fmtN(pair.volume?.h24  ?? 0) },
    { l: 'Hacim 1s',   v: fmtN(pair.volume?.h1   ?? 0) },
    { l: 'Likidite',   v: fmtN(pair.liquidity?.usd ?? 0) },
    { l: 'Piyasa D.',  v: fmtN(pair.marketCap     ?? 0) },
  ]

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-[var(--bg)]">

      {/* ── Header — mobilde wrap, dokunmatik dostu ─────────────────────────────── */}
      <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 min-h-[52px] sm:h-14 border-b border-[var(--border)] bg-[var(--bg1)] flex-shrink-0 flex-wrap">
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 text-[var(--muted)] hover:text-[var(--text)] transition-colors text-[12px] min-h-[44px] sm:min-h-0 py-2 -ml-1"
        >
          ← Geri
        </button>

        <div className="w-px h-5 bg-[var(--border)]" />

        {/* Token kimliği */}
        <div className="flex items-center gap-2.5">
          {img
            ? <img src={img} alt={sym} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
            : <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold text-black"
                style={{ background: 'linear-gradient(135deg, #9945FF, #14F195)' }}>{sym[0]}</div>
          }
          <div>
            <div className="text-[14px] font-bold leading-tight">{sym}</div>
            <div className="text-[10px] text-[var(--muted2)] mono">
              {addr.slice(0, 8)}…{addr.slice(-6)}
            </div>
          </div>
        </div>

        {/* Anlık fiyat */}
        <div className="ml-1">
          <div className="text-[15px] font-bold mono">{fmtPrice(liveP)}</div>
          <div className={`text-[10px] font-semibold ${ch24 >= 0 ? 'text-[var(--green)]' : 'text-[var(--red)]'}`}>
            {ch24 >= 0 ? '▲' : '▼'} {Math.abs(ch24).toFixed(2)}% (24s)
          </div>
        </div>

        {/* % değişimler */}
        <div className="hidden sm:flex items-center gap-2 ml-2">
          {[{ l: '5dk', v: ch5 }, { l: '1s', v: ch1h }].map(c => (
            <div key={c.l} className="text-center">
              <div className="text-[9px] text-[var(--muted2)]">{c.l}</div>
              <div className={`text-[11px] font-semibold mono ${c.v >= 0 ? 'text-[var(--green)]' : 'text-[var(--red)]'}`}>
                {c.v >= 0 ? '+' : ''}{c.v.toFixed(2)}%
              </div>
            </div>
          ))}
        </div>

        {/* Portföy pozisyonu */}
        {pos && (
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--bg3)] border border-[var(--border)]">
            <span className="text-[10px] text-[var(--muted)]">Pozisyon:</span>
            <span className="text-[11px] mono font-semibold">
              {pos.amount >= 1e6 ? `${(pos.amount/1e6).toFixed(2)}M` : pos.amount >= 1e3 ? `${(pos.amount/1e3).toFixed(2)}K` : pos.amount.toFixed(2)} {sym}
            </span>
            {pos.pnl_pct !== undefined && (
              <span className={`text-[10px] font-semibold ${(pos.pnl_pct ?? 0) >= 0 ? 'text-[var(--green)]' : 'text-[var(--red)]'}`}>
                ({(pos.pnl_pct ?? 0) >= 0 ? '+' : ''}{(pos.pnl_pct ?? 0).toFixed(2)}%)
              </span>
            )}
          </div>
        )}

        {/* Trade butonları — mobilde daha büyük dokunma alanı */}
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => { setTradeType('buy'); setTrade(true) }}
            className="px-4 py-2.5 sm:py-2 min-h-[44px] sm:min-h-0 rounded-lg bg-[var(--green)] text-black text-[12px] font-bold hover:opacity-90 transition-opacity"
          >▲ Al</button>
          {pos && (
            <button
              onClick={() => { setTradeType('sell'); setTrade(true) }}
              className="px-4 py-2.5 sm:py-2 min-h-[44px] sm:min-h-0 rounded-lg bg-[var(--red)] text-white text-[12px] font-bold hover:opacity-90 transition-opacity"
            >▼ Sat</button>
          )}
        </div>
      </div>

      {/* ── Ana içerik ──────────────────────────── */}
      <div className="flex flex-1 min-h-0">

        {/* Chart — sol, büyük */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Zaman dilimi seçici — mobilde wrap */}
          <div className="flex items-center gap-1 px-3 py-2 border-b border-[var(--border)] bg-[var(--bg1)] flex-wrap">
            <span className="text-[10px] text-[var(--muted2)] mr-1">ARALIK:</span>
            {TF_LIST.map(t => (
              <button
                key={t.key}
                onClick={() => setTf(t.key)}
                className={`px-2.5 py-1.5 sm:py-1 rounded-md text-[10px] font-semibold transition-all min-h-[36px] sm:min-h-0 ${
                  tf === t.key
                    ? 'bg-[var(--bg3)] text-[var(--text)]'
                    : 'text-[var(--muted2)] hover:text-[var(--text)]'
                }`}
              >{t.label}</button>
            ))}
            <a
              href={`https://dexscreener.com/solana/${pair.pairAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto text-[10px] text-[var(--muted2)] hover:text-[var(--cyan)] transition-colors py-1"
            >DexScreener'da aç ↗</a>
          </div>

          {/* iframe chart */}
          <div className="flex-1 bg-[#0d1117]">
            <iframe
              key={`${pair.pairAddress}-${tf}`}
              src={chartUrl}
              className="w-full h-full border-0"
              title={`${sym} Chart`}
              allow="clipboard-write"
              sandbox="allow-scripts allow-same-origin allow-popups"
            />
          </div>
        </div>

        {/* Sağ bilgi paneli — yalnızca geniş ekranda görünür */}
        <div className="hidden lg:flex flex-col w-64 border-l border-[var(--border)] bg-[var(--bg1)] overflow-y-auto">
          <div className="p-4 border-b border-[var(--border)]">
            <div className="text-[10px] text-[var(--muted2)] tracking-wider mb-3">İSTATİSTİKLER</div>
            <div className="space-y-3">
              {stats.map(s => (
                <div key={s.l} className="flex justify-between items-center">
                  <span className="text-[11px] text-[var(--muted)]">{s.l}</span>
                  <span className="text-[12px] mono font-medium">{s.v}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 border-b border-[var(--border)]">
            <div className="text-[10px] text-[var(--muted2)] tracking-wider mb-3">FİYAT DEĞİŞİMİ</div>
            <div className="space-y-2">
              {[
                { l: '5 Dakika',  v: ch5  },
                { l: '1 Saat',    v: ch1h },
                { l: '24 Saat',   v: ch24 },
                { l: '6 Saat',    v: pair.priceChange?.h6 ?? 0 },
              ].map(r => (
                <div key={r.l} className="flex justify-between items-center">
                  <span className="text-[11px] text-[var(--muted)]">{r.l}</span>
                  <span className={`badge ${r.v >= 0 ? 'badge-up' : 'badge-down'}`}>
                    {r.v >= 0 ? '▲' : '▼'} {Math.abs(r.v).toFixed(2)}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {pos && (
            <div className="p-4 border-b border-[var(--border)]">
              <div className="text-[10px] text-[var(--muted2)] tracking-wider mb-3">POZİSYONUM</div>
              <div className="space-y-2">
                {[
                  { l: 'Miktar',   v: pos.amount >= 1e6 ? `${(pos.amount/1e6).toFixed(2)}M` : pos.amount >= 1e3 ? `${(pos.amount/1e3).toFixed(2)}K` : pos.amount.toFixed(4) },
                  { l: 'Ort. Mal.', v: fmtPrice(pos.avg_cost) },
                  { l: 'Anlık',    v: fmtPrice(liveP) },
                  { l: 'K/Z',      v: `${(pos.pnl_pct ?? 0) >= 0 ? '+' : ''}${(pos.pnl_pct ?? 0).toFixed(2)}%` },
                ].map(r => (
                  <div key={r.l} className="flex justify-between items-center">
                    <span className="text-[11px] text-[var(--muted)]">{r.l}</span>
                    <span className={`text-[12px] mono font-medium ${r.l === 'K/Z' ? ((pos.pnl_pct ?? 0) >= 0 ? 'text-[var(--green)]' : 'text-[var(--red)]') : ''}`}>{r.v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Adres */}
          <div className="p-4">
            <div className="text-[10px] text-[var(--muted2)] tracking-wider mb-2">TOKEN ADRESİ</div>
            <div className="text-[10px] mono text-[var(--muted)] break-all">{addr}</div>
          </div>
        </div>
      </div>

      {/* Trade Modal overlay */}
      {tradeOpen && (
        <TradeModal
          pair={pair}
          onClose={() => setTrade(false)}
          initialType={tradeType}
        />
      )}
    </div>
  )
}
