/** Seat selection rules (pure). Couple recliners move together, sold seats are blocked, max 10 seats. */
import { HALL } from './hall'
export const MAX_SEATS = 10
export type SelectionError = 'sold'|'max'|'unknown'
export type ToggleResult = { seats:string[]; error?:SelectionError }

export function toggleSeat(selected:readonly string[], id:string, sold:ReadonlySet<string>):ToggleResult{
  const seat = HALL.byId.get(id)
  if (!seat) return { seats:[...selected], error:'unknown' }
  const group = seat.coupleWith ? [id, seat.coupleWith] : [id]
  if (selected.includes(id)) return { seats: selected.filter(s=>!group.includes(s)) }     // deselect (pair together)
  if (group.some(g=>sold.has(g))) return { seats:[...selected], error:'sold' }
  const next = [...selected, ...group.filter(g=>!selected.includes(g))]
  if (next.length>MAX_SEATS) return { seats:[...selected], error:'max' }
  return { seats:next }
}
export const HOLD_MS = 8*60*1000
export const holdRemainingMs = (expiresAt:number|null, now:number)=> expiresAt==null ? 0 : Math.max(0, expiresAt-now)
export const formatMmSs = (ms:number)=>{ const s = Math.ceil(ms/1000); return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}` }
