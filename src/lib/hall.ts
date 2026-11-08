/**
 * The hall: seat layout (280 seats, matches CAPACITY), 3D positions in metres, camera bounds.
 * Pure data + functions, no React/three, so it is fast to test and easy to debug.
 *
 * Coordinates: x = left/right (0 = centre), y = up, z = depth (screen at z = -14.5, back wall at z = +12).
 * Rows (front -> back): A–B Premium recliners (each one is a single, individually bookable seat) · C–H Gold · J–N Silver · P–R Balcony (raised).
 * Letters I and O are skipped (look like 1 and 0).
 */
import { mulberry32 } from './rng'

export type Category = 'Silver'|'Gold'|'Premium'|'Balcony'
export type SeatDef = {
  id:string; row:string; number:number; category:Category
  pos:[number,number,number]          // centre of the seat on the floor of its row
  recliner:boolean; accessible?:boolean
}
export type RowDef = { row:string; category:Category; y:number; z:number; seats:SeatDef[] }

export const HALL_DIMS = { width:24, length:27, height:13, screenZ:-14.5, backZ:12, frontZ:-15,
  screenW:16, screenH:9, screenY:6.2, balconyFromZ:5, balconySlabY:5.6, mainFloorMaxY:3.9 } as const

const AISLE = 1.1
type RowSpec = { rows:string[]; category:Category; count:number; aisleAfter:number[]; recliner?:boolean; z0:number; zStep:number; y0:number; yStep:number }
const SPECS:RowSpec[] = [
  { rows:['A','B'],                     category:'Premium', count:8,  aisleAfter:[4],     recliner:true, z0:-9,   zStep:1.6, y0:0,   yStep:.3 },
  { rows:['C','D','E','F','G','H'],     category:'Gold',    count:16, aisleAfter:[4,12], z0:-5.8, zStep:1,   y0:.6,  yStep:.3 },
  { rows:['J','K','L','M','N'],         category:'Silver',  count:18, aisleAfter:[5,13], z0:.2,   zStep:1,   y0:2.4, yStep:.3 },
  { rows:['P','Q','R'],                 category:'Balcony', count:26, aisleAfter:[7,19], z0:6.5,  zStep:1,   y0:6.2, yStep:.35 },
]

function buildRows():RowDef[]{
  const out:RowDef[] = []
  for (const spec of SPECS){
    const pitch = spec.recliner ? 1.0 : .6
    const width = spec.count*pitch + spec.aisleAfter.length*AISLE
    spec.rows.forEach((row,ri)=>{
      const z = +(spec.z0 + ri*spec.zStep).toFixed(2), y = +(spec.y0 + ri*spec.yStep).toFixed(2)
      const seats:SeatDef[] = []
      let x = -width/2 + pitch/2
      for (let n=1; n<=spec.count; n++){
        const id = `${row}${n}`
        const seat:SeatDef = { id, row, number:n, category:spec.category, pos:[+x.toFixed(3), y, z], recliner:!!spec.recliner }
        if (row==='J' && (n===1 || n===spec.count)) seat.accessible = true     // wheelchair spaces at row ends
        seats.push(seat)
        x += pitch + (spec.aisleAfter.includes(n) ? AISLE : 0)
      }
      out.push({ row, category:spec.category, y, z, seats })
    })
  }
  return out
}
const rows = buildRows()
const seats = rows.flatMap(r=>r.seats)
export const HALL = { rows, seats, byId:new Map(seats.map(s=>[s.id,s] as const)) }
export const HALL_CAPACITY = seats.length

/**
 * Which seats are already sold for a show: deterministic from show.seed, exactly show.soldCount seats
 * (capped at the hall capacity).
 */
export function soldSeatIds(show:{ seed:number; soldCount:number }):Set<string>{
  const rng = mulberry32(show.seed ^ 0x9e3779b9)
  const ids = seats.map(s=>s.id)
  for (let i=ids.length-1;i>0;i--){ const j = Math.floor(rng()*(i+1)); [ids[i],ids[j]] = [ids[j],ids[i]] } // Fisher–Yates
  return new Set(ids.slice(0, Math.max(0, Math.min(show.soldCount, ids.length))))
}

/** Floor height under a point (main floor steps up towards the back). Used for camera safety. */
export function floorYAt(z:number):number{
  if (z<-9.7) return 0
  return Math.min(HALL_DIMS.mainFloorMaxY, (z+9.7)*.27)
}
/**
 * Keep a camera position inside the hall (inside walls, below ceiling, above floor, never inside the balcony slab).
 * Day 5 extends this with presets + straight-line moves.
 */
export function clampToHall(p:[number,number,number], margin=.6):[number,number,number]{
  const d = HALL_DIMS
  const x = Math.min(d.width/2-margin, Math.max(-d.width/2+margin, p[0]))
  const z = Math.min(d.backZ-margin, Math.max(d.screenZ+1.5, p[2]))
  let y = Math.min(d.height-margin, Math.max(floorYAt(z)+.9, p[1]))
  if (z>d.balconyFromZ){
    const slabBottom = d.balconySlabY-.4, slabTop = d.balconySlabY+.1
    if (y>slabBottom-.1 && y<slabTop+.9) y = (y < d.balconySlabY) ? slabBottom-.15 : slabTop+.9   // push out of the slab, up or down
  }
  return [x,y,z]
}
