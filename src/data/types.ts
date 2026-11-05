export type Language = 'Tamil'|'Telugu'|'Kannada'|'Malayalam'|'Hindi'|'English'
export type Format = '2D'|'IMAX'|'4DX'
export type Movie = { id:string; title:string; language:Language; genres:string[]; runtime:number; certificate:'U'|'UA'|'A'; rating:number; poster:string; backdrop:string; trailerId:string; cast:string[]; synopsis:string; releaseDate:string; dominantColor:string; nowShowing:boolean }
export type Theatre = { id:string; name:string; city:string; distanceKm:number; formats:Format[]; hallId:string }
export type Snack = { id:string; name:string; category:'Combos'|'Popcorn'|'Drinks'|'Bites'; price:number; veg:boolean; image:string }
export type Ticket = { id:string; movieId:string; theatreId:string; startsAt:string; seats:string[]; total:number }
