import { Link } from 'react-router-dom'
import { movies } from '../data/movies'
import MovieCard from '../components/MovieCard'
export default function Home(){
  const now = movies.filter(m=>m.nowShowing)
  return <>
    <section className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <p className="font-mono text-xs text-accent">3D PANORAMA HERO — COMING DAY 5</p>
      <h1 className="mt-2 text-6xl md:text-8xl">Step inside the <span className="text-accent">theatre</span></h1>
      <p className="mt-3 max-w-xl text-muted">Pick your seat in a real 3D cinema hall and see the screen before you pay.</p>
      <Link to="/movies" className="btn mt-6">Browse movies</Link></section>
    <section className="mx-auto max-w-[1680px] px-4 md:px-8">
      <h2 className="mb-4 text-3xl">Now showing</h2>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-6">{now.map(m=><MovieCard key={m.id} m={m}/>)}</div></section></>
}
