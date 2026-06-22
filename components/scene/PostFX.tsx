'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  EffectComposer,
  Bloom,
  ChromaticAberration,
  Vignette,
} from '@react-three/postprocessing';
import { BlendFunction, KernelSize, type BloomEffect } from 'postprocessing';
import * as THREE from 'three';

import { scrollState } from '@/lib/scroll-state';
import { lerp, smoothstep } from '@/lib/math';

/**
 * The post-processing pipeline: bloom for the bioluminescence, a persistent
 * sliver of chromatic aberration to mimic a pressurised lens, and a heavy
 * vignette for the claustrophobic deep. Bloom intensity spikes across the
 * Act III → Act IV threshold as the creature disperses into the golden ring.
 *
 * Only mounted on capable, non-compact viewports — the caller bypasses the
 * composer entirely below 768px or on sustained frame-rate decline.
 */
export default function PostFX() {
  const bloomRef = useRef<BloomEffect | null>(null);

  const chromaticOffset = useMemo(() => new THREE.Vector2(0.0015, 0.0015), []);

  useFrame(() => {
    const sp = scrollState.smoothProgress;
    const pressure = scrollState.pressure;

    chromaticOffset.set(
      0.0015 + pressure * 0.008,
      0.0015 + pressure * 0.0038,
    );

    if (!bloomRef.current) return;
    // Restrained base, a measured swell at the abyss threshold, calm settle.
    const spike = smoothstep(0.6, 0.7, sp) * (1 - smoothstep(0.7, 0.82, sp));
    const settle = smoothstep(0.82, 1.0, sp);
    bloomRef.current.intensity = lerp(0.85, 1.25, settle) + spike * 0.9 + pressure * 0.46;
  });

  return (
    <EffectComposer multisampling={0}>
      <Bloom
        // The forwarded ref resolves to the BloomEffect instance at runtime; the
        // published types annotate it as the class, hence the cast.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ref={bloomRef as any}
        intensity={0.85}
        luminanceThreshold={0.55}
        luminanceSmoothing={0.35}
        mipmapBlur
        kernelSize={KernelSize.LARGE}
      />
      <ChromaticAberration
        offset={chromaticOffset}
        radialModulation={false}
        modulationOffset={0}
        blendFunction={BlendFunction.NORMAL}
      />
      <Vignette eskil={false} offset={0.26} darkness={1.15} />
    </EffectComposer>
  );
}
