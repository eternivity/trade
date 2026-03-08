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
   - **Node version:** 20 (`netlify.toml` ile otomatik ayarlı)

## 3. Ortam değişkenlerini ekleyin (env dosyası ile)

### Yöntem A — Netlify’da .env içeriğini yapıştır (en kolay)

1. Netlify’da sitenizi açın → **Site configuration** → **Environment variables**
2. **Import from .env** veya **Import from a file** butonuna tıklayın
3. Bilgisayarınızdaki **`.env`** veya **`.env.local`** dosyasını açıp **tüm içeriği kopyalayın** (değerler dolu olsun)
4. Netlify’daki kutuya yapıştırıp **Import** deyin

Örnek (değerleri kendi bilgilerinizle doldurup yapıştırabilirsiniz):

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
NEXT_PUBLIC_APP_URL=https://sitename.netlify.app
```

5. **Build** (ve isteğe bağlı **Deploy**) için kullanılsın seçeneğini işaretleyin
6. **Trigger deploy** ile yeniden build alın

### Yöntem B — Netlify CLI ile .env dosyasını yükle

Proje klasöründe:

```bash
npm install -g netlify-cli
netlify login
netlify link   # Sitenizi seçin
netlify env:import .env
```

Bu komut yerel `.env` dosyanızdaki değişkenleri Netlify’a gönderir. **`.env` dosyasını asla Git’e eklemeyin** (zaten `.gitignore`’da olmalı).

---

Gerekli değişkenler (`.env.example` ile aynı):

| Değişken | Açıklama |
|----------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase proje URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon (public) key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (API’ler için) |
| `NEXT_PUBLIC_APP_URL` | Netlify site adresiniz (örn. `https://sitename.netlify.app`) |

İsteğe bağlı: `NEXT_PUBLIC_SOLANA_RPC`, `BIRDEYE_API_KEY`

## 4. Deploy

- **Deploy** tıklayın veya `main` branch’e push yapın; Netlify otomatik build alır.
- İlk deploy birkaç dakika sürebilir.

## Notlar

- API routes (`/api/*`) Netlify’da serverless function olarak çalışır.
- Supabase’te **Authentication** → **URL Configuration** içinde **Site URL** ve **Redirect URLs**’e Netlify adresinizi ekleyin (örn. `https://sitename.netlify.app`).
