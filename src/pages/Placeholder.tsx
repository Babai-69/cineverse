import { useParams } from 'react-router-dom'
export default function Placeholder({title,day}:{title:string;day:number}){
  const p = useParams()
  return <section className="mx-auto max-w-3xl px-4 py-24 text-center">
    <h1 className="text-5xl">{title}</h1>
    <p className="mt-2 text-muted">Planned for Day {day}.</p>
    {Object.keys(p).length>0 && <pre className="mt-4 font-mono text-xs text-muted">{JSON.stringify(p)}</pre>}</section>
}
