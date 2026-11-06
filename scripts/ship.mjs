#!/usr/bin/env node
/**
 * One command to verify and publish:  npm run ship -- "Day 3: availability colours"
 * Runs build + tests first and STOPS if anything fails (so broken code never reaches GitHub).
 * Then: git add -A, git commit, git push.
 */
import { spawnSync } from 'node:child_process'
const msg = process.argv.slice(2).join(' ').trim()
if (!msg) { console.error('Give a commit message: npm run ship -- "Day 3: ..."'); process.exit(1) }
const run = (cmd, args, label) => {
  console.log(`\n> ${label}`)
  const r = spawnSync(cmd, args, { stdio:'inherit', shell:process.platform==='win32' })
  if (r.status !== 0) { console.error(`\nStopped: "${label}" failed. Nothing was pushed.`); process.exit(r.status ?? 1) }
}
run('npm',['run','build'],'build (typecheck)')
run('npm',['test'],'tests')
run('npm',['run','check'],'engine checks')
run('git',['add','-A'],'git add')
const c = spawnSync('git',['commit','-m',msg],{stdio:'inherit',shell:process.platform==='win32'})
if (c.status !== 0) console.log('(nothing new to commit — pushing anyway)')
run('git',['push'],'git push')
console.log('\nDone. Pushed to GitHub.')
