-- ─────────────────────────────────────
-- MEME TRADE — Supabase Schema
-- Run this in Supabase SQL Editor
-- ─────────────────────────────────────

-- Enable RLS
create extension if not exists "uuid-ossp";

-- ── PROFILES ──────────────────────────
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  wallet_address text unique,
  sim_sol numeric default 1000,
  created_at timestamptz default now()
);
alter table public.profiles enable row level security;
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── PORTFOLIO ─────────────────────────
create table public.portfolio (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  token_address text not null,
  token_symbol text not null,
  token_name text,
  token_image text,
  amount numeric not null default 0,
  avg_cost numeric not null default 0,
  is_sim boolean default false,
  updated_at timestamptz default now(),
  unique(user_id, token_address, is_sim)
);
alter table public.portfolio enable row level security;
create policy "Users manage own portfolio" on public.portfolio for all using (auth.uid() = user_id);
create index on public.portfolio(user_id, is_sim);

-- ── TRADE HISTORY ─────────────────────
create table public.trade_history (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  token_address text not null,
  token_symbol text not null,
  trade_type text check (trade_type in ('buy','sell')) not null,
  amount numeric not null,
  price_usd numeric not null,
  total_usd numeric not null,
  realized_pnl numeric,
  is_sim boolean default false,
  tx_signature text,
  created_at timestamptz default now()
);
alter table public.trade_history enable row level security;
create policy "Users manage own history" on public.trade_history for all using (auth.uid() = user_id);
create index on public.trade_history(user_id, created_at desc);
create index on public.trade_history(user_id, is_sim);

-- ── ALARMS ────────────────────────────
create table public.alarms (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  token_symbol text not null,
  token_address text,
  direction text check (direction in ('above','below')) not null,
  target_price numeric not null,
  triggered boolean default false,
  triggered_at timestamptz,
  created_at timestamptz default now()
);
alter table public.alarms enable row level security;
create policy "Users manage own alarms" on public.alarms for all using (auth.uid() = user_id);

-- ── PORTFOLIO VALUE HISTORY ────────────
create table public.portfolio_history (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  total_value_usd numeric not null,
  is_sim boolean default false,
  recorded_at timestamptz default now()
);
alter table public.portfolio_history enable row level security;
create policy "Users view own history" on public.portfolio_history for all using (auth.uid() = user_id);
create index on public.portfolio_history(user_id, recorded_at desc);

-- ── REALTIME SUBSCRIPTIONS ────────────
-- Enable realtime for alarms (server-side check needed)
alter publication supabase_realtime add table public.alarms;
alter publication supabase_realtime add table public.portfolio;
