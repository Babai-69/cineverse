#!/usr/bin/env node
/**
 * Copies a new CineHall zip's contents into THIS repo (run from the repo root).
 *   1. Unzip the new cinehall-dayN.zip anywhere (it contains a folder called "cinehall")
 *   2. node scripts/sync.mjs <path-to-that-unzipped-cinehall-folder>
 * Never touches: .git, node_modules, dist. Overwrites everything else.
 * Does NOT delete files you removed in newer versions (check PROGRESS.md notes if a day removes any).
 */
import { cpSync, existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'

const src = resolve(process.argv[2] ?? '')
const dest = process.cwd()
if (!process.argv[2] || !existsSync(join(src,'package.json'))) {
  console.error('Usage: node scripts/sync.mjs <path-to-unzipped-cinehall-folder>\n(that folder must contain package.json)'); process.exit(1)
}
if (src === dest) { console.error('Source and destination are the same folder.'); process.exit(1) }
const SKIP = new Set(['.git','node_modules','dist'])
const before = existsSync('package.json') ? readFileSync('package.json','utf8') : ''
let copied = 0
cpSync(src, dest, { recursive:true, force:true, filter:(p)=>{
  const name = p.split(/[\\/]/).pop()
  if (SKIP.has(name)) return false
  if (statSync(p).isFile()) copied++
  return true } })
const after = readFileSync('package.json','utf8')
console.log(`Synced ${copied} files from ${src}`)
if (before !== after) console.log('package.json changed -> run: npm install')
console.log('Next: npm run ship -- "Day N: <what changed>"')
