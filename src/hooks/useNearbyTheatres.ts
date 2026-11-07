import { useCallback, useEffect, useMemo, useState } from 'react'
import type { TheatreWithDistance } from '../data/types'
import { findCinemasNear, geoErrorMessage } from '../lib/geo'
import { mergeVenues, nearbyCuratedTheatres, withDistance } from '../lib/theatres'
import { createLogger } from '../lib/debug'
import { useBooking } from '../store/booking'

const log = createLogger('nearby')
export type Nearby = {
  status:'loading'|'ready'|'error'
  theatres:TheatreWithDistance[]
  source:'curated'|'mixed'
  refining:boolean          // true while the live OpenStreetMap lookup is still running
  notice?:string; error?:string
  retry:()=>void
}
/**
 * Cinemas near the user's location, nearest first.
 *  1. INSTANT: our cinema database (CSV) within the radius — never blank, works offline
 *  2. if the location came from GPS / place search: also ask OpenStreetMap for real cinemas there and MERGE
 *     (exact coordinates for venues we already know, plus venues we don't have)
 * If the live lookup fails we keep the database list and say so.
 */
export function useNearbyTheatres(radiusKm:number):Nearby{
  const loc = useBooking(s=>s.location)
  const [retryKey, setRetryKey] = useState(0)
  const retry = useCallback(()=>setRetryKey(k=>k+1),[])
  const base = useMemo(()=>nearbyCuratedTheatres(loc, radiusKm),[loc.lat, loc.lng, radiusKm])      // eslint-disable-line react-hooks/exhaustive-deps
  const [live, setLive] = useState<{ key:string; theatres:TheatreWithDistance[]|null; error?:string; done:boolean }>({ key:'', theatres:null, done:true })
  const key = `${loc.source}|${loc.lat}|${loc.lng}|${radiusKm}|${retryKey}`

  useEffect(()=>{
    if (loc.source==='city'){ setLive({ key, theatres:null, done:true }); return }
    let cancelled = false
    setLive({ key, theatres:null, done:false })
    findCinemasNear(loc, radiusKm).then(list=>{
      if (cancelled) return; log('osm theatres', list.length); setLive({ key, theatres:list, done:true })
    }).catch(e=>{
      if (cancelled) return; log('osm lookup failed', e); setLive({ key, theatres:null, error:geoErrorMessage(e), done:true })
    })
    return ()=>{ cancelled = true }
  },[key])  // eslint-disable-line react-hooks/exhaustive-deps

  return useMemo(():Nearby=>{
    const fresh = live.key===key
    const refining = loc.source!=='city' && (!fresh || !live.done)
    if (fresh && live.theatres){
      const pool = nearbyCuratedTheatres(loc, radiusKm+30)       // wider pool so edge venues can still be matched
      const merged = withDistance(mergeVenues(pool, live.theatres), loc).filter(t=>t.distanceKm<=radiusKm)
      return { status:'ready', theatres:merged, source:live.theatres.length?'mixed':'curated', refining:false, retry }
    }
    if (base.length) return { status:'ready', theatres:base, source:'curated', refining,
      notice: fresh && live.error ? `${live.error} Showing cinemas from our database.` : undefined, retry }
    if (refining) return { status:'loading', theatres:[], source:'curated', refining:true, retry }
    if (fresh && live.error) return { status:'error', theatres:[], source:'curated', refining:false, error:live.error, retry }
    return { status:'ready', theatres:[], source:'curated', refining:false, retry }
  },[live, key, base, loc, radiusKm, retry])
}
