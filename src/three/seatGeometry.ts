/**
 * One merged geometry per seat type (a seat = base + cushion + back + armrests [+ footrest]).
 * Merging means 264 seats cost ONE draw call via InstancedMesh. Seats face -z (towards the screen).
 * Units are metres; the seat origin is on the floor under its centre.
 */
import { BoxGeometry, type BufferGeometry } from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

function box(w:number,h:number,d:number, x:number,y:number,z:number, rotX=0):BufferGeometry{
  const g = new BoxGeometry(w,h,d); if (rotX) g.rotateX(rotX); g.translate(x,y,z); return g
}
export function buildSeatGeometry(recliner:boolean):BufferGeometry{
  const parts = recliner ? [
    box(.6,.3,.5, 0,.15,.05),                    // base
    box(.8,.2,.7, 0,.42,0),                      // cushion
    box(.8,.8,.16, 0,.85,.4, .25),               // reclined back
    box(.1,.4,.7, -.45,.45,0), box(.1,.4,.7, .45,.45,0),   // wide armrests
    box(.7,.1,.3, 0,.22,-.55),                   // footrest
  ] : [
    box(.36,.3,.34, 0,.15,.03),                  // pedestal
    box(.5,.12,.46, 0,.38,0),                    // cushion
    box(.5,.56,.1, 0,.7,.2, .12),                // back
    box(.05,.18,.4, -.27,.5,0), box(.05,.18,.4, .27,.5,0), // armrests
  ]
  const merged = mergeGeometries(parts, false)
  parts.forEach(p=>p.dispose())
  if (!merged) throw new Error('seat geometry merge failed')
  merged.computeBoundingBox(); merged.computeBoundingSphere()
  return merged
}
