'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useGLTF } from '@react-three/drei';
import { scrollState } from '@/lib/scroll-state';

interface Props {
  /** Presence window in scroll progress: [inStart, inEnd, outStart, outEnd]. */
  range: [number, number, number, number];
  /** How far ahead (in progress) to mount before the window, and keep after. */
  margin?: number;
  /**
   * If set, the model at this URL is evicted from the GLTF cache shortly after
   * the child unmounts, freeing its GPU memory. Only pass for models with a
   * SINGLE instance (shared-geometry models must not be cleared while another
   * instance is alive).
   */
  clearUrl?: string;
  children: ReactNode;
}

/**
 * Defers mounting (and therefore GLB loading) of heavy children until the scroll
 * is near their act window, and unmounts them once well past. This streams the
 * large creature models in one or two at a time instead of decoding ~160 MB of
 * geometry/textures on first paint — the cause of the load freeze.
 *
 * A single rAF compares the render-free scroll singleton and only calls setState
 * when crossing the threshold, so it costs nothing per frame in steady state.
 */
export default function LazyByRange({ range, margin = 0.12, clearUrl, children }: Props) {
  const [near, setNear] = useState(false);

  useEffect(() => {
    let raf = 0;
    let current = false;
    const lo = range[0] - margin;
    const hi = range[3] + margin;
    const tick = () => {
      const p = scrollState.progress;
      const want = p >= lo && p <= hi;
      if (want !== current) {
        current = want;
        setNear(want);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [range, margin]);

  // Once the child has unmounted (scrolled well past), drop the model from the
  // cache after a grace period so its textures/geometry leave GPU memory.
  useEffect(() => {
    if (near || !clearUrl) return;
    const id = window.setTimeout(() => useGLTF.clear(clearUrl), 1200);
    return () => window.clearTimeout(id);
  }, [near, clearUrl]);

  return near ? <>{children}</> : null;
}
