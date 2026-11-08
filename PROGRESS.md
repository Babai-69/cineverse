# CineHall — Daily Progress Log
Upload this file (or the repo) at the start of each new chat so work continues from here.

## Roadmap (one day = one session)
| Day | Scope | Status |
|-----|-------|--------|
| 1 | R0 skeleton: Vite+React+TS, Tailwind tokens, routes, Zustand, dummy data, header/footer | ✅ Done |
| 2 | Movies filters, Movie page layout, seeded RNG + showtimes engine, theatre board | ✅ Done |
| 3 | Timeline showtimes, date strip, format filters, smart pick (+ location: GPS / place search / nearest cinemas) | ✅ Done |
| 3b | Real cinema database (your CSV, 228 venues) replaces the fictional theatres; city/state/PIN search; live-OSM merge | ✅ Done |
| 4 | 3D hall v1: floor, walls, screen, instanced seats, selection | ✅ Done (first version had a blank-canvas bug — fixed and verified in a real browser, see Day 4 fix) |
| 5 | Camera presets, clamp, view-from-seat, auto tour, Best seats | ⬜ |
| 6 | Panorama 3D hero (entry page — match the reference screenshot; rename to Cineverse) | ⬜ |
| 7 | Trailer-first movie page, Lenis + GSAP | ⬜ |
| 8 | Snacks, review, mock pay, QR ticket, My tickets | ⬜ |
| 9 | Polish, accessibility, 2D fallback | ⬜ |
| 10 | Mobile performance, QA checklist, deploy | ⬜ |

## Day 1 — done
- Vite + React 18 + TypeScript, Tailwind 3 with design tokens (tokens.css)
- Routes for all pages (placeholders for later days)
- Zustand store (city + tickets persisted)
- Dummy data: 12 fictional movies, 5 cities × 4 theatres, 10 snacks (placeholder images via picsum)
- Header (city selector, My tickets), footer with demo disclaimer, MovieCard, Home + Movies grid
- `npm run build` passes (JS 59 KB gzip)

## Day 2 — done
- Movies page: Now showing / Coming soon tabs, language + genre + format chips, search, sort (popular/newest/top rated), empty state with "Clear filters"
- Movie page (`/movie/:id`): backdrop (trailer placeholder), poster, certificate, runtime, rating, synopsis, cast, "Book tickets" anchor; "Movie not found" state; coming-soon movies show a release notice instead of showtimes
- `src/lib/rng.ts` (FNV-1a hash + mulberry32) and `src/lib/shows.ts` `getShows(movieId, city, dateISO)`: deterministic, 4–6 slots per theatre, ≥ 2h45m apart, within 09:00–23:30, format limited to what the theatre supports, fill ratio by time of day, price from by format (+10% weekends), theatres sorted by distance
- `TheatreBoard`: 7-day date strip, format filter, theatre cards with showtime chips linking to `/book/:showId/seats`
- `npm run check` (scripts/check-shows.ts) — 8 determinism/rule checks pass; `npm run build` passes (JS 63 KB gzip)

### Day 2 hardening pass (verification + debuggability)
- Format filter is now **real**: each movie has `formats`; the Movies filter, the Movie page format chips and `getShows(..., movieFormats)` all respect it
- `npm test`: 11 render tests (vitest + jsdom) click through Movies tab/language/format/search, Movie page, date strip, coming-soon and not-found — all pass
- `src/lib/debug.ts` scoped logger (`?debug=1`), `ErrorBoundary` around routes, router v7 future flags (no console warnings)
- `docs/DEBUGGING.md`: commands, code map, symptom → file triage table, conventions
- Still NOT verified: real browser/phone look and feel (no browser available when built). Check Movie page + Movies page at 375 px and 1920 px.

### Notes / known limits
- Spec says 4–7 slots, but 7 slots cannot fit with a 2h45m gap in 09:00–23:30, so max is 6.
- Show ids look like `m1_che-1_2026-11-07_1830` (split on `_`). `soldCount` only for now; real sold seat ids come with the hall layout on Day 4.
- Not yet checked in a real browser or on a phone — please test and report anything off.

### Workflow scripts (added after Day 2)
- `node scripts/sync.mjs <unzipped cinehall folder>` copies a new daily zip into the repo (keeps .git/node_modules)
- `npm run ship -- "Day N: message"` runs build + tests + checks, then commits and pushes (stops if anything fails)

## Day 3 — done
**Timeline showtimes + Smart pick**
- `ShowChip`: colour by seats left — green >50% free, amber 20–50%, red <20% — plus a text label (colour-blind safe); shows that already started today are greyed/struck-through and not clickable (`useNow` refreshes every minute)
- Mini 09:00–23:30 timeline bar under each theatre (dots use the same `levelOf` colours)
- `lib/availability.ts`: `levelOf`, `hasStarted`, `smartPick` (45% distance, 40% seats left in best upcoming show, 15% premium format; ties → nearer). Badges: "✦ Smart pick" (with reasons) and "Nearest"
- Clicking a chip saves the show + theatre in the store (`selectedShow/selectedTheatre`) → `SeatsStub` displays them (Day 4 reads the same)
- Bug found by tests and fixed: 80%-full shows were classed "almost full" because of float rounding (0.19999…)

**Location (new feature)**
- Header `LocationPicker`: (1) "Use my current location" — browser permission prompt only after the click; (2) search any place (Mumbai, Durgapur, area, pincode) via OpenStreetMap Nominatim; (3) demo cities; "Clear my location"
- GPS or search → REAL cinemas near that point from OpenStreetMap (Overpass `amenity=cinema`), nearest first, radius 10/25/50 km. Cinema NAMES/LOCATIONS are real; showtimes, prices, availability and screen formats are demo (formats derived from the id)
- If the live lookup fails: near a demo city → demo theatres + notice; elsewhere → clear error with "Try again"
- Friendly messages for permission denied / unavailable / timeout / unsupported / non-https
- `lib/geo.ts`, `lib/distance.ts`, `lib/theatres.ts`, `hooks/useNearbyTheatres.ts`; OSM attribution in the footer
- **Shows are now seeded per theatre** (`movie|theatreId|date`) so a theatre's times don't change when the nearby list changes. Old `getShows(movie, city, …)` replaced by `getShowsForTheatres(movie, theatres, date, formats)`
- Location (label + coordinates) is saved only in this browser's localStorage (key `cinehall-store`); store version bumped to 2 (old saved data is migrated safely)
- Removed a stray folder literally named `src/{data,lib,store,pages,components,styles}` (from an early mkdir mistake) — delete it from your repo too if it exists

**Verification:** `npm test` 43 tests (engine, geo parsing/errors with mocked network, GPS success/denied, search, fallback, UI flows); `npm run check` 9 rules; `npm run build` passes.
**NOT verified (no browser / internet APIs from my environment):** real GPS prompt, live Nominatim + Overpass calls (CORS, rate limits, coverage of small towns — OSM may list few or no cinemas in some places), visual look on phone and desktop.

## Day 3b — real cinema database (done)
- `data/indian_cinema_database.csv` (yours, unchanged) is the source of truth → `npm run data:build` → `src/data/cinemas.generated.ts` (validated: unique ids, required fields, PIN format, city centres). Fictional theatres are gone everywhere.
- All 38 cities have centre coordinates (`data/city-centers.json`); venues show "In Durgapur" / "≈ N km" until exact coordinates exist → `npm run geocode` (run on your computer) fills `data/cinema-coordinates.csv`. See `docs/DATA.md`.
- Location picker: type a city, state or PIN code → instant offline results ("713103" → Bardhaman); popular cities (West Bengal first); GPS/search merge database + live OpenStreetMap cinemas (`mergeVenues`)
- Default location is now Kolkata, West Bengal. Venue cards show area, city, screens (when known), chain venues get demo formats.
- Verified against live ticketing listings during this work: Durgapur, Asansol, Bardhaman, Siliguri and Kolkata venues in your CSV match.

## Day 4 — 3D seat picker (done in code; visual check pending)
- `lib/hall.ts`: 280-seat layout = `CAPACITY` (Premium recliners A–B in couple pairs 16, Gold C–H 96, Silver J–N 90, Balcony P–R 78, wheelchair spaces J1/J18), metres-based positions, deterministic sold seats from `show.seed` (couples sell together), `clampToHall` camera safety
- `lib/pricing.ts` (category + format, weekend +10%, fee ₹30/ticket, GST 18% on fee; cheapest seat == `show.priceFrom`), `lib/selection.ts` (pairs, max 10, sold, 8-min hold helpers)
- `three/HallScene.tsx` real 3D hall: stepped floor, acoustic walls, ceiling baffles, balcony slab + rail, curved-free 16:9 screen with the movie backdrop (plain glow if the image fails), sconces, aisle lights, exit signs, seats as 2 InstancedMeshes (264 + 16, one draw call each), hover/selected/sold colours, tooltip, row letters
- `three/HallCanvas.tsx`: limited orbit controls + per-frame safety clamp, DPR cap on phones; `three/webgl.ts` detection
- `pages/Seats.tsx`: 3D hall ⇄ 2D map toggle sharing one selection, sidebar with live price + fee + GST + total, 8:00 hold timer (expiry clears seats), max-10 and sold-seat messages, mobile layout, no-WebGL / 3D-crash fallback to the 2D map, show rebuilt from the URL after refresh for database cinemas
- Three.js is lazy-loaded (separate 229 KB gzip chunk) — only the seat picker pays for it; main bundle 84 KB gzip
- Tests: 117 passing. `scene.test.tsx` renders the REAL scene graph with @react-three/test-renderer (counts, colours, click/hover/drag handling); `seats.test.tsx` covers selection, pairs, sold, max 10, expiry, countdown, show switching, 3D↔2D sync, crash fallback
- **NOT verified (no GPU/browser here):** how the hall actually looks (lighting, proportions, seat colours), 3D touch behaviour on a phone, real frame rate. Expect 1–2 rounds of visual tweaks — send a screenshot.
- Known limits: camera presets / from-my-seat / auto tour / Best seats = Day 5; the snacks route is still a placeholder (Day 8)

### Housekeeping
- Delete `src/pages/SeatsStub.tsx` from your repo (replaced by `pages/Seats.tsx`; sync does not delete files).
- `package.json` changed (three, @react-three/fiber, drei, test libs) → run `npm install` after syncing.

## Day 4 fix — blank 3D hall, single recliners, trailer on the screen (done, verified in a real browser)
**Why the hall was blank (your screenshot showed only row letters):** the camera safety clamp used `useFrame(..., 1)`. In react-three-fiber a POSITIVE priority switches off automatic rendering, so nothing was ever drawn (0 draw calls) — the row letters are normal page elements, so they still appeared. Fixed (priority 0). My earlier tests had no GPU, so they could not see it; I then got a real Chromium running here (software WebGL), reproduced your exact screenshot, fixed it and re-checked.
- Regression guards: `tests/render-loop.test.ts` (fails if any `useFrame` priority is positive — mutation-checked) and `npm run smoke` (`scripts/browser-smoke.mjs`: real Chrome, asserts the canvas draws, no shader errors, hover tooltip, click selects one seat, drag selects nothing). See `docs/DEBUGGING.md`.
- **Recliners are single seats now** (A–B): each one is bookable on its own; pairing logic and data removed. Sold seats = exactly `show.soldCount`.
- **Trailer plays on the 3D screen** (video texture) with Play/Pause, Mute, "Tap to play" if autoplay is blocked, plays only in 3D view. Placeholder clip for every movie until you add real files → `docs/TRAILERS.md`. Optional YouTube "Full trailer" popup via `trailerId`.
- Default camera moved to an overview above the main floor so the whole screen and rows A–J are visible; lighter walls/floor so the hall reads as a hall; balcony rail is translucent; backdrop image loads quietly (a failed image keeps a plain glow, never throws).
- Verified in real Chromium (desktop + 390 px phone): draws ~1000 calls/frame, hover tooltip "Row G · Seat 8 · Gold · ₹260 · Available", click selects exactly one seat, drag to orbit selects nothing, price panel math correct (Gold 260 + 2 recliners 900 + fee 90 + GST 16 = ₹1266), no console errors. `npm test` 128 passing, `npm run check` 9 rules, production build 84 KB main + 228 KB lazy 3D chunk.
- Still open: on a portrait phone the wide screen is slightly cropped (Day 10 mobile tuning); camera presets / from-my-seat / tour / Best seats = Day 5; software-rendered frame rate here says nothing about real phones.

## Next (Day 5)
Camera presets (Overview, From stage, Balcony, Bird's eye), "From my seat" view, auto tour, straight-line camera moves, ✦ Best N seats (quantity + category).
