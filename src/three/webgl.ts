/** True if this browser can create a WebGL context (otherwise we show the 2D seat map). */
export function hasWebGL():boolean{
  try{ const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')) }catch{ return false }
}
