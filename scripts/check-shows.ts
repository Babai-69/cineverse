import { getShowsForTheatres } from '../src/lib/shows'
import { nearbyCuratedTheatres } from '../src/lib/theatres'
let fail = 0
const ok = (c:boolean,m:string)=>{ console.log(c?'PASS':'FAIL',m); if(!c) fail++ }
const kochi = nearbyCuratedTheatres({lat:9.9312,lng:76.2673}, 25).slice(0,4)
const chennai = nearbyCuratedTheatres({lat:22.5726,lng:88.3639}, 25)  // Kolkata
const a = JSON.stringify(getShowsForTheatres('m1',chennai,'2026-11-07'))
ok(a===JSON.stringify(getShowsForTheatres('m1',chennai,'2026-11-07')),'same input -> identical shows')
ok(a!==JSON.stringify(getShowsForTheatres('m2',chennai,'2026-11-07')),'different movie -> different shows')
ok(a!==JSON.stringify(getShowsForTheatres('m1',chennai,'2026-11-08')),'different day -> different shows')
const solo = getShowsForTheatres('m1',[chennai[1]],'2026-11-07')[0].shows
const inList = getShowsForTheatres('m1',chennai,'2026-11-07').find(r=>r.theatre.id===chennai[1].id)!.shows
ok(JSON.stringify(solo)===JSON.stringify(inList),"a theatre's shows do not depend on which other theatres are listed")
const res = getShowsForTheatres('m3',kochi,'2026-11-09')
ok(res.length===4,'4 theatres picked near Kochi')
ok(res.every((r,i)=>i===0||r.theatre.distanceKm>=res[i-1].theatre.distanceKm),'sorted by distance')
let gapsOk = true, rangeOk = true, fmtOk = true
for (const r of res) { const m = r.shows.map(s=>{const [h,mi]=s.time.split(':').map(Number);return h*60+mi})
  m.forEach((x,i)=>{ if(i&&x-m[i-1]<165) gapsOk=false; if(x<540||x>1410) rangeOk=false })
  r.shows.forEach(s=>{ if(!r.theatre.formats.includes(s.format)) fmtOk=false })
  if (r.shows.length<4||r.shows.length>6) rangeOk=false }
ok(gapsOk,'slots >= 2h45m apart'); ok(rangeOk,'4-6 slots within 09:00-23:30'); ok(fmtOk,'formats supported by theatre')
process.exit(fail?1:0)
