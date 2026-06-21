'use client';

import { useEffect } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { useExperience } from '@/lib/store';
import { setProgress, bindPointer } from '@/lib/scroll-state';
import { clamp } from '@/lib/math';

/**
 * Owns global scroll. In full-motion mode it runs Lenis driven by the GSAP
 * ticker and a single master ScrollTrigger that writes scroll progress into the
 * render-free `scrollState` singleton. In reduced-motion mode it skips Lenis and
 * GSAP entirely, mapping native scroll position to progress with a passive
 * listener so the depth readout still works without any animation.
 */
export default function SmoothScrollProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const reducedMotion = useExperience((s) => s.reducedMotion);
  const setReducedMotion = useExperience((s) => s.setReducedMotion);
  const setIsCompact = useExperience((s) => s.setIsCompact);
  const revealed = useExperience((s) => s.revealed);

  // Detect environment preferences once, and keep them live.
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const compactQuery = window.matchMedia('(max-width: 767px)');

    const syncMotion = () => setReducedMotion(motionQuery.matches);
    const syncCompact = () => setIsCompact(compactQuery.matches);
    syncMotion();
    syncCompact();

    motionQuery.addEventListener('change', syncMotion);
    compactQuery.addEventListener('change', syncCompact);
    return () => {
      motionQuery.removeEventListener('change', syncMotion);
      compactQuery.removeEventListener('change', syncCompact);
    };
  }, [setReducedMotion, setIsCompact]);

  // Pointer parallax source (the scene ignores it in reduced-motion mode).
  useEffect(() => bindPointer(), []);

  // Full-motion scroll engine: Lenis + GSAP ScrollTrigger.
  useEffect(() => {
    if (reducedMotion) {
      // Reduced motion: derive progress from native scroll, no smoothing.
      const onScroll = () => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        setProgress(max > 0 ? clamp(window.scrollY / max) : 0, 0);
      };
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onScroll);
      return () => {
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('resize', onScroll);
      };
    }

    gsap.registerPlugin(ScrollTrigger);

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.6,
    });

    // Keep ScrollTrigger in sync with Lenis, and drive Lenis from GSAP's ticker.
    lenis.on('scroll', ScrollTrigger.update);
    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    const master = ScrollTrigger.create({
      trigger: '#descent-root',
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      onUpdate: (self) => setProgress(self.progress, self.getVelocity()),
    });

    // Debug affordance: jump to a normalised scroll progress (used for visual QA).
    (window as unknown as { __mariana?: unknown }).__mariana = {
      lenis,
      seek: (p: number) => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        lenis.scrollTo(clamp(p) * max, { immediate: true });
      },
    };

    // Measurements settle after fonts/layout; refresh on load.
    const onLoad = () => ScrollTrigger.refresh();
    window.addEventListener('load', onLoad);
    const refreshId = window.setTimeout(() => ScrollTrigger.refresh(), 300);

    return () => {
      window.removeEventListener('load', onLoad);
      window.clearTimeout(refreshId);
      gsap.ticker.remove(raf);
      master.kill();
      lenis.destroy();
      delete (window as unknown as { __mariana?: unknown }).__mariana;
    };
  }, [reducedMotion]);

  // Lock scroll behind the preloader; release on reveal.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.style.scrollBehavior = 'auto';
    if (!revealed) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      if (!reducedMotion) {
        // Nudge ScrollTrigger after the layout unlocks.
        requestAnimationFrame(() => ScrollTrigger.refresh());
      }
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [revealed, reducedMotion]);

  return <>{children}</>;
}
