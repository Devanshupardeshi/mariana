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
  /** Adds a type-specimen spacing pulse and alternate-glyph stretch. */
  specimenPulse?: boolean;
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
  specimenPulse = false,
  ariaLabel,
}: KineticHeadingProps) {
  const reducedMotion = useExperience((s) => s.reducedMotion);
  const containerRef = useRef<HTMLSpanElement>(null);
  const innersRef = useRef<HTMLSpanElement[]>([]);
  const alternateRef = useRef<HTMLSpanElement[]>([]);

  innersRef.current = [];
  alternateRef.current = [];
  const register = (el: HTMLSpanElement | null) => {
    if (el && !innersRef.current.includes(el)) innersRef.current.push(el);
  };
  const registerAlternate = (el: HTMLSpanElement | null) => {
    register(el);
    if (el && !alternateRef.current.includes(el)) alternateRef.current.push(el);
  };

  useEffect(() => {
    const letters = innersRef.current;
    const alternates = alternateRef.current;
    const container = containerRef.current;
    if (letters.length === 0) return;

    if (reducedMotion) {
      gsap.set(letters, {
        yPercent: 0,
        rotate: 0,
        opacity: 1,
        scaleX: 1,
        scaleY: 1,
        filter: 'blur(0px)',
      });
      if (container) gsap.set(container, { clearProps: 'letterSpacing' });
      return;
    }

    gsap.set(letters, {
      yPercent: 130,
      rotate: -7,
      opacity: 0,
      scaleX: 1,
      scaleY: 1,
      filter: 'blur(16px)',
      transformOrigin: '50% 70%',
    });
    if (specimenPulse && container) {
      gsap.set(container, { letterSpacing: '-0.075em' });
    }
    if (specimenPulse && alternates.length > 0) {
      gsap.set(alternates, { scaleX: 0.48, scaleY: 1.2, transformOrigin: '50% 70%' });
    }

    const tl = gsap.timeline({ paused: true });
    tl.to(letters, {
      yPercent: 0,
      rotate: 0,
      opacity: 1,
      scaleX: 1,
      scaleY: 1,
      filter: 'blur(0px)',
      ease: 'power3.out',
      duration: 1,
      stagger: 0.6,
    });
    if (specimenPulse && container) {
      tl.to(container, { letterSpacing: '-0.01em', ease: 'expo.out', duration: 0.9 }, 0.08)
        .to(container, { letterSpacing: '-0.025em', ease: 'sine.inOut', duration: 0.38 }, 0.86);
    }
    if (specimenPulse && alternates.length > 0) {
      tl.to(alternates, {
        scaleX: 1,
        scaleY: 1,
        ease: 'elastic.out(1, 0.68)',
        duration: 0.85,
        stagger: 0.16,
      }, 0.22);
    }

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
      if (container) gsap.set(container, { clearProps: 'letterSpacing' });
    };
  }, [reducedMotion, pStart, pEnd, specimenPulse]);

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
              ref={alternates.has(char.toUpperCase()) ? registerAlternate : register}
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
