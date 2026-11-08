/**
 * Moves the camera for the presets / "from my seat" / auto tour, and keeps it inside the hall every frame.
 *  - moves are STRAIGHT lines (lib/camera.ts) — curved paths would cut through walls
 *  - "orbit" mode = normal orbiting around the hall; "seat" mode = head-turning from one seat (tiny orbit radius, no zoom)
 *  - grabbing the hall with the mouse/finger cancels a move in progress and stops the tour
 * IMPORTANT: useFrame stays at priority 0 (a positive priority switches off auto-rendering — see tests/render-loop.test.ts).
 */
import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { HALL, clampToHall } from '../lib/hall'
import { PRESETS, TOUR_ORDER, TOUR_HOLD_MS, lookAhead, nextTourPreset, seatPose, transitionMs, tweenPose, type Pose, type PresetId, type Vec3 } from '../lib/camera'

export type CameraGoal = { id:number; kind:'preset'; preset:PresetId } | { id:number; kind:'seat'; seatId:string }
type Anim = { from:Pose; to:Pose; start:number; dur:number; seat:boolean }

export default function CameraRig({ goal, tour, onUserMove, reducedMotion=false }:{ goal:CameraGoal|null; tour:boolean; onUserMove:()=>void; reducedMotion?:boolean }){
  const camera = useThree(s=>s.camera)
  const controls = useThree(s=>s.controls) as any
  const anim = useRef<Anim|null>(null)
  const seatMode = useRef(false)
  const moveCb = useRef(onUserMove); moveCb.current = onUserMove

  const limits = (seat:boolean)=>{
    if (!controls) return
    if (seat){            // look around from one seat: orbit radius ≈ 0 so the camera barely moves, dragging turns the head
      controls.minDistance = controls.maxDistance = .05; controls.enableZoom = false; controls.rotateSpeed = -.35
      controls.minPolarAngle = .8; controls.maxPolarAngle = 2.3; controls.minAzimuthAngle = -1.4; controls.maxAzimuthAngle = 1.4
    } else {
      controls.minDistance = 2; controls.maxDistance = 24; controls.enableZoom = true; controls.rotateSpeed = .7
      controls.minPolarAngle = .25; controls.maxPolarAngle = 1.5; controls.minAzimuthAngle = -Infinity; controls.maxAzimuthAngle = Infinity
    }
  }
  const relax = ()=>{ // while flying, let the controls accept any distance/angle so they do not fight the move
    controls.minDistance = 0; controls.maxDistance = Infinity; controls.minPolarAngle = 0; controls.maxPolarAngle = Math.PI
    controls.minAzimuthAngle = -Infinity; controls.maxAzimuthAngle = Infinity; controls.enableZoom = false
  }
  const fly = (pose:Pose, seat:boolean)=>{
    if (!controls) return
    const to:Pose = seat ? { pos:pose.pos, target:lookAhead(pose) } : pose
    const from:Pose = { pos:camera.position.toArray() as Vec3, target:controls.target.toArray() as Vec3 }
    relax(); anim.current = { from, to, start:performance.now(), dur:transitionMs(from.pos, to.pos, reducedMotion), seat }
  }

  useEffect(()=>{            // a new goal from the page buttons
    if (!goal || !controls) return
    if (goal.kind==='preset') fly(PRESETS[goal.preset].pose, false)
    else { const seat = HALL.byId.get(goal.seatId); if (seat) fly(seatPose(seat), true) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[goal?.id, controls])

  useEffect(()=>{            // auto tour: visit every preset, hold, move on
    if (!tour || !controls) return
    let i = 0, timer:ReturnType<typeof setTimeout>
    const step = ()=>{ fly(PRESETS[TOUR_ORDER[i]].pose, false); i = nextTourPreset(i); timer = setTimeout(step, TOUR_HOLD_MS + 1700) }
    step(); return ()=>clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[tour, controls])

  useEffect(()=>{            // the visitor grabs the hall: stop moving by itself
    if (!controls) return
    const onStart = ()=>{ if (anim.current){ anim.current = null; limits(false); seatMode.current = false } moveCb.current() }
    controls.addEventListener('start', onStart); return ()=>controls.removeEventListener('start', onStart)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[controls])

  useFrame(()=>{
    if (!controls) return
    const a = anim.current
    if (a){
      const p = a.dur===0 ? 1 : (performance.now()-a.start)/a.dur
      const pose = tweenPose(a.from, a.to, p)
      camera.position.set(...pose.pos); controls.target.set(...pose.target)
      if (p>=1){ anim.current = null; seatMode.current = a.seat; limits(a.seat) }
      controls.update()
    }
    const [x,y,z] = clampToHall(camera.position.toArray() as Vec3)              // safety net, every frame
    if (x!==camera.position.x || y!==camera.position.y || z!==camera.position.z) camera.position.set(x,y,z)
  })
  return null
}
