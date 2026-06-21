'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import { scrollState } from '@/lib/scroll-state';
import { smoothstep } from '@/lib/math';
import { GODRAYS_VERTEX, GODRAYS_FRAGMENT } from '@/lib/shaders/godrays.glsl';

interface GodRaysProps {
  reduced: boolean;
  color?: string;
  fromBottom?: boolean;
  shaftCount?: number;
  maxOpacity?: number;
  position?: [number, number, number];
  size?: [number, number];
  /** Presence window in scroll progress: [inStart, inEnd, outStart, outEnd]. */
  range?: [number, number, number, number];
}

/**
 * Volumetric light shafts. Configurable for two roles:
 *  - The Act I surface sun-rays piercing down (blue, from the top).
 *  - The hydrothermal shafts rising from the trench floor (gold, from below)
 *    that keep the abyss and sanctuary from reading as flat black.
 */
export default function GodRays({
  reduced,
  color = '#cdd4ff',
  fromBottom = false,
  shaftCount = 6,
  maxOpacity = 0.9,
  position = [0, 7, -12],
  size = [54, 44],
  range = [-0.1, -0.05, 0.18, 0.3],
}: GodRaysProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  const geometry = useMemo(() => new THREE.PlaneGeometry(size[0], size[1], 1, 1), [size]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uOpacity: { value: 0 },
      uShaftCount: { value: shaftCount },
      uFlip: { value: fromBottom ? 1 : 0 },
      uPointer: { value: new THREE.Vector2(0, 0) },
      uColor: { value: new THREE.Color(color) },
    }),
    [shaftCount, fromBottom, color],
  );

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame((state) => {
    const sp = scrollState.smoothProgress;
    const presence =
      smoothstep(range[0], range[1], sp) * (1 - smoothstep(range[2], range[3], sp));
    uniforms.uTime.value = state.clock.elapsedTime * (reduced ? 0.3 : 1);
    uniforms.uOpacity.value = presence * maxOpacity;
    uniforms.uPointer.value.set(
      reduced ? 0 : scrollState.smoothPointerX,
      reduced ? 0 : scrollState.smoothPointerY,
    );
    if (meshRef.current) meshRef.current.visible = presence > 0.001;
  });

  return (
    <mesh ref={meshRef} geometry={geometry} position={position} frustumCulled={false}>
      <shaderMaterial
        vertexShader={GODRAYS_VERTEX}
        fragmentShader={GODRAYS_FRAGMENT}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}
