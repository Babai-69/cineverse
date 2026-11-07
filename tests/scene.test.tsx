// Renders the REAL 3D scene graph with @react-three/test-renderer (no GPU needed) and clicks seats on it.
import { describe, it, expect, vi } from 'vitest'
import ReactThreeTestRenderer from '@react-three/test-renderer'
import HallScene from '../src/three/HallScene'
import { buildSeatGeometry } from '../src/three/seatGeometry'
import { HALL } from '../src/lib/hall'

const base = { soldIds:new Set<string>(['C5']), selectedIds:['C6'], hoveredId:null, onHover:()=>{}, onSeatClick:()=>{}, labels:false }
// r.scene.findAll returns test-instance wrappers: the real three object is `.instance` (InstancedMesh reports type 'Mesh', so use isInstancedMesh)
const seatMeshes = (r:any)=>r.scene.findAll((n:any)=>n.instance.isInstancedMesh && n.instance.count>=16 && n.instance.geometry?.attributes?.position?.count>100)
const countOf = (n:any)=>n.instance.count

describe('seat geometry', () => {
  it('merged geometries are non-empty with sensible sizes (standard ≈0.6 m wide, recliner ≈1 m)', () => {
    const std = buildSeatGeometry(false).boundingBox!, rec = buildSeatGeometry(true).boundingBox!
    expect(std.max.x-std.min.x).toBeGreaterThan(.5); expect(std.max.x-std.min.x).toBeLessThan(.65)
    expect(rec.max.x-rec.min.x).toBeGreaterThan(.9); expect(rec.max.x-rec.min.x).toBeLessThan(1.05)
    expect(std.max.y).toBeLessThan(1.1); expect(buildSeatGeometry(false).attributes.position.count).toBeGreaterThan(100)
  })
})
describe('HallScene (real scene graph)', () => {
  it('mounts without errors and creates one instanced mesh per seat type with the right counts', async () => {
    const r = await ReactThreeTestRenderer.create(<HallScene {...base}/>)
    const meshes = seatMeshes(r)
    expect(meshes.map(countOf).sort((a:number,b:number)=>a-b)).toEqual([16, 264])
    expect(HALL.seats.length).toBe(280)
    await r.unmount()
  })
  it('sold / selected / available seats get different colours', async () => {
    const r = await ReactThreeTestRenderer.create(<HallScene {...base}/>)
    const std = seatMeshes(r).find((m:any)=>countOf(m)===264).instance
    const ids = HALL.seats.filter(s=>!s.recliner).map(s=>s.id)
    const get = (id:string)=>{ const c = new (std.material.color.constructor as any)(); std.getColorAt(ids.indexOf(id), c); return c.getHexString() }
    expect(get('C5')).not.toBe(get('C6')); expect(get('C6')).not.toBe(get('C7')); expect(get('C5')).not.toBe(get('C7'))
    await r.unmount()
  })
  it('clicking a seat calls onSeatClick with its id; a drag (delta>6) is ignored', async () => {
    const onSeatClick = vi.fn()
    const r = await ReactThreeTestRenderer.create(<HallScene {...base} onSeatClick={onSeatClick}/>)
    const std = seatMeshes(r).find((m:any)=>countOf(m)===264)
    const ids = HALL.seats.filter(s=>!s.recliner).map(s=>s.id)
    await r.fireEvent(std, 'click', { instanceId: ids.indexOf('H8'), delta:0, stopPropagation(){} })
    await r.fireEvent(std, 'click', { instanceId: ids.indexOf('J3'), delta:20, stopPropagation(){} })
    expect(onSeatClick).toHaveBeenCalledTimes(1); expect(onSeatClick).toHaveBeenCalledWith('H8')
    await r.unmount()
  })
  it('hover reports the seat id, pointer-out clears it; recliner mesh maps to recliner ids', async () => {
    const onHover = vi.fn(), onSeatClick = vi.fn()
    const r = await ReactThreeTestRenderer.create(<HallScene {...base} onHover={onHover} onSeatClick={onSeatClick}/>)
    const rec = seatMeshes(r).find((m:any)=>countOf(m)===16)
    await r.fireEvent(rec, 'pointerMove', { instanceId:0, stopPropagation(){} })
    await r.fireEvent(rec, 'pointerOut', {})
    await r.fireEvent(rec, 'click', { instanceId:3, delta:0, stopPropagation(){} })
    expect(onHover).toHaveBeenNthCalledWith(1,'A1'); expect(onHover).toHaveBeenNthCalledWith(2,null); expect(onSeatClick).toHaveBeenCalledWith('A4')
    await r.unmount()
  })
})
