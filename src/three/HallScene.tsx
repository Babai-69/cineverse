/**
 * The 3D cinema hall, as plain react-three-fiber content (no <Canvas> here, so it can be tested without WebGL).
 * Layout numbers come from src/lib/hall.ts. Units are metres.
 *   HallShell      floor steps, walls, ceiling, balcony, lights strips   (static, ~40 meshes)
 *   Screen         16:9 screen with the movie backdrop (falls back to a plain glow if the image fails)
 *   SeatInstances  all seats of one type in ONE draw call; colour per seat = category / selected / sold / hover
 */
import { Suspense, useLayoutEffect, useMemo, useRef } from 'react'
import { Color, DoubleSide, InstancedMesh, Object3D, RepeatWrapping, SRGBColorSpace, CanvasTexture, type Texture } from 'three'
import { useTexture, Html } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import { HALL, HALL_DIMS, type SeatDef } from '../lib/hall'
import { buildSeatGeometry } from './seatGeometry'
import SafeBoundary from './SafeBoundary'

export const SEAT_COLORS = { Silver:'#3b4256', Gold:'#7a6330', Premium:'#7c5cff', Balcony:'#2f6f7a', selected:'#f5b942', sold:'#17171f', hover:'#9fb0e0', accessible:'#2dd4bf' } as const
const D = HALL_DIMS
const HALF_W = D.width/2
const DRAG_PX = 6   // a "click" that moved more than this was really a drag (orbit) — ignore it

export type SeatState = 'available'|'selected'|'sold'
export type HallSceneProps = {
  soldIds:ReadonlySet<string>
  selectedIds:readonly string[]
  hoveredId:string|null
  onHover:(id:string|null)=>void
  onSeatClick:(id:string)=>void
  backdropUrl?:string
  glow?:string            // movie colour, lights the hall from the screen
  labels?:boolean         // row letters (drei <Html>, DOM based) — off in tests
}

/** Dark acoustic-panel texture (vertical ribs), generated in code so no image download is needed. */
function useAcousticTexture():Texture|undefined{
  return useMemo(()=>{
    try{
      if (typeof document==='undefined' || /jsdom/i.test(navigator.userAgent)) return undefined
      const c = document.createElement('canvas'); c.width = 128; c.height = 8
      const g = c.getContext('2d'); if (!g) return undefined
      g.fillStyle = '#15151d'; g.fillRect(0,0,128,8)
      for (let x=0;x<128;x+=16){ g.fillStyle = '#1f2030'; g.fillRect(x,0,10,8); g.fillStyle = '#0c0c12'; g.fillRect(x+10,0,2,8) }
      const t = new CanvasTexture(c); t.wrapS = t.wrapT = RepeatWrapping; t.repeat.set(10,1); t.colorSpace = SRGBColorSpace; return t
    }catch{ return undefined }
  },[])
}

function Box({ size, pos, color='#101018', basic=false, emissive }:{ size:[number,number,number]; pos:[number,number,number]; color?:string; basic?:boolean; emissive?:string }){
  return <mesh position={pos}><boxGeometry args={size}/>
    {basic ? <meshBasicMaterial color={color} toneMapped={false}/> : <meshStandardMaterial color={color} roughness={.9} metalness={.05} emissive={emissive ?? '#000'} />}</mesh>
}

function HallShell(){
  const wall = useAcousticTexture()
  const len = D.backZ - D.frontZ, midZ = (D.backZ + D.frontZ)/2
  const mainRows = HALL.rows.filter(r=>r.category!=='Balcony'), balconyRows = HALL.rows.filter(r=>r.category==='Balcony')
  const slabTop = D.balconySlabY + .2
  // wall sconces + aisle step lights + ceiling baffles, as three small instanced meshes
  const sconceZ = useMemo(()=>Array.from({length:8},(_,i)=>-11.5 + i*3.2),[])
  const aisleLights = useMemo(()=>{
    const out:[number,number,number][] = []
    for (const r of HALL.rows){
      const counts = r.seats.length
      for (let i=1;i<counts;i++){
        const gap = r.seats[i].pos[0]-r.seats[i-1].pos[0], pitch = r.seats[i].recliner?1:.6
        if (gap > pitch+.5) out.push([(r.seats[i].pos[0]+r.seats[i-1].pos[0])/2, r.y+.03, r.z])
      }
    }
    return out
  },[])
  const baffleZ = useMemo(()=>Array.from({length:9},(_,i)=>-12 + i*2.6),[])
  const sconceRef = useRef<InstancedMesh>(null), aisleRef = useRef<InstancedMesh>(null), baffleRef = useRef<InstancedMesh>(null)
  useLayoutEffect(()=>{
    const o = new Object3D()
    const fill = (m:InstancedMesh|null, pts:[number,number,number][])=>{ if(!m) return; pts.forEach((p,i)=>{ o.position.set(...p); o.updateMatrix(); m.setMatrixAt(i,o.matrix) }); m.instanceMatrix.needsUpdate = true; m.computeBoundingSphere() }
    fill(sconceRef.current, sconceZ.flatMap(z=>[[-HALF_W+.15,4,z],[HALF_W-.15,4,z]] as [number,number,number][]))
    fill(aisleRef.current, aisleLights)
    fill(baffleRef.current, baffleZ.map(z=>[0,D.height-.4,z] as [number,number,number]))
  },[sconceZ,aisleLights,baffleZ])

  return <group>
    {/* floor: front apron, one step per row, floor under the balcony */}
    <Box size={[D.width-2,.05,5.4]} pos={[0,.025,-12.3]} color="#15101a"/>
    {mainRows.map(r=>{ const depth = r.row==='A'||r.row==='B' ? 1.6 : 1, h = Math.max(r.y,.05)
      return <Box key={r.row} size={[D.width-2,h,depth]} pos={[0,h/2,r.z]} color="#2a1620"/> })}
    <Box size={[D.width-2,D.mainFloorMaxY,D.backZ-4.7]} pos={[0,D.mainFloorMaxY/2,(4.7+D.backZ)/2]} color="#2a1620"/>
    {/* balcony: slab, stepped rows, front rail */}
    <Box size={[D.width-2,.4,D.backZ-D.balconyFromZ]} pos={[0,D.balconySlabY,(D.balconyFromZ+D.backZ)/2]} color="#1a1a24"/>
    {balconyRows.map(r=>{ const h = r.y - slabTop; return <Box key={r.row} size={[D.width-2,h,1]} pos={[0,slabTop+h/2,r.z]} color="#2a1620"/> })}
    <Box size={[D.width-2,.9,.1]} pos={[0,slabTop+.45,D.balconyFromZ+.1]} color="#2b2b3a"/>
    {/* walls, ceiling */}
    <mesh position={[-HALF_W,D.height/2,midZ]} rotation={[0,Math.PI/2,0]}><planeGeometry args={[len,D.height]}/><meshStandardMaterial map={wall} color="#2a2a38" side={DoubleSide} roughness={1}/></mesh>
    <mesh position={[HALF_W,D.height/2,midZ]} rotation={[0,-Math.PI/2,0]}><planeGeometry args={[len,D.height]}/><meshStandardMaterial map={wall} color="#2a2a38" side={DoubleSide} roughness={1}/></mesh>
    <mesh position={[0,D.height/2,D.backZ]} rotation={[0,Math.PI,0]}><planeGeometry args={[D.width,D.height]}/><meshStandardMaterial color="#14141c" side={DoubleSide} roughness={1}/></mesh>
    <mesh position={[0,D.height/2,D.frontZ]}><planeGeometry args={[D.width,D.height]}/><meshStandardMaterial color="#08080c" side={DoubleSide} roughness={1}/></mesh>
    <mesh position={[0,D.height,midZ]} rotation={[Math.PI/2,0,0]}><planeGeometry args={[D.width,len]}/><meshStandardMaterial color="#0d0d14" side={DoubleSide} roughness={1}/></mesh>
    {/* small light details */}
    <instancedMesh ref={sconceRef} args={[undefined as any, undefined as any, sconceZ.length*2]} frustumCulled={false}><boxGeometry args={[.1,.9,.3]}/><meshBasicMaterial color="#ffcf8a" toneMapped={false}/></instancedMesh>
    <instancedMesh ref={aisleRef} args={[undefined as any, undefined as any, aisleLights.length]} frustumCulled={false}><boxGeometry args={[.14,.05,.14]}/><meshBasicMaterial color="#ffb347" toneMapped={false}/></instancedMesh>
    <instancedMesh ref={baffleRef} args={[undefined as any, undefined as any, baffleZ.length]} frustumCulled={false}><boxGeometry args={[D.width-3,.3,.5]}/><meshStandardMaterial color="#090910" roughness={1}/></instancedMesh>
    <Box size={[.9,.35,.05]} pos={[-HALF_W+1.2,3.2,D.frontZ+.1]} color="#2bff88" basic/><Box size={[.9,.35,.05]} pos={[HALF_W-1.2,3.2,D.frontZ+.1]} color="#2bff88" basic/>
  </group>
}

function ScreenSurface({ url }:{ url:string }){
  const tex = useTexture(url) as Texture
  useLayoutEffect(()=>{ tex.colorSpace = SRGBColorSpace; tex.needsUpdate = true },[tex])
  return <meshBasicMaterial map={tex} toneMapped={false}/>
}
function Screen({ backdropUrl }:{ backdropUrl?:string }){
  const plain = <meshBasicMaterial color="#aab4d8" toneMapped={false}/>
  return <group position={[0,D.screenY,D.screenZ]}>
    <mesh position={[0,0,-.2]}><boxGeometry args={[D.screenW+.8,D.screenH+.8,.3]}/><meshStandardMaterial color="#000"/></mesh>
    <mesh><planeGeometry args={[D.screenW,D.screenH]}/>
      {backdropUrl ? <SafeBoundary fallback={plain}><Suspense fallback={plain}><ScreenSurface url={backdropUrl}/></Suspense></SafeBoundary> : plain}</mesh>
  </group>
}

const tmp = new Color()
export function seatColor(s:SeatDef, state:SeatState, hovered:boolean):string{
  if (state==='sold') return SEAT_COLORS.sold
  if (state==='selected') return SEAT_COLORS.selected
  if (hovered) return SEAT_COLORS.hover
  if (s.accessible) return SEAT_COLORS.accessible
  return SEAT_COLORS[s.category]
}

function SeatInstances({ seats, recliner, soldIds, selected, hoveredId, onHover, onSeatClick }:{
  seats:SeatDef[]; recliner:boolean; soldIds:ReadonlySet<string>; selected:ReadonlySet<string>; hoveredId:string|null
  onHover:(id:string|null)=>void; onSeatClick:(id:string)=>void }){
  const ref = useRef<InstancedMesh>(null)
  const geometry = useMemo(()=>buildSeatGeometry(recliner),[recliner])
  useLayoutEffect(()=>{ return ()=>geometry.dispose() },[geometry])
  useLayoutEffect(()=>{      // positions: once
    const m = ref.current; if(!m) return
    const o = new Object3D()
    seats.forEach((s,i)=>{ o.position.set(...s.pos); o.updateMatrix(); m.setMatrixAt(i,o.matrix) })
    m.instanceMatrix.needsUpdate = true; m.computeBoundingSphere()
  },[seats])
  const hoverGroup = useMemo(()=>{ const h = hoveredId ? HALL.byId.get(hoveredId) : null; return new Set(h ? [h.id, ...(h.coupleWith?[h.coupleWith]:[])] : []) },[hoveredId])
  useLayoutEffect(()=>{      // colours: whenever sold / selected / hover change
    const m = ref.current; if(!m) return
    seats.forEach((s,i)=>{
      const state:SeatState = soldIds.has(s.id) ? 'sold' : selected.has(s.id) ? 'selected' : 'available'
      m.setColorAt(i, tmp.set(seatColor(s, state, hoverGroup.has(s.id))))
    })
    if (m.instanceColor) m.instanceColor.needsUpdate = true
  },[seats, soldIds, selected, hoverGroup])
  const idOf = (e:ThreeEvent<PointerEvent|MouseEvent>)=> e.instanceId!=null ? seats[e.instanceId]?.id ?? null : null
  return <instancedMesh ref={ref} args={[geometry, undefined as any, seats.length]} frustumCulled={false}
    onPointerMove={e=>{ e.stopPropagation(); onHover(idOf(e)) }}
    onPointerOut={()=>onHover(null)}
    onClick={e=>{ if (e.delta>DRAG_PX) return; e.stopPropagation(); const id = idOf(e); if(id) onSeatClick(id) }}>
    <meshStandardMaterial roughness={.85} metalness={.05}/>
  </instancedMesh>
}

export default function HallScene({ soldIds, selectedIds, hoveredId, onHover, onSeatClick, backdropUrl, glow='#8fa0ff', labels=true }:HallSceneProps){
  const selected = useMemo(()=>new Set(selectedIds),[selectedIds])
  const standard = useMemo(()=>HALL.seats.filter(s=>!s.recliner),[]), recliners = useMemo(()=>HALL.seats.filter(s=>s.recliner),[])
  return <>
    <ambientLight intensity={.55}/>
    <hemisphereLight args={['#9aa3c7','#1a1410',.6]}/>
    <directionalLight position={[0,11,9]} intensity={.9}/>
    <pointLight position={[0,D.screenY,D.screenZ+3]} color={glow} intensity={90} distance={30} decay={2}/>
    <HallShell/>
    <Screen backdropUrl={backdropUrl}/>
    <SeatInstances seats={standard} recliner={false} soldIds={soldIds} selected={selected} hoveredId={hoveredId} onHover={onHover} onSeatClick={onSeatClick}/>
    <SeatInstances seats={recliners} recliner soldIds={soldIds} selected={selected} hoveredId={hoveredId} onHover={onHover} onSeatClick={onSeatClick}/>
    {labels && HALL.rows.map(r=>
      <Html key={r.row} position={[r.seats[0].pos[0]-(r.category==='Premium'?1:.7), r.y+.7, r.z]} center zIndexRange={[0,0]} style={{ pointerEvents:'none' }}>
        <span style={{ font:'600 11px Inter,sans-serif', color:'#b9bdd3' }}>{r.row}</span></Html>)}
  </>
}
