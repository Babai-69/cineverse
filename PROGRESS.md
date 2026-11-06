# CineHall — Daily Progress Log
Upload this file (or the repo) at the start of each new chat so work continues from here.

## Roadmap (one day = one session)
| Day | Scope | Status |
|-----|-------|--------|
| 1 | R0 skeleton: Vite+React+TS, Tailwind tokens, routes, Zustand, dummy data, header/footer | ✅ Done |
| 2 | Movies filters, Movie page layout, seeded RNG + showtimes engine, theatre board | ✅ Done |
| 3 | Timeline showtimes, date strip, format filters, smart pick | ⬜ |
| 4 | 3D hall v1: floor, walls, screen, instanced seats, selection | ⬜ |
| 5 | Camera presets, clamp, view-from-seat, auto tour, Best seats | ⬜ |
| 6 | Panorama 3D hero | ⬜ |
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

## Next (Day 3)
Colour-coded timeline chips by availability (green >50% free, amber 20–50%, red <20%), "✦ Smart pick" badge (distance + availability + format), hold/past-show handling for today, polish of the theatre board.
