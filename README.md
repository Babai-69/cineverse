# CineHall
Realistic 3D cinema ticket booking demo (React + TypeScript + Vite + Three.js, built day by day).
Docs: see `docs/` (prd, tech, workflow, specifications, prompts). Progress: `PROGRESS.md`.
```
npm install
npm run dev      # run
npm test         # UI tests
npm run check    # showtimes engine rules
npm run build    # typecheck + production build
```
See `docs/DEBUGGING.md` for the code map and troubleshooting.
All movie data is fictional demo data. No real payments.

## Updating from a new daily zip
```
# unzip cinehall-dayN.zip to a temp folder, then from the repo root:
node scripts/sync.mjs <path-to-unzipped>/cinehall
npm install        # only if sync says package.json changed
npm run dev        # look at it
npm run ship -- "Day N: short message"   # build + tests + commit + push
```
