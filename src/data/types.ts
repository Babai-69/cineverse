export type Language = 'Tamil'|'Telugu'|'Kannada'|'Malayalam'|'Hindi'|'English'
export type Format = '2D'|'IMAX'|'4DX'
export type Movie = { id:string; title:string; language:Language; genres:string[]; runtime:number; certificate:'U'|'UA'|'A'; rating:number; poster:string; backdrop:string; trailerId:string; formats:Format[]; cast:string[]; synopsis:string; releaseDate:string; dominantColor:string; nowShowing:boolean }
export type LatLng = { lat:number; lng:number }
export type Theatre = {
  id:string; name:string; city:string; lat:number; lng:number; formats:Format[]; hallId:string
  source:'curated'|'osm'                       // curated = your CSV database, osm = live OpenStreetMap lookup
  precision:'exact'|'city'|'osm'               // how trustworthy lat/lng is ('city' = city centre only, shown as ≈)
  chain?:string; venueType?:string; area?:string; address?:string; pin?:string; district?:string; state?:string; screens?:number|null
}
export type TheatreWithDistance = Theatre & { distanceKm:number }
export type UserLocation = LatLng & { label:string; source:'city'|'gps'|'search' }
export type Snack = { id:string; name:string; category:'Combos'|'Popcorn'|'Drinks'|'Bites'; price:number; veg:boolean; image:string }
export type Ticket = { id:string; movieId:string; theatreId:string; startsAt:string; seats:string[]; total:number }
export type Show = { id:string; movieId:string; theatreId:string; date:string; time:string; startsAt:string; format:Format; capacity:number; soldCount:number; fillRatio:number; priceFrom:number; seed:number }
export type TheatreShows = { theatre:TheatreWithDistance; shows:Show[] }
