'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';

import { scrollState } from '@/lib/scroll-state';
import { useExperience } from '@/lib/store';
import { inverseLerp } from '@/lib/math';

interface KineticHeadingProps {
  text: string;
  /** Scroll-progress window over which the letters surface, scrubbed. */
  pStart: number;
  pEnd: number;
  className?: string;
  letterClassName?: string;
  /** Characters that should use the display font's stylistic alternate glyphs. */
  alternateChars?: string;
  ariaLabel?: string;
}

/**
 * A letter-split display heading. Each glyph rises on the Y-axis from behind a
 * mask, rotating slightly and resolving from a heavy blur — the reveal is
 * scrubbed by scroll position, so the word surfaces from the black as you
 * descend. In reduced-motion mode the letters are simply shown, fully resolved.
 */
export default function KineticHeading({
  text,
  pStart,
  pEnd,
  className,
  letterClassName,
  alternateChars = '',
  ariaLabel,
}: KineticHeadingProps) {
  const reducedMotion = useExperience((s) => s.reducedMotion);
  const containerRef = useRef<HTMLSpanElement>(null);
  const innersRef = useRef<HTMLSpanElement[]>([]);

  innersRef.current = [];
  const register = (el: HTMLSpanElement | null) => {
    if (el && !innersRef.current.includes(el)) innersRef.current.push(el);
  };

  useEffect(() => {
    const letters = innersRef.current;
    if (letters.length === 0) return;

    if (reducedMotion) {
      gsap.set(letters, { yPercent: 0, rotate: 0, opacity: 1, filter: 'blur(0px)' });
      return;
    }

    gsap.set(letters, { yPercent: 130, rotate: -7, opacity: 0, filter: 'blur(16px)' });
    const tl = gsap.timeline({ paused: true });
    tl.to(letters, {
      yPercent: 0,
      rotate: 0,
      opacity: 1,
      filter: 'blur(0px)',
      ease: 'power3.out',
      duration: 1,
      stagger: 0.6,
    });

    let raf = 0;
    const tick = () => {
      const local = inverseLerp(pStart, pEnd, scrollState.smoothProgress);
      tl.progress(local);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      tl.kill();
    };
  }, [reducedMotion, pStart, pEnd]);

  const chars = Array.from(text);
  const alternates = new Set(Array.from(alternateChars.toUpperCase()));

  return (
    <span ref={containerRef} aria-label={ariaLabel ?? text} role="text" className={className}>
      {chars.map((char, i) =>
        char === ' ' ? (
          <span key={i} aria-hidden="true" className="inline-block w-[0.32em]" />
        ) : (
          <span
            key={i}
            aria-hidden="true"
            className="inline-block overflow-hidden align-bottom px-[0.01em] py-[0.18em] -my-[0.18em]"
            style={{ verticalAlign: 'bottom' }}
          >
            <span
              ref={register}
              className={`inline-block will-change-transform ${alternates.has(char.toUpperCase()) ? 'font-aalto-alt' : ''} ${letterClassName ?? ''}`}
            >
              {char}
            </span>
          </span>
        ),
      )}
    </span>
  );
}
