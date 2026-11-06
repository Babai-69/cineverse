import { getShows } from '../src/lib/shows'
let fail = 0
const ok = (c:boolean,m:string)=>{ console.log(c?'PASS':'FAIL',m); if(!c) fail++ }
const a = JSON.stringify(getShows('m1','Chennai','2026-11-07'))
ok(a===JSON.stringify(getShows('m1','Chennai','2026-11-07')),'same input -> identical shows')
ok(a!==JSON.stringify(getShows('m2','Chennai','2026-11-07')),'different movie -> different shows')
ok(a!==JSON.stringify(getShows('m1','Chennai','2026-11-08')),'different day -> different shows')
const res = getShows('m3','Kochi','2026-11-09')
ok(res.length===4,'4 theatres in Kochi')
ok(res.every((r,i)=>i===0||r.theatre.distanceKm>=res[i-1].theatre.distanceKm),'sorted by distance')
let gapsOk = true, rangeOk = true, fmtOk = true
for (const r of res) { const m = r.shows.map(s=>{const [h,mi]=s.time.split(':').map(Number);return h*60+mi})
  m.forEach((x,i)=>{ if(i&&x-m[i-1]<165) gapsOk=false; if(x<540||x>1410) rangeOk=false })
  r.shows.forEach(s=>{ if(!r.theatre.formats.includes(s.format)) fmtOk=false })
  if (r.shows.length<4||r.shows.length>6) rangeOk=false }
ok(gapsOk,'slots >= 2h45m apart'); ok(rangeOk,'4-6 slots within 09:00-23:30'); ok(fmtOk,'formats supported by theatre')
process.exit(fail?1:0)
