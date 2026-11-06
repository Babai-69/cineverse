/** Deterministic helpers: same input string -> same random sequence. */
export function hashString(str:string):number{
  let h = 2166136261 >>> 0 // FNV-1a
  for (let i=0;i<str.length;i++){ h ^= str.charCodeAt(i); h = Math.imul(h,16777619) }
  return h >>> 0
}
export function mulberry32(seed:number){
  let a = seed >>> 0
  return function(){
    a = (a + 0x6D2B79F5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
export const randInt = (rng:()=>number, min:number, max:number)=> min + Math.floor(rng()*(max-min+1))
export const pick = <T,>(rng:()=>number, arr:T[]):T => arr[Math.floor(rng()*arr.length)]
