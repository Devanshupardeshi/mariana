'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

import { useExperience } from '@/lib/store';
import { lerp, pad2 } from '@/lib/math';

/**
 * Act 0 — the descent threshold. A dark void, an oversized thin percentage
 * counter that slowly scales down as it climbs, and a single line of telemetry.
 * When the canvas is ready and a minimum dwell has elapsed, the number dissolves
 * and a volumetric light shaft slices down from the top, signalling the surface.
 *
 * Robustness: the counter is gated so it never claims 100% before the canvas is
 * live, and a hard safety timeout guarantees the experience always reveals.
 */
export default function Preloader() {
  const canvasReady = useExperience((s) => s.canvasReady);
  const reducedMotion = useExperience((s) => s.reducedMotion);
  const reveal = useExperience((s) => s.reveal);

  const [gone, setGone] = useState(false);

  const rootRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLDivElement>(null);
  const numberRef = useRef<HTMLSpanElement>(null);
  const telemetryRef = useRef<HTMLDivElement>(null);
  const shaftRef = useRef<HTMLDivElement>(null);

  // Mirror reactive values into refs so the rAF loop reads the latest.
  const canvasReadyRef = useRef(canvasReady);
  const reducedRef = useRef(reducedMotion);
  useEffect(() => {
    canvasReadyRef.current = canvasReady;
  }, [canvasReady]);
  useEffect(() => {
    reducedRef.current = reducedMotion;
  }, [reducedMotion]);

  useEffect(() => {
    let raf = 0;
    let current = 0;
    let exiting = false;
    const start = performance.now();
    const minDuration = reducedRef.current ? 500 : 2200;
    const safety = window.setTimeout(() => {
      canvasReadyRef.current = true;
    }, reducedRef.current ? 1200 : 6000);

    const startExit = () => {
      if (exiting) return;
      exiting = true;

      if (reducedRef.current) {
        gsap.to(rootRef.current, {
          autoAlpha: 0,
          duration: 0.3,
          onComplete: () => {
            reveal();
            setGone(true);
          },
        });
        return;
      }

      const tl = gsap.timeline({
        defaults: { ease: 'power2.inOut' },
        onComplete: () => {
          reveal();
          setGone(true);
        },
      });
      tl.to(counterRef.current, {
        opacity: 0,
        scale: 0.7,
        filter: 'blur(14px)',
        duration: 0.9,
        ease: 'power3.in',
      })
        .to(telemetryRef.current, { opacity: 0, y: -8, duration: 0.6 }, '<')
        // The volumetric shaft slices down from the top.
        .fromTo(
          shaftRef.current,
          { scaleY: 0, opacity: 0 },
          { scaleY: 1, opacity: 1, duration: 1.0, ease: 'power3.out' },
          '-=0.4',
        )
        .to(shaftRef.current, { opacity: 0, duration: 0.8, ease: 'power2.in' }, '+=0.05')
        .to(rootRef.current, { autoAlpha: 0, duration: 0.7 }, '-=0.7');
    };

    const tick = (now: number) => {
      const elapsed = now - start;
      const timed = (elapsed / minDuration) * 100;
      // Hold below 100 until the GL context is live.
      const target = canvasReadyRef.current ? 100 : Math.min(timed, 92);
      current = lerp(current, target, 0.08);
      if (target === 100 && 100 - current < 0.4) current = 100;

      if (numberRef.current) numberRef.current.textContent = `${pad2(current)}%`;
      if (counterRef.current) {
        const k = current / 100;
        counterRef.current.style.transform = `scale(${lerp(1.0, 0.82, k)})`;
        counterRef.current.style.opacity = `${Math.min(1, current / 12)}`;
      }

      if (current >= 100 && canvasReadyRef.current && elapsed >= minDuration) {
        startExit();
        return;
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(safety);
    };
    // Intentionally run once; latest values are read via refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (gone) return null;

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-void"
    >
      {/* The volumetric reveal shaft. */}
      <div
        ref={shaftRef}
        className="pointer-events-none absolute left-1/2 top-0 h-full w-[2px] -translate-x-1/2 opacity-0"
        style={{
          transformOrigin: 'top center',
          background:
            'linear-gradient(to bottom, rgba(205,212,255,0.9), rgba(99,102,241,0.35) 35%, rgba(99,102,241,0) 90%)',
          boxShadow: '0 0 60px 10px rgba(99,102,241,0.25)',
        }}
      />

      <div
        ref={counterRef}
        className="select-none font-serif text-[22vw] leading-none tracking-tight text-white/95 md:text-[15vw]"
        style={{ opacity: 0 }}
      >
        <span ref={numberRef} className="tabular-nums">
          00%
        </span>
      </div>

      <div
        ref={telemetryRef}
        className="absolute bottom-[14vh] flex items-center gap-3 font-mono text-[11px] uppercase tracking-telemetry text-white/40"
      >
        <span className="inline-block h-1 w-1 rounded-full bg-biolume" />
        Pressurizing Vestibule · Stand By
      </div>
    </div>
  );
}
