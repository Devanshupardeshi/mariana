'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

import { useExperience } from '@/lib/store';
import SmoothScrollProvider from '@/components/providers/SmoothScrollProvider';
import SkipLink from '@/components/dom/SkipLink';
import ScreenReaderNarrative from '@/components/dom/ScreenReaderNarrative';
import Narrative from '@/components/dom/Narrative';
import TelemetryHUD from '@/components/hud/TelemetryHUD';
import Preloader from '@/components/dom/Preloader';

/**
 * The WebGL canvas is loaded client-only (no SSR) and mounted after first paint
 * to avoid hydration mismatches, layout shift and font flash.
 */
const SceneCanvas = dynamic(() => import('@/components/scene/SceneCanvas'), {
  ssr: false,
  loading: () => null,
});

export default function Page() {
  const reducedMotion = useExperience((s) => s.reducedMotion);
  const [mounted, setMounted] = useState(false);

  // Lazy-initialise the canvas only once the first paint has happened.
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <>
      <SkipLink />
      {/* Always-present accessible narrative (visually hidden in immersive mode). */}
      <ScreenReaderNarrative />

      <SmoothScrollProvider>
        {/* The fixed WebGL backdrop. Dimmed to an ambient field in reduced motion. */}
        <div
          className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-700"
          style={{ opacity: reducedMotion ? 0.35 : 1 }}
          aria-hidden="true"
        >
          {mounted && <SceneCanvas />}
        </div>

        {/* Readability scrim only when the canvas is a passive backdrop. */}
        {reducedMotion && (
          <div className="pointer-events-none fixed inset-0 z-10 bg-void/60" aria-hidden="true" />
        )}

        {/* The scroll-length driver for the pinned immersive experience. Lives in
            normal flow so it actually contributes document scroll height. */}
        {!reducedMotion && (
          <div id="descent-root" aria-hidden="true" style={{ height: '760vh' }} />
        )}

        <Narrative />
        <TelemetryHUD />
        <Preloader />
      </SmoothScrollProvider>
    </>
  );
}
