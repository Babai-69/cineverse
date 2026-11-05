import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Ticket } from '../data/types'
type State = {
  city:string; language:string|null; selectedMovieId:string|null; seats:string[]; snacks:Record<string,number>
  tickets:Ticket[]; perfMode:'high'|'low'
  setCity:(c:string)=>void; setLanguage:(l:string|null)=>void; addTicket:(t:Ticket)=>void
}
export const useBooking = create<State>()(persist((set)=>({
  city:'Chennai', language:null, selectedMovieId:null, seats:[], snacks:{}, tickets:[], perfMode:'high',
  setCity:(city)=>set({city}), setLanguage:(language)=>set({language}),
  addTicket:(t)=>set((s)=>({tickets:[t,...s.tickets]})),
}),{ name:'cinehall-store', partialize:(s)=>({tickets:s.tickets, city:s.city}) }))
