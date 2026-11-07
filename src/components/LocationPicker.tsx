import { useEffect, useRef, useState } from 'react'
import { Crosshair, MapPin, Search, X } from 'lucide-react'
import { quickCities, searchLocalCities, type LocalPlace } from '../lib/locations'
import type { Place } from '../lib/geo'
import { geocodePlace, geoErrorMessage, getCurrentPosition, reverseGeocode } from '../lib/geo'
import { useBooking } from '../store/booking'

/**
 * Header location control.
 *  1. "Use my current location"  -> browser permission prompt (only on this click) -> GPS
 *  2. Search any place           -> OpenStreetMap place search (Mumbai, Durgapur, a street, a pincode…)
 *  3. Cities in our cinema database (type a city, state or PIN) -> instant, offline
 */
export default function LocationPicker(){
  const { location, setLocation, resetLocation } = useBooking()
  const [open,setOpen] = useState(false)
  const [busy,setBusy] = useState<null|'gps'|'search'>(null)
  const [error,setError] = useState<string|null>(null)
  const [query,setQuery] = useState('')
  const [results,setResults] = useState<Place[]|null>(null)
  const box = useRef<HTMLDivElement>(null)
  const local = searchLocalCities(query)          // instant matches from the database while typing
  const chips = quickCities()

  useEffect(()=>{
    if(!open) return
    const onDown = (e:MouseEvent)=>{ if(box.current && !box.current.contains(e.target as Node)) setOpen(false) }
    const onKey = (e:KeyboardEvent)=>{ if(e.key==='Escape') setOpen(false) }
    document.addEventListener('mousedown',onDown); document.addEventListener('keydown',onKey)
    return ()=>{ document.removeEventListener('mousedown',onDown); document.removeEventListener('keydown',onKey) }
  },[open])

  const close = ()=>{ setOpen(false); setError(null); setResults(null); setQuery('') }

  async function detect(){
    setBusy('gps'); setError(null)
    try{
      const p = await getCurrentPosition()
      const label = (await reverseGeocode(p.lat,p.lng)) ?? 'Your location'
      setLocation({ lat:p.lat, lng:p.lng, label, source:'gps' }); close()
    }catch(e){ setError(geoErrorMessage(e)) }
    finally{ setBusy(null) }
  }
  async function search(e:React.FormEvent){
    e.preventDefault(); if(query.trim().length<2) return
    setBusy('search'); setError(null); setResults(null)
    try{ setResults(await geocodePlace(query)) }
    catch(err){ setError(geoErrorMessage(err)) }
    finally{ setBusy(null) }
  }
  const choose = (p:Place)=>{ setLocation({ lat:p.lat, lng:p.lng, label:p.label, source:'search' }); close() }

  return <div className="relative" ref={box}>
    <button className="pill flex max-w-[11rem] items-center gap-1 hover:text-white" aria-expanded={open} aria-haspopup="dialog" aria-label={`Location: ${location.label}. Change location`} onClick={()=>setOpen(o=>!o)}>
      {location.source==='gps' ? <Crosshair size={14} className="shrink-0 text-accent"/> : <MapPin size={14} className="shrink-0"/>}
      <span className="truncate">{location.label}</span></button>
    {open && <div role="dialog" aria-label="Choose location" className="card absolute right-0 z-50 mt-2 w-[min(92vw,22rem)] p-4 shadow-2xl">
      <div className="mb-3 flex items-center justify-between"><h2 className="text-xl">Your location</h2>
        <button aria-label="Close" onClick={close} className="text-muted hover:text-white"><X size={16}/></button></div>
      <button className="btn w-full justify-center" onClick={detect} disabled={busy!==null}>
        <Crosshair size={16}/>{busy==='gps' ? 'Detecting…' : 'Use my current location'}</button>
      <p className="mt-1 text-[11px] text-muted">Your browser will ask permission. We only use it to list nearby cinemas and keep it on this device.</p>
      <form onSubmit={search} className="mt-4 flex gap-2" role="search">
        <label className="pill flex flex-1 items-center gap-2"><Search size={14}/>
          <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search a city, state or PIN code" aria-label="Search a place" className="w-full bg-transparent text-white outline-none"/></label>
        <button type="submit" className="pill hover:text-white" disabled={busy!==null}>{busy==='search'?'…':'Go'}</button></form>
      {local.length>0 && <ul className="mt-3 grid gap-1" aria-label="Cities in our database">{local.map(p=>
        <li key={p.label}><button onClick={()=>{ setLocation({ lat:p.lat, lng:p.lng, label:p.label, source:'city' }); close() }} className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-sm hover:bg-white/10">
          <span><MapPin size={12} className="mr-1 inline text-accent"/>{p.label}</span><span className="text-xs text-muted">{p.count} cinemas</span></button></li>)}</ul>}
      {error && <p role="alert" className="mt-3 rounded-lg bg-[color-mix(in_srgb,var(--bad)_15%,transparent)] p-2 text-xs text-white">{error}</p>}
      {results && (results.length===0
        ? <p className="mt-3 text-sm text-muted">No other place found for “{query}”. Try a bigger nearby town.</p>
        : <ul className="mt-3 grid gap-1" aria-label="Search results">{results.map((p,i)=>
            <li key={i}><button onClick={()=>choose(p)} className="w-full rounded-lg px-2 py-1.5 text-left text-sm hover:bg-white/10"><MapPin size={12} className="mr-1 inline"/>{p.label}</button></li>)}</ul>)}
      <p className="mb-1 mt-4 text-[11px] uppercase tracking-widest text-muted">Popular cities</p>
      <div className="flex flex-wrap gap-2">{chips.map((c:LocalPlace)=>
        <button key={c.label} className="pill hover:text-white" onClick={()=>{ setLocation({ lat:c.lat, lng:c.lng, label:c.label, source:'city' }); close() }}>{c.label.split(',')[0]}</button>)}</div>
      <p className="mt-2 text-[11px] text-muted">Not listed? Search any place above — we also check OpenStreetMap for cinemas.</p>
      {location.source!=='city' && <button className="mt-3 text-xs text-muted underline" onClick={()=>{ resetLocation(); close() }}>Clear my location</button>}
    </div>}
  </div>
}
