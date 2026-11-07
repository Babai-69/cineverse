/** Minimal RFC-4180 CSV parser: BOM, CRLF, quoted fields with commas/quotes/newlines. Returns array of objects keyed by header. */
export function parseCsv(text){
  const src = text.replace(/^\uFEFF/, '')
  const rows = []; let row = [], field = '', inQ = false
  for (let i=0;i<src.length;i++){
    const ch = src[i]
    if (inQ){
      if (ch === '"'){ if (src[i+1] === '"'){ field += '"'; i++ } else inQ = false }
      else field += ch
    } else if (ch === '"') inQ = true
    else if (ch === ',') { row.push(field); field = '' }
    else if (ch === '\n' || ch === '\r'){ if (ch==='\r' && src[i+1]==='\n') i++; row.push(field); field=''; if (row.some(c=>c!=='')) rows.push(row); row=[] }
    else field += ch
  }
  if (field!=='' || row.length){ row.push(field); if (row.some(c=>c!=='')) rows.push(row) }
  if (!rows.length) return []
  const head = rows[0].map(h=>h.trim())
  return rows.slice(1).map(r=>Object.fromEntries(head.map((h,i)=>[h,(r[i]??'').trim()])))
}
export const toCsv = (rows, cols)=> [cols.join(','), ...rows.map(r=>cols.map(c=>{ const v = String(r[c]??''); return /[",\n]/.test(v) ? `"${v.replace(/"/g,'""')}"` : v }).join(','))].join('\n') + '\n'
