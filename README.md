# MEME TRADE — Kurulum Rehberi

Solana meme coin trading terminali.
**Stack:** Next.js 14 · Supabase · Jupiter DEX · Vercel

---

## 📁 Proje Yapısı

```
meme-trade/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── market/route.ts       ← DexScreener proxy (30s cache)
│   │   │   ├── portfolio/route.ts    ← Portföy CRUD
│   │   │   ├── trade/route.ts        ← Sim + Jupiter swap
│   │   │   ├── history/route.ts      ← İşlem geçmişi
│   │   │   └── alarms/route.ts       ← Fiyat alarmları
│   │   ├── page.tsx                  ← Ana dashboard
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/        (Topbar, Toast)
│   │   ├── market/    (MarketPanel)
│   │   ├── portfolio/ (PortfolioPanel, HistoryPanel, AlarmsPanel)
│   │   └── trade/     (TradeModal)
│   ├── hooks/
│   │   ├── useWallet.ts    ← Phantom bağlantısı
│   │   ├── useMarket.ts    ← SWR + otomatik güncelleme
│   │   └── usePortfolio.ts ← Supabase realtime
│   ├── lib/
│   │   ├── supabase.ts     ← Client + server
│   │   ├── dexscreener.ts  ← Market data
│   │   ├── jupiter.ts      ← Swap API
│   │   └── store.ts        ← Zustand state
│   └── types/index.ts
└── supabase/migrations/001_init.sql
```

---

## 🚀 Kurulum (5 adım)

### 1. Supabase Projesi Oluştur
- [supabase.com](https://supabase.com) → New Project
- **SQL Editor** → `supabase/migrations/001_init.sql` dosyasını yapıştır → Run
- Settings → API → URL ve anon key'i kopyala

### 2. Ortam Değişkenleri
```bash
cp .env.example .env.local
# .env.local dosyasını Supabase bilgileriyle doldur
```

### 3. Yerel Geliştirme
```bash
npm install
npm run dev
# http://localhost:3000
```

### 4. Vercel Deploy
```bash
npm install -g vercel
vercel
# Vercel dashboard'dan environment variables ekle:
# NEXT_PUBLIC_SUPABASE_URL
# NEXT_PUBLIC_SUPABASE_ANON_KEY
# SUPABASE_SERVICE_ROLE_KEY
```

### 5. Phantom Wallet (Gerçek Trade İçin)
- Chrome/Brave'e [Phantom](https://phantom.app) uzantısını kur
- "PHANTOM BAĞLA" butonuna tıkla
- Mainnet'te işlem yapabilirsin

---

## ✨ Özellikler

| Özellik | Detay |
|---|---|
| 📊 Canlı Piyasa | DexScreener API, 30s güncelleme |
| ⚡ Simülasyon Modu | 1000 SOL sahte bakiye, gerçek fiyatlar |
| ◎ Gerçek Trade | Phantom + Jupiter Aggregator |
| 💼 Portföy | Anlık K/Z, değer grafiği |
| 📋 İşlem Geçmişi | Tüm alım/satımlar, Supabase'de kalıcı |
| 🔔 Fiyat Alarmları | Hedef fiyata ulaşınca bildirim |
| 🔄 Realtime | Supabase WebSocket ile anlık güncellemeler |

---

## 💡 Ücretsiz Limitler

| Servis | Ücretsiz Limit |
|---|---|
| Supabase | 500MB DB, 2GB bandwidth/ay |
| Vercel | 100GB bandwidth/ay |
| DexScreener API | Sınırsız (rate limit yok) |
| Jupiter API | Sınırsız |
| Solana Public RPC | Düşük limit → Helius öner |

> **Helius RPC** (ücretsiz): https://helius.dev → 1M istek/ay

---

## 🔒 Güvenlik Notları

- Özel key/seed phrase asla istenmiyor
- Tüm swap işlemleri Phantom tarafından imzalanır
- Supabase RLS ile her kullanıcı sadece kendi verisini görür
- Service role key sadece sunucu tarafında kullanılır

---

## 📦 Bağımlılıklar

- `next` 14 + React 18
- `@supabase/supabase-js` — database + realtime
- `@solana/web3.js` — Solana RPC
- `swr` — data fetching + cache
- `zustand` — global state
- `recharts` — portföy grafiği
- `tailwindcss` — styling
