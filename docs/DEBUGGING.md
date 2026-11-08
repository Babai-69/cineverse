# DEBUGGING & CODE MAP — CineHall

## Commands
| Command | What it tells you |
|---------|-------------------|
| `npm run dev` | Run locally (http://localhost:5173) |
| `npm run build` | Type-checks (tsc) + production build. Run before every commit |
| `npm test` | Render tests: clicks through Movies filters, Movie page, theatre board |
| `npm run check` | Fast rule checks on the showtimes engine (determinism, gaps, formats) |
| `npm run data:build` | Rebuilds `src/data/cinemas.generated.ts` from the CSV (also runs before `npm run build`) |
| `npm run smoke` | REAL-browser check of the 3D hall (needs `npm i -D puppeteer-core`, `npm run dev` running, and `CHROME_PATH`) — catches blank canvases that unit tests cannot |
| `npm run geocode` | Finds exact coordinates for cinemas (your computer, internet needed) — see `docs/DATA.md` |

## Turn on debug logs
Open any page with `?debug=1` (remembered). Console shows lines like
`[cinehall:shows] getShows {movieId:'m1', city:'Chennai', dateISO:'2026-11-07', theatres:4, shows:20}`.
Turn off with `?debug=0`. Add logs anywhere: `const log = createLogger('seats'); log('picked', seatId)`.

## Where things live
```
src/data/      types.ts (all types) · movies.ts · theatres.ts · snacks.ts   <- DEMO DATA ONLY
src/lib/       rng.ts · shows.ts (showtimes) · availability.ts (colours, smart pick) · geo.ts (GPS, place search, OSM cinemas) · distance.ts · theatres.ts · debug.ts
src/hooks/     useNearbyTheatres.ts (location -> theatres) · useNow.ts
src/three/     HallScene.tsx (the 3D hall) · HallCanvas.tsx (canvas, camera) · seatGeometry.ts · webgl.ts · SafeBoundary.tsx
src/lib/       + hall.ts (layout, sold seats, camera clamp) · pricing.ts · selection.ts · locations.ts · formats.ts
data/          the cinema CSV + city centres (source of truth, see docs/DATA.md)
src/store/     booking.ts  (Zustand; only city + tickets are saved to localStorage)
src/pages/     one file per route (Home, Movies, Movie, Placeholder for future days)
src/components Header, Footer, MovieCard, Chip, TheatreBoard, ErrorBoundary
tests/         day2.test.tsx (UI behaviour)      scripts/check-shows.ts (engine rules)
```

## "It looks wrong" — quick triage
| Symptom | Look at |
|---------|---------|
| Same movie shows different times after refresh | `getShows` must use only `movieId|city|dateISO` + rng; never `Math.random()` or current time |
| Wrong/no showtimes | `?debug=1`, check `theatres` count; theatre `city` must equal the selected city string exactly |
| Format chip missing a format | `Movie.formats` in `data/movies.ts` (movie) and `Theatre.formats` in `data/theatres.ts` (theatre); a show needs a format both support |
| Page goes blank | `ErrorBoundary` shows "Something went wrong"; real error + component stack are in the console under `[cinehall:error]` |
| City/tickets forgotten | localStorage key `cinehall-store` (clear it to reset) |
| Showtime link opens placeholder | Expected until Day 4 (3D seat picker) — it should list the chosen theatre/time |
| No cinemas for my place | `?debug=1`: look for `[cinehall:geo] cinemas found {raw, kept}`. raw=0 means OpenStreetMap has none within the radius → widen radius / search a bigger town. A `network` error = blocked/offline Overpass or rate limit |
| GPS button does nothing / error | Browser must allow location for the site and the page must be https (localhost is fine). Error text shows the reason |
| 3D area blank but row letters visible | The canvas is not drawing. Never use `useFrame(fn, <positive number>)` (it disables auto-render). Run `npm run smoke`; check the console for WebGL/shader errors |
| Trailer not playing on the screen | `?debug=1` → `[cinehall:trailer]`. Autoplay blocked → "Tap to play trailer". File/codec problem → "Trailer video could not load" (use MP4 H.264 + WebM VP9). See `docs/TRAILERS.md` |
| Seat picker blank / wrong | `?debug=1` logs `[cinehall:seats] pick C5 ok`. No WebGL or a 3D crash → automatic 2D map (explained on the page). Real scene: `tests/scene.test.tsx` |
| Seat colour wrong in 3D | `seatColor()` in `three/HallScene.tsx`; 2D map colours in `components/SeatMap2D.tsx` |
| Seat sold unexpectedly | `soldSeatIds` in `lib/hall.ts` (deterministic from `show.seed`, exactly `show.soldCount` seats) |
| Camera inside a wall | `clampToHall` in `lib/hall.ts` (has a fuzz test); tune HALL_DIMS |
| A cinema is missing / wrong place | Edit the CSV → `npm run data:build`; exact position → `npm run geocode` |
| Wrong colour on a chip | One source of truth: `levelOf` in `lib/availability.ts` |
| Location sticks after a test | Clear localStorage key `cinehall-store` |

## ID formats (parse with split)
Show id: `<movieId>_<theatreId>_<YYYY-MM-DD>_<HHMM>` e.g. `m1_che-1_2026-11-07_1830` or `m1_osm-node-123_2026-11-07_1830` (theatre ids never contain `_`)

## Conventions (keep the code easy to read)
- One responsibility per file; pages compose components, components don't fetch data themselves.
- Logic that must be predictable (shows, pricing, best seats) lives in `src/lib` as pure functions with tests.
- Comment the *why*, not the what. Every `lib` file starts with a one-line purpose comment.
- No `Math.random()` for demo data — use `mulberry32(hashString(...))`.
- Add a test or a `check` assertion with every new rule.
