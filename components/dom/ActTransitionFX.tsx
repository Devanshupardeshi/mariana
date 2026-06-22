'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';

import { ACTS } from '@/lib/constants';
import { scrollState } from '@/lib/scroll-state';
import { useExperience } from '@/lib/store';

const TRANSITION_COLORS = {
  surface: '#9fb0ff',
  twilight: '#6f7cff',
  midnight: '#3942c6',
  abyss: '#d4af7a',
  sanctuary: '#f0d19c',
} as const;

function actIndexForProgress(progress: number) {
  for (let i = 0; i < ACTS.length; i++) {
    if (progress <= ACTS[i].pEnd) return i;
  }
  return ACTS.length - 1;
}

export default function ActTransitionFX() {
  const reducedMotion = useExperience((s) => s.reducedMotion);
  const revealed = useExperience((s) => s.revealed);

  const rootRef = useRef<HTMLDivElement>(null);
  const washRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const scanRef = useRef<HTMLDivElement>(null);
  const beamRef = useRef<HTMLDivElement>(null);
  const lastActRef = useRef<number | null>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    if (reducedMotion || !revealed) return;

    const play = (index: number, direction: 1 | -1) => {
      const act = ACTS[index];
      const color = TRANSITION_COLORS[act.id];
      const root = rootRef.current;
      const wash = washRef.current;
      const ring = ringRef.current;
      const scan = scanRef.current;
      const beam = beamRef.current;
      if (!root || !wash || !ring || !scan || !beam) return;

      timelineRef.current?.kill();
      gsap.killTweensOf([root, wash, ring, scan, beam]);

      wash.style.background = `radial-gradient(circle at 50% 50%, ${color}55 0%, ${color}20 18%, transparent 54%)`;
      ring.style.borderColor = color;
      ring.style.boxShadow = `0 0 60px ${color}35, inset 0 0 38px ${color}22`;
      scan.style.background = `linear-gradient(${direction > 0 ? 112 : 68}deg, transparent 0%, ${color}00 24%, ${color}44 50%, ${color}00 76%, transparent 100%)`;
      beam.style.background = `linear-gradient(90deg, transparent 0%, ${color}00 34%, ${color}96 50%, ${color}00 66%, transparent 100%)`;
      beam.style.boxShadow = `0 0 38px ${color}35`;

      gsap.set(root, { autoAlpha: 1 });
      gsap.set(wash, { opacity: 0, scale: 0.8, filter: 'blur(18px)' });
      gsap.set(ring, {
        opacity: 0,
        scale: 0.22,
        rotate: direction > 0 ? -8 : 8,
        filter: 'blur(2px)',
      });
      gsap.set(scan, {
        opacity: 0,
        xPercent: direction > 0 ? -120 : 120,
        skewX: direction > 0 ? -12 : 12,
      });
      gsap.set(beam, {
        opacity: 0,
        x: direction > 0 ? '-68vw' : '68vw',
        yPercent: -50,
        rotate: direction > 0 ? 18 : -18,
        scaleX: 0.68,
        filter: 'blur(1.2px)',
      });

      timelineRef.current = gsap
        .timeline({
          defaults: { ease: 'power3.out' },
          onComplete: () => {
            gsap.set(root, { autoAlpha: 0 });
          },
        })
        .to(wash, { opacity: 0.32, scale: 1.04, duration: 0.22, ease: 'power2.out' }, 0)
        .to(wash, { opacity: 0, scale: 1.32, filter: 'blur(28px)', duration: 0.9, ease: 'power2.in' }, 0.18)
        .to(ring, { opacity: 0.72, scale: 0.72, duration: 0.18, ease: 'power3.out' }, 0.02)
        .to(ring, { opacity: 0, scale: 2.2, rotate: 0, filter: 'blur(11px)', duration: 1.28, ease: 'expo.out' }, 0.08)
        .to(scan, { opacity: 0.52, duration: 0.12, ease: 'power2.out' }, 0.04)
        .to(scan, {
          opacity: 0,
          xPercent: direction > 0 ? 120 : -120,
          duration: 0.9,
          ease: 'power2.out',
        }, 0.04)
        .to(beam, { opacity: 0.62, duration: 0.16, ease: 'power2.out' }, 0.08)
        .to(beam, {
          opacity: 0,
          x: direction > 0 ? '66vw' : '-66vw',
          duration: 1.08,
          ease: 'power3.out',
        }, 0.08);
    };

    let raf = 0;
    const tick = () => {
      const next = actIndexForProgress(scrollState.progress);
      const previous = lastActRef.current;
      if (previous === null) {
        lastActRef.current = next;
      } else if (next !== previous) {
        play(next, next > previous ? 1 : -1);
        lastActRef.current = next;
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      timelineRef.current?.kill();
      timelineRef.current = null;
    };
  }, [reducedMotion, revealed]);

  if (reducedMotion) return null;

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[18] opacity-0"
    >
      <div ref={washRef} className="absolute inset-0 will-change-transform" />
      <div
        ref={ringRef}
        className="absolute left-1/2 top-1/2 h-[72vmin] w-[72vmin] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/30 will-change-transform"
      />
      <div ref={scanRef} className="absolute inset-y-0 left-1/2 w-[36vw] -translate-x-1/2 will-change-transform" />
      <div
        ref={beamRef}
        className="absolute left-1/2 top-1/2 h-[145vh] w-[9vw] origin-center will-change-transform"
      />
    </div>
  );
}
