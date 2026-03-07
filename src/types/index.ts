// ─── Market ───────────────────────────
export interface TokenPair {
  pairAddress: string
  baseToken: { address: string; symbol: string; name: string; decimals?: number }
  quoteToken: { symbol: string }
  priceUsd: string
  priceChange: { m5: number; h1: number; h6: number; h24: number }
  volume: { h24: number; h6: number; h1: number }
  liquidity: { usd: number }
  marketCap: number
  pairCreatedAt: number
  chainId: string
  url: string
  info?: { imageUrl?: string }
}

// ─── Portfolio ────────────────────────
export interface Position {
  id: string
  user_id: string
  token_address: string
  token_symbol: string
  token_name?: string
  token_image?: string
  amount: number
  avg_cost: number
  is_sim: boolean
  updated_at: string
  // computed
  current_price?: number
  current_value?: number
  pnl_pct?: number
  pnl_usd?: number
}

// ─── Trade ────────────────────────────
export interface Trade {
  id: string
  user_id: string
  token_address: string
  token_symbol: string
  trade_type: 'buy' | 'sell'
  amount: number
  price_usd: number
  total_usd: number
  realized_pnl?: number
  is_sim: boolean
  tx_signature?: string
  created_at: string
}

// ─── Alarm ────────────────────────────
export interface Alarm {
  id: string
  user_id: string
  token_symbol: string
  token_address?: string
  direction: 'above' | 'below'
  target_price: number
  triggered: boolean
  triggered_at?: string
  created_at: string
}

// ─── Profile ──────────────────────────
export interface Profile {
  id: string
  wallet_address?: string
  sim_sol: number
  created_at: string
}

// ─── Store ────────────────────────────
export interface AppStore {
  simSol: number
  setSimSol: (n: number) => void
  solPrice: number
  setSolPrice: (n: number) => void
  pairs: TokenPair[]
  setPairs: (p: TokenPair[]) => void
  priceMap: Record<string, number>
  setPriceMap: (m: Record<string, number>) => void
}
