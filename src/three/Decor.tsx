/**
 * Premium look for the hall, in the website's colours (black + warm gold + violet). PURELY ADDITIVE: none of this is
 * clickable, and nothing here changes seats, floor, walls or lighting that already existed.
 *   CINEHALL wall sign · gold screen frame · velvet curtains with gold trim · gold cove light round the ceiling ·
 *   gold wall inlays · starlit ceiling · soft glow behind the screen (movie colour) · projector beam + floating dust
 * Textures are drawn in code (no downloads). All of it is cheap: ~10 meshes + 3 instanced meshes.
 */
import { useLayoutEffect, useMemo, useRef } from 'react'
import { AdditiveBlending, CanvasTexture, Color, ConeGeometry, DoubleSide, InstancedMesh, Mesh, Object3D, RepeatWrapping, SRGBColorSpace, type Texture } from 'three'
import { Sparkles } from '@react-three/drei'
import { HALL_DIMS as D } from '../lib/hall'
import { mulberry32 } from '../lib/rng'

export const GOLD = '#f5b942'
const HALF_W = D.width/2
const noop = ()=>null            // decor must never block clicks/hover on seats

/** Draws once into a canvas texture. Returns undefined where canvases are unavailable (tests) so the decor just skips it. */
function canvasTexture(w:number, h:number, draw:(g:CanvasRenderingContext2D)=>void, opts:{ repeat?:[number,number]; redrawOnFonts?:boolean }={}):Texture|undefined{
  try{
    if (typeof document==='undefined' || /jsdom/i.test(navigator.userAgent)) return undefined
    const c = document.createElement('canvas'); c.width = w; c.height = h
    const g = c.getContext('2d'); if (!g) return undefined
    draw(g)
    const t = new CanvasTexture(c); t.colorSpace = SRGBColorSpace
    if (opts.repeat){ t.wrapS = t.wrapT = RepeatWrapping; t.repeat.set(...opts.repeat) }
    // the website font may finish loading after the hall opens: redraw once it is ready
    if (opts.redrawOnFonts) (document as any).fonts?.ready?.then(()=>{ g.clearRect(0,0,w,h); draw(g); t.needsUpdate = true })
    return t
  }catch{ return undefined }
}

function drawSign(g:CanvasRenderingContext2D){
  const W = 1024, H = 160
  g.font = '700 118px "Bebas Neue", Impact, "Arial Narrow", sans-serif'
  ;(g as any).letterSpacing = '16px'
  const a = g.measureText('CINE').width, b = g.measureText('HALL').width, x0 = (W-(a+b))/2, y = 122
  const grad = g.createLinearGradient(0,20,0,130); grad.addColorStop(0,'#ffe29a'); grad.addColorStop(1,'#e8a321')
  g.fillStyle = grad; g.fillText('CINE', x0, y)
  g.fillStyle = '#f4f1ea'; g.fillText('HALL', x0+a, y)
  const line = (x1:number,x2:number)=>{ const l = g.createLinearGradient(x1,0,x2,0); l.addColorStop(0,'rgba(245,185,66,0)'); l.addColorStop(1,'rgba(245,185,66,.9)'); g.fillStyle = l; g.fillRect(Math.min(x1,x2),H/2-1.5,Math.abs(x2-x1),3) }
  line(30, x0-30)
  const r = g.createLinearGradient(W-30,0,x0+a+b+30,0); r.addColorStop(0,'rgba(245,185,66,0)'); r.addColorStop(1,'rgba(245,185,66,.9)'); g.fillStyle = r; g.fillRect(x0+a+b+30,H/2-1.5,W-30-(x0+a+b+30),3)
}
function drawFolds(g:CanvasRenderingContext2D){   // deep violet velvet folds
  const W = 128, H = 8
  const grad = g.createLinearGradient(0,0,W,0)
  for (let i=0;i<=8;i++) grad.addColorStop(i/8, i%2 ? '#2a2058' : '#120d2b')
  g.fillStyle = grad; g.fillRect(0,0,W,H)
}
const radial = (color:string)=>(g:CanvasRenderingContext2D)=>{
  const c = new Color(color), rgb = `${Math.round(c.r*255)},${Math.round(c.g*255)},${Math.round(c.b*255)}`
  const grad = g.createRadialGradient(128,128,0,128,128,128)
  grad.addColorStop(0,`rgba(${rgb},.75)`); grad.addColorStop(.5,`rgba(${rgb},.22)`); grad.addColorStop(1,`rgba(${rgb},0)`)
  g.fillStyle = grad; g.fillRect(0,0,256,256)
}

function Basic({ color=GOLD, ...mesh }:{ color?:string; size:[number,number,number]; pos:[number,number,number] }){
  return <mesh position={mesh.pos} raycast={noop}><boxGeometry args={mesh.size}/><meshBasicMaterial color={color} toneMapped={false}/></mesh>
}

export default function Decor({ glow='#8fa0ff', sparkles=false }:{ glow?:string; sparkles?:boolean }){
  const sign = useMemo(()=>canvasTexture(1024,160,drawSign,{ redrawOnFonts:true }),[])
  const folds = useMemo(()=>canvasTexture(128,8,drawFolds,{ repeat:[3,1] }),[])
  const halo = useMemo(()=>canvasTexture(256,256,radial(glow)),[glow])
  const beamGeo = useMemo(()=>{ const L = 27, g = new ConeGeometry(9,L,40,1,true); g.translate(0,-L/2,0); g.rotateX(-Math.PI/2); return g },[])   // apex at origin, opening towards +z
  const beam = useRef<Mesh>(null)
  const starsRef = useRef<InstancedMesh>(null), inlayRef = useRef<InstancedMesh>(null)
  const inlayZ = useMemo(()=>Array.from({length:8},(_,i)=>-9.9+i*3.2),[])       // between the wall lights
  const stars = useMemo(()=>{ const r = mulberry32(7); return Array.from({length:130},()=>[(r()-.5)*(D.width-3), D.height-.03, D.frontZ+2+r()*(D.backZ-D.frontZ-3)] as [number,number,number]) },[])

  useLayoutEffect(()=>{
    const o = new Object3D(), put = (m:InstancedMesh|null, pts:[number,number,number][])=>{ if(!m) return; pts.forEach((p,i)=>{ o.position.set(...p); o.updateMatrix(); m.setMatrixAt(i,o.matrix) }); m.instanceMatrix.needsUpdate = true; m.computeBoundingSphere() }
    put(starsRef.current, stars)
    put(inlayRef.current, inlayZ.flatMap(z=>[[-HALF_W+.06,6,z],[HALF_W-.06,6,z]] as [number,number,number][]))
  },[stars,inlayZ])
  useLayoutEffect(()=>{ beam.current?.position.set(0, D.height-2, D.backZ-.4); beam.current?.lookAt(0, D.screenY, D.screenZ) },[])   // +z of the cone points at the screen
  useLayoutEffect(()=>()=>{ sign?.dispose(); folds?.dispose(); halo?.dispose(); beamGeo.dispose() },[sign,folds,halo,beamGeo])

  const midZ = (D.backZ+D.frontZ)/2, len = D.backZ-D.frontZ
  const W = D.screenW, H = D.screenH, sy = D.screenY, sz = D.screenZ
  return <group name="premium-decor">
    {/* soft glow behind the screen, tinted with the movie's colour */}
    {halo && <mesh position={[0,sy,D.frontZ+.03]} raycast={noop}><planeGeometry args={[W*1.7,H*1.7]}/><meshBasicMaterial map={halo} transparent blending={AdditiveBlending} depthWrite={false} toneMapped={false}/></mesh>}
    {/* CINEHALL sign above the screen */}
    {sign && <mesh position={[0,sy+H/2+1.45,D.frontZ+.06]} raycast={noop}><planeGeometry args={[7.4,1.15]}/><meshBasicMaterial map={sign} transparent depthWrite={false} toneMapped={false}/></mesh>}
    {/* gold frame round the screen */}
    <Basic size={[W+.5,.12,.06]} pos={[0,sy+H/2+.06,sz+.03]}/><Basic size={[W+.5,.12,.06]} pos={[0,sy-H/2-.06,sz+.03]}/>
    <Basic size={[.12,H+.24,.06]} pos={[-(W/2+.06),sy,sz+.03]}/><Basic size={[.12,H+.24,.06]} pos={[W/2+.06,sy,sz+.03]}/>
    {/* velvet curtains with gold trim */}
    {[-1,1].map(side=><group key={side}>
      <mesh position={[side*(W/2+.4+1.7),5.8,D.frontZ+.35]} raycast={noop}><boxGeometry args={[3.4,11.6,.6]}/><meshStandardMaterial map={folds} color="#ffffff" roughness={.95}/></mesh>
      <Basic size={[.08,11.6,.64]} pos={[side*(W/2+.4),5.8,D.frontZ+.35]}/></group>)}
    {/* warm gold cove light round the ceiling */}
    <Basic color="#ffcf8a" size={[.14,.14,len]} pos={[-HALF_W+.12,D.height-.55,midZ]}/><Basic color="#ffcf8a" size={[.14,.14,len]} pos={[HALF_W-.12,D.height-.55,midZ]}/>
    <Basic color="#ffcf8a" size={[D.width-.4,.14,.14]} pos={[0,D.height-.55,D.backZ-.12]}/><Basic color="#ffcf8a" size={[D.width-.4,.14,.14]} pos={[0,D.height-.55,D.frontZ+.12]}/>
    {/* thin gold inlays between the wall lights */}
    <instancedMesh ref={inlayRef} args={[undefined as any, undefined as any, inlayZ.length*2]} frustumCulled={false} raycast={noop}><boxGeometry args={[.05,9,.16]}/><meshBasicMaterial color={GOLD} toneMapped={false}/></instancedMesh>
    {/* starlit ceiling */}
    <instancedMesh ref={starsRef} args={[undefined as any, undefined as any, stars.length]} frustumCulled={false} raycast={noop}><boxGeometry args={[.07,.02,.07]}/><meshBasicMaterial color="#fff1c9" toneMapped={false}/></instancedMesh>
    {/* projector beam + floating dust */}
    <mesh ref={beam} geometry={beamGeo} raycast={noop} frustumCulled={false}><meshBasicMaterial color="#ffe9b0" transparent opacity={.035} blending={AdditiveBlending} depthWrite={false} side={DoubleSide} toneMapped={false}/></mesh>
    {sparkles && <Sparkles count={45} scale={[12,6,24]} position={[0,7.2,-1]} size={2.2} speed={.15} opacity={.55} color="#fff1c9"/>}
  </group>
}
