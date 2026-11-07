import { describe, it, expect } from 'vitest'
import { seatPrice, priceSummary, isWeekend } from '../src/lib/pricing'
import { toggleSeat, MAX_SEATS, holdRemainingMs, formatMmSs } from '../src/lib/selection'
import { getShowsForTheatres } from '../src/lib/shows'
import { nearbyCuratedTheatres } from '../src/lib/theatres'

describe('pricing', () => {
  it('category + format surcharge, weekend +10%', () => {
    expect(seatPrice('Silver','2D','2026-11-04')).toBe(180)          // Wed
    expect(seatPrice('Gold','IMAX','2026-11-04')).toBe(380)
    expect(seatPrice('Premium','4DX','2026-11-04')).toBe(650)
    expect(isWeekend('2026-11-07')).toBe(true); expect(seatPrice('Silver','2D','2026-11-07')).toBe(198)
  })
  it('summary: fee ₹30 per ticket, GST 18% of fee, total adds up', () => {
    const s = priceSummary(['C1','C2','J5'], { format:'2D', date:'2026-11-04' })
    expect(s.count).toBe(3); expect(s.subtotal).toBe(260*2+180); expect(s.fee).toBe(90); expect(s.gst).toBe(16)
    expect(s.total).toBe(s.subtotal+s.fee+s.gst); expect(s.lines.map(l=>[l.category,l.count])).toEqual([['Gold',2],['Silver',1]])
  })
  it('empty selection costs 0', () => { expect(priceSummary([], { format:'2D', date:'2026-11-04' }).total).toBe(0) })
  it('show.priceFrom equals the cheapest seat (Silver) price for every generated show', () => {
    const rows = getShowsForTheatres('m1', nearbyCuratedTheatres({lat:22.5726,lng:88.3639},25), '2026-11-07')
    rows.forEach(r=>r.shows.forEach(s=>expect(seatPrice('Silver', s.format, s.date)).toBe(s.priceFrom)))
  })
})

describe('toggleSeat', () => {
  const none = new Set<string>()
  it('selects and deselects', () => {
    const a = toggleSeat([], 'C5', none); expect(a.seats).toEqual(['C5'])
    expect(toggleSeat(a.seats,'C5',none).seats).toEqual([])
  })
  it('couple recliners select and deselect as a pair', () => {
    const a = toggleSeat([], 'A3', none); expect(a.seats.sort()).toEqual(['A3','A4'])
    expect(toggleSeat(a.seats,'A4',none).seats).toEqual([])
  })
  it('blocks sold seats', () => { expect(toggleSeat([], 'C5', new Set(['C5']))).toEqual({ seats:[], error:'sold' }) })
  it('enforces the max of 10 (and a pair that would exceed it)', () => {
    const ten = Array.from({length:MAX_SEATS},(_,i)=>`H${i+1}`)
    expect(toggleSeat(ten,'G1',none)).toEqual({ seats:ten, error:'max' })
    const nine = ten.slice(0,9); expect(toggleSeat(nine,'A1',none).error).toBe('max')
  })
  it('unknown seat id is rejected', () => { expect(toggleSeat([], 'Z9', none).error).toBe('unknown') })
})
describe('hold timer helpers', () => {
  it('remaining time never negative; mm:ss format', () => {
    expect(holdRemainingMs(null, 5)).toBe(0); expect(holdRemainingMs(1000, 5000)).toBe(0); expect(holdRemainingMs(10_000, 4000)).toBe(6000)
    expect(formatMmSs(8*60*1000)).toBe('8:00'); expect(formatMmSs(65_000)).toBe('1:05'); expect(formatMmSs(500)).toBe('0:01')
  })
})
