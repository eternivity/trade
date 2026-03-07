// ── DexScreener API — tamamen ücretsiz ──────────────────────

export interface DexPair {
  chainId: string
  pairAddress: string
  baseToken: { address: string; symbol: string; name: string }
  quoteToken: { symbol: string }
  priceUsd: string
  priceChange: { m5: number; h1: number; h6: number; h24: number }
  volume: { h24: number; h6: number; h1: number }
  liquidity: { usd: number }
  marketCap: number
  pairCreatedAt: number
  info?: { imageUrl?: string }
  url: string
}

const BASE = 'https://api.dexscreener.com'

export async function getTrendingSOL(): Promise<DexPair[]> {
  const [r1, r2] = await Promise.all([
    fetch(`${BASE}/token-boosts/top/v1`),
    fetch(`${BASE}/token-boosts/latest/v1`)
  ])
  const [d1, d2] = await Promise.all([r1.json(), r2.json()])

  const addrs = [...(d1 || []), ...(d2 || [])]
    .filter((t: any) => t.chainId === 'solana')
    .map((t: any) => t.tokenAddress)
    .filter((v: string, i: number, a: string[]) => a.indexOf(v) === i)
    .slice(0, 40)

  if (!addrs.length) return []

  const pairs: DexPair[] = []
  for (let i = 0; i < addrs.length; i += 10) {
    const chunk = addrs.slice(i, i + 10).join(',')
    const r = await fetch(`${BASE}/tokens/v1/solana/${chunk}`)
    const d = await r.json()
    if (Array.isArray(d)) pairs.push(...d)
  }
  // deduplicate by base token
  const seen = new Set<string>()
  return pairs.filter(p => {
    if (!p.baseToken?.address || !p.priceUsd) return false
    if (seen.has(p.baseToken.address)) return false
    seen.add(p.baseToken.address)
    return true
  })
}

export async function searchSOL(q: string): Promise<DexPair[]> {
  const r = await fetch(`${BASE}/latest/dex/search?q=${encodeURIComponent(q)}`)
  const d = await r.json()
  return (d.pairs || []).filter((p: DexPair) => p.chainId === 'solana')
}

export async function getPairsByAddresses(addrs: string[]): Promise<DexPair[]> {
  if (!addrs.length) return []
  const pairs: DexPair[] = []
  for (let i = 0; i < addrs.length; i += 10) {
    const chunk = addrs.slice(i, i + 10).join(',')
    const r = await fetch(`${BASE}/tokens/v1/solana/${chunk}`)
    const d = await r.json()
    if (Array.isArray(d)) pairs.push(...d)
  }
  return pairs
}
