import { describe, it, expect } from 'vitest'
import { nearbyCuratedTheatres, distanceLabel, nameSimilarity, mergeVenues, withDistance } from '../src/lib/theatres'
import { searchLocalCities, quickCities } from '../src/lib/locations'
import { theatres, cityCenters } from '../src/data/theatres'
import { formatsFor } from '../src/lib/formats'
import type { Theatre } from '../src/data/types'

const DURGAPUR = { lat:23.5204, lng:87.3119 }
describe('curated database', () => {
  it('has 228 venues, unique ids without underscores (show ids split on _)', () => {
    expect(theatres).toHaveLength(228); expect(new Set(theatres.map(t=>t.id)).size).toBe(228); expect(theatres.every(t=>!t.id.includes('_'))).toBe(true)
  })
  it('every venue has a valid format list, a state and a district', () => {
    theatres.forEach(t=>{ expect(t.formats.length).toBeGreaterThan(0); expect(t.formats).toContain('2D'); expect(t.state && t.district).toBeTruthy() })
  })
  it('single screens/older cinemas are always 2D only; derived formats are deterministic', () => {
    expect(formatsFor('c62','Single Screen','Independent')).toEqual(['2D']); expect(formatsFor('c64','Multiplex','INOX')).toEqual(formatsFor('c64','Multiplex','INOX'))
  })
})
describe('nearbyCuratedTheatres', () => {
  it('Durgapur centre -> exactly the 5 Durgapur cinemas first, within 25 km', () => {
    const r = nearbyCuratedTheatres(DURGAPUR, 25)
    expect(r.slice(0,5).every(t=>t.city==='Durgapur')).toBe(true); expect(r.map(t=>t.city)).not.toContain('Kolkata')
  })
  it('radius grows the list; 50 km around Durgapur still excludes Kolkata (≈160 km)', () => {
    expect(nearbyCuratedTheatres(DURGAPUR,50).length).toBeGreaterThanOrEqual(nearbyCuratedTheatres(DURGAPUR,10).length)
    expect(nearbyCuratedTheatres(DURGAPUR,50).some(t=>t.city==='Kolkata')).toBe(false)
  })
  it('a point in the middle of nowhere finds nothing', () => { expect(nearbyCuratedTheatres({lat:15.2,lng:79.0}, 25)).toEqual([]) })
  it('sorted by distance then name (stable)', () => {
    const r = nearbyCuratedTheatres(DURGAPUR, 50); for (let i=1;i<r.length;i++) expect(r[i].distanceKm).toBeGreaterThanOrEqual(r[i-1].distanceKm)
  })
})
describe('distanceLabel', () => {
  const t = (precision:Theatre['precision'], d:number)=>({ ...theatres[0], precision, distanceKm:d, city:'Durgapur' } as any)
  it('exact/osm -> km; city precision -> "In city" or "≈ N km"', () => {
    expect(distanceLabel(t('exact',3.2))).toBe('3.2 km away'); expect(distanceLabel(t('osm',0.4))).toBe('0.4 km away')
    expect(distanceLabel(t('city',0))).toBe('In Durgapur'); expect(distanceLabel(t('city',12.4))).toBe('≈ 12 km away')
  })
})
describe('name matching + merge with live OSM data', () => {
  it('matches the same venue written differently, but not different venues of the same chain', () => {
    expect(nameSimilarity('INOX: South City, Kolkata Jadavpur','INOX South City Mall')).toBeGreaterThanOrEqual(.6)
    expect(nameSimilarity('INOX: Quest Mall','INOX South City Mall')).toBe(0)
    expect(nameSimilarity('INOX','INOX')).toBe(0)                       // chain name alone is never a match
  })
  const db = withDistance(theatres.filter(t=>t.city==='Kolkata'), { lat:22.5726, lng:88.3639 })
  const osm = (name:string, lat:number, lng:number):Theatre => ({ id:`osm-node-${name.length}`, name, city:'', lat, lng, formats:['2D'], hallId:'h', source:'osm', precision:'osm' })
  it('upgrades the matching venue to exact OSM coordinates, keeps its metadata, adds unknown ones', () => {
    const m = mergeVenues(db, [osm('INOX Quest Mall',22.5398,88.3652), osm('Some New Hall',22.6,88.4)])
    const quest = m.find(t=>t.name==='INOX: Quest Mall')!
    expect(quest).toMatchObject({ lat:22.5398, lng:88.3652, precision:'osm', source:'curated' }); expect(quest.area).toBe('Ballygunge')
    expect(m.find(t=>t.name==='Some New Hall')).toBeTruthy(); expect(m).toHaveLength(db.length+1)
  })
  it('does NOT merge when two database venues match equally (no wrong snap)', () => {
    const two = [ { ...db[0], id:'a1', name:'Star Plaza One', area:'' }, { ...db[1], id:'a2', name:'Star Plaza Two', area:'' } ]
    const m = mergeVenues(two, [osm('Star Plaza',22.5,88.3)])
    expect(m.filter(t=>t.precision==='osm')).toHaveLength(1); expect(m).toHaveLength(3)    // both kept + the OSM one added
  })
  it('never matches venues more than 30 km apart', () => {
    const far = mergeVenues(db, [osm('INOX Quest Mall',19.07,72.87)]); expect(far.find(t=>t.name==='INOX: Quest Mall')!.precision).toBe('city')
  })
})
describe('local place search', () => {
  it('city prefix, state, PIN code, too-short and unknown queries', () => {
    expect(searchLocalCities('durg')[0].label).toBe('Durgapur, West Bengal')
    expect(searchLocalCities('west bengal').every(p=>p.state==='West Bengal')).toBe(true)
    expect(searchLocalCities('713216')[0].label).toBe('Durgapur, West Bengal')
    expect(searchLocalCities('d')).toEqual([]); expect(searchLocalCities('zzzzzz')).toEqual([]); expect(searchLocalCities('999999')).toEqual([])
  })
  it('quick chips: 12, West Bengal first', () => {
    const q = quickCities(); expect(q).toHaveLength(12); expect(q[0].state).toBe('West Bengal'); expect(cityCenters.length).toBe(38)
  })
})
