# WORKFLOW — Building CineHall with the Premium Website Workflow (adapted for Google AI Studio)

Rule: never ask AI to build everything in one prompt. One round = one prompt from `prompts.md`. Test each round before the next.

## Phase 01 — Collect references (30–45 min, before AI Studio)
1. Write your style in one sentence: *"Dark cinematic luxury cinema booking, deep black with warm gold/amber accents, glowing screens, smooth motion."*
2. Save 5–8 refs each: Pinterest (mood, cinema photography), MotionSites (hero motion), Behance (full booking-app systems), Dribbble (seat map, ticket card, buttons).
3. Study the Cineverse live demo (cineverse-blond-nine.vercel.app) on desktop + phone: note hero ring, seat colours, camera buttons, ticket layout.
4. Pick palette + fonts (see specifications.md §2). Screenshot your refs; you can upload them to AI Studio as visual direction.

## Phase 02 — Assemble the stack (one time)
- Open Google AI Studio → Build. Choose React/TypeScript.
- Add `prd.md`, `tech.md`, `specifications.md` content as the first message (or paste in System instructions). Keep files short enough for the model to follow.
- Planning: use Claude/Gemini to refine prompts; later export to GitHub and continue in Claude Code/VS Code if AI Studio hits limits.

## Phase 03 — Visuals, motion, 3D assets
1. **Posters/backdrops:** generate fictional posters (2:3) and backdrops (16:9, 1920×1080) with Imagen/Gemini or Higgsfield. Prompt template: *"cinematic movie poster, [genre], [mood], dramatic lighting, no text, 2:3, high detail"*. Name `poster-01.webp`… Never use real studio posters.
2. **Food photos:** popcorn, nachos, cola, samosa, combo — *"studio food photography, dark background, rim light, 1:1"*.
3. **Hero stills / loops (optional):** Higgsfield/Kling slow-zoom of an empty theatre, 4 s loop.
4. **3D (optional):** Tripo AI seat → Blender cleanup (named parts, <5k tris) → GLB → `gltf-transform meshopt`. Skip in v1 if time-boxed; procedural seats look good with correct materials.
5. **Compress:** WebP via Squoosh, loops via EZGIF, GLB via meshopt.
6. Upload assets in AI Studio's file panel or use generated image URLs; keep a `/public/assets` manifest.

## Phase 04 — Build in rounds (each round = test on desktop + phone)
| Round | Scope | Done when |
|-------|-------|-----------|
| R0 | Project skeleton, design tokens, routes, dummy data | All pages render with placeholders |
| R1 | Structure: Home, Movies grid, Movie page layout (no animation) | Layout/typography hierarchy correct on 375 / 768 / 1920 px |
| R2 | Showtimes engine + theatre board + timeline | Deterministic shows; filters work |
| R3 | 3D hall + seat selection + live pricing | Seats selectable, no walls clipping |
| R4 | Camera presets, view-from-seat, auto tour, Best seats | All 4 presets + tour + best seats pass tests |
| R5 | Motion: panorama hero, trailer-first movie page, GSAP/Lenis | Smooth, subtle, no jank |
| R6 | Snacks, review, mock payment, QR ticket, My tickets | Full flow completes, persists |
| R7 | Polish + performance + mobile + accessibility | Checklist in specifications.md §12 passes |

## Phase 05 — Premium components
Use 21st.dev / Magic UI for: marquee of upcoming movies, testimonials/offers strip, footer, FAQ, pricing-style format comparison (2D vs IMAX vs 4DX). Install → ask AI to restyle to the CineHall tokens. Max 2–3 imported components.

## Phase 06 — Backend (only if needed)
v1: localStorage. v2: Supabase (auth, bookings table, seat-hold with expiry) + Razorpay test mode. Do not add Spring Boot for this scope.

## Phase 07 — Ship
1. Run the QA checklist (specifications.md §12). 2. Compress again. 3. Deploy (AI Studio deploy / GitHub → Vercel). 4. Test on real iPhone Safari + Android. 5. Add credits (CC-BY assets, "demo data" notice).

## Debug rule
When something looks wrong: don't restart. Say *what looks wrong, what should change, what feeling you want*, plus the device/browser. Example: *"On iPhone the hall canvas is blurry and laggy. Cap DPR at 1.5, disable bloom and shadows under 768 px, keep everything else."*
