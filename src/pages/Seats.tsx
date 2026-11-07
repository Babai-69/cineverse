/**
 * 3D seat picker page. Data flow:  showId (URL) -> show + theatre (store, or rebuilt for database theatres)
 *   -> soldIds (deterministic from show.seed) -> selection lives in the store (shared by 3D hall and 2D map).
 * Debug: ?debug=1 logs picks. 3D crash or no WebGL -> automatically falls back to the 2D map.
 */
import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Box, Grid3x3 } from 'lucide-react'
import { movies } from '../data/movies'
import { findShowById } from '../lib/shows'
import { soldSeatIds } from '../lib/hall'
import { seatPrice } from '../lib/pricing'
import { HALL } from '../lib/hall'
import { createLogger } from '../lib/debug'
import { useBooking } from '../store/booking'
import { hasWebGL } from '../three/webgl'
import SafeBoundary from '../three/SafeBoundary'
import SeatMap2D from '../components/SeatMap2D'
import BookingSidebar from '../components/BookingSidebar'
import Chip from '../components/Chip'
import type { SelectionError } from '../lib/selection'

const HallCanvas = lazy(()=>import('../three/HallCanvas'))   // three.js is only downloaded when the 3D view opens
const log = createLogger('seats')
const MESSAGES:Record<SelectionError,string> = {
  sold:'That seat is already taken — please pick another.', max:'You can book up to 10 seats at a time.', unknown:'That seat does not exist.' }

export default function Seats(){
  const { showId } = useParams(); const navigate = useNavigate()
  const { selectedShow, selectedTheatre, selectShow, seats, seatsShowId, holdExpiresAt, pickSeat, resetSeatsFor, clearSeats } = useBooking()
  const resolved = useMemo(()=>{
    if (selectedShow && selectedTheatre && selectedShow.id===showId) return { show:selectedShow, theatre:selectedTheatre }
    return showId ? findShowById(showId) : null            // refresh / shared link for a database theatre
  },[showId, selectedShow, selectedTheatre])
  const show = resolved?.show, theatre = resolved?.theatre, movie = movies.find(m=>m.id===show?.movieId)

  useEffect(()=>{ if (resolved && selectedShow?.id!==resolved.show.id) selectShow(resolved.show, resolved.theatre) },[resolved, selectedShow, selectShow])
  useEffect(()=>{ if (show && seatsShowId!==show.id) resetSeatsFor(show.id) },[show, seatsShowId, resetSeatsFor])   // new show -> empty selection

  const soldIds = useMemo(()=>show ? soldSeatIds(show) : new Set<string>(),[show])
  const [hovered,setHovered] = useState<string|null>(null)
  const [notice,setNotice] = useState<string|null>(null)
  const [expired,setExpired] = useState(false)
  const [webgl] = useState(()=>hasWebGL())
  const [view,setView] = useState<'3d'|'2d'>(()=>hasWebGL() ? '3d' : '2d')
  const [crashed,setCrashed] = useState(false)
  const priceOf = useCallback((id:string)=>{ const s = HALL.byId.get(id); return s && show ? seatPrice(s.category, show.format, show.date) : 0 },[show])

  const onSeatClick = useCallback((id:string)=>{
    const err = pickSeat(id, soldIds); setExpired(false); setNotice(err ? MESSAGES[err] : null); log('pick', id, err ?? 'ok')
  },[pickSeat, soldIds])
  const onExpire = useCallback(()=>{ clearSeats(); setExpired(true) },[clearSeats])
  const onRemove = useCallback((id:string)=>{ pickSeat(id, soldIds) },[pickSeat, soldIds])

  if (!show || !theatre || !movie) return <section className="mx-auto max-w-xl px-4 py-24 text-center">
    <h1 className="text-5xl">Show not found</h1>
    <p className="mt-2 text-muted">We could not find this showtime. It may have been opened from a live-lookup cinema before the page was refreshed.</p>
    <Link to="/movies" className="btn mt-6">Pick a movie and showtime</Link></section>

  const use3d = view==='3d' && webgl && !crashed
  return <section className="mx-auto max-w-[1680px] px-4 pb-28 pt-6 md:px-8 lg:pb-10">
    <header className="mb-4 flex flex-wrap items-end justify-between gap-3" data-testid="selected-show">
      <div><Link to={`/movie/${movie.id}`} className="text-sm text-muted hover:text-white">← {movie.title}</Link>
        <h1 className="text-4xl md:text-5xl">{theatre.name}</h1>
        <p className="text-sm text-muted">{[theatre.area, theatre.city].filter(Boolean).join(', ')} · {show.date} · <span className="font-mono text-white">{show.time}</span> · {show.format}</p></div>
      <div className="flex gap-2" role="group" aria-label="Seat view">
        <Chip on={use3d} onClick={()=>setView('3d')}><span className="flex items-center gap-1"><Box size={13}/>3D hall</span></Chip>
        <Chip on={!use3d} onClick={()=>setView('2d')}><span className="flex items-center gap-1"><Grid3x3 size={13}/>2D map</span></Chip></div></header>

    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div>
        {!webgl && <p className="mb-3 rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-muted">3D is not available in this browser, so here is the 2D seat map.</p>}
        {crashed && <p className="mb-3 rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-muted">The 3D hall could not start, so we switched to the 2D seat map.</p>}
        {expired && <p role="alert" className="mb-3 rounded-lg border border-[var(--bad)]/40 bg-[color-mix(in_srgb,var(--bad)_12%,transparent)] p-3 text-sm">Your seat hold expired. Please choose your seats again.</p>}
        <p role="status" aria-live="polite" className={`mb-3 text-sm ${notice?'text-accent':'sr-only'}`}>{notice}</p>
        {use3d
          ? <div className="card relative h-[55vh] overflow-hidden lg:h-[72vh]" data-testid="hall3d-wrap">
              <SafeBoundary fallback={null} onError={()=>setCrashed(true)}>
                <Suspense fallback={<div className="grid h-full place-items-center text-muted">Loading 3D hall…</div>}>
                  <HallCanvas soldIds={soldIds} selectedIds={seats} hoveredId={hovered} onHover={setHovered} onSeatClick={onSeatClick}
                    backdropUrl={movie.backdrop} glow={movie.dominantColor} priceOf={priceOf} lowPower={typeof window!=='undefined' && window.innerWidth<768}/>
                </Suspense></SafeBoundary>
              <p className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-[11px] text-muted">Drag to look around · scroll to zoom · tap a seat</p></div>
          : <SeatMap2D soldIds={soldIds} selectedIds={seats} onSeatClick={onSeatClick} priceOf={priceOf}/>}
        <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted" aria-label="Seat colours">
          {[['#3b4256','Silver'],['#7a6330','Gold'],['#7c5cff','Premium recliner (pairs)'],['#2f6f7a','Balcony'],['#f5b942','Selected'],['#17171f','Sold'],['#2dd4bf','Wheelchair space']].map(([c,t])=>
            <li key={t} className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm border border-white/20" style={{background:c}}/>{t}</li>)}</ul>
      </div>
      <div className="lg:sticky lg:top-20 lg:self-start">
        <BookingSidebar movie={movie} show={show} theatre={theatre} seats={seats} holdExpiresAt={holdExpiresAt}
          onRemove={onRemove} onExpire={onExpire} onContinue={()=>navigate(`/book/${show.id}/snacks`)}/></div>
    </div></section>
}
