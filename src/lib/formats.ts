/**
 * Screen formats are NOT in the cinema database, so they are derived deterministically (demo data):
 * chain multiplexes sometimes get IMAX/4DX, single screens are always 2D. Add a "Formats" column
 * to the CSV (e.g. 2D|IMAX) to override with real data.
 */
import type { Format } from '../data/types'
import { hashString } from './rng'
export function formatsFor(id:string, venueType?:string, chain?:string):Format[]{
  if (venueType && venueType!=='Multiplex') return ['2D']
  if (chain==='Independent') return ['2D']
  const h = hashString(id)%100
  return h<18 ? ['2D','IMAX'] : h<32 ? ['2D','4DX'] : ['2D']
}
export const isFormat = (f:string):f is Format => f==='2D'||f==='IMAX'||f==='4DX'
