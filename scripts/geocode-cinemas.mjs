#!/usr/bin/env node
/**
 * Finds exact latitude/longitude for every cinema using OpenStreetMap Nominatim (free, no key).
 *   npm run geocode                 -> all cinemas not done yet (resumable: safe to stop with Ctrl+C and re-run)
 *   npm run geocode -- --city Durgapur --limit 10
 * Writes data/cinema-coordinates.csv, then run `npm run data:build` to bake it into the app.
 * Takes about 1.1 s per attempt (~5-10 minutes for all 228). Needs internet. Be polite: do not run in parallel.
 * Venues Nominatim cannot find stay at city-centre precision (the site shows "≈" for those).
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { parseCsv, toCsv } from './lib/csv.mjs'
import { geocodeOne } from './lib/geocode.mjs'

const args = process.argv.slice(2)
const opt = n => { const i = args.indexOf(`--${n}`); return i>=0 ? args[i+1] : null }
const only = opt('city'), limit = Number(opt('limit') ?? Infinity)
const rows = parseCsv(readFileSync('data/indian_cinema_database.csv','utf8'))
const centers = JSON.parse(readFileSync('data/city-centers.json','utf8'))
const file = 'data/cinema-coordinates.csv'
const done = existsSync(file) ? parseCsv(readFileSync(file,'utf8')) : []
const doneIds = new Set(done.map(r=>r.Cinema_ID))
const todo = rows.filter(r=>!doneIds.has(r.Cinema_ID) && (!only || r.City.toLowerCase()===only.toLowerCase())).slice(0, limit)
console.log(`${todo.length} cinemas to geocode (${done.length} already done)`)
let found = 0, missed = 0
for (const [i,c] of todo.entries()){
  const hit = await geocodeOne(c, centers[c.City], { userAgent:'cinehall-data-script/1.0 (personal project)' })
  if (hit){ done.push({ Cinema_ID:c.Cinema_ID, Latitude:hit.lat.toFixed(6), Longitude:hit.lng.toFixed(6), Source:hit.source }); found++ }
  else { missed++; console.log(`  not found: #${c.Cinema_ID} ${c.Venue_Name} (${c.City})`) }
  writeFileSync(file, toCsv(done, ['Cinema_ID','Latitude','Longitude','Source']))   // save after each, so it is resumable
  if ((i+1)%10===0) console.log(`  ${i+1}/${todo.length}  found ${found}, not found ${missed}`)
}
console.log(`Done. Found ${found}, not found ${missed}. Now run: npm run data:build`)
