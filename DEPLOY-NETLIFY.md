# TradeSim — Netlify’a Yükleme

Bu proje Netlify’da çalışacak şekilde ayarlı. Aşağıdaki adımları izleyin.

## 1. Projeyi GitHub’a atın (henüz yoksa)

```bash
git init
git add .
git commit -m "TradeSim initial"
git branch -M main
git remote add origin https://github.com/KULLANICI/REPO.git
git push -u origin main
```

## 2. Netlify’da site oluşturun

1. [netlify.com](https://netlify.com) → **Add new site** → **Import an existing project**
2. GitHub ile bağlayıp bu repoyu seçin
3. **Build settings** (Netlify çoğu zaman otomatik doldurur):
   - **Build command:** `npm run build`
   - **Publish directory:** boş bırakın (Next.js eklentisi halleder)
   - **Node version:** 18 (veya Netlify’da Environment variables’dan `NODE_VERSION = 18` ekleyin)

## 3. Ortam değişkenlerini ekleyin

Netlify: **Site settings** → **Environment variables** → **Add variable** / **Import from .env**

En az şunları ekleyin (`.env.example` ile eşleşenler):

| Değişken | Açıklama |
|----------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase proje URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon (public) key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (API’ler için) |
| `NEXT_PUBLIC_APP_URL` | Netlify site adresiniz (örn. `https://sitename.netlify.app`) |

İsteğe bağlı:

- `NEXT_PUBLIC_SOLANA_RPC` — farklı RPC için
- `BIRDEYE_API_KEY` — kullanıyorsanız

Sonra **Trigger deploy** ile yeniden build alın.

## 4. Deploy

- **Deploy** tıklayın veya `main` branch’e push yapın; Netlify otomatik build alır.
- İlk deploy birkaç dakika sürebilir.

## Notlar

- API routes (`/api/*`) Netlify’da serverless function olarak çalışır.
- Supabase’te **Authentication** → **URL Configuration** içinde **Site URL** ve **Redirect URLs**’e Netlify adresinizi ekleyin (örn. `https://sitename.netlify.app`).
