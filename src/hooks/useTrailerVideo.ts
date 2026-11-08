import { useCallback, useEffect, useState } from 'react'
import { createLogger } from '../lib/debug'
const log = createLogger('trailer')

export type TrailerState = 'idle'|'loading'|'playing'|'paused'|'blocked'|'error'
const MIME:Record<string,string> = { mp4:'video/mp4; codecs="avc1.42E01E"', m4v:'video/mp4', webm:'video/webm; codecs="vp9"', ogv:'video/ogg' }
/** Pick the first source this browser can play (Safari: MP4, Chrome/Firefox: either). Unknown extensions are tried anyway. */
export function pickSource(v:Pick<HTMLVideoElement,'canPlayType'>, list:string[]):string|null{
  if (!list.length) return null
  const ext = (u:string)=>u.split('?')[0].split('.').pop()?.toLowerCase() ?? ''
  return list.find(u=>!MIME[ext(u)] || v.canPlayType(MIME[ext(u)])!=='') ?? list[0]
}
/**
 * One <video> element that the 3D screen uses as a texture. Lives in the page (not in the 3D canvas) so the
 * Play/Mute buttons are normal accessible HTML. Muted autoplay is allowed by browsers; if it is blocked the state
 * becomes 'blocked' and the page shows a "tap to play" button. enabled=false pauses it (e.g. while the 2D map is shown).
 */
export function useTrailerVideo(sources:string|string[]|undefined, enabled:boolean){
  const [video,setVideo] = useState<HTMLVideoElement|null>(null)
  const [state,setState] = useState<TrailerState>('idle')
  const [muted,setMuted] = useState(true)
  const key = Array.isArray(sources) ? sources.join('|') : sources ?? ''

  useEffect(()=>{
    if (!key){ setVideo(null); setState('idle'); return }
    const v = document.createElement('video')
    v.muted = true; v.loop = true; v.playsInline = true; v.preload = 'auto'; v.crossOrigin = 'anonymous'; v.setAttribute('playsinline','')
    const src = pickSource(v, key.split('|')); if (!src) return
    v.src = src; log('source', src)
    const on = (ev:string, fn:()=>void)=>v.addEventListener(ev, fn)
    on('playing', ()=>setState('playing')); on('pause', ()=>setState(s=>s==='blocked'?s:'paused')); on('waiting', ()=>setState(s=>s==='playing'?'loading':s))
    on('error', ()=>{ log('video error', v.error?.message); setState('error') })
    setState('loading'); setVideo(v)
    return ()=>{ v.pause(); v.removeAttribute('src'); v.load(); setVideo(null) }
  },[key])

  const play = useCallback(()=>{
    if (!video) return
    video.play().then(()=>setState('playing')).catch(e=>{ log('autoplay blocked', e?.name); setState('blocked') })
  },[video])
  useEffect(()=>{ if (!video) return; if (enabled) play(); else video.pause() },[video, enabled, play])

  const toggle = useCallback(()=>{ if(!video) return; if (video.paused) play(); else video.pause() },[video, play])
  const toggleMute = useCallback(()=>{ if(!video) return; video.muted = !video.muted; setMuted(video.muted) },[video])
  return { video, state, muted, toggle, toggleMute, play }
}
