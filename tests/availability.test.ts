import { describe, it, expect } from 'vitest'
import { levelOf, hasStarted, smartPick } from '../src/lib/availability'
import { getShowsForTheatres } from '../src/lib/shows'
import { nearbyCuratedTheatres } from '../src/lib/theatres'
import type { Show } from '../src/data/types'

const show = (fill:number, startsAt='2026-11-07T18:00:00'):Show => ({ id:'x', movieId:'m1', theatreId:'t', date:'2026-11-07', time:'18:00', startsAt, format:'2D', capacity:280, soldCount:0, fillRatio:fill, priceFrom:180, seed:1 })
describe('levelOf', () => {
  it('green >50% free, amber 20–50%, red <20%', () => {
    expect(levelOf(show(.49))).toBe('plenty'); expect(levelOf(show(.5))).toBe('filling')
    expect(levelOf(show(.8))).toBe('filling'); expect(levelOf(show(.81))).toBe('almost')
  })
})
describe('hasStarted', () => {
  it('compares start to now', () => {
    expect(hasStarted(show(.3),new Date('2026-11-07T18:00:00'))).toBe(true)
    expect(hasStarted(show(.3),new Date('2026-11-07T17:59:00'))).toBe(false)
  })
})
describe('smartPick', () => {
  const rows = getShowsForTheatres('m1', nearbyCuratedTheatres({lat:22.5726,lng:88.3639},25), '2026-11-07', ['2D','IMAX'])
  it('picks one theatre with reasons, deterministically', () => {
    const a = smartPick(rows,new Date('2026-11-07T08:00:00')); const b = smartPick(rows,new Date('2026-11-07T08:00:00'))
    expect(a).not.toBeNull(); expect(a).toEqual(b); expect(rows.some(r=>r.theatre.id===a!.theatreId)).toBe(true)
  })
  it('returns null when every show has started', () => { expect(smartPick(rows,new Date('2026-11-08T03:00:00'))).toBeNull() })
  it('ignores theatres whose shows have all started', () => {
    const late = rows.map((r,i)=>i===0 ? { ...r, shows:r.shows.map(s=>({ ...s, startsAt:'2026-11-07T01:00:00' })) } : r)
    expect(smartPick(late,new Date('2026-11-07T08:00:00'))!.theatreId).not.toBe(rows[0].theatre.id)
  })
})
