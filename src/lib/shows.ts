import type { Format, Show, TheatreShows, TheatreWithDistance } from '../data/types'
import { hashString, mulberry32, randInt, pick } from './rng'
import { createLogger } from './debug'
import { theatres as demoTheatres } from '../data/theatres'
import { withDistance } from './theatres'
const log = createLogger('shows')

export const CAPACITY = 280
const DAY_START = 9*60, DAY_END = 23*60+30, MIN_GAP = 165 // 2h45m between start times

const pad = (n:number)=>String(n).padStart(2,'0')
export const toHHMM = (mins:number)=>`${pad(Math.floor(mins/60))}:${pad(mins%60)}`
export const toISODate = (d:Date)=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`

/** Start times: n slots, each >= MIN_GAP apart, between 09:00 and 23:30 (max 6 slots fit). */
function makeSlots(rng:()=>number):number[]{
  const n = randInt(rng,4,6)
  const slack = (DAY_END-DAY_START) - (n-1)*MIN_GAP
  const w = Array.from({length:n+1},()=>rng()); const sum = w.reduce((a,b)=>a+b,0)
  const parts = w.map(x=>Math.floor(x/sum*slack))
  const slots:number[] = []; let t = DAY_START + parts[0]
  for (let i=0;i<n;i++){ slots.push(Math.round(t/5)*5); t += MIN_GAP + parts[i+1] }
  return slots
}
const base = (f:Format)=> f==='IMAX'?300 : f==='4DX'?380 : 180
const fillFor = (mins:number)=> mins<15*60 ? .25 : mins<18*60 ? .6 : .85

/**
 * Same (movie, theatre, day) -> same shows, always. Each theatre has its OWN seed, so a theatre's
 * times never change when the user moves and the list of nearby theatres changes. Nearest first.
 */
export function getShowsForTheatres(movieId:string, list:TheatreWithDistance[], dateISO:string, movieFormats?:Format[]):TheatreShows[]{
  const day = new Date(dateISO+'T12:00:00').getDay()
  const weekend = day===0 || day===6
  const result = [...list].sort((a,b)=>a.distanceKm-b.distanceKm).map(theatre=>{
    const rng = mulberry32(hashString(`${movieId}|${theatre.id}|${dateISO}`))
    const shows:Show[] = makeSlots(rng).map(mins=>{
      // Only formats BOTH the theatre and the movie support; fall back to the theatre's list.
      const options = theatre.formats.filter(f=>!movieFormats||movieFormats.includes(f))
      const format = pick(rng, options.length ? options : theatre.formats)
      const fillRatio = Math.min(.98, fillFor(mins)+rng()*.15)
      const time = toHHMM(mins)
      const priceFrom = Math.round(base(format)*(weekend?1.1:1))
      return { id:`${movieId}_${theatre.id}_${dateISO}_${time.replace(':','')}`, movieId, theatreId:theatre.id,
        date:dateISO, time, startsAt:`${dateISO}T${time}:00`, format, capacity:CAPACITY,
        soldCount:Math.round(fillRatio*CAPACITY), fillRatio, priceFrom, seed:hashString(`${movieId}|${theatre.id}|${dateISO}|${time}`) }
    })
    return { theatre, shows }
  })
  log('getShowsForTheatres', { movieId, dateISO, theatres: result.length, shows: result.reduce((n,r)=>n+r.shows.length,0) })
  return result
}

/** Show id = movieId_theatreId_YYYY-MM-DD_HHMM. Returns null if malformed. */
export function parseShowId(id:string){
  const m = /^([^_]+)_([^_]+)_(\d{4}-\d{2}-\d{2})_(\d{4})$/.exec(id)
  return m ? { movieId:m[1], theatreId:m[2], date:m[3], hhmm:m[4] } : null
}
/** Rebuilds a DEMO-theatre show from its id (refresh / shared link). Live OpenStreetMap venues can't be rebuilt without the store. */
export function findShowById(id:string):{ show:Show; theatre:TheatreWithDistance }|null{
  const p = parseShowId(id); if(!p) return null
  const t = demoTheatres.find(x=>x.id===p.theatreId); if(!t) return null
  const row = getShowsForTheatres(p.movieId, withDistance([t], t), p.date)[0]  // distance 0: ids/times don't depend on it
  const show = row?.shows.find(s=>s.id===id)
  return show ? { show, theatre:row.theatre } : null
}
