# PROMPTS — Paste into Google AI Studio (Build mode), one at a time

## MASTER PROMPT (paste first)
```
You are a senior creative front-end engineer. Build "CineHall", a premium, realistic, Full-HD (1920x1080) 3D cinema ticket booking website as a React + TypeScript + Vite app, with Tailwind CSS, three + @react-three/fiber + @react-three/drei, GSAP, Lenis, Zustand, react-router-dom, qrcode, lucide-react.

Style: dark cinematic luxury, deep black (#07070b) with warm gold (#f5b942) accents, glowing screens, restrained smooth motion. Fonts: Bebas Neue (headings), Inter (body), JetBrains Mono (ticket). Mood: like entering a real theatre.

Core experience: (1) 3D panorama hero: a curved ring of cinema screens you can drag/swipe/tap; (2) trailer-first movie pages with a theatre board and timeline showtimes; (3) a real-time 3D cinema hall seat picker with camera presets (Overview, From stage, Balcony, Bird's eye), "From my seat" view and an auto tour; (4) a complete flow: seats -> snacks -> review -> mock pay -> QR ticket saved in "My tickets".

All data is dummy (Tamil, Telugu, Kannada, Malayalam, Hindi, English movies; fictional posters; Indian cities; INR). Mark payment as "Demo". Must work on iPhone Safari and Android: cap DPR at 1.5 on mobile, disable bloom/shadows on small screens, keep it fast. Add a 2D seat-map fallback if WebGL fails.

IMPORTANT RULES: Do NOT build everything at once. I will give you rounds. After each round, summarise what exists and wait. Keep code modular (src/data, src/lib, src/store, src/three, src/pages, src/components). No real payments, no real studio posters. Follow this spec strictly: [paste specifications.md], [paste prd.md §5-6], [paste tech.md §2,5].
```

## ROUND 0 — Skeleton
```
Create the project skeleton: routes (/, /movies, /movie/:id, /book/:showId/seats|snacks|review|pay, /ticket/:ticketId, /tickets), Tailwind design tokens in tokens.css (colors, fonts, radius, motion), glass sticky header (logo, city selector, search, My tickets), footer with credits/demo disclaimer, Zustand store (booking + persisted tickets), and dummy data: 12 movies (fictional titles, languages, trailerId placeholders, generated poster/backdrop image URLs via placeholder service until I upload assets), 5 cities x 4 theatres, 10 snacks. Pages render placeholders only. No animation.
```

## ROUND 1 — Structure
```
Build Home (static hero placeholder for now), Movies page with filters (language, genre, format, sort) and responsive poster grid (2 cols on 375px up to 6 cols on 1920px), and the Movie page layout (trailer area placeholder, details, cast, theatre board shell). Focus on spacing, grid, and typography hierarchy. No animation yet. Make it look premium at 375, 768 and 1920 widths.
```

## ROUND 2 — Showtimes
```
Implement src/lib/rng.ts (string hash + mulberry32), src/lib/shows.ts getShows(movie, city, day) deterministic as in the spec, 7-day date strip, format filters (2D/IMAX/4DX), theatre board sorted by distance, "Smart pick" badge, and horizontal timeline showtime chips coloured by availability with format badges and price-from. Same input must always give the same output. Add unit-style console checks.
```

## ROUND 3 — 3D hall + seats
```
Build the 3D seat picker page. Procedural hall (24W x 32L x 11H m): stepped tiered floor, curved emissive 16:9 screen with black masking, acoustic wall panels, ceiling baffles, wall sconces, aisle step lights, green exit signs, a raised balcony with its own rows. Seats via InstancedMesh (~280 seats) with categories Premium recliners (couple pairs), Gold, Silver, Balcony. Seat states: available, hover, selected, sold, wheelchair. Click/tap to select, tooltip with row/seat/price, max 10 seats, live price total in a sidebar (desktop) / bottom sheet (mobile) with convenience fee and an 8-minute hold timer. Use ACESFilmic tone mapping, PBR materials, soft lighting. Also add a 2D seat-map toggle that stays in sync.
```

## ROUND 4 — Camera + best seats
```
Add CameraRig with presets: Overview, From stage, Balcony, Bird's eye, From my seat (eye height seat+1.1m looking at screen centre), and an Auto tour (touch cancels). Move the camera along a STRAIGHT line to targets (no curved paths). Every frame clamp position inside the hall: inside walls minus 0.6m margin, below ceiling minus 0.6m, above floor/balcony slab plus 0.9m. Fade out the screen's video/still effects when the screen is far off-axis. Add "✦ Best N seats" (qty stepper + category) implementing the BEST_SEATS algorithm in the spec (skip sold seats, aisle crossings and split couple recliners; score = distFromCentre*1.2 + distFromSweetSpotRow, balcony weighted lower). Verify by dragging aggressively that the camera never leaves the hall.
```

## ROUND 5 — Motion
```
Replace the Home hero with the 3D panorama: 7 featured screens on a curved ring, drag velocity with friction, snap-to-nearest on release, auto-advance every 5.2s with a progress bar (pause on drag), front screen scaled and glowing, side screens darker by angle, background sky gradient from the front poster's dominant colour, click side -> rotate to front, click front -> open movie page. Mobile: 5 visible screens, DPR<=1.5, no bloom. Add trailer-first movie page: full-viewport YouTube trailer (muted autoplay with unmute button) that fades on scroll. Add Lenis smooth scroll (disabled inside canvases) and GSAP ScrollTrigger reveals. Keep animations subtle; respect prefers-reduced-motion.
```

## ROUND 6 — Snacks, pay, ticket
```
Build Snacks (categories, photo cards, veg dot, steppers, live cart drawer, skip), Review (summary, offer code CINE10 = 10%, contact validation), mock Payment (UPI/Card/Wallet tabs, "Demo - no real payment" ribbon, 1.5s processing), Ticket page (boarding-pass style card with poster strip, ticket ID CV-YYMMDD-XXXXXX, QR code of ticket JSON, download PNG, share) and My tickets (persisted in localStorage, upcoming/past, empty state). Handle: hold expired, seat taken, sold out.
```

## ROUND 7 — Polish and performance
```
Polish: button states, hover/focus, micro-interactions, contrast, skeleton loaders, 404, empty/error states. Performance: lazy-load 3D routes, WebP images with lazy loading, dispose Three resources on unmount, pause rendering when tab hidden, low-power mode for <768px or low-end devices (no shadows, no bloom, DPR 1.5, fewer lights). Accessibility: keyboard seat navigation, aria labels, 2D fallback if WebGL unavailable. Then run through the QA checklist in the spec and list anything failing.
```

## FIX PROMPT TEMPLATES
```
"On [device/browser], [what looks wrong]. I want [what should change] and the feeling should be [adjective]. Keep everything else unchanged."
```
```
"The camera goes through the wall when I [action]. Keep clamping inside the hall with a 0.6 m margin and move in a straight line."
```
```
"It's laggy on iPhone Safari. Reduce DPR to 1.5, remove bloom and shadows under 768px, merge static meshes, keep the design."
```

## IMAGE PROMPTS (Google AI Studio / Higgsfield)
- Poster: `cinematic movie poster, [genre], dramatic rim lighting, teal and amber grading, no text, 2:3, ultra detailed`
- Backdrop: `wide cinematic still, [scene], anamorphic, shallow depth of field, 16:9, 1920x1080, no text`
- Hall reference: `luxury cinema auditorium interior, tiered recliner seats, curved screen glowing, aisle step lights, dark acoustic walls, photorealistic, 16:9`
- Snacks: `studio food photography, [item], dark background, warm rim light, 1:1`
