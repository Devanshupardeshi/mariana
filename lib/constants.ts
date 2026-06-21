/**
 * MARIANA — narrative + physical constants for the descent.
 *
 * The whole experience maps vertical scroll progress (0 → 1) onto ocean depth
 * (0m → 10,994m). Each act owns a slice of scroll real-estate (`pStart`→`pEnd`)
 * and a slice of physical depth (`depthStart`→`depthEnd`). The depth value is
 * piecewise-interpolated so the counter always rises monotonically and stays in
 * lock-step with the scroll position, while each act still gets balanced room to
 * breathe.
 */

export const TRENCH_DEPTH = 10994; // Challenger Deep, in metres.

export const COORDINATES = {
  label: '11°21′N 142°12′E',
  lat: '11.3497° N',
  lon: '142.1996° E',
};

export const PALETTE = {
  voidBlack: '#0b0b0b',
  bioluminescentBlue: '#6366f1',
  hydrothermalGold: '#d4af7a',
} as const;

export type ActId = 'surface' | 'twilight' | 'midnight' | 'abyss' | 'sanctuary';

export interface Act {
  id: ActId;
  index: number;
  /** Structural marker shown in the HUD / above the copy. */
  marker: string;
  zone: string;
  /** The literary body copy. */
  copy: string;
  /** Off-screen alternative for screen readers. */
  srText: string;
  pStart: number;
  pEnd: number;
  depthStart: number;
  depthEnd: number;
}

export const ACTS: Act[] = [
  {
    id: 'surface',
    index: 1,
    marker: 'ACT I · THE EPIPELAGIC ZONE',
    zone: 'THE SURFACE',
    copy: 'The Surface. Where light and warmth sustain the ocean’s lungs. Here, the world we know begins to fade.',
    srText:
      'Act one, the epipelagic zone, from zero to two hundred metres. The surface, where light and warmth sustain the ocean’s lungs. Here, the world we know begins to fade.',
    pStart: 0.0,
    pEnd: 0.16,
    depthStart: 0,
    depthEnd: 200,
  },
  {
    id: 'twilight',
    index: 2,
    marker: 'ACT II · THE MESOPELAGIC ZONE',
    zone: 'THE TWILIGHT',
    copy: 'The Twilight. At one thousand metres, the last rays of sunlight die. We enter a domain of cold pressure and quiet shadows.',
    srText:
      'Act two, the mesopelagic zone, from two hundred to one thousand metres. The twilight. At one thousand metres, the last rays of sunlight die. We enter a domain of cold pressure and quiet shadows.',
    pStart: 0.16,
    pEnd: 0.38,
    depthStart: 200,
    depthEnd: 1000,
  },
  {
    id: 'midnight',
    index: 3,
    marker: 'ACT III · THE BATHYPELAGIC ZONE',
    zone: 'THE MIDNIGHT',
    copy: 'The Midnight. In total darkness, life invents its own light. Over ninety percent of creatures here communicate through cold, living fire.',
    srText:
      'Act three, the bathypelagic zone, from one thousand to four thousand metres. The midnight. In total darkness, life invents its own light. Over ninety percent of creatures here communicate through cold, living fire.',
    pStart: 0.38,
    pEnd: 0.64,
    depthStart: 1000,
    depthEnd: 4000,
  },
  {
    id: 'abyss',
    index: 4,
    marker: 'ACT IV · THE HADAL ZONE',
    zone: 'THE ABYSS',
    copy: 'The Abyss. Ten thousand nine hundred and ninety-four metres beneath the sky. A pristine, silent sanctuary of planetary memory, threatened by the reach of humankind.',
    srText:
      'Act four, the hadal zone, from four thousand to ten thousand nine hundred and ninety-four metres. The abyss. A pristine, silent sanctuary of planetary memory, threatened by the reach of humankind.',
    pStart: 0.64,
    pEnd: 0.88,
    depthStart: 4000,
    depthEnd: TRENCH_DEPTH,
  },
  {
    id: 'sanctuary',
    index: 5,
    marker: 'ACT V · THE SANCTUARY',
    zone: 'THE SHIELD',
    copy: 'A sanctuary too deep to destroy. Join the initiative to designate the Hadal Zone as a permanent planetary reserve.',
    srText:
      'Act five, the sanctuary, at ten thousand nine hundred and ninety-four metres. A sanctuary too deep to destroy. Join the initiative to designate the hadal zone as a permanent planetary reserve.',
    pStart: 0.88,
    pEnd: 1.0,
    depthStart: TRENCH_DEPTH,
    depthEnd: TRENCH_DEPTH,
  },
];

/** The scroll fraction at which the descent reaches the floor and depth holds. */
export const ABYSS_FLOOR_PROGRESS = 0.88;

/**
 * Piecewise map from global scroll progress (0..1) to physical depth (m).
 * Depth rises through Acts I–IV, then holds at the trench floor for Act V.
 */
export function depthFromProgress(p: number): number {
  const clamped = Math.min(Math.max(p, 0), 1);
  for (const act of ACTS) {
    if (clamped <= act.pEnd || act.id === 'sanctuary') {
      if (act.id === 'sanctuary') return TRENCH_DEPTH;
      const span = act.pEnd - act.pStart;
      const local = span > 0 ? (clamped - act.pStart) / span : 1;
      return act.depthStart + (act.depthEnd - act.depthStart) * Math.min(Math.max(local, 0), 1);
    }
  }
  return TRENCH_DEPTH;
}

/** 0..1 normalised progress within a given act's scroll window. */
export function actLocalProgress(p: number, act: Act): number {
  const span = act.pEnd - act.pStart;
  if (span <= 0) return p >= act.pStart ? 1 : 0;
  return Math.min(Math.max((p - act.pStart) / span, 0), 1);
}
