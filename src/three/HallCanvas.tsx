/**
 * <Canvas> wrapper for the hall: camera, orbit controls (limited), hover tooltip.
 * CameraRig (Day 5) handles presets, "from my seat", the auto tour and the keep-inside-the-hall clamp.
 */
import { memo, useEffect, useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Html } from '@react-three/drei'
import { ACESFilmicToneMapping, SRGBColorSpace } from 'three'
import HallScene from './HallScene'
import { HALL } from '../lib/hall'
import CameraRig, { type CameraGoal } from './CameraRig'

export type HallCanvasProps = {
  soldIds:ReadonlySet<string>; selectedIds:readonly string[]
  hoveredId:string|null; onHover:(id:string|null)=>void; onSeatClick:(id:string)=>void
  backdropUrl?:string; glow?:string
  trailerVideo?:HTMLVideoElement|null; trailerPlaying?:boolean
  cameraGoal?:CameraGoal|null; tour?:boolean; onUserMove?:()=>void; reducedMotion?:boolean
  priceOf:(seatId:string)=>number
  lowPower?:boolean        // phones: lower pixel ratio
}

function Tooltip({ id, soldIds, selected, priceOf }:{ id:string; soldIds:ReadonlySet<string>; selected:boolean; priceOf:(id:string)=>number }){
  const s = HALL.byId.get(id); if(!s) return null
  const status = soldIds.has(id) ? 'Sold' : selected ? 'Selected' : 'Available'
  return <Html position={[s.pos[0], s.pos[1]+1.5, s.pos[2]]} center zIndexRange={[20,0]} style={{ pointerEvents:'none' }}>
    <div style={{ background:'rgba(10,10,16,.92)', border:'1px solid rgba(255,255,255,.15)', borderRadius:10, padding:'6px 10px', color:'#f4f1ea', font:'500 12px Inter,sans-serif', whiteSpace:'nowrap' }}>
      Row {s.row} · Seat {s.number} · {s.category}{s.recliner?' recliner':''} · {soldIds.has(id)?'—':`₹${priceOf(id)}`} · {status}{s.accessible?' · wheelchair space':''}</div></Html>
}

function HallCanvas({ soldIds, selectedIds, hoveredId, onHover, onSeatClick, backdropUrl, glow, priceOf, lowPower, trailerVideo, trailerPlaying, cameraGoal=null, tour=false, onUserMove, reducedMotion }:HallCanvasProps){
  useEffect(()=>{ document.body.style.cursor = hoveredId ? (soldIds.has(hoveredId)?'not-allowed':'pointer') : ''; return ()=>{ document.body.style.cursor = '' } },[hoveredId, soldIds])
  const selectedSet = useMemo(()=>new Set(selectedIds),[selectedIds])
  return <Canvas dpr={[1, lowPower ? 1.5 : 2]} camera={{ position:[0,8.2,5], fov:62, near:.1, far:80 }}
      gl={{ antialias:true, powerPreference:'high-performance' }}
      onCreated={({ gl })=>{ gl.toneMapping = ACESFilmicToneMapping; gl.outputColorSpace = SRGBColorSpace }}>
    <color attach="background" args={['#050508']}/>
    <HallScene soldIds={soldIds} selectedIds={selectedIds} hoveredId={hoveredId} onHover={onHover} onSeatClick={onSeatClick} backdropUrl={backdropUrl} glow={glow} trailerVideo={trailerVideo} trailerPlaying={trailerPlaying} sparkles={!lowPower}/>
    {hoveredId && <Tooltip id={hoveredId} soldIds={soldIds} selected={selectedSet.has(hoveredId)} priceOf={priceOf}/>}
    <OrbitControls makeDefault target={[0,3.4,-6.8]} enableDamping dampingFactor={.08} minDistance={2} maxDistance={24}
      minPolarAngle={.25} maxPolarAngle={1.5} enablePan={false} rotateSpeed={.7}/>
    <CameraRig goal={cameraGoal} tour={tour} onUserMove={onUserMove ?? (()=>{})} reducedMotion={reducedMotion}/>
  </Canvas>
}
export default memo(HallCanvas)
