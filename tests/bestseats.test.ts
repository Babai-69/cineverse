import { describe, it, expect } from 'vitest'
import { findBestSeats, seatBlocks, largestGroup, SWEET_Z } from '../src/lib/bestSeats'
import { HALL, soldSeatIds } from '../src/lib/hall'

const none = new Set<string>()
const seatsOf = (ids:string[])=>ids.map(id=>HALL.byId.get(id)!)
describe('seatBlocks', () => {
  it('splits rows at the aisles: Gold 4|8|4, Silver 5|8|5, Balcony 7|12|7, Premium 4|4', () => {
    const sizes = (row:string)=>seatBlocks(HALL.rows.find(r=>r.row===row)!).map(b=>b.length)
    expect(sizes('C')).toEqual([4,8,4]); expect(sizes('K')).toEqual([5,8,5]); expect(sizes('Q')).toEqual([7,12,7]); expect(sizes('A')).toEqual([4,4])
  })
})
describe('findBestSeats', () => {
  it('empty hall, 2 seats: the middle of the sweet-spot row (H8+H9), Gold', () => {
    const r = findBestSeats(2, none)!; expect(r.seats).toEqual(['H8','H9']); expect(r.category).toBe('Gold')
    expect(Math.abs(HALL.rows.find(x=>x.row==='H')!.z - SWEET_Z)).toBeLessThan(.5)
  })
  it('returns exactly qty seats, in one row, side by side, never across an aisle, never a wheelchair space', () => {
    for (let q=1;q<=10;q++) for (const cat of ['Any','Premium','Gold','Silver','Balcony'] as const){
      const r = findBestSeats(q, none, cat); if (!r) continue
      const ss = seatsOf(r.seats); expect(ss).toHaveLength(q)
      expect(new Set(ss.map(s=>s.row)).size).toBe(1)
      const nums = ss.map(s=>s.number); expect(nums[nums.length-1]-nums[0]).toBe(q-1)                       // consecutive numbers
      const block = seatBlocks(HALL.rows.find(x=>x.row===ss[0].row)!).find(b=>b.some(s=>s.id===ss[0].id))!
      expect(ss.every(s=>block.includes(s))).toBe(true)                                                  // same block => no aisle crossed
      expect(ss.some(s=>s.accessible)).toBe(false)
      if (cat!=='Any') expect(r.category).toBe(cat)
    }
  })
  it('never returns a sold seat, and finds the next best group when the best is taken', () => {
    const a = findBestSeats(2, none)!; const b = findBestSeats(2, new Set([a.seats[0]]))!
    expect(b.seats).not.toContain(a.seats[0]); expect(b.seats).toHaveLength(2)
    for (let seed=1; seed<40; seed++){ const sold = soldSeatIds({ seed, soldCount:150 }); const r = findBestSeats(3, sold); if (r) r.seats.forEach(id=>expect(sold.has(id)).toBe(false)) }
  })
  it('category filter: Premium -> A/B recliners, Balcony -> P/Q/R only', () => {
    expect(['A','B']).toContain(findBestSeats(2, none, 'Premium')!.row); expect(['P','Q','R']).toContain(findBestSeats(2, none, 'Balcony')!.row)
  })
  it('balcony is the last choice for "Any" unless the main floor cannot fit the group', () => {
    expect(findBestSeats(8, none)!.category).not.toBe('Balcony')
    const r = findBestSeats(10, none)!; expect(r.category).toBe('Balcony')                                   // only the 12-seat balcony middle blocks fit 10
  })
  it('prefers the centre: a single seat goes to the middle of the row', () => {
    const s = HALL.byId.get(findBestSeats(1, none)!.seats[0])!; expect(Math.abs(s.pos[0])).toBeLessThan(.5)
  })
  it('null when nothing fits (all sold, bad qty, 11 together)', () => {
    expect(findBestSeats(2, new Set(HALL.seats.map(s=>s.id)))).toBeNull()
    expect(findBestSeats(0, none)).toBeNull(); expect(findBestSeats(11, none)).toBeNull(); expect(findBestSeats(2.5, none)).toBeNull()
    expect(findBestSeats(9, none, 'Premium')).toBeNull()
  })
  it('is deterministic', () => { const sold = soldSeatIds({ seed:77, soldCount:120 }); expect(findBestSeats(4, sold)).toEqual(findBestSeats(4, sold)) })
  it('largestGroup reports how many fit together', () => {
    expect(largestGroup(none,'Premium')).toBe(4); expect(largestGroup(none,'Balcony')).toBe(12 > 10 ? 10 : 12); expect(largestGroup(new Set(HALL.seats.map(s=>s.id)))).toBe(0)
  })
})
