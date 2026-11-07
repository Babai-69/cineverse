/** Seat availability levels, "already started" logic, and the Smart pick score. Pure functions. */
import type { Show, TheatreShows } from '../data/types'

export type Level = 'plenty'|'filling'|'almost'
export const freeRatio = (s:Show)=>1 - s.fillRatio
/** >50% free = plenty (green), 20–50% = filling (amber), <20% = almost full (red). */
export function levelOf(s:Show):Level{ const f = Math.round(freeRatio(s)*1000)/1000 /* avoid 0.1999999 float edge */; return f>0.5 ? 'plenty' : f>=0.2 ? 'filling' : 'almost' }
export const LEVEL_LABEL:Record<Level,string> = { plenty:'Plenty of seats', filling:'Filling fast', almost:'Almost full' }
export const hasStarted = (s:Show, now:Date)=> new Date(s.startsAt).getTime() <= now.getTime()

export type SmartPick = { theatreId:string; reasons:string[]; score:number }
/**
 * ✦ Smart pick = best mix of distance (45%), seats left in the best upcoming show (40%) and premium format (15%).
 * Only theatres with at least one upcoming show are considered. Ties go to the nearer theatre.
 */
export function smartPick(rows:TheatreShows[], now:Date):SmartPick|null{
  let best:SmartPick|null = null; let bestDist = Infinity
  for (const { theatre, shows } of rows){
    const upcoming = shows.filter(s=>!hasStarted(s, now))
    if (!upcoming.length) continue
    const bestFree = Math.max(...upcoming.map(freeRatio))
    const premium = upcoming.some(s=>s.format!=='2D')
    const near = 1 - Math.min(theatre.distanceKm/15, 1)
    const score = .45*near + .40*bestFree + .15*(premium?1:0)
    const reasons:string[] = []
    if (theatre.distanceKm<=3) reasons.push('Close by')
    if (bestFree>0.5) reasons.push('Plenty of seats')
    const fmt = upcoming.find(s=>s.format!=='2D')?.format; if (fmt) reasons.push(fmt)
    if (!best || score>best.score+1e-9 || (Math.abs(score-best.score)<=1e-9 && theatre.distanceKm<bestDist)){
      best = { theatreId:theatre.id, reasons, score }; bestDist = theatre.distanceKm }
  }
  return best
}
