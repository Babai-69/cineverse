import { describe, it, expect, vi } from 'vitest'
import { haversineKm } from '../src/lib/distance'
import { findCinemasNear, geocodePlace, reverseGeocode, getCurrentPosition, GeoError, labelFromNominatim } from '../src/lib/geo'
import { DURGAPUR_OVERPASS } from './helpers'
import { mockGeolocation, clearGeolocation } from './helpers'

const ok = (body:unknown)=>vi.fn(async()=>({ ok:true, status:200, json:async()=>body })) as any
const DURGAPUR = { lat:23.5204, lng:87.3119 }

describe('haversineKm', () => {
  it('0 for same point, ~1030 km Mumbai–Chennai', () => {
    expect(haversineKm(DURGAPUR,DURGAPUR)).toBe(0)
    const d = haversineKm({lat:19.076,lng:72.8777},{lat:13.0827,lng:80.2707})
    expect(d).toBeGreaterThan(1000); expect(d).toBeLessThan(1070)
  })
})
describe('findCinemasNear', () => {
  it('keeps named cinemas (nodes + way centres), skips unnamed, sorts nearest first, builds ids', async () => {
    const list = await findCinemasNear(DURGAPUR, 25, { fetchFn: ok(DURGAPUR_OVERPASS) })
    expect(list.map(t=>t.name)).toEqual(['City Centre Talkies','Bengal Silver Screen','Durgapur Cineplex'])
    expect(list[0].id).toBe('osm-node-222'); expect(list[1].id).toBe('osm-way-333')
    expect(list.every(t=>t.source==='osm' && t.distanceKm>=0)).toBe(true)
    expect(list[0].distanceKm).toBeLessThanOrEqual(list[1].distanceKm)
  })
  it('sends the query to Overpass as a POST with the radius in metres', async () => {
    const f = ok({ elements:[] }); await findCinemasNear({lat:19.076,lng:72.8777}, 10, { fetchFn:f })
    const [url, init] = f.mock.calls[0]
    expect(url).toContain('overpass'); expect(init.method).toBe('POST'); expect(decodeURIComponent(init.body)).toContain('around:10000,19.076,72.8777')
  })
  it('throws GeoError(network) on HTTP error and bad-response on odd JSON', async () => {
    await expect(findCinemasNear({lat:1,lng:1},5,{ fetchFn: vi.fn(async()=>({ok:false,status:500,json:async()=>({})})) as any })).rejects.toMatchObject({ code:'network' })
    await expect(findCinemasNear({lat:2,lng:2},5,{ fetchFn: ok({ nope:1 }) })).rejects.toMatchObject({ code:'bad-response' })
  })
})
describe('geocodePlace / reverseGeocode', () => {
  it('parses Nominatim results into short labels', async () => {
    const r = await geocodePlace('Durgapur', { fetchFn: ok([{ lat:'23.52', lon:'87.31', address:{ city:'Durgapur', state:'West Bengal' } }, { lat:'bad', lon:'x' }]) })
    expect(r).toEqual([{ lat:23.52, lng:87.31, label:'Durgapur, West Bengal' }])
  })
  it('ignores queries under 2 characters without calling the network', async () => {
    const f = ok([]); expect(await geocodePlace(' a ',{fetchFn:f})).toEqual([]); expect(f).not.toHaveBeenCalled()
  })
  it('reverseGeocode never throws', async () => {
    expect(await reverseGeocode(1,1,{ fetchFn: vi.fn(async()=>{ throw new Error('offline') }) as any })).toBeNull()
  })
  it('label falls back to display_name', () => { expect(labelFromNominatim({lat:'1',lon:'1',display_name:'A, B, C'})).toBe('A, B') })
})
describe('getCurrentPosition', () => {
  it('resolves coordinates', async () => { mockGeolocation(DURGAPUR); expect(await getCurrentPosition()).toMatchObject(DURGAPUR) })
  it.each([[1,'denied'],[2,'unavailable'],[3,'timeout']])('maps browser error %i -> %s', async (code, name) => {
    mockGeolocation({ code: code as 1|2|3 }); await expect(getCurrentPosition()).rejects.toMatchObject({ code:name })
  })
  it('unsupported when the browser has no geolocation', async () => { clearGeolocation(); await expect(getCurrentPosition()).rejects.toBeInstanceOf(GeoError) })
})
