# Trailers on the 3D screen

The 3D screen plays a **video file** as a live texture (browsers cannot draw a YouTube player inside a 3D scene).

## Add a trailer for a movie
1. Put the file(s) in `public/trailers/`, 16:9, short (10–60 s is plenty), about 1–3 MB, no audio needed (it starts muted).
   - Safari/iPhone play **MP4 (H.264)**; Chrome/Firefox play MP4 or **WebM (VP9)**. Provide both for best coverage.
   - Make a short clip from a longer video: `ffmpeg -i trailer.mp4 -t 30 -vf scale=1280:-2 -an -c:v libx264 -movflags +faststart public/trailers/m1.mp4`
2. In `src/data/movies.ts` set for that movie: `trailerVideo: ['/trailers/m1.mp4', '/trailers/m1.webm']` (or a single string).
3. Optional: `trailerId: 'YOUTUBE_ID'` (the part after `v=`) adds a **Full trailer** button that opens the official YouTube player in a popup.

Every movie currently uses `public/trailers/sample-trailer.(mp4|webm)` — a placeholder clip that says "TRAILER PLAYS HERE".
Only use trailers you have the right to host (official press-kit clips, your own or generated clips, e.g. Higgsfield/Kling loops).

## Behaviour
- Plays automatically, **muted** (browsers only allow muted autoplay), looping, only while the 3D hall is shown (pauses on the 2D map).
- Buttons on the hall: Play/Pause, Mute/Sound on. If the browser blocks autoplay, a **Tap to play trailer** button appears.
- If the file is missing/unplayable, the screen keeps the backdrop image and shows "Trailer video could not load".
- Debug: `?debug=1` logs `[cinehall:trailer] source …` and autoplay/ error events.
