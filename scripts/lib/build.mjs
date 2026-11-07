/** Pure build logic: CSV rows -> validated cinema records + city centres. Used by build-cinemas.mjs and tests. */
const REQUIRED = ['Cinema_ID','Venue_Name','City','District','State']
const inIndia = (lat,lng)=> lat>6 && lat<37.5 && lng>68 && lng<98
export function buildCinemas(rows, cityCenters, coordRows = []){
  const errors = [], warnings = [], seen = new Set()
  const exact = new Map(coordRows.map(r=>[String(r.Cinema_ID), r]))
  const cinemas = []
  rows.forEach((r, i)=>{
    const line = i+2
    for (const k of REQUIRED) if (!r[k]) errors.push(`line ${line}: missing ${k}`)
    const id = String(r.Cinema_ID)
    if (seen.has(id)) errors.push(`line ${line}: duplicate Cinema_ID ${id}`); seen.add(id)
    if (r.PIN_Code && !/^\d{6}$/.test(r.PIN_Code)) warnings.push(`line ${line}: PIN "${r.PIN_Code}" is not 6 digits`)
    const e = exact.get(id)
    let lat, lng, precision
    if (e && Number.isFinite(+e.Latitude) && Number.isFinite(+e.Longitude) && inIndia(+e.Latitude,+e.Longitude)){ lat=+e.Latitude; lng=+e.Longitude; precision='exact' }
    else if (cityCenters[r.City]) { lat=cityCenters[r.City].lat; lng=cityCenters[r.City].lng; precision='city' }
    else { errors.push(`line ${line}: no coordinates for city "${r.City}" (add it to data/city-centers.json)`); return }
    const screens = r.Total_Screens ? Number(r.Total_Screens) : null
    if (screens!==null && (!Number.isInteger(screens) || screens<1 || screens>30)) warnings.push(`line ${line}: odd Total_Screens "${r.Total_Screens}"`)
    cinemas.push({ id:`c${id}`, name:r.Venue_Name, chain:r.Chain||'Independent', venueType:r.Type||'Cinema', area:r.Specific_Area||'', address:r.Full_Address||'',
      pin:r.PIN_Code||'', city:r.City, district:r.District, state:r.State, screens: Number.isFinite(screens)?screens:null, lat, lng, precision,
      formats: r.Formats ? r.Formats.split(/[|;]/).map(s=>s.trim()).filter(Boolean) : null })
  })
  const byCity = new Map()
  for (const c of cinemas){ const k = c.city; const cur = byCity.get(k) ?? { name:c.city, state:c.state, lat:cityCenters[c.city].lat, lng:cityCenters[c.city].lng, count:0 }; cur.count++; byCity.set(k,cur) }
  const centers = [...byCity.values()].sort((a,b)=>a.state.localeCompare(b.state)||b.count-a.count||a.name.localeCompare(b.name))
  return { cinemas, centers, errors, warnings }
}
