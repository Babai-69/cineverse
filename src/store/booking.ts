import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Show, Ticket, TheatreWithDistance, UserLocation } from '../data/types'
import { toggleSeat, HOLD_MS, type SelectionError } from '../lib/selection'

/** Default = Kolkata (largest city in the database). Location is saved on THIS device only (localStorage), never sent anywhere by us. */
export const DEFAULT_LOCATION:UserLocation = { lat:22.5726, lng:88.3639, label:'Kolkata, West Bengal', source:'city' }

type State = {
  location:UserLocation
  language:string|null; selectedMovieId:string|null; snacks:Record<string,number>
  seats:string[]; seatsShowId:string|null; holdExpiresAt:number|null      // seats picked for ONE show; held for 8 minutes from the first pick
  selectedShow:Show|null; selectedTheatre:TheatreWithDistance|null   // set when a showtime chip is clicked (needed for OSM theatres, which are not in static data)
  tickets:Ticket[]; perfMode:'high'|'low'
  setLocation:(l:UserLocation)=>void; resetLocation:()=>void
  setLanguage:(l:string|null)=>void; addTicket:(t:Ticket)=>void
  selectShow:(show:Show, theatre:TheatreWithDistance)=>void
  pickSeat:(id:string, sold:ReadonlySet<string>)=>SelectionError|undefined
  resetSeatsFor:(showId:string)=>void; clearSeats:()=>void
}
export const useBooking = create<State>()(persist((set,get)=>({
  location:DEFAULT_LOCATION, language:null, selectedMovieId:null, snacks:{}, seats:[], seatsShowId:null, holdExpiresAt:null,
  selectedShow:null, selectedTheatre:null, tickets:[], perfMode:'high',
  setLocation:(location)=>set({location}), resetLocation:()=>set({location:DEFAULT_LOCATION}),
  setLanguage:(language)=>set({language}),
  addTicket:(t)=>set((s)=>({tickets:[t,...s.tickets]})),
  selectShow:(selectedShow, selectedTheatre)=>set({selectedShow, selectedTheatre}),
  pickSeat:(id, sold)=>{
    const r = toggleSeat(get().seats, id, sold); if (r.error) return r.error
    set(s=>({ seats:r.seats, holdExpiresAt: r.seats.length===0 ? null : (s.holdExpiresAt ?? Date.now()+HOLD_MS) }))
  },
  resetSeatsFor:(showId)=>set({ seats:[], seatsShowId:showId, holdExpiresAt:null }),
  clearSeats:()=>set({ seats:[], holdExpiresAt:null }),
}),{ name:'cinehall-store', version:2,
  partialize:(s)=>({ tickets:s.tickets, location:s.location, selectedShow:s.selectedShow, selectedTheatre:s.selectedTheatre }),
  migrate:(old:any)=>({ tickets:old?.tickets ?? [], location:DEFAULT_LOCATION, selectedShow:null, selectedTheatre:null }) as any }))
