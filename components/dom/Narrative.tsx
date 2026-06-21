'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';

import { useExperience } from '@/lib/store';
import { scrollState } from '@/lib/scroll-state';
import { lerp, smoothstep, formatDepth } from '@/lib/math';
import { ACTS, COORDINATES, TRENCH_DEPTH } from '@/lib/constants';

import KineticHeading from './KineticHeading';
import MagneticButton from './MagneticButton';
import Termination from './Termination';

interface Scene {
  id: string;
  marker: string;
  zone: string;
  copy: string;
  alternateChars: string;
  in: [number, number];
  out: [number, number];
}

/** The four narrated descent acts, with their cross-fade windows in progress. */
const SCENES: Scene[] = [
  {
    id: 'surface',
    marker: ACTS[0].marker,
    zone: ACTS[0].zone,
    alternateChars: 'AC',
    copy: 'The Surface. Where light and warmth sustain the ocean’s lungs. Here, the world we know begins to fade.',
    // Fully present and resolved the instant the descent is revealed.
    in: [-0.1, -0.03],
    out: [0.12, 0.17],
  },
  {
    id: 'twilight',
    marker: ACTS[1].marker,
    zone: ACTS[1].zone,
    alternateChars: 'G',
    copy: 'The Twilight. At one thousand metres, the last rays of sunlight die. We enter a domain of cold pressure and quiet shadows.',
    in: [0.18, 0.24],
    out: [0.33, 0.39],
  },
  {
    id: 'midnight',
    marker: ACTS[2].marker,
    zone: ACTS[2].zone,
    alternateChars: 'G',
    copy: 'The Midnight. In total darkness, life invents its own light. Over ninety percent of creatures here communicate through cold, living fire.',
    in: [0.4, 0.47],
    out: [0.57, 0.64],
  },
  {
    id: 'abyss',
    marker: ACTS[3].marker,
    zone: ACTS[3].zone,
    alternateChars: 'A',
    copy: 'The Abyss. 10,994 metres beneath the sky. A pristine, silent sanctuary of planetary memory, threatened by the reach of humankind.',
    // Clears the stage before the MARIANA hero surfaces (no text collision).
    in: [0.63, 0.68],
    out: [0.71, 0.76],
  },
];

const SANCTUARY = {
  marker: ACTS[4].marker,
  copy: 'A sanctuary too deep to destroy. Join the initiative to designate the Hadal Zone as a permanent planetary reserve.',
  in: [0.85, 0.9] as [number, number],
  out: [0.965, 0.995] as [number, number],
};

const HERO_REVEAL: [number, number] = [0.77, 0.89];

const ENTER_Y = 30;
const ENTER_BLUR = 8;
const EXIT_Y = -16; // subtler exit than enter (Jakub)
const EXIT_BLUR = 6;

function computeReveal(p: number, inW: [number, number], outW: [number, number]) {
  if (p < inW[0]) return { opacity: 0, y: ENTER_Y, blur: ENTER_BLUR };
  if (p < inW[1]) {
    const t = smoothstep(inW[0], inW[1], p);
    return { opacity: t, y: lerp(ENTER_Y, 0, t), blur: lerp(ENTER_BLUR, 0, t) };
  }
  if (p < outW[0]) return { opacity: 1, y: 0, blur: 0 };
  if (p < outW[1]) {
    const t = smoothstep(outW[0], outW[1], p);
    return { opacity: 1 - t, y: lerp(0, EXIT_Y, t), blur: lerp(0, EXIT_BLUR, t) };
  }
  return { opacity: 0, y: EXIT_Y, blur: EXIT_BLUR };
}

function applyReveal(
  el: HTMLElement | null,
  r: { opacity: number; y: number; blur: number },
) {
  if (!el) return;
  el.style.opacity = `${r.opacity}`;
  el.style.transform = `translate3d(0, ${r.y}px, 0)`;
  el.style.filter = r.blur > 0.01 ? `blur(${r.blur}px)` : 'none';
}

/* ------------------------------------------------------------------ */
/* Immersive layout — fixed, scroll-scrubbed cross-fades over the canvas */
/* ------------------------------------------------------------------ */

function ImmersiveNarrative() {
  const panelRefs = useRef<(HTMLElement | null)[]>([]);
  const heroRef = useRef<HTMLDivElement>(null);
  const sanctuaryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const p = scrollState.smoothProgress;

      SCENES.forEach((scene, i) => {
        applyReveal(panelRefs.current[i], computeReveal(p, scene.in, scene.out));
      });

      // Hero persists once revealed, dissolving only at the termination.
      if (heroRef.current) {
        heroRef.current.style.opacity = `${1 - smoothstep(0.955, 1.0, p)}`;
      }
      applyReveal(sanctuaryRef.current, computeReveal(p, SANCTUARY.in, SANCTUARY.out));

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // A slow, continuous float so the hero title feels suspended in the deep.
  // Animates the container's transform; the rAF above only touches opacity, and
  // the scrubbed letter reveal animates the inner glyphs — no conflict.
  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const float = gsap.to(el, {
      y: 12,
      duration: 5.5,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
    });
    return () => {
      float.kill();
      gsap.set(el, { clearProps: 'transform' });
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-20">
      {SCENES.map((scene, i) => (
        <article
          key={scene.id}
          ref={(el) => {
            panelRefs.current[i] = el;
          }}
          className="absolute inset-0 flex items-center justify-center px-8 will-change-transform"
          style={{ opacity: 0 }}
        >
          <div className="w-[min(88vw,980px)] text-center">
            <div className="mb-5 flex items-center justify-center gap-3 font-mono text-[10px] uppercase tracking-telemetry text-white/40">
              <span className="h-px w-8 bg-white/20" />
              {scene.marker}
              <span className="h-px w-8 bg-white/20" />
            </div>
            <h2 className="font-aalto-display whitespace-nowrap text-[clamp(3.7rem,8.4vw,7.6rem)] leading-[1.06] text-white/95">
              <KineticHeading
                text={scene.zone}
                pStart={scene.in[0]}
                pEnd={scene.in[1] + 0.02}
                alternateChars={scene.alternateChars}
              />
            </h2>
            <p className="mx-auto mt-7 max-w-md font-sans text-base font-light leading-loose text-white/65">
              {scene.copy}
            </p>
          </div>
        </article>
      ))}

      {/* The MARIANA reveal — surfaces letter by letter from the golden ring. */}
      <div ref={heroRef} className="absolute inset-0 flex items-center justify-center px-6" style={{ opacity: 0 }}>
        <h2
          className="font-serif text-[15vw] leading-none text-white/95 md:text-[12vw]"
          style={{ textShadow: '0 0 80px rgba(212,175,122,0.35)' }}
        >
          <KineticHeading
            text="MARIANA"
            pStart={HERO_REVEAL[0]}
            pEnd={HERO_REVEAL[1]}
            className="tracking-[0.14em]"
            ariaLabel="Mariana"
          />
        </h2>
      </div>

      {/* The sanctuary call to action. */}
      <div
        ref={sanctuaryRef}
        className="absolute inset-x-0 bottom-[16vh] flex flex-col items-center px-8 will-change-transform"
        style={{ opacity: 0 }}
      >
        <div className="mb-3 font-mono text-[10px] uppercase tracking-telemetry text-hydrothermal/70">
          {SANCTUARY.marker}
        </div>
        <p className="mb-9 max-w-md text-center font-sans text-base font-light leading-loose text-white/65">
          {SANCTUARY.copy}
        </p>
        <MagneticButton label="Secure the Sanctuary" href="#narrative-content" />
      </div>

      <Termination variant="overlay" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Reduced-motion layout — a calm, readable vertical column            */
/* ------------------------------------------------------------------ */

function ReducedNarrative() {
  return (
    <main className="relative z-20 mx-auto max-w-2xl px-6 py-28">
      <header className="mb-32 text-center">
        <div className="mb-6 font-mono text-[10px] uppercase tracking-telemetry text-white/40">
          Mariana Sanctuary Initiative · {COORDINATES.label}
        </div>
        <h1 className="font-serif text-7xl italic leading-none text-white/95">Mariana</h1>
        <p className="mx-auto mt-8 max-w-md font-sans text-base font-light leading-loose text-white/65">
          A descent into the deepest, most fragile place on Earth — from the surface to{' '}
          {formatDepth(TRENCH_DEPTH)} metres.
        </p>
      </header>

      <div className="space-y-32">
        {SCENES.map((scene) => (
          <article key={scene.id} className="text-center">
            <div className="mb-5 font-mono text-[10px] uppercase tracking-telemetry text-white/40">
              {scene.marker}
            </div>
            <h2 className="font-aalto-display whitespace-nowrap text-[clamp(3.6rem,13vw,7rem)] leading-[1.06] text-white/95">
              <KineticHeading
                text={scene.zone}
                pStart={0}
                pEnd={1}
                alternateChars={scene.alternateChars}
              />
            </h2>
            <p className="mx-auto mt-7 max-w-md font-sans text-base font-light leading-loose text-white/65">
              {scene.copy}
            </p>
          </article>
        ))}

        <article className="flex flex-col items-center text-center">
          <div className="mb-5 font-mono text-[10px] uppercase tracking-telemetry text-hydrothermal/70">
            {SANCTUARY.marker}
          </div>
          <h2 className="mb-7 font-serif text-6xl leading-none tracking-[0.14em] text-white/95">
            MARIANA
          </h2>
          <p className="mb-10 max-w-md font-sans text-base font-light leading-loose text-white/65">
            {SANCTUARY.copy}
          </p>
          <MagneticButton label="Secure the Sanctuary" href="#narrative-content" />
        </article>
      </div>

      <Termination variant="static" />
    </main>
  );
}

export default function Narrative() {
  const reducedMotion = useExperience((s) => s.reducedMotion);
  return reducedMotion ? <ReducedNarrative /> : <ImmersiveNarrative />;
}
