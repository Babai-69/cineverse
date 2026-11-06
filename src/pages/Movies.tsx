import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { movies } from '../data/movies'
import MovieCard from '../components/MovieCard'
import Chip from '../components/Chip'
import type { Format } from '../data/types'

const languages = ['All','Tamil','Telugu','Kannada','Malayalam','Hindi','English']
const genres = ['All', ...Array.from(new Set(movies.flatMap(m=>m.genres)))]
const formats = ['All','2D','IMAX','4DX']
type Sort = 'popular'|'new'|'rating'

export default function Movies(){
  const [lang,setLang] = useState('All'); const [genre,setGenre] = useState('All')
  const [format,setFormat] = useState('All'); const [sort,setSort] = useState<Sort>('popular')
  const [q,setQ] = useState(''); const [tab,setTab] = useState<'now'|'soon'>('now')

  const list = useMemo(()=>{
    let r = movies.filter(m=> (tab==='now')===m.nowShowing)
      .filter(m=>lang==='All'||m.language===lang)
      .filter(m=>genre==='All'||m.genres.includes(genre))
      .filter(m=>format==='All'||m.formats.includes(format as Format))
      .filter(m=>m.title.toLowerCase().includes(q.trim().toLowerCase()))
    if(sort==='new') r=[...r].sort((a,b)=>b.releaseDate.localeCompare(a.releaseDate))
    if(sort==='rating') r=[...r].sort((a,b)=>b.rating-a.rating)
    return r
  },[lang,genre,format,sort,q,tab])

  const reset = ()=>{setLang('All');setGenre('All');setFormat('All');setQ('')}
  return <section className="mx-auto max-w-[1680px] px-4 py-8 md:px-8">
    <h1 className="mb-4 text-5xl">Movies</h1>
    <div className="mb-3 flex flex-wrap items-center gap-2">
      <Chip on={tab==='now'} onClick={()=>setTab('now')}>Now showing</Chip>
      <Chip on={tab==='soon'} onClick={()=>setTab('soon')}>Coming soon</Chip>
      <label className="pill ml-auto flex items-center gap-2"><Search size={14}/>
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search title" aria-label="Search movies" className="w-40 bg-transparent text-white outline-none"/></label>
      <select aria-label="Sort" value={sort} onChange={e=>setSort(e.target.value as Sort)} className="pill bg-transparent">
        <option className="bg-black" value="popular">Popular</option><option className="bg-black" value="new">Newest</option><option className="bg-black" value="rating">Top rated</option></select>
    </div>
    <div className="mb-2 flex flex-wrap gap-2" role="group" aria-label="Language">{languages.map(l=><Chip key={l} on={lang===l} onClick={()=>setLang(l)}>{l}</Chip>)}</div>
    <div className="mb-2 flex flex-wrap gap-2" role="group" aria-label="Genre">{genres.map(g=><Chip key={g} on={genre===g} onClick={()=>setGenre(g)}>{g}</Chip>)}</div>
    <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label="Format">{formats.map(f=><Chip key={f} on={format===f} onClick={()=>setFormat(f)}>{f}</Chip>)}</div>
    {list.length===0
      ? <div className="card p-10 text-center text-muted">No movies match. <button className="text-accent underline" onClick={reset}>Clear filters</button></div>
      : <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-6">{list.map(m=><MovieCard key={m.id} m={m}/>)}</div>}
  </section>
}
