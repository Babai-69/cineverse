/**
 * Tiny scoped logger. OFF by default so production stays quiet.
 * Turn on:  open the site with ?debug=1   (remembered), turn off with ?debug=0
 * Or in the browser console:  localStorage.setItem('cinehall:debug','1')
 * Usage:   const log = createLogger('shows');  log('built board', {city, count})
 */
const KEY = 'cinehall:debug'
function readFlag():boolean{
  try{
    if (typeof window === 'undefined') return false
    const q = new URLSearchParams(window.location.search).get('debug')
    if (q==='1') localStorage.setItem(KEY,'1')
    if (q==='0') localStorage.removeItem(KEY)
    return localStorage.getItem(KEY)==='1'
  }catch{ return false }
}
export const isDebug = ()=>readFlag()
export function createLogger(scope:string){
  return (...args:unknown[])=>{ if(isDebug()) console.debug(`%c[cinehall:${scope}]`,'color:#f5b942',...args) }
}
