/** Seat selection rules (pure). Every seat — recliners included — is picked on its own. Sold seats are blocked, max 10 seats. */
import { HALL } from './hall'
export const MAX_SEATS = 10
export type SelectionError = 'sold'|'max'|'unknown'
export type ToggleResult = { seats:string[]; error?:SelectionError }

export function toggleSeat(selected:readonly string[], id:string, sold:ReadonlySet<string>):ToggleResult{
  if (!HALL.byId.has(id)) return { seats:[...selected], error:'unknown' }
  if (selected.includes(id)) return { seats: selected.filter(s=>s!==id) }          // deselect
  if (sold.has(id)) return { seats:[...selected], error:'sold' }
  if (selected.length>=MAX_SEATS) return { seats:[...selected], error:'max' }
  return { seats:[...selected, id] }
}
export const HOLD_MS = 8*60*1000
export const holdRemainingMs = (expiresAt:number|null, now:number)=> expiresAt==null ? 0 : Math.max(0, expiresAt-now)
export const formatMmSs = (ms:number)=>{ const s = Math.ceil(ms/1000); return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}` }
