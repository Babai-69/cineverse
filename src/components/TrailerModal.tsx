import { useEffect } from 'react'
import { X } from 'lucide-react'
/** Full trailer in a popup using the official YouTube player (the 3D screen can only play video FILES, not YouTube). */
export default function TrailerModal({ youtubeId, title, onClose }:{ youtubeId:string; title:string; onClose:()=>void }){
  useEffect(()=>{ const k = (e:KeyboardEvent)=>{ if(e.key==='Escape') onClose() }; document.addEventListener('keydown',k); return ()=>document.removeEventListener('keydown',k) },[onClose])
  return <div role="dialog" aria-modal="true" aria-label={`${title} trailer`} className="fixed inset-0 z-[60] grid place-items-center bg-black/80 p-4" onClick={onClose}>
    <div className="relative aspect-video w-full max-w-4xl overflow-hidden rounded-xl bg-black" onClick={e=>e.stopPropagation()}>
      <iframe className="h-full w-full" title={`${title} trailer`} allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen
        src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(youtubeId)}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}/>
      <button aria-label="Close trailer" onClick={onClose} className="absolute right-2 top-2 rounded-full bg-black/70 p-2 text-white hover:bg-black"><X size={16}/></button></div></div>
}
