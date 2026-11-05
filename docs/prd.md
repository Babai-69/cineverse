# PRD — "CineHall" (working title): Realistic Full-HD 3D Cinema Ticket Booking Website

Version 1.0 · Reference product: Cineverse showcase (alagappan567/cineverse-showcase) · Build target: Google AI Studio (Build mode)

## 1. Vision
A premium movie ticket booking website where the cinema hall is a real-time 3D space. The user sees the screen from their chosen seat before paying. It must feel cinematic (dark, glowing, smooth), run in Full HD (1920×1080) on desktop and stay fast on phones.

## 2. Goals
1. Make seat selection feel like walking into the theatre (3D hall, view-from-seat).
2. Complete booking in under 90 seconds: Movie → Theatre/Time → Seats → Snacks → Review → Pay → QR ticket.
3. Look premium: restrained, consistent type/colour, subtle motion.
4. Work smoothly on iPhone Safari and Android Chrome (30+ fps on mid-range phones).

## 3. Non-goals (v1)
- Real payments, real inventory, real user accounts (all demo/dummy, clearly labelled "Demo").
- Real movie posters/trailers hosted by us (use AI-generated or licensed placeholders; trailers via official YouTube embeds only).
- Native apps.

## 4. Users & personas
- **Casual moviegoer (mobile)**: wants fast "best seats", minimal taps.
- **Group planner (desktop)**: wants 4–8 seats together, compares theatres/formats.
- **Premium seeker**: IMAX / recliner / balcony, previews view before booking.

## 5. Core features (priority)
| ID | Feature | Priority |
|----|---------|----------|
| F1 | 3D panorama hero: ring of screens, drag/swipe/tap, auto-rotate every 5.2 s, click front screen → movie page | P0 |
| F2 | Now Showing / Coming Soon grid with language + genre + format filters | P0 |
| F3 | Movie page: full-screen trailer first, scroll to details, cast, theatre board, timeline showtimes | P0 |
| F4 | Showtimes engine (seeded, deterministic demo data), formats 2D/IMAX/4DX, fill-state colouring | P0 |
| F5 | 3D seat picker with real-time hall, seat states, price categories | P0 |
| F6 | Camera presets: Overview, From stage, Balcony, Bird's eye + auto tour + "view from my seat" | P0 |
| F7 | "✦ Best N seats" smart picker | P0 |
| F8 | Snacks step with food photos and live cart | P1 |
| F9 | Review + mock payment (UPI / card / wallet UI) with 8-min seat-hold timer | P0 |
| F10 | QR ticket (ticket ID + QR), saved under "My tickets" (localStorage), downloadable/shareable | P0 |
| F11 | Mobile-first responsive + low-power 3D fallback | P0 |
| F12 | City selector, language filter, search | P1 |
| F13 | Accessibility: keyboard seat nav, 2D fallback seat map, reduced-motion | P1 |

## 6. User stories & acceptance criteria
- **US-1** As a user I drag the hero ring and release; it snaps to the nearest screen. *AC:* snap < 400 ms, side screens darker by angle, front screen scaled up with glow, progress bar cycles every 5.2 s, pauses while dragging.
- **US-2** As a user I open a movie and the trailer plays full-screen (muted autoplay with unmute button), then scroll to details. *AC:* trailer fades out when scrolled away; no layout shift.
- **US-3** As a user I choose a theatre and time from a timeline. *AC:* same movie+city+day always yields identical shows; seats fill by time of day; theatres sorted by distance.
- **US-4** As a user I tap seats in the 3D hall. *AC:* tapped seat highlights within 100 ms; sold seats not selectable; max 10 seats; price total updates live.
- **US-5** As a user I tap "From my seat" and see the screen from that seat's eye height. *AC:* camera moves in a straight line, never leaves the hall.
- **US-6** As a user I tap "✦ Best 2 seats" and the best contiguous seats in the chosen category are selected. *AC:* never split by an aisle, never split a couple recliner, never include a sold seat.
- **US-7** As a user I pay (mock) and receive a QR ticket. *AC:* ticket ID format `CV-YYMMDD-XXXXXX`, QR encodes ticket JSON, ticket visible in My tickets after refresh.
- **US-8** As a mobile user the whole flow works with thumb reach and no jank. *AC:* Lighthouse mobile performance ≥ 80; 3D canvas DPR capped at 1.5.

## 7. Success metrics (demo)
- Time from Home → QR ticket ≤ 90 s.
- 3D hall interactive in ≤ 3 s on desktop, ≤ 5 s on mid phone (4G).
- Zero camera-through-wall bugs; zero console errors.

## 8. Risks & mitigations
| Risk | Mitigation |
|------|-----------|
| "Full HD realistic" assets heavy | Procedural geometry + InstancedMesh; compress textures (WebP/KTX2); optional GLB with meshopt/Draco |
| Copyright of posters/trailers | AI-generated fictional posters; YouTube official embeds only; mark demo data |
| Camera clipping | Clamp to hall bounds, straight-line interpolation |
| Mobile GPU limits | Low-power mode: no shadows, no post-processing, DPR ≤ 1.5, fewer lights |
| AI Studio limitations | Build in rounds (structure → motion → polish); keep files modular |

## 9. Assumptions
Currency INR; languages Tamil, Telugu, Kannada, Malayalam, Hindi, English; Indian cities (Chennai, Bengaluru, Hyderabad, Kochi, Mumbai).
