import { Link, useParams } from 'react-router-dom'
import { Clock, Star } from 'lucide-react'
import { movies } from '../data/movies'
import TheatreBoard from '../components/TheatreBoard'

export default function Movie(){
  const { id } = useParams()
  const m = movies.find(x=>x.id===id)
  if(!m) return <section className="mx-auto max-w-3xl px-4 py-24 text-center">
    <h1 className="text-5xl">Movie not found</h1><Link to="/movies" className="btn mt-6">Back to movies</Link></section>
  return <>
    <div className="relative aspect-video max-h-[70vh] w-full overflow-hidden">
      <img src={m.backdrop} alt="" className="h-full w-full object-cover"/>
      <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg)] via-black/30 to-black/20"/>
      <p className="absolute left-4 top-4 pill bg-black/60 font-mono text-xs md:left-8">Trailer area — full-screen trailer arrives Day 7</p></div>
    <div className="mx-auto -mt-24 max-w-[1680px] px-4 md:px-8">
      <div className="relative grid gap-6 md:grid-cols-[240px_1fr]">
        <img src={m.poster} alt={`${m.title} poster`} className="card hidden aspect-[2/3] w-60 object-cover md:block"/>
        <div>
          <h1 className="text-5xl md:text-7xl">{m.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted">
            <span className="pill">{m.certificate}</span>
            <span className="flex items-center gap-1"><Clock size={14}/>{Math.floor(m.runtime/60)}h {m.runtime%60}m</span>
            <span className="flex items-center gap-1 text-accent"><Star size={14}/>{m.rating}</span>
            <span>{m.language}</span><span>{m.genres.join(' · ')}</span></div>
          <p className="mt-4 max-w-2xl text-muted">{m.synopsis}</p>
          <p className="mt-3 text-sm"><span className="text-muted">Cast: </span>{m.cast.join(', ')}</p>
          {m.nowShowing && <a href="#theatres" className="btn mt-5">Book tickets</a>}
        </div></div>
      <div className="mt-12">
        {m.nowShowing ? <TheatreBoard movieId={m.id}/>
          : <div className="card p-8 text-center text-muted">Releases {m.releaseDate}. Bookings open closer to release.</div>}
      </div></div></>
}
