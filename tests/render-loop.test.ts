// Regression guard for the "blank 3D hall" bug: a useFrame() with a POSITIVE priority switches off react-three-fiber's
// automatic rendering (nothing is drawn unless you call gl.render yourself). Keep every useFrame at priority 0 (or negative).
import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'

/** Returns the top-level arguments of every useFrame(...) call in `src` (balanced-paren scan, ignores strings/comments roughly). */
export function useFrameArgs(src:string):string[][]{
  const out:string[][] = []; let idx = 0
  while ((idx = src.indexOf('useFrame(', idx)) !== -1){
    let i = idx + 'useFrame('.length, depth = 1, cur = '', args:string[] = []
    for (; i<src.length && depth>0; i++){
      const c = src[i]
      if ('([{'.includes(c)) depth++
      else if (')]}'.includes(c)) { depth--; if (depth===0) break }
      if (c===',' && depth===1){ args.push(cur.trim()); cur = '' } else cur += c
    }
    args.push(cur.trim()); out.push(args); idx = i
  }
  return out
}
describe('useFrameArgs helper', () => {
  it('finds the priority argument even when the callback contains parentheses and newlines', () => {
    const src = `useFrame(()=>{\n  foo(bar(1,2))\n  camera.position.set(1,2,3)\n}, 1)\nuseFrame((s)=>s.x)`
    const calls = useFrameArgs(src)
    expect(calls).toHaveLength(2); expect(calls[0][calls[0].length-1]).toBe('1'); expect(calls[1]).toHaveLength(1)
  })
})
describe('3D render loop safety', () => {
  it('no useFrame in src/three has a positive priority', () => {
    const bad:string[] = []
    for (const f of readdirSync('src/three').filter(f=>/\.tsx?$/.test(f)))
      for (const args of useFrameArgs(readFileSync(`src/three/${f}`,'utf8')))
        if (args.length>1 && Number(args[args.length-1])>0) bad.push(`${f}: useFrame priority ${args[args.length-1]}`)
    expect(bad).toEqual([])
  })
})
