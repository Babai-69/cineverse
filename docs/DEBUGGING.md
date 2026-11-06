# DEBUGGING & CODE MAP — CineHall

## Commands
| Command | What it tells you |
|---------|-------------------|
| `npm run dev` | Run locally (http://localhost:5173) |
| `npm run build` | Type-checks (tsc) + production build. Run before every commit |
| `npm test` | Render tests: clicks through Movies filters, Movie page, theatre board |
| `npm run check` | Fast rule checks on the showtimes engine (determinism, gaps, formats) |

## Turn on debug logs
Open any page with `?debug=1` (remembered). Console shows lines like
`[cinehall:shows] getShows {movieId:'m1', city:'Chennai', dateISO:'2026-11-07', theatres:4, shows:20}`.
Turn off with `?debug=0`. Add logs anywhere: `const log = createLogger('seats'); log('picked', seatId)`.

## Where things live
```
src/data/      types.ts (all types) · movies.ts · theatres.ts · snacks.ts   <- DEMO DATA ONLY
src/lib/       rng.ts (hash + seeded random) · shows.ts (showtimes engine) · debug.ts (logger)
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
| Showtime link opens placeholder | Expected until Day 4 (3D seat picker) |

## ID formats (parse with split)
Show id: `<movieId>_<theatreId>_<YYYY-MM-DD>_<HHMM>` e.g. `m1_che-1_2026-11-07_1830`

## Conventions (keep the code easy to read)
- One responsibility per file; pages compose components, components don't fetch data themselves.
- Logic that must be predictable (shows, pricing, best seats) lives in `src/lib` as pure functions with tests.
- Comment the *why*, not the what. Every `lib` file starts with a one-line purpose comment.
- No `Math.random()` for demo data — use `mulberry32(hashString(...))`.
- Add a test or a `check` assertion with every new rule.
