import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getShows, toISODate } from '../lib/shows'
import { useBooking } from '../store/booking'
import Chip from './Chip'
import { movies } from '../data/movies'

const WEEK = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
export default function TheatreBoard({movieId}:{movieId:string}){
  const city = useBooking(s=>s.city)
  const days = useMemo(()=>Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()+i);return d}),[])
  const [date,setDate] = useState(toISODate(days[0]))
  const [format,setFormat] = useState('All')
  const movieFormats = movies.find(m=>m.id===movieId)?.formats
  const board = useMemo(()=>getShows(movieId,city,date,movieFormats),[movieId,city,date,movieFormats])
  const rows = board.map(b=>({...b, shows:b.shows.filter(s=>format==='All'||s.format===format)})).filter(b=>b.shows.length>0)

  return <section id="theatres" aria-label="Theatres and showtimes">
    <h2 className="mb-4 text-3xl">Theatres in {city}</h2>
    <div className="mb-4 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Date">
      {days.map(d=>{const iso=toISODate(d);const on=iso===date
        return <button key={iso} role="tab" aria-selected={on} onClick={()=>setDate(iso)}
          className={`card min-w-[64px] px-3 py-2 text-center transition ${on?'!border-accent text-accent':'text-muted hover:text-white'}`}>
          <div className="text-xs">{WEEK[d.getDay()]}</div><div className="font-display text-2xl leading-none">{d.getDate()}</div></button>})}
    </div>
    <div className="mb-5 flex flex-wrap gap-2" role="group" aria-label="Format">
      {['All',...(movieFormats??['2D','IMAX','4DX'])].map(f=><Chip key={f} on={format===f} onClick={()=>setFormat(f)}>{f}</Chip>)}</div>
    {rows.length===0 && <div className="card p-8 text-center text-muted">No shows for this format on this day.</div>}
    <div className="grid gap-4">
      {rows.map(({theatre,shows})=>(
        <article key={theatre.id} className="card p-4 md:p-5">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="text-2xl">{theatre.name}</h3>
            <span className="text-sm text-muted">{theatre.distanceKm} km away</span></div>
          <div className="flex flex-wrap gap-2">
            {shows.map(s=>(
              <Link key={s.id} to={`/book/${s.id}/seats`} className="pill text-center transition hover:!border-accent hover:text-white">
                <span className="font-mono text-white">{s.time}</span>
                <span className="ml-2 text-xs">{s.format}</span>
                <span className="block text-[11px]">from ₹{s.priceFrom}</span></Link>))}
          </div></article>))}
    </div></section>
}
