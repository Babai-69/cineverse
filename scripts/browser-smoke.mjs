#!/usr/bin/env node
/**
 * Real-browser smoke test of the 3D seat picker (the unit tests have no GPU, so they cannot see a blank canvas).
 * Checks: the canvas actually DRAWS, no shader errors, hovering a seat shows a tooltip, a click selects exactly one
 * seat, dragging to look around selects nothing, no uncaught page errors. Saves a screenshot.
 *
 *   1. npm i -D puppeteer-core          (one time; uses YOUR installed Chrome/Edge)
 *   2. npm run dev                      (keep it running in another terminal)
 *   3. CHROME_PATH="C:\Program Files\Google\Chrome\Application\chrome.exe" npm run smoke
 *      (macOS: /Applications/Google Chrome.app/Contents/MacOS/Google Chrome · Linux: /usr/bin/google-chrome)
 * Options: BASE_URL (default http://localhost:5173)  MOVIE (default m1)  OUT (screenshot, default smoke-3d.png)
 */
import { writeFileSync } from 'node:fs'
const BASE = process.env.BASE_URL ?? 'http://localhost:5173', MOVIE = process.env.MOVIE ?? 'm1', OUT = process.env.OUT ?? 'smoke-3d.png'

let puppeteer; try { puppeteer = (await import('puppeteer-core')).default } catch { console.error('Install it first:  npm i -D puppeteer-core'); process.exit(2) }
let executablePath = process.env.CHROME_PATH, extra = []
if (!executablePath) { try { const c = (await import('@sparticuz/chromium')).default; executablePath = await c.executablePath(); extra = [...c.args, '--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--no-sandbox'] } catch {} }
if (!executablePath) { console.error('Set CHROME_PATH to your Chrome/Edge executable.'); process.exit(2) }

const browser = await puppeteer.launch({ executablePath, headless:'new', args:['--ignore-gpu-blocklist','--autoplay-policy=no-user-gesture-required', ...extra] })
const page = await browser.newPage(); await page.setViewport({ width:1362, height:820 })
const problems = [], warnings = []
page.on('pageerror', e=>problems.push(`uncaught page error: ${String(e).slice(0,200)}`))
page.on('console', m=>{ if (m.type()==='error') warnings.push(m.text().slice(0,160)) })
await page.evaluateOnNewDocument(()=>{
  window.__gl = { draws:0, shaderErr:[] }
  for (const C of [window.WebGL2RenderingContext, window.WebGLRenderingContext]) { if (!C) continue
    const P = C.prototype
    for (const n of ['drawElements','drawArrays','drawElementsInstanced','drawArraysInstanced']) { const o = P[n]; if (!o) continue; P[n] = function(...a){ window.__gl.draws++; return o.apply(this,a) } }
    const lp = P.linkProgram; P.linkProgram = function(pr){ const r = lp.call(this,pr); if (!this.getProgramParameter(pr,this.LINK_STATUS)) window.__gl.shaderErr.push(String(this.getProgramInfoLog(pr)).slice(0,200)); return r } }
})
const wait = ms=>new Promise(r=>setTimeout(r,ms))
const selected = ()=>page.evaluate(()=>Number(document.body.innerText.match(/(\d+) \/ 10/)?.[1] ?? -1))
const tooltip = ()=>page.evaluate(()=>[...document.querySelectorAll('div')].map(d=>d.textContent).find(t=>/^Row \w · Seat \d+/.test(t||'')) ?? null)

await page.goto(`${BASE}/movie/${MOVIE}`, { waitUntil:'networkidle2' })
const href = await page.evaluate(()=>[...document.querySelectorAll('a')].map(a=>a.getAttribute('href')).find(h=>h&&h.includes('/seats')))
if (!href) { console.error('No upcoming showtime found on the movie page (all shows started today? try tomorrow).'); await browser.close(); process.exit(1) }
await page.goto(`${BASE}${href}`, { waitUntil:'domcontentloaded' }); await wait(7000)

const gl = await page.evaluate(()=>window.__gl)
if (!(await page.$('canvas'))) problems.push('no <canvas>: the 3D hall did not start (is WebGL available?)')
if (gl.draws<50) problems.push(`the canvas is BLANK: only ${gl.draws} draw calls (expected hundreds)`)
if (gl.shaderErr.length) problems.push(`shader errors: ${gl.shaderErr.join(' | ')}`)

// find a seat by scanning for a tooltip that says Available, then click it
let hit = null
const box = await (await page.$('canvas'))?.boundingBox()
if (box) scan: for (let y = box.y + box.height*.45; y < box.y + box.height*.92; y += 14) for (let x = box.x + box.width*.2; x < box.x + box.width*.8; x += 14) {
  await page.mouse.move(x,y); await wait(35); const t = await tooltip(); if (t && /Available$/.test(t)) { hit = [x,y,t]; break scan } }
if (!hit) problems.push('hover: no seat tooltip found anywhere in the hall')
else {
  const before = await selected(); await page.mouse.click(hit[0],hit[1]); await wait(400); const after = await selected()
  if (after !== before+1) problems.push(`click: selected seats ${before} -> ${after} (expected +1) at "${hit[2]}"`)
  await page.mouse.move(box.x+box.width*.5, box.y+box.height*.3); await page.mouse.down(); await page.mouse.move(box.x+box.width*.62, box.y+box.height*.25,{steps:8}); await page.mouse.up(); await wait(400)
  if (await selected() !== after) problems.push('drag: dragging to look around changed the selection')
}
writeFileSync(OUT, await page.screenshot())
console.log(`draw calls: ${gl.draws} · hover/click seat: ${hit ? hit[2] : 'NOT FOUND'} · screenshot: ${OUT}`)
if (warnings.length) console.log('console errors (informational):', [...new Set(warnings)].slice(0,3))
await browser.close()
if (problems.length) { console.error('\nFAILED:\n - ' + problems.join('\n - ')); process.exit(1) }
console.log('3D SMOKE TEST PASSED')
