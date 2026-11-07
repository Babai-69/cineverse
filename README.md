# CineHall
Realistic 3D cinema ticket booking demo (React + TypeScript + Vite + Three.js, built day by day).
Docs: see `docs/` (prd, tech, workflow, specifications).
---
```
npm install
npm run dev      # run
npm test         # UI tests
npm run check    # showtimes engine rules
npm run build    # typecheck + production build
```
<<<<<<< HEAD
See `docs/DEBUGGING.md` for the code map and troubleshooting, `docs/DATA.md` for the cinema database.

Cinema data: `data/indian_cinema_database.csv` → `npm run data:build`; exact coordinates → `npm run geocode`.
All movie data is fictional demo data. No real payments.

## Updating from a new daily zip
```
# unzip cinehall-dayN.zip to a temp folder, then from the repo root:
node scripts/sync.mjs <path-to-unzipped>/cinehall
npm install        # only if sync says package.json changed
npm run dev        # look at it
npm run ship -- "Day N: short message"   # build + tests + commit + push
```
=======
---
>>>>>>> 0ff69a44d58c07efea98d8ec493ccb7f1cbe4ef3
