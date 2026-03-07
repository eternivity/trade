'use client'
import { useState, useMemo } from 'react'
import { useStore } from '@/lib/store'
import { useMarket } from '@/hooks/useMarket'
import { fmtUSD, fmtPrice, fmtPct } from '@/lib/format'
import { DexPair } from '@/lib/dexscreener'

type SortKey = 'vol'|'ch5m'|'mc'|'liq'|'new'

export function MarketTable() {
  const { pairs, setSelectedPair, setTradeModalOpen } = useStore()
  const { reload } = useMarket()
  const [sort, setSort] = useState<SortKey>('vol')
  const [q, setQ] = useState('')

  const sorted = useMemo(() => {
    let data = pairs.filter(p => !q || p.baseToken?.symbol?.toLowerCase().includes(q.toLowerCase()) || p.baseToken?.name?.toLowerCase().includes(q.toLowerCase()))
    data.sort((a,b) => {
      if(sort==='vol') return (b.volume?.h24||0)-(a.volume?.h24||0)
      if(sort==='ch5m') return (b.priceChange?.m5||0)-(a.priceChange?.m5||0)
      if(sort==='mc') return (b.marketCap||0)-(a.marketCap||0)
      if(sort==='liq') return (b.liquidity?.usd||0)-(a.liquidity?.usd||0)
      if(sort==='new') return (b.pairCreatedAt||0)-(a.pairCreatedAt||0)
      return 0
    })
    return data
  }, [pairs, sort, q])

  const ups = pairs.filter(p=>(p.priceChange?.m5||0)>0).length
  const dns = pairs.filter(p=>(p.priceChange?.m5||0)<0).length
  const topVol = pairs.reduce((m,p)=>Math.max(m,p.volume?.h24||0),0)

  function open(p: DexPair){setSelectedPair(p);setTradeModalOpen(true)}

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {[
          {label:'TOPLAM',val:pairs.length.toString(),cls:'text-cyan'},
          {label:'EN YÜKSEK HACİM',val:fmtUSD(topVol),cls:'text-white'},
          {label:'YÜKSELENler ▲',val:`▲ ${ups}`,cls:'up'},
          {label:'DÜŞENler ▼',val:`▼ ${dns}`,cls:'down'},
        ].map(s=>(
          <div key={s.label} className="bg-bg1 border border-white/5 rounded-lg p-4 relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan/30 to-transparent"/>
            <div className="text-[10px] tracking-widest text-gray-500 mb-2">{s.label}</div>
            <div className={`font-display text-2xl ${s.cls}`}>{s.val}</div>
          </div>
        ))}
      </div>
      <div className="flex gap-2 mb-3 flex-wrap items-center">
        <span className="text-[10px] tracking-widest text-gray-600">SIRALA:</span>
        {([['vol','HACİM'],['ch5m','5D TREND'],['mc','PİYASA D.'],['liq','LİKİDİTE'],['new','YENİ']] as [SortKey,string][]).map(([k,l])=>(
          <button key={k} onClick={()=>setSort(k)} className={`px-3 py-1 rounded text-[11px] tracking-wider border transition-all ${sort===k?'border-cyan text-cyan':'border-white/10 text-gray-500 hover:text-white'}`}>{l}</button>
        ))}
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="🔍 Coin ara..."
          className="ml-auto bg-bg2 border border-white/10 rounded px-3 py-1 text-[11px] outline-none focus:border-cyan w-44 transition-all"/>
        <button onClick={reload} className="px-3 py-1 border border-white/10 rounded text-[11px] text-gray-500 hover:text-cyan hover:border-cyan transition-all">⟳</button>
      </div>
      <div className="grid grid-cols-[36px_2fr_1fr_72px_72px_1fr_80px] gap-x-2 px-3 py-2 text-[10px] tracking-widest text-gray-600 bg-bg2 rounded-t border border-white/5 border-b-0">
        <span>#</span><span>COİN</span><span>FİYAT</span><span>5D%</span><span>1S%</span><span>HACİM 24S</span><span>İŞLEM</span>
      </div>
      <div className="border border-white/5 rounded-b overflow-hidden">
        {!sorted.length && (
          <div className="text-center py-12 text-gray-600">
            {pairs.length===0?<><div className="w-8 h-8 border-2 border-white/10 border-t-cyan rounded-full spin mx-auto mb-3"/><div>Yükleniyor...</div></>:<div>Coin bulunamadı.</div>}
          </div>
        )}
        {sorted.map((p,i)=>{
          const ch5=p.priceChange?.m5||0, ch1h=p.priceChange?.h1||0
          return (
            <div key={p.baseToken.address} onClick={()=>open(p)} className="grid grid-cols-[36px_2fr_1fr_72px_72px_1fr_80px] gap-x-2 px-3 py-2.5 border-b border-white/[0.04] hover:bg-cyan/[0.03] cursor-pointer items-center transition-colors row-anim" style={{animationDelay:`${i*15}ms`}}>
              <div className="text-[11px] text-gray-600">{i+1}</div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sol to-cyan flex items-center justify-center text-xs font-bold overflow-hidden flex-shrink-0">
                  {p.info?.imageUrl?<img src={p.info.imageUrl} className="w-full h-full object-cover rounded-full" onError={e=>{(e.target as HTMLImageElement).style.display='none'}}/>:p.baseToken.symbol[0]}
                </div>
                <div><div className="font-semibold text-[13px] text-white">{p.baseToken.symbol}</div><div className="text-[10px] text-gray-600">{p.baseToken.name}</div></div>
              </div>
              <div className="text-[12px]">{fmtPrice(parseFloat(p.priceUsd))}</div>
              <div className={`text-[12px] font-semibold ${ch5>=0?'up':'down'}`}>{fmtPct(ch5)}</div>
              <div className={`text-[12px] font-semibold ${ch1h>=0?'up':'down'}`}>{fmtPct(ch1h)}</div>
              <div className="text-[11px] text-gray-300">{fmtUSD(p.volume?.h24)}</div>
              <div><button onClick={e=>{e.stopPropagation();open(p)}} className="px-2 py-1 bg-green/10 border border-green/25 text-green text-[10px] rounded tracking-wider hover:bg-green hover:text-black transition-all">AL/SAT</button></div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
