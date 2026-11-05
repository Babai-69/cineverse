# TECH — Technology choices

## 1. Platform decision: Google AI Studio
AI Studio **Build mode** generates and live-previews web apps (React + TypeScript on a Vite-style setup) and lets you export to GitHub / ZIP. It does **not** need Next.js; use **React + Vite**. (AI Studio features change often — verify current capabilities in the Build tab before starting.)
Answer: **Yes, you can build the front-end demo in AI Studio.** Real backend, real payments, and heavy 3D asset production happen outside it (see "Outside AI Studio").

## 2. Stack
| Layer | Choice | Why |
|-------|--------|-----|
| Framework | React 18 + TypeScript + Vite | Native to AI Studio Build |
| Routing | react-router-dom | Pages: Home, Movies, Movie, Seats, Snacks, Review, Ticket, My tickets |
| 3D | three + @react-three/fiber + @react-three/drei | Declarative 3D, easy camera/controls |
| Post-FX (desktop only) | @react-three/postprocessing (Bloom, subtle) | Cinematic glow; disabled on mobile |
| Motion | GSAP (+ ScrollTrigger), Motion (framer-motion) for UI | Scroll reveals, transitions |
| Smooth scroll | Lenis | Weighted scroll (disabled inside 3D canvas) |
| Styling | Tailwind CSS (CDN/config) + CSS variables | Design tokens, dark theme |
| State | Zustand (+ persist middleware) | Booking store, My tickets |
| QR | qrcode (npm) | Ticket QR as canvas/SVG |
| Icons | lucide-react | Consistent |
| Fonts | Google Fonts: "Bebas Neue" (display), "Inter" (body), "JetBrains Mono" (ticket) | |
| Hosting | Vercel / Netlify / Cloud Run (AI Studio deploy) | |

## 3. Visual / 3D asset pipeline (from the workflow)
| Step | Tool | Output |
|------|------|--------|
| Reference | Pinterest, MotionSites, Behance, Dribbble | Mood board, 5–8 refs |
| Posters, hero stills, food photos | Google AI Studio (Imagen / Gemini image) or Higgsfield | 1920×1080 + 2:3 posters, WebP |
| Short loops | Higgsfield / Kling AI | 3–6 s MP4/WebM loops (optional) |
| 3D seat/prop (optional) | Tripo AI → Blender → GLB | `seat.glb` (<300 KB) |
| Compression | meshopt/Draco (gltf-transform), EZGIF, Squoosh | Lightweight assets |
Default (zero external dependency): **procedural hall** built from boxes/extrusions, seats via `InstancedMesh`.
If using a CC-BY seat model (e.g. Sketchfab "Cinema Seat"), credit the author in the footer.

## 4. Data (demo)
- `movies.ts`: ~12 movies (title, language, genre, runtime, rating, poster, backdrop, trailerYouTubeId, cast, synopsis).
- `theatres.ts`: 4–6 theatres per city with distance, formats, hall layout id.
- `halls.ts`: layout definitions (rows, seats per row, aisles, categories, balcony, couple recliners).
- `shows.ts`: `getShows(movie, city, day)` with seeded RNG (mulberry32 + string hash).
- `snacks.ts`: 10–12 items with photo, price, veg flag.

## 5. Performance budget
- JS bundle (gzip): ≤ 450 KB initial route; lazy-load 3D routes.
- Images: WebP, posters ≤ 120 KB, hero ≤ 250 KB, `loading="lazy"`.
- 3D: DPR `[1, 1.5]` mobile, `[1, 2]` desktop; shadows off on mobile; ≤ 150 draw calls; instancing for seats (hall of 300 seats = 1–3 draw calls).
- Target 60 fps desktop, ≥ 30 fps phones. Use `frameloop="demand"` when idle.
- Pause trailer + 3D when tab hidden.

## 6. Compatibility
Chrome, Edge, Firefox, Safari 16+ (iOS 16+), Android Chrome. WebGL2 required; WebGL1/no-WebGL → 2D seat-map fallback.

## 7. Outside AI Studio (phase 2, optional)
| Need | Tool |
|------|------|
| Real DB (bookings, users) | Supabase (auth + Postgres) or Neon + API routes |
| Payments | Razorpay / Stripe (test mode) |
| Seat locking | Postgres row locks / Redis TTL |
| Enterprise logic | Spring Boot service |
Match backend to scope: v1 stays frontend-only with localStorage.

## 8. Security & legal
- No real card data ever; mock forms labelled "Demo — no real payment".
- Trailers via official YouTube embed API only; posters AI-generated/fictional or licensed.
- Credit CC-BY assets; add privacy note (localStorage only).
