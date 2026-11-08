import { useState } from 'react'
import { Minus, Plus, Sparkles } from 'lucide-react'
import type { Category } from '../lib/hall'
import { MAX_SEATS } from '../lib/selection'

export type CategoryChoice = Category | 'Any'
/** "✦ Best N seats": choose how many and (optionally) which area; we pick the best seats next to each other. */
export default function BestSeatsPanel({ onFind }:{ onFind:(qty:number, category:CategoryChoice)=>void }){
  const [qty,setQty] = useState(2); const [cat,setCat] = useState<CategoryChoice>('Any')
  return <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-white/10 bg-white/[.03] p-3" role="group" aria-label="Find the best seats">
    <span className="flex items-center gap-1.5 text-sm text-accent"><Sparkles size={14}/>Best seats</span>
    <div className="flex items-center gap-1" role="group" aria-label="Number of seats">
      <button type="button" className="pill !px-2" aria-label="Fewer seats" disabled={qty<=1} onClick={()=>setQty(q=>q-1)}><Minus size={12}/></button>
      <output className="w-6 text-center font-mono text-white" aria-live="polite" aria-label="Number of seats">{qty}</output>
      <button type="button" className="pill !px-2" aria-label="More seats" disabled={qty>=MAX_SEATS} onClick={()=>setQty(q=>q+1)}><Plus size={12}/></button></div>
    <label className="pill flex items-center gap-1 text-sm">in
      <select aria-label="Seat area" value={cat} onChange={e=>setCat(e.target.value as CategoryChoice)} className="bg-transparent text-white outline-none">
        {(['Any','Premium','Gold','Silver','Balcony'] as const).map(c=><option key={c} value={c} className="bg-black">{c==='Any' ? 'any area' : c}</option>)}</select></label>
    <button type="button" className="btn !px-4 !py-1.5 text-sm" onClick={()=>onFind(qty,cat)}>✦ Find best {qty} seat{qty>1?'s':''}</button>
  </div>
}
