import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, afterEach, vi } from 'vitest'
import App from '../src/App'
export const renderAt = (path:string)=>render(<MemoryRouter initialEntries={[path]} future={{v7_startTransition:true,v7_relativeSplatPath:true}}><App/></MemoryRouter>)
/** Freeze only Date (timers stay real so userEvent works). Call inside a describe(). */
export function freezeTime(iso:string){
  beforeEach(()=>{ vi.useFakeTimers({ toFake:['Date'] }); vi.setSystemTime(new Date(iso)) })
  afterEach(()=>{ vi.useRealTimers() })
}
/** Pretend the browser GPS answers (or fails). */
export function mockGeolocation(result:{lat:number;lng:number}|{code:1|2|3}){
  Object.defineProperty(navigator,'geolocation',{ configurable:true, value:{
    getCurrentPosition:(ok:any,err:any)=>{ 'code' in result ? err({code:result.code,message:'x'}) : ok({coords:{latitude:result.lat,longitude:result.lng,accuracy:25}}) } } })
}
export const clearGeolocation = ()=>{ Object.defineProperty(navigator,'geolocation',{ configurable:true, value:undefined }) }
/** Route fake network answers by URL. Return undefined for a 500. */
export function mockFetch(routes:{reverse?:unknown;search?:unknown;overpass?:unknown}){
  const f = vi.fn(async (url:string)=>{
    const body = url.includes('/reverse') ? routes.reverse : url.includes('/search') ? routes.search : url.includes('overpass') ? routes.overpass : undefined
    return body===undefined ? { ok:false, status:500, json:async()=>({}) } : { ok:true, status:200, json:async()=>body }
  })
  vi.stubGlobal('fetch', f); return f
}
export const DURGAPUR_OVERPASS = { elements:[
  { type:'node', id:111, lat:23.5550, lon:87.3200, tags:{ name:'Durgapur Cineplex', 'addr:city':'Durgapur' } },
  { type:'node', id:222, lat:23.5210, lon:87.3120, tags:{ name:'City Centre Talkies' } },
  { type:'way', id:333, center:{ lat:23.5400, lon:87.2900 }, tags:{ name:'Bengal Silver Screen' } },
  { type:'node', id:444, lat:23.5300, lon:87.3000, tags:{ cuisine:'unnamed cinema' } } ] }
export const DURGAPUR_REVERSE = { address:{ city:'Durgapur', state:'West Bengal' }, display_name:'Durgapur, Paschim Bardhaman, West Bengal, India' }
