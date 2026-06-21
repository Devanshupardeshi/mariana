# MARIANA — The Descent

An immersive, scroll-told storytelling website for a deep-ocean conservation
initiative. The entire experience is a single cinematic descent into the Mariana
Trench, mapping vertical scroll directly to ocean depth — **0 m → 10,994 m** —
across five seamless acts, from the sunlit surface to the silent abyss.

Built as a production-grade WebGL experience: every creature, particle field and
light shaft is procedural, driven by custom GLSL; there are no placeholders.

---

## Stack

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS** (bespoke tokens, no generic component library)
- **React Three Fiber** + **@react-three/drei** + **@react-three/postprocessing**
- **GSAP** (+ ScrollTrigger) and **Lenis** for smooth, scrubbed scroll
- **zustand** for discrete UI state; a render-free singleton for per-frame values

## Run it

```bash
npm install      # already done if node_modules exists
npm run dev      # development at http://localhost:3000
# or
npm run build && npm run start   # production
npm run typecheck                # strict type-check, no emit
```

Open the page and scroll. The descent is the navigation.

---

## The five acts (scroll → depth)

| Act | Zone | Depth | What you see |
|-----|------|-------|--------------|
| 0 | Preloader | — | A thin percentage counter scales down over a void; a light shaft slices in on reveal. |
| I | Epipelagic · The Surface | 0–200 m | Underside of a wavy sea, volumetric god rays, indigo light. |
| II | Mesopelagic · The Twilight | 200–1,000 m | Light dims; marine-snow particles stream upward (descent velocity). |
| III | Bathypelagic · The Midnight | 1,000–4,000 m | Darkness; particles ignite and swarm a breathing, Fresnel-lit creature. |
| IV | Hadal · The Abyss | 4,000–10,994 m | Particles disperse into a golden ring; **MARIANA** surfaces letter by letter. |
| V | The Sanctuary | 10,994 m | The ring settles into orbit; the magnetic “Secure the Sanctuary” CTA. |

A fixed telemetry HUD tracks live depth, zone, coordinates and a depth gauge.
At the end, the canvas dissolves to a near-black void with a single poetic line
and a live pseudo-telemetry feed — no traditional footer.

---

## Architecture notes

- **`lib/scroll-state.ts`** — a mutable singleton holding scroll progress, derived
  depth and pointer position. GSAP/Lenis write to it; the R3F `useFrame` loop and
  the HUD's rAF read from it. This keeps per-frame updates **out of React** (zero
  re-renders on scroll).
- **`lib/constants.ts`** — the act model and the piecewise `depthFromProgress`
  map, so the depth counter rises monotonically in lock-step with scroll while
  each act gets balanced scroll real-estate.
- **`lib/shaders/*`** — all GLSL as template strings (3D simplex noise, the
  creature's noise-displacement vertex + Fresnel fragment, the particle systems,
  the water surface and the god rays). No GLSL loader required.
- **`components/scene/*`** — the WebGL scene, dynamically imported with
  `{ ssr: false }` and mounted only after first paint.
- **`components/dom/*`**, **`components/hud/*`** — the editorial/HUD layer.

## Performance & graceful degradation

- Total particle/vertex budget kept low (~17k high-tier; far less on mobile).
- `<PerformanceMonitor>` drops the render tier below ~45 fps (disabling the heavy
  post-processing and thinning particles).
- The post-processing composer is bypassed entirely below 768px.
- All geometries/materials are disposed on unmount.

## Accessibility

- **`prefers-reduced-motion`** is fully honoured: Lenis/GSAP/ScrollTrigger are not
  instantiated, the canvas becomes a dim ambient backdrop, and the narrative is
  laid out as a calm, readable vertical column.
- A complete, server-rendered **screen-reader narrative** is always in the DOM.
- A **“Skip to content”** link and a global reduced-motion CSS reset are included.

## 3D assets

- **Procedural-first.** The creature, marine snow and golden ring are pure
  geometry + GLSL — nothing to break.
- The only loaded model is a **local copy of a verified, CORS-safe Khronos sample
  asset** (`public/models/salvage.glb`, the DamagedHelmet), re-skinned as corroded
  deep-sea salvage. If it ever fails to load, an error boundary swaps in a
  procedural rock — the scene never breaks. No remote HDRs or unverified CDNs.

## A note on fonts

Display serif **Instrument Serif** and data mono **Space Mono** are loaded via
`next/font/google`. The brief calls for **Satoshi / General Sans** for body copy;
neither is on Google Fonts, and the brief's overriding mandate is 100 % load
reliability (no unstable remote font dependencies). The body is therefore set in
**Hanken Grotesk** — a razor-sharp neo-grotesk in the same register, self-hosted
by `next/font`. To use Satoshi, self-host the files and swap the `--font-sans`
definition in `app/layout.tsx`.
