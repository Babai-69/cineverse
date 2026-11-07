/** Instant, offline place search over the cinema database (cities, states, PIN codes). */
import { cityCenters, theatres } from '../data/theatres'
import type { UserLocation } from '../data/types'

export type LocalPlace = UserLocation & { count:number; state:string }
const toPlace = (c:{name:string;state:string;lat:number;lng:number;count:number}):LocalPlace =>
  ({ lat:c.lat, lng:c.lng, label:`${c.name}, ${c.state}`, source:'city', count:c.count, state:c.state })

export function searchLocalCities(query:string, limit=6):LocalPlace[]{
  const q = query.trim().toLowerCase()
  if (q.length<2) return []
  if (/^\d{6}$/.test(q)){                                  // PIN code -> the city of the venue(s) with that PIN
    const t = theatres.find(x=>x.pin===q); const c = t && cityCenters.find(c=>c.name===t.city)
    return c ? [toPlace(c)] : []
  }
  const byName = cityCenters.filter(c=>c.name.toLowerCase().includes(q))
  const byState = cityCenters.filter(c=>c.state.toLowerCase().includes(q) && !byName.includes(c))
  const rank = (c:typeof cityCenters[number])=> (c.name.toLowerCase().startsWith(q)?0:1)
  return [...byName.sort((a,b)=>rank(a)-rank(b)||b.count-a.count), ...byState.sort((a,b)=>b.count-a.count)].slice(0,limit).map(toPlace)
}
/** Chips for the picker: West Bengal first, then the busiest cities. */
export const quickCities = ():LocalPlace[] =>
  [...cityCenters].sort((a,b)=>(a.state==='West Bengal'?0:1)-(b.state==='West Bengal'?0:1)||b.count-a.count).slice(0,12).map(toPlace)
