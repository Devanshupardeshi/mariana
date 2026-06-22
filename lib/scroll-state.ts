/**
 * High-frequency, render-free shared state.
 *
 * Scroll progress, derived depth and the normalised pointer position update on
 * every frame. Routing these through React state would thrash re-renders, so
 * instead they live on a single mutable module singleton: GSAP/Lenis write to
 * it, while the R3F `useFrame` loop and the HUD's rAF loop read from it. This is
 * Emil's "update the DOM via a ref to prevent re-renders" rule, applied globally.
 */

import { depthFromProgress } from './constants';

export interface ScrollState {
  /** Global scroll progress, 0..1. */
  progress: number;
  /** Smoothed progress for visual easing in the scene. */
  smoothProgress: number;
  /** Derived physical depth in metres. */
  depth: number;
  /** Signed scroll velocity (Lenis), for subtle motion-streak effects. */
  velocity: number;
  /** Smoothed absolute velocity, normalised to 0..1 as descent pressure. */
  pressure: number;
  /** Raw pointer position, normalised to -1..1 with origin at viewport centre. */
  pointerX: number;
  pointerY: number;
  /** Smoothed pointer position used for the camera parallax lerp. */
  smoothPointerX: number;
  smoothPointerY: number;
}

export const scrollState: ScrollState = {
  progress: 0,
  smoothProgress: 0,
  depth: 0,
  velocity: 0,
  pressure: 0,
  pointerX: 0,
  pointerY: 0,
  smoothPointerX: 0,
  smoothPointerY: 0,
};

/** Commit a new scroll progress and recompute the derived depth. */
export function setProgress(progress: number, velocity = 0): void {
  scrollState.progress = progress;
  scrollState.depth = depthFromProgress(progress);
  scrollState.velocity = velocity;
}

let pointerBound = false;

/** Attach a single global pointer listener (idempotent). */
export function bindPointer(): () => void {
  if (typeof window === 'undefined' || pointerBound) return () => {};
  pointerBound = true;

  const onPointerMove = (event: PointerEvent) => {
    scrollState.pointerX = (event.clientX / window.innerWidth) * 2 - 1;
    scrollState.pointerY = -((event.clientY / window.innerHeight) * 2 - 1);
  };

  // Recentre when the pointer leaves the window so the scene settles.
  const onPointerLeave = () => {
    scrollState.pointerX = 0;
    scrollState.pointerY = 0;
  };

  window.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('pointerout', onPointerLeave, { passive: true });

  return () => {
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerout', onPointerLeave);
    pointerBound = false;
  };
}
