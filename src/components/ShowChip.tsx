import { Link } from 'react-router-dom'
import type { Show, TheatreWithDistance } from '../data/types'
import { LEVEL_LABEL, levelOf } from '../lib/availability'
import { useBooking } from '../store/booking'

/** One showtime: colour = seats left (plus a text label for colour-blind users). Started shows are greyed out. */
export default function ShowChip({show, theatre, started}:{show:Show; theatre:TheatreWithDistance; started:boolean}){
  const selectShow = useBooking(s=>s.selectShow)
  const level = levelOf(show)
  const label = `${show.time} ${show.format}, ${started ? 'already started' : LEVEL_LABEL[level].toLowerCase()}, from ₹${show.priceFrom}`
  const body = <>
    <span className="font-mono text-white">{show.time}</span><span className="ml-2 text-xs">{show.format}</span>
    <span className="block text-[11px] leading-tight">{started ? 'Started' : LEVEL_LABEL[level]}</span>
    <span className="block text-[11px] leading-tight opacity-80">from ₹{show.priceFrom}</span></>
  const cls = `pill show-chip lvl-${level} min-w-[96px] text-center transition`
  if (started) return <span className={cls} aria-disabled="true" aria-label={label} data-level={level} data-started="true">{body}</span>
  return <Link to={`/book/${show.id}/seats`} onClick={()=>selectShow(show, theatre)} className={cls} aria-label={label} data-level={level}>{body}</Link>
}
