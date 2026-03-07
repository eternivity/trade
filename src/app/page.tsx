'use client'
import { useState } from 'react'
import { Topbar } from '@/components/ui/Topbar'
import { MarketPanel } from '@/components/market/MarketPanel'
import { PortfolioPanel, HistoryPanel, AlarmsPanel } from '@/components/portfolio/PortfolioPanel'
import { ChartView } from '@/components/chart/ChartView'
import { TradeModal } from '@/components/trade/TradeModal'
import { Toast } from '@/components/ui/Toast'
import type { TokenPair } from '@/types'

type Tab = 'market' | 'portfolio' | 'history' | 'alarms'

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'market',    label: 'Piyasa',   icon: '📊' },
  { key: 'portfolio', label: 'Portföy',  icon: '💼' },
  { key: 'history',   label: 'Geçmiş',   icon: '📋' },
  { key: 'alarms',    label: 'Alarmlar', icon: '🔔' },
]

export default function HomePage() {
  const [tab, setTab]           = useState<Tab>('market')
  const [chartPair, setChartPair] = useState<TokenPair | null>(null) // chart view
  const [tradePair, setTradePair] = useState<TokenPair | null>(null) // sadece trade modal (portföy satış)

  return (
    <div className="min-h-screen w-full max-w-[100vw] overflow-x-hidden" style={{ background: 'var(--bg)' }}>
      <div className="relative z-10 flex flex-col min-h-screen w-full min-w-0">
        <Topbar />

        {/* Tab bar — mobilde kaydırılabilir, dokunmatik dostu */}
        <nav className="flex items-center gap-0 sm:gap-1 px-2 sm:px-5 w-full min-w-0 border-b border-[var(--border)] bg-[var(--bg)] overflow-x-auto flex-shrink-0">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-4 py-3 min-h-[44px] sm:min-h-0 text-[12px] font-medium border-b-2 transition-all whitespace-nowrap flex-shrink-0 ${
                tab === t.key
                  ? 'border-[var(--cyan)] text-[var(--cyan)]'
                  : 'border-transparent text-[var(--muted)] hover:text-[var(--text)]'
              }`}
            >
              <span>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </nav>

        {/* İçerik — tam genişlik mobilde, max masaüstünde */}
        <main className="flex-1 p-3 sm:p-5 w-full max-w-7xl mx-auto min-w-0 overflow-x-hidden">
          {/* Piyasada tıklanınca ChartView açılır */}
          {tab === 'market'    && <MarketPanel    onTrade={setChartPair} />}
          {/* Portföydeki SAT butonu doğrudan TradeModal açar */}
          {tab === 'portfolio' && <PortfolioPanel onTrade={setTradePair} />}
          {tab === 'history'   && <HistoryPanel />}
          {tab === 'alarms'    && <AlarmsPanel />}
        </main>
      </div>

      {/* Chart View — tam ekran, token seçilince */}
      {chartPair && (
        <ChartView
          pair={chartPair}
          onClose={() => setChartPair(null)}
        />
      )}

      {/* Direkt trade modal (portföy satış) */}
      {tradePair && (
        <TradeModal
          pair={tradePair}
          onClose={() => setTradePair(null)}
          initialType="sell"
        />
      )}

      <Toast />
    </div>
  )
}
