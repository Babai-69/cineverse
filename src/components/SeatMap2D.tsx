import { HALL } from '../lib/hall'
import type { SeatDef } from '../lib/hall'

const BTN = 'h-7 min-w-7 rounded-md text-[10px] font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent'
function look(s:SeatDef, sold:boolean, selected:boolean){
  if (sold) return 'bg-[var(--seat-sold)] text-white/20 cursor-not-allowed'
  if (selected) return 'bg-[var(--seat-selected)] text-black'
  if (s.accessible) return 'bg-[var(--seat-access)] text-black'
  if (s.category==='Premium') return 'bg-[var(--seat-premium)] text-white hover:brightness-125'
  if (s.category==='Balcony') return 'bg-[#2f6f7a] text-white hover:brightness-125'
  if (s.category==='Gold') return 'bg-[#7a6330] text-white hover:brightness-125'
  return 'bg-[var(--seat-available)] text-white hover:bg-[var(--seat-hover)]'
}
/** 2D seat map: always available, keyboard/screen-reader friendly, and the fallback when WebGL is missing. Same selection as the 3D hall. */
export default function SeatMap2D({ soldIds, selectedIds, onSeatClick, priceOf }:{
  soldIds:ReadonlySet<string>; selectedIds:readonly string[]; onSeatClick:(id:string)=>void; priceOf:(id:string)=>number }){
  const sel = new Set(selectedIds)
  return <div className="card overflow-x-auto p-4" data-testid="seatmap2d">
    <div className="mx-auto mb-5 h-1.5 w-3/4 min-w-[320px] rounded-full bg-gradient-to-r from-transparent via-white/70 to-transparent"/>
    <p className="mb-4 text-center text-[11px] uppercase tracking-[.3em] text-muted">Screen this way</p>
    <div className="grid w-max min-w-full gap-1.5">
      {HALL.rows.map((r,ri)=>{
        const catStart = ri===0 || HALL.rows[ri-1].category!==r.category
        return <div key={r.row}>
          {catStart && <p className="mb-1 mt-3 text-[11px] uppercase tracking-widest text-muted">{r.category}{r.category==='Premium'?' recliners':''} · ₹{priceOf(r.seats[0].id)}</p>}
          <div className="flex items-center justify-center gap-1" role="group" aria-label={`Row ${r.row}`}>
            <span className="w-5 text-center font-mono text-[11px] text-muted">{r.row}</span>
            {r.seats.map((s,i)=>{
              const prev = r.seats[i-1], gap = prev && s.pos[0]-prev.pos[0] > (s.recliner?1.5:1.1)
              const sold = soldIds.has(s.id), selected = sel.has(s.id)
              return <button key={s.id} type="button" onClick={()=>onSeatClick(s.id)} data-state={sold?'sold':selected?'selected':'available'}
                aria-pressed={selected} aria-disabled={sold}
                aria-label={`Row ${s.row} seat ${s.number}, ${s.category}${s.recliner?' recliner':''}${s.accessible?', wheelchair space':''}, ${sold?'sold':`₹${priceOf(s.id)}, ${selected?'selected':'available'}`}`}
                className={`${BTN} ${s.recliner?'w-9':'w-7'} ${gap?'ml-4':''} ${look(s,sold,selected)}`}>{s.number}</button>
            })}
            <span className="w-5 text-center font-mono text-[11px] text-muted">{r.row}</span></div></div>})}
    </div></div>
}
