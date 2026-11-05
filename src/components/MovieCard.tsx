import { Link } from 'react-router-dom'
import type { Movie } from '../data/types'
export default function MovieCard({m}:{m:Movie}){
  return <Link to={`/movie/${m.id}`} className="group block">
    <div className="card overflow-hidden transition duration-300 group-hover:-translate-y-1">
      <img src={m.poster} alt={m.title} loading="lazy" className="aspect-[2/3] w-full object-cover"/></div>
    <h3 className="mt-2 text-lg leading-tight">{m.title}</h3>
    <p className="text-xs text-muted">{m.language} · {m.genres.join(', ')} · ★ {m.rating}</p></Link>
}
