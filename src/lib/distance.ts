/** Great-circle distance (haversine). Pure, no dependencies. */
import type { LatLng } from '../data/types'
const R = 6371 // earth radius, km
const rad = (d:number)=>d*Math.PI/180
export function haversineKm(a:LatLng, b:LatLng):number{
  const dLat = rad(b.lat-a.lat), dLng = rad(b.lng-a.lng)
  const h = Math.sin(dLat/2)**2 + Math.cos(rad(a.lat))*Math.cos(rad(b.lat))*Math.sin(dLng/2)**2
  return 2*R*Math.asin(Math.min(1,Math.sqrt(h)))
}
