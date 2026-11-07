/**
 * Location services (browser + free OpenStreetMap APIs). No API keys.
 *  - getCurrentPosition : browser GPS (asks permission ONLY when called from a user click)
 *  - geocodePlace       : "Durgapur" -> coordinates      (Nominatim search)
 *  - reverseGeocode     : coordinates -> "Durgapur, West Bengal"  (Nominatim reverse)
 *  - findCinemasNear    : real cinemas around a point    (Overpass, amenity=cinema)
 * Every network function accepts an optional fetchFn so tests can mock it.
 * Debug: open the site with ?debug=1 and watch the [cinehall:geo] console lines.
 * Usage policy: Nominatim = max 1 request/sec, user-initiated only. Attribution lives in Footer.
 */
import type { LatLng, Theatre, TheatreWithDistance } from '../data/types'
import { createLogger } from './debug'
import { withDistance } from './theatres'
import { formatsFor } from './formats'

const log = createLogger('geo')

export type GeoErrorCode = 'unsupported'|'insecure'|'denied'|'unavailable'|'timeout'|'network'|'bad-response'
export class GeoError extends Error {
  code: GeoErrorCode
  constructor(code:GeoErrorCode, message:string){ super(message); this.code = code; this.name = 'GeoError' }
}
/** Human-friendly text for the UI. */
export function geoErrorMessage(e:unknown):string{
  const code = e instanceof GeoError ? e.code : 'network'
  switch(code){
    case 'unsupported': return 'This browser cannot detect location. Search for a place instead.'
    case 'insecure': return 'Location needs a secure (https) page. Search for a place instead.'
    case 'denied': return 'Location permission is blocked. Allow it in your browser’s site settings, or search for a place.'
    case 'unavailable': return 'Your position could not be determined. Try again or search for a place.'
    case 'timeout': return 'Finding your position took too long. Try again or search for a place.'
    case 'bad-response': return 'The location service sent an unexpected answer. Please try again.'
    default: return 'Could not reach the location service. Check your connection and try again.'
  }
}

export type DetectedPosition = LatLng & { accuracyM:number }
export function getCurrentPosition(timeoutMs = 10000):Promise<DetectedPosition>{
  return new Promise((resolve, reject)=>{
    if (typeof window !== 'undefined' && window.isSecureContext === false) return reject(new GeoError('insecure','insecure context'))
    if (typeof navigator === 'undefined' || !navigator.geolocation) return reject(new GeoError('unsupported','no geolocation'))
    navigator.geolocation.getCurrentPosition(
      p => { log('gps ok', { accuracyM: p.coords.accuracy }); resolve({ lat:p.coords.latitude, lng:p.coords.longitude, accuracyM:p.coords.accuracy }) },
      err => { log('gps error', err.code, err.message)
        reject(new GeoError(err.code===1?'denied': err.code===3?'timeout':'unavailable', err.message)) },
      { enableHighAccuracy:false, timeout:timeoutMs, maximumAge:5*60*1000 })
  })
}

type FetchFn = typeof fetch
type Opts = { fetchFn?:FetchFn; signal?:AbortSignal; timeoutMs?:number }

async function fetchJson(url:string, init:RequestInit, { fetchFn, signal, timeoutMs=15000 }:Opts):Promise<unknown>{
  const f = fetchFn ?? fetch
  const ctrl = new AbortController()
  const timer = setTimeout(()=>ctrl.abort(), timeoutMs)
  signal?.addEventListener('abort', ()=>ctrl.abort())
  try{
    const res = await f(url, { ...init, signal: ctrl.signal })
    if (!res.ok) throw new GeoError('network', `HTTP ${res.status}`)
    return await res.json()
  }catch(e){
    if (e instanceof GeoError) throw e
    if (signal?.aborted) throw e
    throw new GeoError('network', e instanceof Error ? e.message : 'fetch failed')
  }finally{ clearTimeout(timer) }
}

type NominatimItem = { lat:string; lon:string; display_name?:string; address?:Record<string,string> }
/** "Durgapur, West Bengal" style label from a Nominatim item. */
export function labelFromNominatim(it:NominatimItem):string{
  const a = it.address ?? {}
  const place = a.suburb || a.neighbourhood || a.city || a.town || a.village || a.municipality || a.county
  const parts = [place, a.state].filter(Boolean) as string[]
  if (parts.length) return parts.join(', ')
  return (it.display_name ?? 'Selected place').split(',').slice(0,2).map(s=>s.trim()).join(', ')
}

export type Place = LatLng & { label:string }
export async function geocodePlace(query:string, opts:Opts = {}):Promise<Place[]>{
  const q = query.trim()
  if (q.length < 2) return []
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=5&q=${encodeURIComponent(q)}`
  const data = await fetchJson(url, { headers:{ Accept:'application/json' } }, opts)
  if (!Array.isArray(data)) throw new GeoError('bad-response','not an array')
  log('geocode', q, '->', data.length)
  return (data as NominatimItem[]).map(it=>({ lat:Number(it.lat), lng:Number(it.lon), label:labelFromNominatim(it) }))
    .filter(p=>Number.isFinite(p.lat) && Number.isFinite(p.lng))
}

/** Never throws: a missing label must not block the user. */
export async function reverseGeocode(lat:number, lng:number, opts:Opts = {}):Promise<string|null>{
  try{
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&zoom=14&lat=${lat}&lon=${lng}`
    const data = await fetchJson(url, { headers:{ Accept:'application/json' } }, { timeoutMs:4000, ...opts }) as NominatimItem
    return data && (data.address || data.display_name) ? labelFromNominatim(data) : null
  }catch(e){ log('reverse geocode failed', e); return null }
}

type OsmElement = { type:string; id:number; lat?:number; lon?:number; center?:{lat:number;lon:number}; tags?:Record<string,string> }
const cache = new Map<string, TheatreWithDistance[]>()
export const clearCinemaCache = ()=>cache.clear()

/** Real cinemas within radiusKm of `from`, nearest first (max 20). Showtimes for them are demo data. */
export async function findCinemasNear(from:LatLng, radiusKm:number, opts:Opts = {}):Promise<TheatreWithDistance[]>{
  const key = `${from.lat.toFixed(2)},${from.lng.toFixed(2)},${radiusKm}`
  const hit = cache.get(key)
  if (hit) { log('cinema cache hit', key); return withDistance(hit, from) }
  const r = Math.round(radiusKm*1000)
  const query = `[out:json][timeout:20];(node["amenity"="cinema"](around:${r},${from.lat},${from.lng});way["amenity"="cinema"](around:${r},${from.lat},${from.lng}););out center tags;`
  const data = await fetchJson('https://overpass-api.de/api/interpreter',
    { method:'POST', headers:{ 'Content-Type':'application/x-www-form-urlencoded' }, body:`data=${encodeURIComponent(query)}` }, { timeoutMs:25000, ...opts }) as { elements?:OsmElement[] }
  if (!data || !Array.isArray(data.elements)) throw new GeoError('bad-response','no elements')
  const seen = new Set<string>()
  const list:Theatre[] = []
  for (const el of data.elements){
    const name = el.tags?.name || el.tags?.['name:en']
    const lat = el.lat ?? el.center?.lat, lng = el.lon ?? el.center?.lon
    if (!name || lat==null || lng==null) continue            // skip unnamed / no position
    const dedupe = `${name.toLowerCase()}|${lat.toFixed(3)}|${lng.toFixed(3)}`
    if (seen.has(dedupe)) continue; seen.add(dedupe)
    const id = `osm-${el.type}-${el.id}`
    list.push({ id, name, city: el.tags?.['addr:city'] ?? '', lat, lng, formats: formatsFor(id,'Multiplex',el.tags?.operator ?? 'OSM'), hallId:'hall-main', source:'osm', precision:'osm' })
  }
  const result = withDistance(list, from).slice(0,20)
  log('cinemas found', { radiusKm, raw:data.elements.length, kept:result.length })
  cache.set(key, result)
  return result
}
