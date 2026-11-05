import { movies } from '../data/movies'
import MovieCard from '../components/MovieCard'
export default function Movies(){
  return <section className="mx-auto max-w-[1680px] px-4 py-8 md:px-8">
    <h1 className="mb-1 text-5xl">Movies</h1><p className="mb-6 text-muted">Filters arrive on Day 2.</p>
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-6">{movies.map(m=><MovieCard key={m.id} m={m}/>)}</div></section>
}
