import { Crosshair, Play, Square } from 'lucide-react'
import { PRESETS, PRESET_ORDER, type PresetId } from '../lib/camera'

export type CamMode = PresetId | 'seat' | 'free'
/** View buttons floating over the 3D hall: 4 presets, "From my seat" (needs a selected seat) and the auto tour. */
export default function CameraBar({ mode, hasSeat, seatLabel, tour, canTour, onPreset, onSeat, onTour }:{
  mode:CamMode; hasSeat:boolean; seatLabel?:string; tour:boolean; canTour:boolean
  onPreset:(id:PresetId)=>void; onSeat:()=>void; onTour:()=>void }){
  const base = 'pill flex shrink-0 items-center gap-1 whitespace-nowrap border-white/15 bg-black/55 text-xs text-white/85 backdrop-blur transition hover:border-accent/60 hover:text-white disabled:cursor-not-allowed disabled:opacity-40'
  const on = '!border-accent !bg-accent !text-black'
  return <div role="toolbar" aria-label="Camera views" className="absolute inset-x-2 bottom-9 flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] sm:bottom-10 sm:justify-center">
    {PRESET_ORDER.map(id=><button key={id} type="button" aria-pressed={mode===id && !tour} className={`${base} ${mode===id && !tour ? on : ''}`} onClick={()=>onPreset(id)}>{PRESETS[id].label}</button>)}
    <button type="button" aria-pressed={mode==='seat'} className={`${base} ${mode==='seat' ? on : ''}`} disabled={!hasSeat} onClick={onSeat}
      title={hasSeat ? `See the screen from seat ${seatLabel}` : 'Select a seat first'}><Crosshair size={12}/>{hasSeat && seatLabel ? `From seat ${seatLabel}` : 'From my seat'}</button>
    {canTour && <button type="button" aria-pressed={tour} className={`${base} ${tour ? on : ''}`} onClick={onTour}>{tour ? <><Square size={11}/>Stop tour</> : <><Play size={11}/>Auto tour</>}</button>}
  </div>
}
