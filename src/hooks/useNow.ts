import { useEffect, useState } from 'react'
/** Current time, refreshed every minute, so shows that start while the page is open grey out. */
export function useNow(override?:Date):Date{
  const [now,setNow] = useState(()=>new Date())
  useEffect(()=>{ if(override) return; const id = setInterval(()=>setNow(new Date()), 60_000); return ()=>clearInterval(id) },[override])
  return override ?? now
}
