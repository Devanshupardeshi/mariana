'use client';

import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerformanceMonitor } from '@react-three/drei';
import * as THREE from 'three';

import { useExperience } from '@/lib/store';
import Experience from './Experience';
import PostFX from './PostFX';

/**
 * The WebGL canvas. Dynamically imported with `{ ssr: false }` and only mounted
 * after first paint (see app/page.tsx) to avoid hydration mismatches and layout
 * shift. Adaptive quality drops the render tier on sustained frame-rate decline;
 * the post-processing composer is bypassed on compact viewports, in reduced
 * motion, or once quality falls.
 */
export default function SceneCanvas() {
  const setCanvasReady = useExperience((s) => s.setCanvasReady);
  const setQuality = useExperience((s) => s.setQuality);
  const quality = useExperience((s) => s.quality);
  const isCompact = useExperience((s) => s.isCompact);
  const reduced = useExperience((s) => s.reducedMotion);

  const enablePost = quality === 'high' && !isCompact && !reduced;
  const dpr: [number, number] = isCompact ? [1, 1.5] : [1, 2];

  return (
    <Canvas
      dpr={dpr}
      gl={{
        antialias: !isCompact,
        alpha: false,
        powerPreference: 'high-performance',
        stencil: false,
        depth: true,
      }}
      camera={{ position: [0, 0, 9.2], fov: 55, near: 0.1, far: 120 }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.04;
        setCanvasReady(true);
      }}
    >
      <PerformanceMonitor
        bounds={() => [45, 60]}
        flipflops={3}
        onDecline={() => setQuality('low')}
        onFallback={() => setQuality('low')}
      />
      <Suspense fallback={null}>
        <Experience />
      </Suspense>
      {enablePost && <PostFX />}
    </Canvas>
  );
}
