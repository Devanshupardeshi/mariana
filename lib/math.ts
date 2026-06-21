/** Small, dependency-free math helpers shared by the DOM and WebGL layers. */

export const clamp = (v: number, min = 0, max = 1): number =>
  Math.min(Math.max(v, min), max);

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/** Inverse lerp: where does `v` sit between `a` and `b`, as 0..1. */
export const inverseLerp = (a: number, b: number, v: number): number =>
  a === b ? 0 : clamp((v - a) / (b - a));

/** Remap `v` from the input range to the output range, clamped. */
export const mapRange = (
  v: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
): number => lerp(outMin, outMax, inverseLerp(inMin, inMax, v));

/** Smoothstep easing between two edges. */
export const smoothstep = (edge0: number, edge1: number, x: number): number => {
  const t = clamp((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
};

/**
 * Frame-rate-independent damping. `current` eases toward `target`; `lambda`
 * controls stiffness (higher = snappier). `dt` is delta time in seconds.
 */
export const damp = (
  current: number,
  target: number,
  lambda: number,
  dt: number,
): number => lerp(current, target, 1 - Math.exp(-lambda * dt));

/** Pad a number into a fixed-width string, e.g. depthLabel(842) -> "00,842". */
export const formatDepth = (metres: number): string =>
  Math.round(metres).toLocaleString('en-US');

/** Two-digit zero-padded integer, for the preloader counter. */
export const pad2 = (n: number): string => String(Math.floor(n)).padStart(2, '0');
