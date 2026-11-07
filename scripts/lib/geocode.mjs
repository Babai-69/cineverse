/**
 * Geocoding logic for scripts/geocode-cinemas.mjs (kept separate so it can be tested with a fake fetch).
 * For each cinema it tries up to 3 queries, from most to least specific, and ACCEPTS a result only if it lies
 * within `maxKm` of the city centre (stops "INOX" matching a cinema in another city).
 */
const R = 6371
const rad = d=>d*Math.PI/180
export function km(a,b){ const dLat=rad(b.lat-a.lat), dLng=rad(b.lng-a.lng)
  const h=Math.sin(dLat/2)**2+Math.cos(rad(a.lat))*Math.cos(rad(b.lat))*Math.sin(dLng/2)**2; return 2*R*Math.asin(Math.min(1,Math.sqrt(h))) }
/** "INOX: South City, Kolkata" -> "INOX South City" (drop the ": " and a trailing ", City"). */
export function cleanName(name, city){
  return name.replace(/:\s*/g,' ').replace(new RegExp(`,\\s*${city}\\s*$`,'i'),'').replace(/\s+-\s+/g,' ').replace(/\s+/g,' ').trim()
}
export function queriesFor(c){
  const n = cleanName(c.Venue_Name, c.City), q = []
  q.push([n, c.Specific_Area, c.City, c.State, 'India'].filter(Boolean).join(', '))
  if (c.PIN_Code) q.push([n, c.City, c.PIN_Code, 'India'].join(', '))
  if (c.Full_Address) q.push(c.Full_Address.replace(/\s*\d{6}\s*$/,'') + ', India')
  return [...new Set(q)]
}
export async function geocodeOne(c, center, { fetchFn=fetch, sleep=ms=>new Promise(r=>setTimeout(r,ms)), maxKm=30, delayMs=1100, userAgent }={}){
  for (const q of queriesFor(c)){
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=3&countrycodes=in&q=${encodeURIComponent(q)}`
    let data
    try{
      const res = await fetchFn(url, { headers:{ 'User-Agent': userAgent, Accept:'application/json' } })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      data = await res.json()
    }catch(e){ await sleep(delayMs); continue }
    await sleep(delayMs)                       // Nominatim policy: max 1 request per second
    for (const hit of Array.isArray(data) ? data : []){
      const p = { lat:Number(hit.lat), lng:Number(hit.lon) }
      if (Number.isFinite(p.lat) && Number.isFinite(p.lng) && km(p, center) <= maxKm) return { ...p, source:'nominatim' }
    }
  }
  return null
}
