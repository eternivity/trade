export function fmtUSD(n: number | null | undefined): string {
  if (!n || isNaN(n)) return '—'
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`
  return `$${n.toFixed(2)}`
}

export function fmtPrice(p: number | null | undefined): string {
  if (!p || isNaN(p)) return '—'
  if (p < 0.000001) return `$${p.toExponential(3)}`
  if (p < 0.0001) return `$${p.toFixed(9)}`
  if (p < 0.01) return `$${p.toFixed(7)}`
  if (p < 1) return `$${p.toFixed(5)}`
  return `$${p.toFixed(4)}`
}

export function fmtPct(p: number | null | undefined): string {
  if (p === null || p === undefined || isNaN(p)) return '—'
  return (p >= 0 ? '+' : '') + p.toFixed(2) + '%'
}

export function fmtDate(ts: number | string): string {
  return new Date(ts).toLocaleString('tr-TR', {
    hour12: false, month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit'
  })
}

export function timeAgo(ts: number): string {
  const d = Date.now() - ts
  const m = Math.floor(d / 60000)
  const h = Math.floor(m / 60)
  const dy = Math.floor(h / 24)
  if (dy > 0) return `${dy}g`
  if (h > 0) return `${h}s`
  return `${m}d`
}
