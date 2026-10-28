# My-Portfolio

Personal portfolio. Step 1: a cinematic, scroll-controlled 3D hero.

## Run locally

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build in dist/
npm run preview    # serve the production build
```

## Editing content

All hero copy, stage text and career facts live in `src/content/hero.js`.
Stage timing, camera keyframes and scroll length live in `src/components/hero/journey.js`.
Scene sizes, palette, camera framing and per-device budgets live in `src/components/hero/scene/config.js`.
