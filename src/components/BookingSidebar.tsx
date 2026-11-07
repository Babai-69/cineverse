import { useEffect, useState } from 'react'
import { Clock, X } from 'lucide-react'
import type { Movie, Show, TheatreWithDistance } from '../data/types'
import { priceSummary } from '../lib/pricing'
import { HALL } from '../lib/hall'
import { formatMmSs, holdRemainingMs, MAX_SEATS } from '../lib/selection'

/** Own 1-second tick so the heavy 3D page does not re-render every second. Calls onExpire once when it reaches 0. */
function HoldTimer({ expiresAt, onExpire }:{ expiresAt:number; onExpire:()=>void }){
  const [left,setLeft] = useState(()=>holdRemainingMs(expiresAt, Date.now()))
  useEffect(()=>{
    const tick = ()=>{ const l = holdRemainingMs(expiresAt, Date.now()); setLeft(l); if (l<=0) onExpire() }
    tick(); const id = setInterval(tick, 1000); return ()=>clearInterval(id)
  },[expiresAt, onExpire])
  return <p className={`flex items-center gap-1.5 text-sm ${left<60_000?'text-[var(--bad)]':'text-muted'}`} role="timer" aria-label="Seat hold time left">
    <Clock size={14}/>Seats held for <span className="font-mono text-white">{formatMmSs(left)}</span></p>
}

export type SidebarProps = { movie:Movie; show:Show; theatre:TheatreWithDistance; seats:string[]; holdExpiresAt:number|null
  onRemove:(id:string)=>void; onExpire:()=>void; onContinue:()=>void }
export default function BookingSidebar({ movie, show, theatre, seats, holdExpiresAt, onRemove, onExpire, onContinue }:SidebarProps){
  const sum = priceSummary(seats, show)
  return <aside className="card p-5" aria-label="Your booking">
    <h2 className="text-2xl leading-tight">{movie.title}</h2>
    <p className="mt-1 text-sm text-muted">{theatre.name}</p>
    <p className="text-sm text-muted">{new Date(show.startsAt).toLocaleDateString(undefined,{weekday:'short',day:'numeric',month:'short'})} · <span className="font-mono text-white">{show.time}</span> · {show.format}</p>
    <hr className="my-4 border-white/10"/>
    <div className="mb-2 flex items-center justify-between"><h3 className="text-lg">Seats</h3><span className="text-xs text-muted">{seats.length} / {MAX_SEATS}</span></div>
    {seats.length===0 ? <p className="text-sm text-muted">Tap seats in the hall to select them.</p> :
      <ul className="flex flex-wrap gap-2" aria-label="Selected seats">{seats.map(id=>{ const s = HALL.byId.get(id)!
        return <li key={id}><button onClick={()=>onRemove(id)} aria-label={`Remove seat ${id}`} className="pill flex items-center gap-1 !border-accent/50 text-white hover:!border-accent">
          {s.row}{s.number}<X size={12}/></button></li> })}</ul>}
    {sum.lines.length>0 && <dl className="mt-4 grid gap-1 text-sm" data-testid="price-summary">
      {sum.lines.map(l=><div key={l.category} className="flex justify-between"><dt className="text-muted">{l.category} × {l.count}</dt><dd>₹{l.amount}</dd></div>)}
      <div className="flex justify-between"><dt className="text-muted">Convenience fee</dt><dd>₹{sum.fee}</dd></div>
      <div className="flex justify-between"><dt className="text-muted">GST on fee (18%)</dt><dd>₹{sum.gst}</dd></div>
      <div className="mt-2 flex justify-between border-t border-white/10 pt-2 text-lg"><dt>Total</dt><dd className="font-mono text-accent" data-testid="total">₹{sum.total}</dd></div></dl>}
    {holdExpiresAt && seats.length>0 && <div className="mt-3"><HoldTimer expiresAt={holdExpiresAt} onExpire={onExpire}/></div>}
    <button className="btn mt-5 w-full justify-center disabled:cursor-not-allowed disabled:opacity-40" disabled={seats.length===0} onClick={onContinue}>
      Continue to snacks{seats.length>0 && ` · ₹${sum.total}`}</button>
  </aside>
}
