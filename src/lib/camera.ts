/**
 * Camera presets, "from my seat" poses and the straight-line move between poses. Pure functions (no three.js),
 * so the hall's camera rules are unit-tested: every pose is inside the hall, moves are straight lines (curved
 * paths cut through walls), and the auto tour order is fixed.
 */
import { HALL_DIMS, clampToHall, type SeatDef } from './hall'

export type Vec3 = [number,number,number]
export type Pose = { pos:Vec3; target:Vec3 }
export type PresetId = 'overview'|'stage'|'balcony'|'bird'

export const PRESETS:Record<PresetId,{ label:string; pose:Pose }> = {
  overview: { label:'Overview',   pose:{ pos:[0,8.2,5],     target:[0,3.4,-6.8] } },   // the default view
  stage:    { label:'From stage', pose:{ pos:[0,2.4,-12.2],  target:[0,5.5,8] } },      // standing in front of the screen, facing the audience
  balcony:  { label:'Balcony',    pose:{ pos:[0,8.6,7.4],    target:[0,3.6,-8] } },   // a seated-height view from the middle of the balcony
  bird:     { label:"Bird's eye", pose:{ pos:[0,12.2,3.5],   target:[0,0.5,-3.5] } },   // high up, tilted so orbiting never flips
}
export const PRESET_ORDER:PresetId[] = ['overview','stage','balcony','bird']
/** Auto tour = every preset in order, looping. */
export const TOUR_ORDER:PresetId[] = PRESET_ORDER
export const TOUR_HOLD_MS = 4500
export const nextTourPreset = (i:number)=>(i+1)%TOUR_ORDER.length

export const EYE_HEIGHT = 1.15   // seated eye height above the seat's floor level
/** What you see sitting in a seat: eyes above the seat, looking at the middle of the screen. */
export function seatPose(seat:SeatDef):Pose{
  const pos = clampToHall([seat.pos[0], seat.pos[1]+EYE_HEIGHT, seat.pos[2]])
  return { pos, target:[0, HALL_DIMS.screenY, HALL_DIMS.screenZ] }
}
/** Orbit target placed just ahead of the eyes, so dragging turns your head instead of circling the screen. */
export function lookAhead(pose:Pose, dist=.05):Vec3{
  const d:Vec3 = [pose.target[0]-pose.pos[0], pose.target[1]-pose.pos[1], pose.target[2]-pose.pos[2]]
  const len = Math.hypot(...d) || 1
  return [pose.pos[0]+d[0]/len*dist, pose.pos[1]+d[1]/len*dist, pose.pos[2]+d[2]/len*dist]
}

/** Exact at both ends (no 2.4000000000000004 drift), so the camera lands precisely on its target pose. */
const lerp = (a:number,b:number,t:number)=> t>=1 ? b : t<=0 ? a : a+(b-a)*t
export const lerpVec = (a:Vec3,b:Vec3,t:number):Vec3=>[lerp(a[0],b[0],t),lerp(a[1],b[1],t),lerp(a[2],b[2],t)]
export const easeInOut = (t:number)=>t<.5 ? 2*t*t : 1-Math.pow(-2*t+2,2)/2
const dist = (a:Vec3,b:Vec3)=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2])

/** How long a move takes: longer for longer trips (0.7–1.7 s). 0 when the visitor prefers reduced motion. */
export function transitionMs(from:Vec3, to:Vec3, reducedMotion=false):number{
  if (reducedMotion) return 0
  return Math.min(1700, Math.max(700, dist(from,to)*70))
}
/**
 * Pose at progress p (0..1): the camera moves on a STRAIGHT line (and so does its target), then is clamped inside the hall.
 * A straight line between two points inside the hall stays inside the hall's open space; the clamp handles the balcony slab.
 */
export function tweenPose(from:Pose, to:Pose, p:number):Pose{
  const t = p>=1 ? 1 : p<=0 ? 0 : easeInOut(p)
  return { pos:clampToHall(lerpVec(from.pos,to.pos,t)), target:lerpVec(from.target,to.target,t) }
}
