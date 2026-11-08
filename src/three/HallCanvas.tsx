/**
 * <Canvas> wrapper for the hall: camera, orbit controls (limited), safety clamp, hover tooltip.
 * Day 5 adds camera presets, "from my seat", auto tour. The clamp already keeps the camera inside the hall.
 */
import { memo, useEffect, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Html } from '@react-three/drei'
import { ACESFilmicToneMapping, SRGBColorSpace } from 'three'
import HallScene from './HallScene'
import { HALL, clampToHall } from '../lib/hall'

export type HallCanvasProps = {
  soldIds:ReadonlySet<string>; selectedIds:readonly string[]
  hoveredId:string|null; onHover:(id:string|null)=>void; onSeatClick:(id:string)=>void
  backdropUrl?:string; glow?:string
  trailerVideo?:HTMLVideoElement|null; trailerPlaying?:boolean
  priceOf:(seatId:string)=>number
  lowPower?:boolean        // phones: lower pixel ratio
}

/**
 * Keeps the camera inside walls/ceiling/floor every frame (runs after OrbitControls moved it).
 * IMPORTANT: leave useFrame at the default priority (0). A POSITIVE priority makes react-three-fiber stop
 * rendering automatically (you would have to call gl.render yourself) — that was the "blank 3D hall" bug.
 * OrbitControls updates at priority -1, so this still runs after it.
 */
function SafetyClamp(){
  const camera = useThree(s=>s.camera)
  useFrame(()=>{
    const [x,y,z] = clampToHall([camera.position.x, camera.position.y, camera.position.z])
    if (x!==camera.position.x || y!==camera.position.y || z!==camera.position.z) camera.position.set(x,y,z)
  })
  return null
}

function Tooltip({ id, soldIds, selected, priceOf }:{ id:string; soldIds:ReadonlySet<string>; selected:boolean; priceOf:(id:string)=>number }){
  const s = HALL.byId.get(id); if(!s) return null
  const status = soldIds.has(id) ? 'Sold' : selected ? 'Selected' : 'Available'
  return <Html position={[s.pos[0], s.pos[1]+1.5, s.pos[2]]} center zIndexRange={[20,0]} style={{ pointerEvents:'none' }}>
    <div style={{ background:'rgba(10,10,16,.92)', border:'1px solid rgba(255,255,255,.15)', borderRadius:10, padding:'6px 10px', color:'#f4f1ea', font:'500 12px Inter,sans-serif', whiteSpace:'nowrap' }}>
      Row {s.row} · Seat {s.number} · {s.category}{s.recliner?' recliner':''} · {soldIds.has(id)?'—':`₹${priceOf(id)}`} · {status}{s.accessible?' · wheelchair space':''}</div></Html>
}

function HallCanvas({ soldIds, selectedIds, hoveredId, onHover, onSeatClick, backdropUrl, glow, priceOf, lowPower, trailerVideo, trailerPlaying }:HallCanvasProps){
  useEffect(()=>{ document.body.style.cursor = hoveredId ? (soldIds.has(hoveredId)?'not-allowed':'pointer') : ''; return ()=>{ document.body.style.cursor = '' } },[hoveredId, soldIds])
  const selectedSet = useMemo(()=>new Set(selectedIds),[selectedIds])
  return <Canvas dpr={[1, lowPower ? 1.5 : 2]} camera={{ position:[0,8.2,5], fov:62, near:.1, far:80 }}
      gl={{ antialias:true, powerPreference:'high-performance' }}
      onCreated={({ gl })=>{ gl.toneMapping = ACESFilmicToneMapping; gl.outputColorSpace = SRGBColorSpace }}>
    <color attach="background" args={['#050508']}/>
    <HallScene soldIds={soldIds} selectedIds={selectedIds} hoveredId={hoveredId} onHover={onHover} onSeatClick={onSeatClick} backdropUrl={backdropUrl} glow={glow} trailerVideo={trailerVideo} trailerPlaying={trailerPlaying}/>
    {hoveredId && <Tooltip id={hoveredId} soldIds={soldIds} selected={selectedSet.has(hoveredId)} priceOf={priceOf}/>}
    <OrbitControls makeDefault target={[0,3.4,-6.8]} enableDamping dampingFactor={.08} minDistance={2} maxDistance={24}
      minPolarAngle={.25} maxPolarAngle={1.5} enablePan={false} rotateSpeed={.7}/>
    <SafetyClamp/>
  </Canvas>
}
export default memo(HallCanvas)
