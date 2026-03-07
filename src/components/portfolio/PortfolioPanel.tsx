'use client'
import { useMemo } from 'react'
import { useStore } from '@/lib/store'
import { usePortfolio, useHistory, useAlarms } from '@/hooks/usePortfolio'
import { useLivePrices } from '@/hooks/useLivePrices'
import { fmtPrice, fmtUSD, fmtPct } from '@/lib/format'
import type { TokenPair, Position } from '@/types'

interface TradeProps { onTrade?: (pair: TokenPair) => void }

// ─── Portfolio ──────────────────────────────────────────────
export function PortfolioPanel({ onTrade }: TradeProps) {
  const { simSOL, userId, pairs, solPrice } = useStore()
  const { positions: raw, realizedPnl, isLoading } = usePortfolio(userId ?? undefined, true)
  const addrs = useMemo(() => raw.map(p => p.token_address), [raw])
  const live  = useLivePrices(addrs, 1000)

  const positions = raw.map(p => {
    const cur    = live[p.token_address] ?? p.current_price ?? 0
    const pnlUsd = (cur - p.avg_cost) * p.amount
    const pnlPct = p.avg_cost > 0 ? ((cur - p.avg_cost) / p.avg_cost) * 100 : 0
    return { ...p, current_price: cur, pnl_usd: pnlUsd, pnl_pct: pnlPct }
  })

  const totalValue  = positions.reduce((s, p) => s + p.amount * (p.current_price ?? 0), 0)
  const totalPnlUsd = positions.reduce((s, p) => s + (p.pnl_usd ?? 0), 0)
  const totalBalanceUsd = simSOL * solPrice + totalValue

  function handleSell(addr: string) {
    const pair = pairs.find(p => p.baseToken.address === addr)
    if (pair && onTrade) onTrade(pair)
  }

  const fmtAmt = (n: number) => {
    if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`
    if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`
    if (n >= 1e3) return `${(n / 1e3).toFixed(2)}K`
    if (n < 0.001) return n.toExponential(2)
    return n.toFixed(4)
  }

  return (
    <div className="space-y-4 w-full min-w-0">
      {/* Stat kartları */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { l: 'Toplam Bakiye (USD)', v: fmtUSD(totalBalanceUsd), c: 'var(--cyan)' },
          { l: 'Sim SOL Bakiye',
            v: `${simSOL.toFixed(2)} SOL (${fmtUSD(simSOL * solPrice)})`,
            c: 'var(--yellow)' },
          { l: 'Token Değeri (USD)', v: fmtUSD(totalValue),   c: 'var(--cyan)'  },
          { l: 'Gerçekleşmemiş K/Z',  v: `${totalPnlUsd >= 0 ? '+' : ''}${fmtUSD(totalPnlUsd)}`,
            c: totalPnlUsd >= 0 ? 'var(--green)' : 'var(--red)' },
          { l: 'Gerçekleşen K/Z',     v: `${realizedPnl >= 0 ? '+' : ''}${fmtUSD(realizedPnl)}`,
            c: realizedPnl >= 0 ? 'var(--green)' : 'var(--red)' },
        ].map(s => (
          <div key={s.l} className="card p-4">
            <div className="text-[11px] text-[var(--muted)] mb-2">{s.l}</div>
            <div className="text-xl font-bold mono" style={{ color: s.c }}>{s.v}</div>
          </div>
        ))}
      </div>

      {/* Pozisyonlar */}
      {isLoading ? (
        <div className="card flex flex-col items-center py-16 gap-3">
          <div className="w-7 h-7 rounded-full border-2 border-[var(--border2)] border-t-[var(--cyan)] spin" />
          <div className="text-[12px] text-[var(--muted)]">Yükleniyor…</div>
        </div>
      ) : !positions.length ? (
        <div className="card flex flex-col items-center py-16 gap-2 text-[var(--muted)]">
          <div className="text-4xl">💼</div>
          <div className="text-[14px] font-medium">Portföy boş</div>
          <div className="text-[12px]">Piyasadan bir token alın.</div>
        </div>
      ) : (
        <div className="card overflow-hidden w-full">
          <div className="table-scroll w-full min-w-0">
            <div className="min-w-[680px] sm:min-w-0">
              {/* Header */}
              <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_120px_80px] gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 border-b border-[var(--border)] text-[10px] font-semibold tracking-wider text-[var(--muted2)] uppercase">
                <span>Token</span><span>Miktar</span><span>Ort. Maliyet ($)</span><span>Anlık ($)</span><span>Değer ($)</span><span>K/Z</span><span></span>
              </div>
              {positions.map(pos => {
            const pnlUp = (pos.pnl_pct ?? 0) >= 0
            const posValueUsd = pos.amount * (pos.current_price ?? 0)
            return (
              <div key={pos.token_address} className="trow grid grid-cols-[2fr_1fr_1fr_1fr_1fr_120px_80px] gap-2 sm:gap-3 px-3 sm:px-4 py-3 border-b border-[var(--border)] last:border-0 items-center min-w-0">
                {/* Token */}
                <div className="flex items-center gap-2.5 min-w-0">
                  {pos.token_image
                    ? <img src={pos.token_image} alt={pos.token_symbol} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                    : <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-[12px] font-bold text-black"
                        style={{ background: 'linear-gradient(135deg, #9945FF, #14F195)' }}>{pos.token_symbol[0]}</div>
                  }
                  <div className="min-w-0">
                    <div className="text-[13px] font-semibold truncate">{pos.token_symbol}</div>
                    <div className="text-[10px] text-[var(--muted2)] mono">{pos.token_address.slice(0, 6)}…</div>
                  </div>
                </div>
                <div className="text-[12px] mono">{fmtAmt(pos.amount)}</div>
                <div className="text-[12px] mono">{fmtPrice(pos.avg_cost)}</div>
                <div className="text-[12px] mono">{pos.current_price ? fmtPrice(pos.current_price) : '—'}</div>
                <div className="text-[12px] mono">{fmtUSD(posValueUsd)}</div>
                {/* K/Z badge */}
                <div>
                  <span className={`badge ${pnlUp ? 'badge-up' : 'badge-down'}`}>
                    {pnlUp ? '▲' : '▼'} {Math.abs(pos.pnl_pct ?? 0).toFixed(2)}%
                  </span>
                  <div className={`text-[10px] mono mt-0.5 ${pnlUp ? 'text-[var(--green)]' : 'text-[var(--red)]'}`}>
                    {(pos.pnl_usd ?? 0) >= 0 ? '+' : ''}{fmtUSD(pos.pnl_usd ?? 0)}
                  </div>
                </div>
                <button
                  onClick={() => handleSell(pos.token_address)}
                  className="px-3 py-2 sm:py-1.5 rounded-lg bg-[var(--red-bg)] border border-[rgba(239,68,68,0.25)] text-[var(--red)] text-[11px] font-semibold hover:bg-[var(--red)] hover:text-white transition-all min-h-[40px] sm:min-h-0"
                >Sat</button>
              </div>
            )
          })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── History Panel ──────────────────────────────────────────
export function HistoryPanel() {
  const { userId } = useStore()
  const { trades, isLoading } = useHistory(userId ?? undefined)
  const filtered = trades.filter(t => t.is_sim)

  return (
    <div className="space-y-4 w-full min-w-0">
      {isLoading ? (
        <div className="card flex justify-center py-16">
          <div className="w-7 h-7 rounded-full border-2 border-t-[var(--cyan)] border-[var(--border2)] spin" />
        </div>
      ) : !filtered.length ? (
        <div className="card flex flex-col items-center py-16 gap-2 text-[var(--muted)]">
          <div className="text-4xl">📋</div>
          <div className="text-[14px] font-medium">İşlem geçmişi yok</div>
        </div>
      ) : (
        <div className="card overflow-hidden w-full">
          <div className="table-scroll w-full min-w-0">
            <div className="min-w-[520px] sm:min-w-0">
              <div className="grid grid-cols-[1.5fr_80px_1fr_1fr_1fr] gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 border-b border-[var(--border)] text-[10px] font-semibold tracking-wider text-[var(--muted2)] uppercase">
                <span>Token / Zaman</span><span>Tip</span><span>Miktar</span><span>Fiyat</span><span>Toplam / K-Z</span>
              </div>
              {filtered.map(t => (
            <div key={t.id} className="grid grid-cols-[1.5fr_80px_1fr_1fr_1fr] gap-2 sm:gap-3 px-3 sm:px-4 py-3 border-b border-[var(--border)] last:border-0 items-center min-w-0">
              <div>
                <div className="text-[13px] font-semibold">{t.token_symbol}</div>
                <div className="text-[10px] text-[var(--muted2)]">{new Date(t.created_at).toLocaleString('tr-TR')}</div>
              </div>
              <span className={`badge ${t.trade_type === 'buy' ? 'badge-up' : 'badge-down'} w-fit`}>
                {t.trade_type === 'buy' ? '▲ Alış' : '▼ Satış'}
              </span>
              <div className="text-[12px] mono">
                {t.amount >= 1e6 ? `${(t.amount / 1e6).toFixed(2)}M`
                  : t.amount >= 1e3 ? `${(t.amount / 1e3).toFixed(2)}K`
                  : t.amount.toFixed(4)}
              </div>
              <div className="text-[12px] mono">{fmtPrice(t.price_usd)}</div>
              <div>
                <div className="text-[12px] mono">{fmtUSD(t.total_usd)}</div>
                {t.trade_type === 'sell' && t.realized_pnl !== undefined && (
                  <div className={`text-[10px] mono font-semibold ${(t.realized_pnl ?? 0) >= 0 ? 'text-[var(--green)]' : 'text-[var(--red)]'}`}>
                    {(t.realized_pnl ?? 0) >= 0 ? '+' : ''}{fmtUSD(t.realized_pnl ?? 0)}
                  </div>
                )}
              </div>
            </div>
          ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Alarms Panel ───────────────────────────────────────────
export function AlarmsPanel() {
  const { userId } = useStore()
  const { alarms, isLoading } = useAlarms(userId ?? undefined)

  return (
    <div className="w-full min-w-0">
      {isLoading ? (
        <div className="card flex justify-center py-16">
          <div className="w-7 h-7 rounded-full border-2 border-t-[var(--cyan)] border-[var(--border2)] spin" />
        </div>
      ) : !alarms.length ? (
        <div className="card flex flex-col items-center py-16 gap-2 text-[var(--muted)]">
          <div className="text-4xl">🔔</div>
          <div className="text-[14px] font-medium">Alarm tanımlı değil</div>
        </div>
      ) : (
        <div className="card divide-y divide-[var(--border)]">
          {alarms.map(a => (
            <div key={a.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <span className="font-semibold text-[13px]">{a.token_symbol}</span>
                <span className="text-[var(--muted)] text-[12px] ml-2">
                  {a.direction === 'above' ? '▲ üstünde' : '▼ altında'} {fmtPrice(a.target_price)}
                </span>
              </div>
              <span className={`badge ${a.triggered ? 'badge-up' : ''}`}
                style={!a.triggered ? { background: 'var(--bg3)', color: 'var(--muted)' } : {}}>
                {a.triggered ? '✓ Tetiklendi' : '⏳ Bekliyor'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
