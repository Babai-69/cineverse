# SPECIFICATIONS — CineHall

## 1. Information architecture / routes
`/` Home · `/movies` Now showing + Coming soon · `/movie/:id` Movie page · `/book/:showId/seats` 3D seat picker · `/book/:showId/snacks` · `/book/:showId/review` · `/book/:showId/pay` · `/ticket/:ticketId` · `/tickets` My tickets · `*` 404

## 2. Design system
**Mood:** dark cinematic luxury. **Tokens (CSS variables):**
- `--bg #07070b`, `--surface #101018`, `--surface-2 #181823`, `--border rgba(255,255,255,.08)`
- `--text #f4f1ea`, `--muted #9a98a6`
- `--accent #f5b942` (gold), `--accent-2 #ff3d5a` (red, CTA hover/alerts), `--glow rgba(245,185,66,.35)`
- Seat colours: available `#2a2f3d`, hover `#3d4660`, selected `#f5b942`, sold `#14141b` (dim), premium `#7c5cff`, recliner/couple `#e0457b`, wheelchair `#2dd4bf`
**Type:** Bebas Neue (H1/H2, uppercase, letter-spacing .04em), Inter (body 16 px/1.6), JetBrains Mono (ticket IDs, times).
**Radius:** 14 px cards, 999 px pills. **Spacing:** 4-pt scale. **Shadows:** soft glow, never harsh.
**Breakpoints:** 375 / 768 / 1280 / 1920 (Full HD layout max-width 1680 px content).
**Motion:** ease `cubic-bezier(.22,1,.36,1)`, 300–700 ms; respect `prefers-reduced-motion`.

## 3. Pages

### 3.1 Home
1. Sticky glass header: logo, city selector, search, language chips, "My tickets".
2. **Panorama hero (3D):** 7 featured movies on a curved ring (radius ≈ 6, each plane 16:9 backdrop with poster-title overlay). Behaviour per pseudo-code: drag velocity + friction, snap to nearest, auto-advance every 5.2 s with progress bar, front screen scale 1.15 + emissive glow, side screens darkened by angle, background sky gradient = blurred dominant colour of front poster, click side → rotate to front, click front → movie page. Overlay: title, genre, rating, "Book tickets" button. Mobile: fewer screens visible (5), DPR cap, no bloom.
3. Now showing carousel/grid (poster 2:3, rating badge, language tag, hover tilt on desktop).
4. Coming soon row with "Notify me".
5. Offers marquee, FAQ, footer (credits + demo disclaimer).

### 3.2 Movies
Filters: language, genre, format (2D/IMAX/4DX), sort (popular/new/rating). Grid 2 cols (mobile) → 6 cols (1920).

### 3.3 Movie page (trailer-first)
- Full-viewport YouTube trailer (muted autoplay, unmute/pause buttons, poster fallback). On scroll the trailer fades/parallax-pins.
- Details: synopsis, runtime, certificate, cast, languages.
- **Theatre board:** date strip (7 days), format filters, theatres listed by distance with "✦ Smart pick" badge (best combo of distance + seat availability + format). Each theatre has a **timeline** of showtimes; chip colour = availability (green >50 %, amber 20–50 %, red <20 %), format badge, price from.

### 3.4 3D seat picker (core)
**Layout:** desktop = 3D canvas left (70 %) + booking sidebar right (30 %); mobile = canvas top (55 vh) + bottom sheet.
**Hall model (procedural, units in metres):**
- Hall 24 W × 32 L × 11 H. Floor stepped (tiered rows, 0.35 m rise per row), carpet texture.
- Screen: 16:9 plane, ~18 m wide, slight curve, black masking, emissive; plays trailer texture (VideoTexture) or poster still; fades to still when off-axis/far.
- Walls: acoustic panels (dark fabric), wall sconces (emissive strips), ceiling baffles, exit signs (green emissive), aisle step lights (emissive dots).
- Seats: InstancedMesh (back, cushion, armrests via merged geometry), ~280 seats. Categories: Premium recliner (rows A–B, couple pairs), Gold (C–H), Silver (J–N), Balcony (rows P–R on raised slab).
- Lighting: dim ambient + screen spill light (RectAreaLight/emissive approximation) + baked-looking AO via vertex colours; no real-time shadows on mobile.
**Seat states:** available, hover, selected, sold, locked-by-me (timer), wheelchair. Row letters and seat numbers via SDF text/sprites, visible when camera is near.
**Interactions:** tap/click seat toggles; long-press/hover shows tooltip (Row, seat, category, price); drag to orbit (limited), pinch/scroll to zoom (limited); keyboard: arrows move focus, Enter select.
**Camera presets (buttons):** Overview, From stage, Balcony, Bird's eye, **From my seat** (eye height = seat + 1.1 m looking at screen centre), **Auto tour** (loops presets, any touch cancels).
**Camera safety:** every frame clamp position to `x∈[-wallX+0.6, wallX-0.6]`, `y∈[floorAt(x,z)+0.9, ceilingY-0.6]`, `z∈[backWallZ-0.6, screenZ+1.5]`, above balcony slab when over it; interpolate on a straight line (lerp), not curved; max speed limited.
**Best seats:** button "✦ Best 2 seats" with quantity stepper 1–10 + category selector, algorithm below.
**Sidebar:** movie, theatre, date/time, format, selected seats list, category price, convenience fee (₹30/ticket), total, "Continue to snacks". Hold timer 8:00.

### 3.5 Snacks
Categories (Combos, Popcorn, Drinks, Bites). Cards with photo, veg/non-veg dot, price, +/- stepper. Live cart drawer with subtotal; "Skip".

### 3.6 Review & payment (mock)
Summary card, offer code field (`CINE10` = 10 % off, demo), contact (name, email/phone with validation), payment tabs: UPI / Card / Wallet (fake forms, "Demo" ribbon). Pay button → 1.5 s processing animation → success.

### 3.7 Ticket
Boarding-pass style card: poster strip, movie, theatre, screen, date/time, seats, format, snacks, total, ticket ID, **QR**, "Add to My tickets" (auto), download PNG, share. Tear-off notch design, subtle holographic sheen.

### 3.8 My tickets
List upcoming / past, from localStorage; empty state with CTA.

## 4. Algorithms

**Best seats**
```
BEST_SEATS(qty, sold, category):
  for row in hall.rows:
    if category && row.category != category: continue
    for window of qty adjacent seats in row:
      if any sold: continue
      if crosses aisle: continue
      if splits couple recliner pair: continue
      score = distFromCentre(window)*1.2 + distFromSweetSpotRow(row)*(row.balcony?0.7:1)
      keep min score
  return best (or "no contiguous seats; show nearest split option")
```
Sweet spot row ≈ 60 % of the way back from the screen.

**Seeded shows**
```
seed = hash(movieId + city + dateISO)
rng = mulberry32(seed)
for theatre in cityTheatres:
  formats = pick from theatre.formats via rng
  times = 4–7 slots between 09:00 and 23:30, spaced ≥ 2h45m
  fillRatio = base(timeOfDay: matinee .25, evening .6, prime .85) + rng*.15
  soldSeats = deterministic subset (seed + showId) of size fillRatio*capacity
sort theatres by distance
```

**Price (INR, demo):** Silver 180, Gold 260, Premium recliner 450, Balcony 220; IMAX +120, 4DX +200; weekend +10 %; fee ₹30/ticket; GST 18 % on fee shown.

**Ticket ID:** `CV-` + YYMMDD + `-` + 6 base32 chars. QR payload JSON: `{id, movie, theatre, time, seats, total}`.

## 5. State (Zustand)
`city, language, selectedMovie, selectedShow, seats[], snacks{}, offer, holdExpiresAt, contact, tickets[] (persisted), perfMode ('high'|'low')`

## 6. Data schemas (TypeScript)
```ts
type Movie = {id:string; title:string; language:'Tamil'|'Telugu'|'Kannada'|'Malayalam'|'Hindi'|'English'; genres:string[]; runtime:number; certificate:'U'|'UA'|'A'; rating:number; poster:string; backdrop:string; trailerId:string; cast:string[]; synopsis:string; releaseDate:string; dominantColor:string};
type Theatre = {id:string; name:string; city:string; distanceKm:number; formats:('2D'|'IMAX'|'4DX')[]; hallId:string};
type Show = {id:string; movieId:string; theatreId:string; startsAt:string; format:string; soldSeatIds:string[]; priceFrom:number};
type SeatDef = {id:string; row:string; number:number; category:'Silver'|'Gold'|'Premium'|'Balcony'; pos:[number,number,number]; coupleWith?:string; accessible?:boolean};
```

## 7. Components (suggested file structure)
```
src/
  data/ movies.ts theatres.ts halls.ts snacks.ts
  lib/ rng.ts shows.ts bestSeats.ts pricing.ts ticket.ts
  store/ booking.ts
  three/ PanoramaHero.tsx Hall.tsx Seats.tsx Screen.tsx CameraRig.tsx CameraPresets.ts
  pages/ Home Movies Movie Seats Snacks Review Ticket MyTickets
  components/ Header Footer MovieCard ShowTimeline SeatSidebar SnackCard TicketCard QRCode Skeleton
  styles/ tokens.css
```

## 8. Realism checklist (Full HD)
- Render canvas at device pixel ratio up to 2 on desktop, antialias on, tone mapping ACESFilmic, sRGB output.
- Materials: PBR (roughness .6–.9), seat fabric normal map, carpet pattern texture, subtle screen bloom.
- Aspect-correct 16:9 screen; hall proportions realistic (rows 1.0 m deep, seat width 0.55 m, aisle 1.1 m).
- Details: aisle lights, exit signs, wall sconces, projection beam dust (low-opacity cone, desktop only).

## 9. Accessibility
Focus rings, aria-labels on seats, 2D seat-map toggle (also fallback when WebGL fails), colour-blind-safe icons on states, reduced-motion disables auto tour/auto-rotate, contrast ≥ 4.5:1.

## 10. Error/empty states
No shows, sold out, seat taken during hold ("Someone just booked that seat" → reselect), hold expired, WebGL unsupported, offline.

## 11. Performance rules
Lazy-load `three/*` routes, preload next route's assets on hover, `Suspense` skeletons, `useGLTF.preload` if GLB, dispose geometries/materials on unmount, throttle pointer raycasts (only on pointer move end), pause render when tab hidden.

## 12. QA checklist (must pass)
- [ ] Hero ring: drag, snap, auto-advance 5.2 s, tap flow
- [ ] Camera never exits hall in any preset or drag
- [ ] View-from-seat works for every seat
- [ ] Best seats respects sold/aisle/couple rules
- [ ] Same movie+city+day gives same shows after refresh
- [ ] Full flow to QR ticket, persists in My tickets
- [ ] iPhone Safari + Android Chrome: no crash, ≥30 fps, touch orbit doesn't scroll page
- [ ] 1920×1080 looks crisp; 375 px has no horizontal scroll
- [ ] Lighthouse mobile ≥ 80, no console errors
- [ ] Credits + demo disclaimers present
