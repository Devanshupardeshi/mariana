/**
 * Discrete UI state (the low-frequency stuff that *should* trigger React
 * updates): loading lifecycle, render quality tier and the reduced-motion flag.
 */

import { create } from 'zustand';

export type QualityTier = 'high' | 'low';

interface ExperienceState {
  /** Canvas has created its GL context and rendered its first frame. */
  canvasReady: boolean;
  setCanvasReady: (ready: boolean) => void;

  /** Preloader has completed and the experience has been revealed. */
  revealed: boolean;
  reveal: () => void;

  /** Adaptive render quality. Drops to `low` on sustained frame-rate decline. */
  quality: QualityTier;
  setQuality: (tier: QualityTier) => void;

  /** Whether the viewport is below the mobile breakpoint (composer bypass). */
  isCompact: boolean;
  setIsCompact: (compact: boolean) => void;

  /** Honour prefers-reduced-motion: ambient canvas, no scroll-driven dive. */
  reducedMotion: boolean;
  setReducedMotion: (reduced: boolean) => void;
}

export const useExperience = create<ExperienceState>((set) => ({
  canvasReady: false,
  setCanvasReady: (canvasReady) => set({ canvasReady }),

  revealed: false,
  reveal: () => set({ revealed: true }),

  quality: 'high',
  setQuality: (quality) => set({ quality }),

  isCompact: false,
  setIsCompact: (isCompact) => set({ isCompact }),

  reducedMotion: false,
  setReducedMotion: (reducedMotion) => set({ reducedMotion }),
}));
