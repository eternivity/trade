// ── Sunucu taraflı fiyat cache'i ─────────────────────────────────────
// Next.js dev modunda aynı process'te çalışır → module-level state kalıcıdır.
// DexScreener /tokens/v1/solana/ limiti: 60 istek/dakika → 1 istek / 1.1s

interface CacheEntry {
  price: number
  ts: number
}

const cache = new Map<string, CacheEntry>()

// Son DexScreener çağrısının zamanı (rate limiting için)
let lastCallTs = 0

// İstekte bulunan adreslerin kuyruğu
let pendingAddrs = new Set<string>()
let pendingResolvers: Array<() => void> = []

const RATE_MS    = 1100  // DexScreener'a max 1 istek / 1.1 saniye → 54/dk < 60 limit
const CACHE_TTL  = 2000  // Cache TTL — 2s sonra DexScreener'dan yenilenir
const BATCH_SIZE = 10    // DexScreener'ın tek seferde kabul ettiği max adres

const BASE = 'https://api.dexscreener.com'

async function fetchBatch(addrs: string[]): Promise<void> {
  for (let i = 0; i < addrs.length; i += BATCH_SIZE) {
    if (i > 0) {
      // Birden fazla batch varsa her biri arasında da bekle
      await new Promise(r => setTimeout(r, RATE_MS))
      lastCallTs = Date.now()
    }
    const chunk = addrs.slice(i, i + BATCH_SIZE).join(',')
    try {
      const r = await fetch(`${BASE}/tokens/v1/solana/${chunk}`)
      const d = await r.json()
      const now = Date.now()
      if (Array.isArray(d)) {
        for (const pair of d) {
          if (pair.baseToken?.address && pair.priceUsd) {
            cache.set(pair.baseToken.address, {
              price: parseFloat(pair.priceUsd),
              ts: now,
            })
          }
        }
      }
    } catch { /* sessiz hata, eski cache kalır */ }
  }
}

/**
 * Verilen adresler için anlık fiyatları döner.
 * Rate limiti aşmamak için en fazla 1.1s'de bir DexScreener'a istek atar.
 * Cache'teki taze veriler anında döner, süresi geçenler arka planda yenilenir.
 */
export async function getTokenPrices(addresses: string[]): Promise<Record<string, number>> {
  const now = Date.now()
  const result: Record<string, number> = {}
  const stale: string[] = []

  for (const addr of addresses) {
    const entry = cache.get(addr)
    if (entry && now - entry.ts < CACHE_TTL) {
      result[addr] = entry.price
    } else {
      stale.push(addr)
    }
  }

  if (!stale.length) return result

  // Rate limit kontrolü
  const elapsed = now - lastCallTs
  if (elapsed < RATE_MS) {
    // Henüz istek atmak için erken — süresi dolmuş verileri döndür
    for (const addr of stale) {
      const entry = cache.get(addr)
      if (entry) result[addr] = entry.price
    }
    return result
  }

  lastCallTs = now
  await fetchBatch(stale)

  // Güncel cache'ten oku
  for (const addr of stale) {
    const entry = cache.get(addr)
    if (entry) result[addr] = entry.price
  }

  return result
}

/**
 * Market verisi çekildiğinde tüm pair fiyatlarını cache'e yazar.
 * Bu sayede portföy sorgularında trending token'lar için sıfır DexScreener çağrısı yapılır.
 */
export function warmCache(pairs: Array<{ baseToken: { address: string }; priceUsd: string }>): void {
  const now = Date.now()
  for (const p of pairs) {
    if (p.baseToken?.address && p.priceUsd) {
      cache.set(p.baseToken.address, {
        price: parseFloat(p.priceUsd),
        ts: now,
      })
    }
  }
}
