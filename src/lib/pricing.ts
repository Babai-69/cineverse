/** Demo prices (INR). Seat price = category price + format surcharge, +10% on weekends. Fee ₹30 per ticket + 18% GST on the fee. */
import type { Format } from '../data/types'
import type { Category } from './hall'
import { HALL } from './hall'

export const CATEGORY_PRICE:Record<Category,number> = { Silver:180, Gold:260, Premium:450, Balcony:220 }
export const FORMAT_SURCHARGE:Record<Format,number> = { '2D':0, IMAX:120, '4DX':200 }
export const FEE_PER_TICKET = 30, GST_RATE = .18

export const isWeekend = (dateISO:string)=>{ const d = new Date(dateISO+'T12:00:00').getDay(); return d===0||d===6 }
export function seatPrice(category:Category, format:Format, dateISO:string):number{
  return Math.round((CATEGORY_PRICE[category]+FORMAT_SURCHARGE[format])*(isWeekend(dateISO)?1.1:1))
}
export type PriceLine = { category:Category; count:number; unit:number; amount:number }
export type PriceSummary = { lines:PriceLine[]; subtotal:number; fee:number; gst:number; total:number; count:number }
export function priceSummary(seatIds:string[], show:{ format:Format; date:string }):PriceSummary{
  const by = new Map<Category,PriceLine>()
  for (const id of seatIds){
    const s = HALL.byId.get(id); if(!s) continue
    const unit = seatPrice(s.category, show.format, show.date)
    const line = by.get(s.category) ?? { category:s.category, count:0, unit, amount:0 }
    line.count++; line.amount += unit; by.set(s.category, line)
  }
  const lines = [...by.values()], count = lines.reduce((n,l)=>n+l.count,0)
  const subtotal = lines.reduce((n,l)=>n+l.amount,0)
  const fee = count*FEE_PER_TICKET, gst = Math.round(fee*GST_RATE)
  return { lines, subtotal, fee, gst, total:subtotal+fee+gst, count }
}
