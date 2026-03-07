'use client'
import { useState, useMemo } from 'react'
import { useStore } from '@/lib/store'
import { usePortfolio } from '@/hooks/usePortfolio'
import { useLivePrices } from '@/hooks/useLivePrices'
import { useToast } from '@/components/ui/Toast'
import type { TokenPair } from '@/types'

interface Props { pair: TokenPair; onClose: () => void; initialType?: 'buy' | 'sell' }

const fmtPrice = (p: number) => {
  if (!p) return '—'
  if (p < 0.000001) return `$${p.toExponential(3)}`
  if (p < 0.0001)   return `$${p.toFixed(9)}`
  if (p < 0.01)     return `$${p.toFixed(7)}`
  if (p < 1)        return `$${p.toFixed(5)}`
  return `$${p.toFixed(4)}`
}

export function TradeModal({ pair, onClose, initialType = 'buy' }: Props) {
  const { simSOL, setSimSOL, solPrice, userId } = useStore()
  const fallbackPrice = parseFloat(pair.priceUsd || '0')
  const addr = pair.baseToken?.address ?? ''
  const livePrices = useLivePrices(addr ? [addr] : [], 800)
  const price = useMemo(() => {
    const live = addr ? livePrices[addr] : undefined
    return live != null && live > 0 ? live : fallbackPrice
  }, [addr, livePrices, fallbackPrice])

  const { positions } = usePortfolio(userId ?? undefined, true)
  const { show: showToast } = useToast()

  const ch24Abs = Math.abs(pair.priceChange?.h24 ?? 0)
  const isVolatile = ch24Abs >= 15

  const [type,     setType]     = useState<'buy' | 'sell'>(initialType)
  const [amount,   setAmount]   = useState('')
  const [slippage, setSlippage] = useState(1)
  const [loading,  setLoading]  = useState(false)

  const sym  = pair.baseToken?.symbol || '?'
  const ch24 = pair.priceChange?.h24 ?? 0

  const pos          = positions.find(p => p.token_address === addr) ?? null
  const tokenBalance = pos?.amount ?? 0

  const slip = slippage / 100
  const amt  = parseFloat(amount || '0')

  const outputVal = (() => {
    if (!amt) return '—'
    if (type === 'buy') {
      const eff    = price * (1 + slip)
      const tokens = eff > 0 ? (amt * solPrice) / eff : 0
      return tokens > 0
        ? tokens >= 1e6
          ? `${(tokens / 1e6).toFixed(2)}M ${sym}`
          : tokens >= 1e3
            ? `${(tokens / 1e3).toFixed(2)}K ${sym}`
            : `${tokens.toFixed(2)} ${sym}`
        : '—'
    } else {
      const eff    = price * (1 - slip)
      const solBk  = (amt * eff) / solPrice
      return solBk > 0 ? `${solBk.toFixed(6)} SOL` : '—'
    }
  })()

  const setPct = (pct: number) => {
    if (type === 'buy') setAmount((simSOL * pct).toFixed(4))
    else                setAmount((tokenBalance * pct).toFixed(6))
  }

  const execute = async () => {
    if (!amt || amt <= 0) { showToast('Geçerli miktar girin', 'err'); return }
    if (!userId)           { showToast('Kullanıcı yükleniyor…', 'err'); return }
    if (type === 'sell' && amt > tokenBalance) {
      showToast(`Yetersiz bakiye — maks. ${tokenBalance.toLocaleString()} ${sym}`, 'err'); return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId, tradeType: type,
          tokenAddress: addr, tokenSymbol: sym,
          tokenName: pair.baseToken?.name, tokenImage: pair.info?.imageUrl,
          amount: amt, priceUsd: price, solPrice,
          slippageBps: slippage * 100,
          currentPosition: pos,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'İşlem hatası')

      setSimSOL(data.newSimSol)
      if (type === 'buy') {
        const n = data.tokensReceived ?? 0
        const fmt = n >= 1e6 ? `${(n / 1e6).toFixed(2)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(2)}K` : n.toFixed(2)
        showToast(`✓ ${fmt} ${sym} alındı @ ${fmtPrice(data.livePrice ?? data.effectivePrice)}`, 'ok')
      } else {
        const pnl = data.realizedPnl ?? 0
        showToast(`✓ ${sym} satıldı — K/Z: ${pnl >= 0 ? '+' : ''}$${Math.abs(pnl).toFixed(4)}`, 'ok')
      }
      onClose()
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : 'Hata', 'err')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className="relative bg-[var(--bg1)] border border-[var(--border2)] w-full max-h-[90vh] sm:max-h-[85vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl max-w-sm shadow-2xl fade-up"
        style={{ boxShadow: '0 0 60px rgba(153,69,255,0.15)' }}
        onClick={e => e.stopPropagation()}
      >

        {/* Header — mobilde safe area */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-4 border-b border-[var(--border)] pt-[env(safe-area-inset-top)] sm:pt-4">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {pair.info?.imageUrl
              ? <img src={pair.info.imageUrl} alt={sym} className="w-9 h-9 rounded-full object-cover" />
              : <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-black"
                  style={{ background: 'linear-gradient(135deg, #9945FF, #14F195)' }}>{sym[0]}</div>
            }
            <div>
              <div className="text-[15px] font-bold">{sym}</div>
              <div className={`text-[11px] font-semibold ${ch24 >= 0 ? 'text-[var(--green)]' : 'text-[var(--red)]'}`}>
                {ch24 >= 0 ? '▲' : '▼'} {Math.abs(ch24).toFixed(2)}% (24s)
              </div>
            </div>
          </div>
          <button onClick={onClose} className="flex-shrink-0 w-10 h-10 sm:w-auto sm:h-auto flex items-center justify-center text-[var(--muted)] hover:text-[var(--red)] transition-colors text-lg leading-none -mr-1">✕</button>
        </div>

        <div className="p-4 sm:p-5 space-y-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:pb-5">
          {/* Fiyat bilgileri */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { l: 'Fiyat',      v: fmtPrice(price) },
              { l: 'Hacim 24s',  v: pair.volume?.h24 ? `$${(pair.volume.h24 / 1e6).toFixed(2)}M` : '—' },
              { l: 'Likidite',   v: pair.liquidity?.usd ? `$${(pair.liquidity.usd / 1e6).toFixed(2)}M` : '—' },
              { l: 'SOL Fiyatı', v: `$${solPrice.toFixed(2)}` },
            ].map(item => (
              <div key={item.l} className="bg-[var(--bg2)] rounded-xl px-3 py-2">
                <div className="text-[10px] text-[var(--muted2)] mb-0.5">{item.l}</div>
                <div className="text-[12px] mono font-medium">{item.v}</div>
              </div>
            ))}
          </div>

          {/* Sim banner */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--yellow-bg)] border border-[rgba(245,158,11,0.2)]">
            <span className="text-[var(--yellow)]">⚡</span>
            <div className="text-[11px]">
              <span className="text-[var(--yellow)] font-semibold">Simülasyon</span>
              <span className="text-[var(--muted)] ml-1">— Bakiye: {simSOL.toFixed(3)} SOL</span>
              {type === 'sell' && tokenBalance > 0 && (
                <span className="text-[var(--muted)] ml-1">| {sym}: {tokenBalance >= 1e6 ? `${(tokenBalance/1e6).toFixed(2)}M` : tokenBalance >= 1e3 ? `${(tokenBalance/1e3).toFixed(2)}K` : tokenBalance.toFixed(2)}</span>
              )}
            </div>
          </div>

          {/* Al / Sat toggle */}
          <div className="flex bg-[var(--bg2)] rounded-xl p-1 gap-1">
            <button
              onClick={() => setType('buy')}
              className={`flex-1 py-2 rounded-lg text-[12px] font-semibold transition-all ${
                type === 'buy'
                  ? 'bg-[var(--green-bg)] text-[var(--green)] border border-[rgba(34,197,94,0.3)]'
                  : 'text-[var(--muted)] hover:text-[var(--text)]'
              }`}
            >▲ Al</button>
            <button
              onClick={() => setType('sell')}
              className={`flex-1 py-2 rounded-lg text-[12px] font-semibold transition-all ${
                type === 'sell'
                  ? 'bg-[var(--red-bg)] text-[var(--red)] border border-[rgba(239,68,68,0.3)]'
                  : 'text-[var(--muted)] hover:text-[var(--text)]'
              }`}
            >▼ Sat</button>
          </div>

          {/* Miktar */}
          <div>
            <label className="text-[11px] text-[var(--muted)] block mb-1.5">
              {type === 'buy' ? 'SOL Miktarı' : `${sym} Miktarı`}
            </label>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full bg-[var(--bg2)] border border-[var(--border2)] text-[var(--text)] px-3 py-2.5 rounded-xl text-[13px] mono outline-none focus:border-[var(--cyan)] transition-colors"
            />
            <div className="flex gap-1.5 mt-2">
              {[0.25, 0.5, 0.75, 1].map(p => (
                <button key={p} onClick={() => setPct(p)}
                  className="flex-1 py-1.5 text-[10px] font-semibold bg-[var(--bg2)] border border-[var(--border)] rounded-lg hover:border-[var(--cyan)] hover:text-[var(--cyan)] text-[var(--muted)] transition-all">
                  {p === 1 ? 'MAX' : `%${p * 100}`}
                </button>
              ))}
            </div>
          </div>

          {/* Çıktı */}
          <div className="bg-[var(--bg2)] rounded-xl px-3 py-2.5">
            <div className="text-[10px] text-[var(--muted2)] mb-1">
              {type === 'buy' ? `Alacağınız ${sym}` : 'Alacağınız SOL'}
            </div>
            <div className="text-[14px] mono font-semibold text-[var(--cyan)]">{outputVal}</div>
          </div>

          {/* Slippage — volatil piyasalarda yüksek slippage (Axiom tarzı) */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] text-[var(--muted)]">Slippage:</span>
              <div className="flex bg-[var(--bg2)] rounded-lg p-0.5 gap-0.5 flex-wrap">
                {[0.5, 1, 2, 5, 10, 15, 25].map(s => (
                  <button key={s} onClick={() => setSlippage(s)}
                    className={`px-2.5 py-1 rounded-md text-[10px] font-semibold transition-all ${
                      slippage === s ? 'bg-[var(--bg3)] text-[var(--text)]' : 'text-[var(--muted)] hover:text-[var(--text)]'
                    }`}>%{s}</button>
                ))}
              </div>
            </div>
            {isVolatile && (
              <p className="text-[10px] text-[var(--yellow)]">
                Anlık yükseliş/düşüş var — satışın gerçekleşmesi için %5–15 slippage deneyin (Axiom gibi DEX’lerde de böyle kullanılır).
              </p>
            )}
          </div>

          {/* Execute — mobilde daha büyük dokunma alanı */}
          <button
            onClick={execute}
            disabled={loading || !amount}
            className={`w-full py-3.5 sm:py-3 min-h-[48px] rounded-xl text-[13px] font-bold tracking-wide transition-all disabled:opacity-40 ${
              type === 'buy'
                ? 'bg-[var(--green)] text-black hover:opacity-90'
                : 'bg-[var(--red)] text-white hover:opacity-90'
            }`}
          >
            {loading
              ? <span className="flex items-center justify-center gap-2"><span className="spin inline-block">⟳</span> İşleniyor…</span>
              : type === 'buy' ? '▲ Simüle Satın Al' : '▼ Simüle Sat'}
          </button>

          <div className="text-center text-[10px] text-[var(--muted2)]">
            Gerçek fiyatlar · <span className="text-[var(--yellow)]">Simüle işlem</span> · Gerçek para riski yok
          </div>
        </div>
      </div>
    </div>
  )
}
