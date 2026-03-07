-- ═══════════════════════════════════════════════════════════
--  MEME TRADE — Şema Düzeltme Migrasyonu
--  Supabase Dashboard > SQL Editor'a yapıştırın ve çalıştırın
-- ═══════════════════════════════════════════════════════════

-- Eski tabloları temizle (varsa)
DROP TABLE IF EXISTS public.portfolio_history CASCADE;
DROP TABLE IF EXISTS public.trade_history CASCADE;
DROP TABLE IF EXISTS public.portfolio CASCADE;
DROP TABLE IF EXISTS public.alarms CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- ── PROFILES ─────────────────────────────────────────────
-- auth.users FK kaldırıldı → device UUID ve anonymous auth destekli
CREATE TABLE public.profiles (
  id          TEXT PRIMARY KEY,   -- auth user id veya device uuid
  wallet_address TEXT,
  sim_sol     NUMERIC NOT NULL DEFAULT 1000,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_open" ON public.profiles FOR ALL USING (true) WITH CHECK (true);

-- ── PORTFOLIO ─────────────────────────────────────────────
CREATE TABLE public.portfolio (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  token_address TEXT NOT NULL,
  token_symbol  TEXT NOT NULL,
  token_name    TEXT,
  token_image   TEXT,
  amount        NUMERIC NOT NULL DEFAULT 0,
  avg_cost      NUMERIC NOT NULL DEFAULT 0,
  is_sim        BOOLEAN DEFAULT FALSE,
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, token_address, is_sim)
);

ALTER TABLE public.portfolio ENABLE ROW LEVEL SECURITY;
CREATE POLICY "portfolio_open" ON public.portfolio FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX ON public.portfolio(user_id, is_sim);

-- ── TRADE HISTORY ─────────────────────────────────────────
CREATE TABLE public.trade_history (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  token_address TEXT NOT NULL,
  token_symbol  TEXT NOT NULL,
  trade_type    TEXT CHECK (trade_type IN ('buy','sell')) NOT NULL,
  amount        NUMERIC NOT NULL,
  price_usd     NUMERIC NOT NULL,
  total_usd     NUMERIC NOT NULL,
  realized_pnl  NUMERIC DEFAULT 0,
  is_sim        BOOLEAN DEFAULT FALSE,
  tx_signature  TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.trade_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "history_open" ON public.trade_history FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX ON public.trade_history(user_id, created_at DESC);
CREATE INDEX ON public.trade_history(user_id, is_sim);

-- ── ALARMS ────────────────────────────────────────────────
CREATE TABLE public.alarms (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  token_symbol  TEXT NOT NULL,
  token_address TEXT,
  direction     TEXT CHECK (direction IN ('above','below')) NOT NULL,
  target_price  NUMERIC NOT NULL,
  triggered     BOOLEAN DEFAULT FALSE,
  triggered_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.alarms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "alarms_open" ON public.alarms FOR ALL USING (true) WITH CHECK (true);

-- ── REALTIME ──────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE public.alarms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.portfolio;
