# CineHall — Daily Progress Log
Upload this file (or the repo) at the start of each new chat so work continues from here.

## Roadmap (one day = one session)
| Day | Scope | Status |
|-----|-------|--------|
| 1 | R0 skeleton: Vite+React+TS, Tailwind tokens, routes, Zustand, dummy data, header/footer | ✅ Done |
| 2 | Movies filters, Movie page layout, seeded RNG + showtimes engine, theatre board | ⬜ |
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

## Next (Day 2)
Movie filters, Movie page layout, `lib/rng.ts` + `lib/shows.ts`, theatre board.
