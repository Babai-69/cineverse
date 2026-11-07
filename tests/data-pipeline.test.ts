import { describe, it, expect } from 'vitest'
// @ts-ignore plain .mjs modules
import { parseCsv, toCsv } from '../scripts/lib/csv.mjs'
// @ts-ignore
import { buildCinemas } from '../scripts/lib/build.mjs'
// @ts-ignore
import { geocodeOne, cleanName, queriesFor, km } from '../scripts/lib/geocode.mjs'
import { readFileSync } from 'node:fs'
import { RAW_CINEMAS, CITY_CENTERS } from '../src/data/cinemas.generated'

describe('csv parser', () => {
  it('handles BOM, quotes, commas, doubled quotes, CRLF, blank lines', () => {
    const rows = parseCsv('\uFEFFa,b\r\n1,"x, y"\r\n\r\n2,"say ""hi"""\r\n')
    expect(rows).toEqual([{ a:'1', b:'x, y' }, { a:'2', b:'say "hi"' }])
  })
  it('round-trips with toCsv', () => {
    const r = [{ a:'1', b:'x, "y"' }]; expect(parseCsv(toCsv(r,['a','b']))).toEqual(r)
  })
})
describe('the real uploaded CSV', () => {
  const rows = parseCsv(readFileSync('data/indian_cinema_database.csv','utf8'))
  const centers = JSON.parse(readFileSync('data/city-centers.json','utf8'))
  const res = buildCinemas(rows, centers)
  it('parses all 228 rows with no errors', () => { expect(rows).toHaveLength(228); expect(res.errors).toEqual([]) })
  it('every city has centre coordinates inside India', () => {
    for (const c of res.centers){ expect(c.lat).toBeGreaterThan(6); expect(c.lat).toBeLessThan(37.5); expect(c.lng).toBeGreaterThan(68); expect(c.lng).toBeLessThan(98) }
  })
  it('keeps the venues the user cares about (Durgapur, Asansol, Bardhaman, Kolkata)', () => {
    const names = (city:string)=>res.cinemas.filter((c:any)=>c.city===city).map((c:any)=>c.name)
    expect(names('Durgapur')).toEqual(expect.arrayContaining(['SVF Cinemas - Junction Mall','SVF Cinemas - Raj Sammilonee Mall','Durgapur Cinema']))
    expect(names('Asansol')).toContain('Cinecosmo Sentrum Mall'); expect(names('Bardhaman')).toContain('INOX Burdwan Arcade')
    expect(names('Kolkata')).toContain('INOX: Quest Mall')
  })
  it('generated TS file is in sync with the CSV (run `npm run data:build` if this fails)', () => {
    expect(RAW_CINEMAS.length).toBe(res.cinemas.length); expect(CITY_CENTERS.length).toBe(res.centers.length)
    expect(RAW_CINEMAS.map(c=>c.id)).toEqual(res.cinemas.map((c:any)=>c.id))
  })
})
describe('buildCinemas validation', () => {
  const centers = { Kolkata:{ lat:22.57, lng:88.36 } }
  const ok = { Cinema_ID:'1', Venue_Name:'A', City:'Kolkata', District:'K', State:'WB', PIN_Code:'700001' }
  it('reports duplicate ids, missing fields, unknown cities, bad PINs', () => {
    const r = buildCinemas([ok, { ...ok }, { ...ok, Cinema_ID:'2', Venue_Name:'' }, { ...ok, Cinema_ID:'3', City:'Nowhere' }, { ...ok, Cinema_ID:'4', PIN_Code:'12' }], centers)
    expect(r.errors.join('\n')).toMatch(/duplicate Cinema_ID 1/); expect(r.errors.join('\n')).toMatch(/missing Venue_Name/); expect(r.errors.join('\n')).toMatch(/no coordinates for city "Nowhere"/)
    expect(r.warnings.join('\n')).toMatch(/PIN "12"/)
  })
  it('uses exact coordinates when provided, rejects ones outside India', () => {
    const good = buildCinemas([ok], centers, [{ Cinema_ID:'1', Latitude:'22.5018', Longitude:'88.3622' }]).cinemas[0]
    expect(good).toMatchObject({ lat:22.5018, lng:88.3622, precision:'exact' })
    const bad = buildCinemas([ok], centers, [{ Cinema_ID:'1', Latitude:'51', Longitude:'0' }]).cinemas[0]
    expect(bad).toMatchObject({ lat:22.57, precision:'city' })
  })
  it('optional Formats column is parsed', () => {
    expect(buildCinemas([{ ...ok, Formats:'2D|IMAX' }], centers).cinemas[0].formats).toEqual(['2D','IMAX'])
  })
})
describe('geocoding logic (mock network)', () => {
  const kolkata = { lat:22.5726, lng:88.3639 }
  const row = { Venue_Name:'INOX: South City, Kolkata', Specific_Area:'Jadavpur', City:'Kolkata', State:'West Bengal', PIN_Code:'700068', Full_Address:'375 Prince Anwar Shah Rd, Kolkata 700068' }
  const fast = { sleep: async()=>{}, userAgent:'t' }
  const reply = (body:unknown)=>async()=>({ ok:true, status:200, json:async()=>body }) as any
  it('cleans names and builds specific -> general queries', () => {
    expect(cleanName('INOX: South City, Kolkata','Kolkata')).toBe('INOX South City')
    const q = queriesFor(row); expect(q[0]).toContain('INOX South City, Jadavpur, Kolkata'); expect(q.length).toBe(3)
  })
  it('accepts a hit near the city', async () => {
    const r = await geocodeOne(row, kolkata, { ...fast, fetchFn: reply([{ lat:'22.5018', lon:'88.3622' }]) })
    expect(r).toMatchObject({ lat:22.5018, lng:88.3622 })
  })
  it('rejects a hit in another city and tries the next query, then gives up (null)', async () => {
    let calls = 0
    const f = (async()=>{ calls++; return { ok:true, status:200, json:async()=>[{ lat:'19.07', lon:'72.87' }] } }) as any   // Mumbai
    expect(await geocodeOne(row, kolkata, { ...fast, fetchFn:f })).toBeNull(); expect(calls).toBe(3)
  })
  it('survives network errors', async () => {
    expect(await geocodeOne(row, kolkata, { ...fast, fetchFn: async()=>{ throw new Error('offline') } })).toBeNull()
  })
  it('km() sanity', () => { expect(km(kolkata,kolkata)).toBe(0); expect(km(kolkata,{lat:19.076,lng:72.8777})).toBeGreaterThan(1600) })
})
