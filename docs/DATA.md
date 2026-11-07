# Cinema database — how it works and how to update it

**Source of truth:** `data/indian_cinema_database.csv` (228 venues, 21 states, 38 cities). Everything else is generated.

```
data/indian_cinema_database.csv ─┐
data/city-centers.json ──────────┼─> npm run data:build ─> src/data/cinemas.generated.ts ─> website
data/cinema-coordinates.csv ─────┘      (validates, fails loudly on bad rows)
         ▲
         └── npm run geocode  (finds exact lat/lng per venue via OpenStreetMap; run on YOUR computer, needs internet)
```

## Add or fix a cinema
1. Open the CSV in Excel/Sheets. Keep columns: `Cinema_ID, Venue_Name, Chain, Type, Specific_Area, Full_Address, PIN_Code, City, District, State, Total_Screens`.
2. New row: next unused `Cinema_ID` (unique, any number), required: Venue_Name, City, District, State. PIN must be 6 digits.
3. New city? add it to `data/city-centers.json` (name must match the CSV exactly).
4. Optional column `Formats` (e.g. `2D|IMAX|4DX`) overrides the demo formats.
5. `npm run data:build` → read the summary line → `npm test` → `npm run ship -- "Data: …"`.

## Exact distances (do this once)
Right now every venue sits at its **city centre** (the site shows "In Durgapur" / "≈ 12 km away"). To get real positions:
```
npm run geocode                       # all venues, ~5–10 min, resumable (Ctrl+C is safe)
npm run geocode -- --city Durgapur    # just one city (good first test)
npm run data:build
```
It writes `data/cinema-coordinates.csv`. A result is accepted only if it is within 30 km of the city centre. Venues OpenStreetMap cannot find stay at city precision — the console lists them; you can paste their latitude/longitude into `data/cinema-coordinates.csv` by hand (columns `Cinema_ID,Latitude,Longitude,Source`; take the numbers from Google Maps → right-click → copy coordinates).

## What the site does with it
- Picking a city / typing a city, state or PIN → instant list from this database (offline).
- GPS or "search any place" → database venues in range **plus** live OpenStreetMap cinemas, merged: a live cinema that clearly matches a database venue gives it exact coordinates; unknown ones are added; ambiguous matches are never merged.
- Live lookup failing never empties the list — you still see the database venues.

## Known gaps / honesty
- Not in the CSV: Chennai, Thiruvananthapuram, Jaipur, Surat, Kanpur, Bhopal and most smaller towns (they appear only through the live lookup). Add rows + a city centre to cover them.
- `Total_Screens` is empty for 209 of 228 rows (shown only when present). Screen formats (IMAX/4DX), showtimes, prices and seat availability are **demo data** — there is no public cinema schedule feed.
- Cinemas open and close; re-verify before a public launch.
