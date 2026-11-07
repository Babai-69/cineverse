import { useMemo, useState } from 'react'
import { MapPin, Sparkles } from 'lucide-react'
import { getShowsForTheatres, toISODate } from '../lib/shows'
import { hasStarted, levelOf, smartPick } from '../lib/availability'
import { useBooking } from '../store/booking'
import { useNearbyTheatres } from '../hooks/useNearbyTheatres'
import { distanceLabel } from '../lib/theatres'
import { useNow } from '../hooks/useNow'
import { movies } from '../data/movies'
import Chip from './Chip'
import ShowChip from './ShowChip'

const WEEK = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
const RADII = [10,25,50]
const DAY_START = 540, DAY_SPAN = 870 // 09:00 -> 23:30, for the mini timeline axis
const AXIS_VAR = { plenty:'ok', filling:'warn', almost:'bad' } as const
const minsOf = (t:string)=>{ const [h,m]=t.split(':').map(Number); return h*60+m }

export default function TheatreBoard({movieId, now:nowOverride}:{movieId:string; now?:Date}){
  const loc = useBooking(s=>s.location)
  const now = useNow(nowOverride)
  const days = useMemo(()=>Array.from({length:7},(_,i)=>{const d=new Date(now);d.setDate(d.getDate()+i);return d}),[]) // eslint-disable-line react-hooks/exhaustive-deps
  const [date,setDate] = useState(toISODate(days[0]))
  const [format,setFormat] = useState('All')
  const [radius,setRadius] = useState(25)
  const nearby = useNearbyTheatres(radius)
  const movieFormats = movies.find(m=>m.id===movieId)?.formats

  const board = useMemo(()=>getShowsForTheatres(movieId, nearby.theatres, date, movieFormats),[movieId,nearby.theatres,date,movieFormats])
  const rows = useMemo(()=>board.map(b=>({...b, shows:b.shows.filter(s=>format==='All'||s.format===format)})).filter(b=>b.shows.length>0),[board,format])
  const smart = useMemo(()=>smartPick(rows, now),[rows,now])

  return <section id="theatres" aria-label="Theatres and showtimes">
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <h2 className="text-3xl">Theatres near {loc.label}</h2>
      <label className="pill flex items-center gap-2 text-sm">Within
        <select aria-label="Search radius" value={radius} onChange={e=>setRadius(Number(e.target.value))} className="bg-transparent text-white outline-none">
          {RADII.map(r=><option key={r} value={r} className="bg-black">{r} km</option>)}</select></label></div>

    <div className="mb-4 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Date">
      {days.map(d=>{const iso=toISODate(d);const on=iso===date
        return <button key={iso} role="tab" aria-selected={on} onClick={()=>setDate(iso)}
          className={`card min-w-[64px] px-3 py-2 text-center transition ${on?'!border-accent text-accent':'text-muted hover:text-white'}`}>
          <div className="text-xs">{WEEK[d.getDay()]}</div><div className="font-display text-2xl leading-none">{d.getDate()}</div></button>})}
    </div>
    <div className="mb-3 flex flex-wrap items-center gap-2" role="group" aria-label="Format">
      {['All',...(movieFormats??['2D','IMAX','4DX'])].map(f=><Chip key={f} on={format===f} onClick={()=>setFormat(f)}>{f}</Chip>)}</div>
    <ul className="mb-5 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted" aria-label="Colour legend">
      {[['plenty','Plenty of seats'],['filling','Filling fast'],['almost','Almost full']].map(([l,t])=>
        <li key={l} className={`lvl-${l} flex items-center gap-1.5`}><span className="h-2.5 w-2.5 rounded-full" style={{background:'var(--lvl)'}}/>{t}</li>)}
      <li>Demo showtimes &amp; availability</li>{rows.some(r=>r.theatre.precision==='city') && <li>≈ distances are measured to the city centre</li>}</ul>

    <div aria-live="polite">
      {nearby.status==='loading' && <div className="card animate-pulse p-8 text-center text-muted">Finding cinemas near {loc.label}…</div>}
      {nearby.refining && nearby.status==='ready' && <p className="mb-3 text-xs text-muted">Checking OpenStreetMap for more cinemas nearby…</p>}
      {nearby.status==='error' && <div className="card p-8 text-center" role="alert"><p className="text-muted">{nearby.error}</p>
        <button className="btn mt-4" onClick={nearby.retry}>Try again</button></div>}
      {nearby.notice && <p className="mb-3 rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-muted">{nearby.notice}</p>}
      {nearby.status==='ready' && nearby.theatres.length===0 && <div className="card p-8 text-center text-muted">
        No cinemas found within {radius} km of {loc.label}. {radius<50 ? 'Try a wider radius above, or search another place.' : 'Try searching another place.'}</div>}
      {nearby.status==='ready' && nearby.theatres.length>0 && rows.length===0 && <div className="card p-8 text-center text-muted">No shows for this format on this day.</div>}
    </div>

    <div className="grid gap-4">
      {nearby.status!=='loading' && rows.map(({theatre,shows},idx)=>{
        const isSmart = smart?.theatreId===theatre.id
        return <article key={theatre.id} className={`card p-4 md:p-5 ${isSmart?'!border-accent/60':''}`}>
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-2xl">{theatre.name}</h3>
              {idx===0 && rows.length>1 && <span className="pill !border-white/20 !text-white text-xs">Nearest</span>}
              {isSmart && <span className="pill flex items-center gap-1 !border-accent !text-accent text-xs" title={smart!.reasons.join(' · ')}><Sparkles size={12}/>Smart pick</span>}
            </div>
            <span className="flex items-center gap-1 text-sm text-muted"><MapPin size={14}/>{distanceLabel(theatre)}</span></div>
          <p className="-mt-2 mb-3 text-xs text-muted">{[theatre.area, theatre.city, theatre.screens ? `${theatre.screens} screens` : null].filter(Boolean).join(' · ')}</p>
          {isSmart && <p className="mb-2 text-xs text-accent">{smart!.reasons.join(' · ')}</p>}
          <div className="flex flex-wrap gap-2">
            {shows.map(s=><ShowChip key={s.id} show={s} theatre={theatre} started={hasStarted(s,now)}/>)}</div>
          <div className="relative mt-3 h-1.5 rounded-full bg-white/10" aria-hidden="true">
            {shows.map(s=><span key={s.id} style={{position:'absolute',top:0,height:'100%',width:6,borderRadius:3,
              left:`${(minsOf(s.time)-DAY_START)/DAY_SPAN*100}%`,background:`var(--${AXIS_VAR[levelOf(s)]})`,opacity:hasStarted(s,now)?.3:1}}/>)}</div>
          <div className="mt-1 flex justify-between font-mono text-[10px] text-muted" aria-hidden="true"><span>09:00</span><span>16:00</span><span>23:30</span></div>
        </article>})}
    </div></section>
}
