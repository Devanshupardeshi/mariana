'use client';

import { useEffect, useRef } from 'react';

import { scrollState } from '@/lib/scroll-state';
import { smoothstep } from '@/lib/math';
import { COORDINATES } from '@/lib/constants';

interface TerminationProps {
  variant: 'overlay' | 'static';
}

/**
 * The atmospheric termination — not a footer. The canvas dissolves into a
 * near-black void, a single poetic line fades in, and beneath it a horizontal
 * line of technical data runs alongside a live pseudo-telemetry feed (subtle
 * pressure and temperature updates). In `overlay` mode it fades in over the
 * dive's final stretch; in `static` mode (reduced motion) it sits at the foot of
 * the readable column.
 */
export default function Termination({ variant }: TerminationProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const scrimRef = useRef<HTMLDivElement>(null);
  const pressureRef = useRef<HTMLSpanElement>(null);
  const tempRef = useRef<HTMLSpanElement>(null);
  const sonarRef = useRef<HTMLSpanElement>(null);

  // Live telemetry: subtle, slow updates — informative, not attention-seeking.
  useEffect(() => {
    const update = () => {
      const pressure = (1086 + (Math.random() - 0.5) * 3).toFixed(0);
      const temp = (1.2 + (Math.random() - 0.5) * 0.4).toFixed(1);
      const sonar = (Math.random() * 40 + 720).toFixed(0);
      if (pressureRef.current) pressureRef.current.textContent = `${pressure} bar`;
      if (tempRef.current) tempRef.current.textContent = `${temp}°C`;
      if (sonarRef.current) sonarRef.current.textContent = `${sonar} ms`;
    };
    update();
    const id = window.setInterval(update, 1600);
    return () => window.clearInterval(id);
  }, []);

  // Overlay mode fades in over the final stretch of the descent.
  useEffect(() => {
    if (variant !== 'overlay') return;
    let raf = 0;
    const tick = () => {
      const p = scrollState.progress;
      const content = smoothstep(0.965, 1.0, p);
      const scrim = smoothstep(0.94, 1.0, p);
      if (rootRef.current) rootRef.current.style.opacity = `${content}`;
      if (scrimRef.current) scrimRef.current.style.opacity = `${scrim}`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [variant]);

  const dataLine = (
    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 font-mono text-[10px] uppercase tracking-telemetry text-white/40">
      <span>Mariana Sanctuary Initiative © 2026</span>
      <span className="text-white/20">·</span>
      <span>
        {COORDINATES.lat}, {COORDINATES.lon}
      </span>
      <span className="text-white/20">·</span>
      <span className="text-white/55">Latency Active</span>
      <span className="text-white/20">·</span>
      <span className="text-biolume/70">
        <span ref={pressureRef}>1086 bar</span>
      </span>
      <span className="text-white/20">·</span>
      <span className="text-biolume/70">
        <span ref={tempRef}>1.2°C</span>
      </span>
      <span className="text-white/20">·</span>
      <span className="text-hydrothermal/70">
        SONAR <span ref={sonarRef}>740 ms</span>
      </span>
    </div>
  );

  if (variant === 'static') {
    return (
      <div className="flex flex-col items-center gap-10 px-8 py-24 text-center">
        <p className="max-w-md font-serif text-2xl italic leading-snug text-white/80">
          We protect what we choose to understand.
        </p>
        {dataLine}
      </div>
    );
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-[25]">
      <div ref={scrimRef} className="absolute inset-0 bg-[#050507]" style={{ opacity: 0 }} />
      <div
        ref={rootRef}
        className="absolute inset-0 flex flex-col items-center justify-center gap-12 px-8 text-center"
        style={{ opacity: 0 }}
      >
        <p className="max-w-md font-serif text-3xl italic leading-snug text-white/85 md:text-4xl">
          We protect what we choose to understand.
        </p>
        {dataLine}
      </div>
    </div>
  );
}
