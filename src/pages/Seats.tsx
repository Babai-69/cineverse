/**
 * 3D seat picker page. Data flow:  showId (URL) -> show + theatre (store, or rebuilt for database theatres)
 *   -> soldIds (deterministic from show.seed) -> selection lives in the store (shared by 3D hall and 2D map).
 * Debug: ?debug=1 logs picks. 3D crash or no WebGL -> automatically falls back to the 2D map.
 */
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Box, Grid3x3, Pause, Play, Volume2, VolumeX, Film } from 'lucide-react'
import { movies } from '../data/movies'
import { findShowById } from '../lib/shows'
import { soldSeatIds, HALL } from '../lib/hall'
import { seatPrice } from '../lib/pricing'
import { createLogger } from '../lib/debug'
import { useBooking } from '../store/booking'
import { hasWebGL } from '../three/webgl'
import SafeBoundary from '../three/SafeBoundary'
import { findBestSeats, largestGroup } from '../lib/bestSeats'
import type { PresetId } from '../lib/camera'
import type { CameraGoal } from '../three/CameraRig'
import { useTrailerVideo } from '../hooks/useTrailerVideo'
import CameraBar, { type CamMode } from '../components/CameraBar'
import BestSeatsPanel, { type CategoryChoice } from '../components/BestSeatsPanel'
import TrailerModal from '../components/TrailerModal'
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
  const { selectedShow, selectedTheatre, selectShow, seats, seatsShowId, holdExpiresAt, pickSeat, resetSeatsFor, clearSeats, replaceSeats } = useBooking()
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
  const [trailerOpen,setTrailerOpen] = useState(false)
  const [goal,setGoal] = useState<CameraGoal|null>(null)          // camera move requested by the buttons
  const [cam,setCam] = useState<CamMode>('overview')
  const [tour,setTour] = useState(false)
  const goalId = useRef(0)
  const reducedMotion = typeof window!=='undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  const use3d = view==='3d' && webgl && !crashed
  const trailer = useTrailerVideo(movie?.trailerVideo, use3d)      // plays on the 3D screen only while the 3D hall is shown
  const priceOf = useCallback((id:string)=>{ const s = HALL.byId.get(id); return s && show ? seatPrice(s.category, show.format, show.date) : 0 },[show])

  const onSeatClick = useCallback((id:string)=>{
    const err = pickSeat(id, soldIds); setExpired(false); setNotice(err ? MESSAGES[err] : null); log('pick', id, err ?? 'ok')
  },[pickSeat, soldIds])
  const goPreset = useCallback((id:PresetId)=>{ setTour(false); setCam(id); setGoal({ id:++goalId.current, kind:'preset', preset:id }) },[])
  const lastSeat = seats[seats.length-1]
  const goSeat = useCallback(()=>{ if(!lastSeat) return; setTour(false); setCam('seat'); setGoal({ id:++goalId.current, kind:'seat', seatId:lastSeat }) },[lastSeat])
  const onUserMove = useCallback(()=>{ setTour(false); setCam(c=>c==='seat' ? c : 'free') },[])
  const findBest = useCallback((qty:number, category:CategoryChoice)=>{
    const r = findBestSeats(qty, soldIds, category)
    setExpired(false)
    if (r){ replaceSeats(r.seats); setNotice(`Best ${qty} seat${qty>1?'s':''}: ${r.row}${HALL.byId.get(r.seats[0])!.number}${qty>1?`–${r.row}${HALL.byId.get(r.seats[qty-1])!.number}`:''} (${r.category})`); log('best seats', qty, category, r.seats) }
    else { const most = largestGroup(soldIds, category); setNotice(most ? `No ${qty} seats together${category==='Any'?'':` in ${category}`}. The most together is ${most} — try fewer seats or another area.` : `No seats left${category==='Any'?'':` in ${category}`}.`) }
  },[soldIds, replaceSeats])
  const onExpire = useCallback(()=>{ clearSeats(); setExpired(true) },[clearSeats])
  const onRemove = useCallback((id:string)=>{ pickSeat(id, soldIds) },[pickSeat, soldIds])

  if (!show || !theatre || !movie) return <section className="mx-auto max-w-xl px-4 py-24 text-center">
    <h1 className="text-5xl">Show not found</h1>
    <p className="mt-2 text-muted">We could not find this showtime. It may have been opened from a live-lookup cinema before the page was refreshed.</p>
    <Link to="/movies" className="btn mt-6">Pick a movie and showtime</Link></section>

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
        <BestSeatsPanel onFind={findBest}/>
        <p role="status" aria-live="polite" className={`mb-3 text-sm ${notice?'text-accent':'sr-only'}`}>{notice}</p>
        {use3d
          ? <div className="card relative h-[55vh] overflow-hidden lg:h-[72vh]" data-testid="hall3d-wrap">
              <SafeBoundary fallback={null} onError={()=>setCrashed(true)}>
                <Suspense fallback={<div className="grid h-full place-items-center text-muted">Loading 3D hall…</div>}>
                  <HallCanvas soldIds={soldIds} selectedIds={seats} hoveredId={hovered} onHover={setHovered} onSeatClick={onSeatClick}
                    backdropUrl={movie.backdrop} glow={movie.dominantColor} priceOf={priceOf}
                    trailerVideo={trailer.video} trailerPlaying={trailer.state==='playing'}
                    cameraGoal={goal} tour={tour} onUserMove={onUserMove} reducedMotion={reducedMotion} lowPower={typeof window!=='undefined' && window.innerWidth<768}/>
                </Suspense></SafeBoundary>
              {trailer.video && <div className="absolute left-3 top-3 flex items-center gap-2">
                {trailer.state==='blocked'
                  ? <button className="btn !px-4 !py-2 text-sm" onClick={trailer.play}><Play size={14}/>Tap to play trailer</button>
                  : <>
                    <button className="pill flex items-center gap-1 bg-black/60 text-white" aria-label={trailer.state==='playing' ? 'Pause trailer' : 'Play trailer'} onClick={trailer.toggle}>
                      {trailer.state==='playing' ? <Pause size={13}/> : <Play size={13}/>}{trailer.state==='playing' ? 'Pause' : 'Play'}</button>
                    <button className="pill flex items-center gap-1 bg-black/60 text-white" aria-label={trailer.muted ? 'Unmute trailer' : 'Mute trailer'} onClick={trailer.toggleMute}>
                      {trailer.muted ? <VolumeX size={13}/> : <Volume2 size={13}/>}{trailer.muted ? 'Muted' : 'Sound on'}</button></>}
                {movie.trailerId && <button className="pill flex items-center gap-1 bg-black/60 text-white" onClick={()=>setTrailerOpen(true)}><Film size={13}/>Full trailer</button>}
                {trailer.state==='error' && <span className="pill bg-black/60 text-[var(--bad)]" role="status">Trailer video could not load</span>}</div>}
              <div className="pointer-events-none absolute inset-0" aria-hidden="true" style={{ background:'radial-gradient(ellipse at center, transparent 58%, rgba(0,0,0,.42) 100%)' }}/>
              <CameraBar mode={cam} hasSeat={!!lastSeat} seatLabel={lastSeat} tour={tour} canTour={!reducedMotion}
                onPreset={goPreset} onSeat={goSeat} onTour={()=>{ setTour(t=>!t); setCam('free') }}/>
              <p className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/60 px-3 py-1 text-[11px] text-muted">{cam==='seat' ? 'Drag to look around from your seat' : 'Drag to look around · scroll to zoom · tap a seat'}</p></div>
          : <SeatMap2D soldIds={soldIds} selectedIds={seats} onSeatClick={onSeatClick} priceOf={priceOf}/>}
        <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted" aria-label="Seat colours">
          {[['#3b4256','Silver'],['#7a6330','Gold'],['#7c5cff','Premium recliner'],['#2f6f7a','Balcony'],['#f5b942','Selected'],['#17171f','Sold'],['#2dd4bf','Wheelchair space']].map(([c,t])=>
            <li key={t} className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm border border-white/20" style={{background:c}}/>{t}</li>)}</ul>
      </div>
      <div className="lg:sticky lg:top-20 lg:self-start">
        <BookingSidebar movie={movie} show={show} theatre={theatre} seats={seats} holdExpiresAt={holdExpiresAt}
          onRemove={onRemove} onExpire={onExpire} onContinue={()=>navigate(`/book/${show.id}/snacks`)}/></div>
    </div>
    {trailerOpen && movie.trailerId && <TrailerModal youtubeId={movie.trailerId} title={movie.title} onClose={()=>setTrailerOpen(false)}/>}</section>
}
