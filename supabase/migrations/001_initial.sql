-- ══════════════════════════════════════════════
--  MEME TRADE — Supabase Schema
--  Supabase Dashboard > SQL Editor'a yapıştır
-- ══════════════════════════════════════════════

-- Kullanıcı portföyleri
CREATE TABLE IF NOT EXISTS portfolios (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT NOT NULL,          -- wallet pubkey veya auth uid
  token_addr  TEXT NOT NULL,
  symbol      TEXT NOT NULL,
  name        TEXT,
  image_url   TEXT,
  amount      NUMERIC NOT NULL DEFAULT 0,
  avg_cost    NUMERIC NOT NULL DEFAULT 0,  -- USD
  is_sim      BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, token_addr, is_sim)
);

-- İşlem geçmişi
CREATE TABLE IF NOT EXISTS trades (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT NOT NULL,
  token_addr  TEXT NOT NULL,
  symbol      TEXT NOT NULL,
  trade_type  TEXT NOT NULL CHECK (trade_type IN ('buy','sell')),
  amount      NUMERIC NOT NULL,
  price_usd   NUMERIC NOT NULL,
  total_usd   NUMERIC NOT NULL,
  realized_pnl NUMERIC DEFAULT 0,
  tx_sig      TEXT,                   -- gerçek işlem imzası
  is_sim      BOOLEAN DEFAULT false,
  slippage    NUMERIC DEFAULT 1,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Fiyat alarmları
CREATE TABLE IF NOT EXISTS alarms (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT NOT NULL,
  symbol      TEXT NOT NULL,
  token_addr  TEXT,
  direction   TEXT NOT NULL CHECK (direction IN ('above','below')),
  target_price NUMERIC NOT NULL,
  triggered   BOOLEAN DEFAULT false,
  triggered_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Portföy değer geçmişi (grafik için)
CREATE TABLE IF NOT EXISTS portfolio_snapshots (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT NOT NULL,
  total_value NUMERIC NOT NULL,
  is_sim      BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Simülasyon bakiyesi
CREATE TABLE IF NOT EXISTS sim_balances (
  user_id     TEXT PRIMARY KEY,
  sol_balance NUMERIC NOT NULL DEFAULT 1000,
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- ── İndeksler ──────────────────────────────
CREATE INDEX idx_portfolios_user ON portfolios(user_id);
CREATE INDEX idx_trades_user ON trades(user_id, created_at DESC);
CREATE INDEX idx_alarms_user ON alarms(user_id);
CREATE INDEX idx_snapshots_user ON portfolio_snapshots(user_id, created_at DESC);

-- ── Row Level Security ─────────────────────
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE alarms ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE sim_balances ENABLE ROW LEVEL SECURITY;

-- Herkes kendi verisine erişebilir (wallet bazlı)
CREATE POLICY "users_own_portfolio" ON portfolios FOR ALL USING (true);
CREATE POLICY "users_own_trades" ON trades FOR ALL USING (true);
CREATE POLICY "users_own_alarms" ON alarms FOR ALL USING (true);
CREATE POLICY "users_own_snapshots" ON portfolio_snapshots FOR ALL USING (true);
CREATE POLICY "users_own_sim" ON sim_balances FOR ALL USING (true);
