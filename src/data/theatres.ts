import type { Format, Theatre } from './types'
import { RAW_CINEMAS, CITY_CENTERS } from './cinemas.generated'
import { formatsFor, isFormat } from '../lib/formats'
/** Cinemas from data/indian_cinema_database.csv (edit the CSV, then `npm run data:build`). */
export const theatres: Theatre[] = RAW_CINEMAS.map(c=>{
  const given = c.formats?.filter(isFormat) as Format[]|undefined
  return { id:c.id, name:c.name, city:c.city, lat:c.lat, lng:c.lng, formats: given?.length ? given : formatsFor(c.id, c.venueType, c.chain),
    hallId:'hall-main', source:'curated', precision:c.precision, chain:c.chain, venueType:c.venueType, area:c.area, address:c.address,
    pin:c.pin, district:c.district, state:c.state, screens:c.screens }
})
export const cityCenters = CITY_CENTERS
export const cities = cityCenters.map(c=>c.name)
