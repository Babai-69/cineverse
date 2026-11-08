/**
 * ✦ Best N seats: the best group of N seats next to each other.
 * Skips sold seats, wheelchair spaces and groups that would cross an aisle. A group scores
 *   distance of the group's centre from the middle of the row (x1.2)  +  distance of its row from the "sweet spot" row
 * (lower = better). Balcony rows count 30% further from the sweet spot, so they are the last choice. Ties: nearer the centre.
 */
import { HALL, type Category, type RowDef, type SeatDef } from './hall'
import { MAX_SEATS } from './selection'

export const MAIN_ROWS = HALL.rows.filter(r=>r.category!=='Balcony')
/** About 60% of the way from the first to the last main-floor row (where most people like to sit). */
export const SWEET_Z = MAIN_ROWS[0].z + .6*(MAIN_ROWS[MAIN_ROWS.length-1].z - MAIN_ROWS[0].z)
export const BALCONY_PENALTY = 1.3
export const CENTRE_WEIGHT = 1.2

/** Runs of neighbouring seats with no aisle between them. */
export function seatBlocks(row:RowDef):SeatDef[][]{
  const blocks:SeatDef[][] = []; let cur:SeatDef[] = []
  row.seats.forEach((s,i)=>{
    const prev = row.seats[i-1]
    const aisle = prev && s.pos[0]-prev.pos[0] > (s.recliner ? 1 : .6) + .5
    if (aisle){ blocks.push(cur); cur = [] }
    cur.push(s)
  })
  if (cur.length) blocks.push(cur); return blocks
}

export type BestSeatsResult = { seats:string[]; row:string; category:Category }
export function findBestSeats(qty:number, sold:ReadonlySet<string>, category:Category|'Any'='Any'):BestSeatsResult|null{
  if (!Number.isInteger(qty) || qty<1 || qty>MAX_SEATS) return null      // can never exceed the 10-seat booking limit
  let best:{ score:number; centre:number; ids:string[]; row:RowDef }|null = null
  for (const row of HALL.rows){
    if (category!=='Any' && row.category!==category) continue
    const rowPenalty = Math.abs(row.z-SWEET_Z) * (row.category==='Balcony' ? BALCONY_PENALTY : 1)
    for (const block of seatBlocks(row)){
      for (let i=0; i+qty<=block.length; i++){
        const win = block.slice(i, i+qty)
        if (win.some(s=>sold.has(s.id) || s.accessible)) continue
        const centre = Math.abs(win.reduce((n,s)=>n+s.pos[0],0)/qty)
        const score = centre*CENTRE_WEIGHT + rowPenalty
        if (!best || score<best.score-1e-9 || (Math.abs(score-best.score)<=1e-9 && centre<best.centre)) best = { score, centre, ids:win.map(s=>s.id), row }
      }
    }
  }
  return best ? { seats:best.ids, row:best.row.row, category:best.row.category } : null
}
/** Largest group that can sit together in a category (for helpful "no seats" messages). */
export function largestGroup(sold:ReadonlySet<string>, category:Category|'Any'='Any'):number{
  for (let q=10; q>=1; q--) if (findBestSeats(q, sold, category)) return q
  return 0
}
