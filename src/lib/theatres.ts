/** Theatre helpers: distances, nearby lookup in the curated database, merging with live OpenStreetMap results. */
import { theatres as curated } from '../data/theatres'
import type { LatLng, Theatre, TheatreWithDistance } from '../data/types'
import { haversineKm } from './distance'

const round1 = (n:number)=>Math.round(n*10)/10

/** Adds distanceKm (1 decimal), sorted nearest first (ties by name, so lists are stable). */
export function withDistance(list:Theatre[], from:LatLng):TheatreWithDistance[]{
  return list.map(t=>({ ...t, distanceKm: round1(haversineKm(from,t)) }))
    .sort((a,b)=>a.distanceKm-b.distanceKm || a.name.localeCompare(b.name))
}
export function nearbyCuratedTheatres(from:LatLng, radiusKm:number):TheatreWithDistance[]{
  return withDistance(curated, from).filter(t=>t.distanceKm<=radiusKm)
}
/** "3.2 km away" for exact positions; for city-centre-only positions "In Durgapur" / "≈ 12 km away". */
export function distanceLabel(t:TheatreWithDistance):string{
  if (t.precision!=='city') return `${t.distanceKm} km away`
  return t.distanceKm<3 ? `In ${t.city}` : `≈ ${Math.round(t.distanceKm)} km away`
}

/* ---------- merge curated database + live OSM results ---------- */
const GENERIC = new Set(['cinema','cinemas','mall','multiplex','theatre','theater','talkies','the','and','of','hall','screen','screens'])
const CHAINS = new Set(['inox','pvr','cinepolis','svf','miraj','carnival','bioscope','fun','rajhans','moviemax','ssr','amb','movietime','wave','eylex','pvrinox'])
const tokens = (s:string)=>s.toLowerCase().replace(/[^a-z0-9]+/g,' ').split(' ').filter(w=>w && !GENERIC.has(w))
/** Distinctive words (chain names removed) -> two names match only if they share a place-like word. */
const distinctive = (s:string)=>new Set(tokens(s).filter(w=>!CHAINS.has(w)))
export function nameSimilarity(a:string, b:string):number{
  const A = distinctive(a), B = distinctive(b)
  if (!A.size || !B.size) return 0
  let hit = 0; A.forEach(w=>{ if (B.has(w)) hit++ })
  return hit/Math.min(A.size,B.size)
}
/**
 * Combine our database with live OSM cinemas:
 *  - an OSM cinema that clearly matches ONE database venue (same distinctive words) gives that venue its exact coordinates
 *  - ambiguous matches are NOT merged (better two listings than a wrong snap)
 *  - unmatched OSM cinemas are added as-is, unmatched database venues stay (city-centre precision)
 */
export function mergeVenues(db:Theatre[], osm:Theatre[]):Theatre[]{
  const used = new Set<string>(), upgraded = new Map<string,Theatre>(), extra:Theatre[] = []
  for (const o of osm){
    const scored = db.filter(c=>!used.has(c.id) && haversineKm(c,o)<=30)
      .map(c=>({ c, sim:nameSimilarity(`${c.name} ${c.area??''}`, o.name) })).filter(x=>x.sim>=.6).sort((a,b)=>b.sim-a.sim)
    if (scored.length && (scored.length===1 || scored[0].sim>scored[1].sim)){
      const c = scored[0].c; used.add(c.id); upgraded.set(c.id, { ...c, lat:o.lat, lng:o.lng, precision:'osm' })
    } else extra.push(o)
  }
  return [...db.map(c=>upgraded.get(c.id) ?? c), ...extra]
}
