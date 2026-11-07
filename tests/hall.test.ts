import { describe, it, expect } from 'vitest'
import { HALL, HALL_CAPACITY, HALL_DIMS, soldSeatIds, clampToHall, floorYAt, seatUnits } from '../src/lib/hall'
import { CAPACITY } from '../src/lib/shows'

describe('hall layout', () => {
  it('has exactly CAPACITY (280) unique seats', () => {
    expect(HALL_CAPACITY).toBe(CAPACITY); expect(HALL.byId.size).toBe(280)
  })
  it('category counts: Premium 16, Gold 96, Silver 90, Balcony 78', () => {
    const c = (k:string)=>HALL.seats.filter(s=>s.category===k).length
    expect([c('Premium'),c('Gold'),c('Silver'),c('Balcony')]).toEqual([16,96,90,78])
  })
  it('skips row letters I and O; rows in order A..R', () => {
    expect(HALL.rows.map(r=>r.row).join('')).toBe('ABCDEFGHJKLMNPQR')
  })
  it('couple recliners pair up symmetrically (A1<->A2 …)', () => {
    const prem = HALL.seats.filter(s=>s.category==='Premium')
    prem.forEach(s=>expect(HALL.byId.get(s.coupleWith!)!.coupleWith).toBe(s.id))
    expect(HALL.byId.get('A1')!.coupleWith).toBe('A2')
    expect(HALL.seats.filter(s=>s.category!=='Premium').every(s=>!s.coupleWith)).toBe(true)
  })
  it('every seat is inside the walls and no two seats in a row overlap', () => {
    const half = HALL_DIMS.width/2
    for (const r of HALL.rows){
      r.seats.forEach(s=>expect(Math.abs(s.pos[0])).toBeLessThan(half-.8))
      for (let i=1;i<r.seats.length;i++){
        const gap = r.seats[i].pos[0]-r.seats[i-1].pos[0], need = r.seats[i].recliner ? 1 : .6
        expect(gap).toBeGreaterThanOrEqual(need-1e-6)
      }
    }
  })
  it('rows get higher and deeper going back; balcony is above the main floor', () => {
    for (let i=1;i<HALL.rows.length;i++){ expect(HALL.rows[i].z).toBeGreaterThan(HALL.rows[i-1].z); expect(HALL.rows[i].y).toBeGreaterThan(HALL.rows[i-1].y-1e-9) }
    expect(HALL.byId.get('P1')!.pos[1]).toBeGreaterThan(HALL.byId.get('N1')!.pos[1]+1)
  })
  it('all seats are in front of the back wall and behind the screen', () => {
    HALL.seats.forEach(s=>{ expect(s.pos[2]).toBeGreaterThan(HALL_DIMS.screenZ+3); expect(s.pos[2]).toBeLessThan(HALL_DIMS.backZ) })
  })
  it('two wheelchair spaces', () => { expect(HALL.seats.filter(s=>s.accessible).map(s=>s.id)).toEqual(['J1','J18']) })
})

describe('soldSeatIds', () => {
  it('is deterministic and close to soldCount', () => {
    const a = soldSeatIds({ seed:12345, soldCount:120 }), b = soldSeatIds({ seed:12345, soldCount:120 })
    expect([...a]).toEqual([...b]); expect(a.size).toBeGreaterThanOrEqual(120); expect(a.size).toBeLessThanOrEqual(121)
  })
  it('different shows sell different seats', () => {
    expect([...soldSeatIds({seed:1,soldCount:100})]).not.toEqual([...soldSeatIds({seed:2,soldCount:100})])
  })
  it('couple recliners are always sold together', () => {
    for (let seed=1; seed<30; seed++){
      const sold = soldSeatIds({ seed, soldCount:150 })
      for (const u of seatUnits()) if (u.length===2) expect(sold.has(u[0])).toBe(sold.has(u[1]))
    }
  })
  it('0 sold -> empty; everything sold -> all 280', () => {
    expect(soldSeatIds({seed:5,soldCount:0}).size).toBe(0); expect(soldSeatIds({seed:5,soldCount:999}).size).toBe(280)
  })
})

describe('clampToHall', () => {
  it('leaves a safe point unchanged', () => { expect(clampToHall([0,6,2])).toEqual([0,6,2]) })
  it('pulls points inside walls, below ceiling and above floor', () => {
    const [x,y,z] = clampToHall([99,99,99]); expect(x).toBeLessThanOrEqual(HALL_DIMS.width/2); expect(y).toBeLessThan(HALL_DIMS.height); expect(z).toBeLessThan(HALL_DIMS.backZ)
    const [,y2] = clampToHall([0,-50,-8]); expect(y2).toBeGreaterThanOrEqual(floorYAt(-8)+.9)
    const [,,z2] = clampToHall([0,5,-99]); expect(z2).toBeGreaterThan(HALL_DIMS.screenZ)
  })
  it('never leaves a camera inside the balcony slab (random fuzz)', () => {
    const lo = HALL_DIMS.balconySlabY-.4, hi = HALL_DIMS.balconySlabY+.1
    for (let i=0;i<500;i++){
      const [,y,z] = clampToHall([Math.sin(i)*30, 1+((i*37)%120)/10, 3+((i*13)%90)/10])
      if (z>HALL_DIMS.balconyFromZ) expect(y<=lo || y>=hi).toBe(true)
    }
  })
  it('is idempotent', () => { const p = clampToHall([40,30,-30]); expect(clampToHall(p)).toEqual(p) })
})
