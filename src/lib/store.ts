import { create } from 'zustand'
import { DexPair } from './dexscreener'

export interface Position {
  tokenAddr: string
  symbol: string
  name: string
  imageUrl?: string
  amount: number
  avgCost: number  // USD
}

export interface Trade {
  id?: string
  tokenAddr: string
  symbol: string
  tradeType: 'buy' | 'sell'
  amount: number
  priceUsd: number
  totalUsd: number
  realizedPnl?: number
  isSim: boolean
  createdAt: string
}

export interface Alarm {
  id?: string
  symbol: string
  tokenAddr?: string
  direction: 'above' | 'below'
  targetPrice: number
  triggered: boolean
  createdAt: string
}

interface AppStore {
  simSOL: number
  setSimSOL: (n: number) => void

  solPrice: number
  setSolPrice: (n: number) => void

  userId: string | null
  setUserId: (id: string | null) => void

  pairs: DexPair[]
  setPairs: (p: DexPair[]) => void

  portfolio: Record<string, Position>
  setPortfolio: (p: Record<string, Position>) => void
  upsertPosition: (pos: Position) => void
  removePosition: (addr: string) => void

  trades: Trade[]
  setTrades: (t: Trade[]) => void
  addTrade: (t: Trade) => void

  alarms: Alarm[]
  setAlarms: (a: Alarm[]) => void

  portHistory: { ts: number; val: number }[]
  addPortSnapshot: (val: number) => void

  selectedPair: DexPair | null
  setSelectedPair: (p: DexPair | null) => void

  tradeModalOpen: boolean
  setTradeModalOpen: (v: boolean) => void
}

export const useStore = create<AppStore>((set) => ({
  simSOL: 2,
  setSimSOL: (simSOL) => set({ simSOL }),

  solPrice: 150,
  setSolPrice: (solPrice) => set({ solPrice }),

  userId: null,
  setUserId: (userId) => set({ userId }),

  pairs: [],
  setPairs: (pairs) => set({ pairs }),

  portfolio: {},
  setPortfolio: (portfolio) => set({ portfolio }),
  upsertPosition: (pos) => set((s) => ({
    portfolio: { ...s.portfolio, [pos.tokenAddr]: pos }
  })),
  removePosition: (addr) => set((s) => {
    const p = { ...s.portfolio }
    delete p[addr]
    return { portfolio: p }
  }),

  trades: [],
  setTrades: (trades) => set({ trades }),
  addTrade: (t) => set((s) => ({ trades: [t, ...s.trades] })),

  alarms: [],
  setAlarms: (alarms) => set({ alarms }),

  portHistory: [],
  addPortSnapshot: (val) => set((s) => ({
    portHistory: [...s.portHistory.slice(-49), { ts: Date.now(), val }]
  })),

  selectedPair: null,
  setSelectedPair: (selectedPair) => set({ selectedPair }),

  tradeModalOpen: false,
  setTradeModalOpen: (tradeModalOpen) => set({ tradeModalOpen }),
}))
