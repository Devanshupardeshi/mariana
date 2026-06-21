'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import { scrollState } from '@/lib/scroll-state';
import { PALETTE } from '@/lib/constants';
import { smoothstep } from '@/lib/math';
import { CREATURE_VERTEX, CREATURE_FRAGMENT } from '@/lib/shaders/creature.glsl';

export interface CreatureConfig {
  position: [number, number, number];
  scale: number;
  detail: number;
  /** Phase offset so each organism breathes and drifts independently. */
  phase: number;
  /** Presence windows in scroll progress: [inStart, inEnd, outStart, outEnd]. */
  range: [number, number, number, number];
  /** Drift amplitude multiplier. */
  drift?: number;
  /** Roaming amplitude across x/y/z. */
  roam?: [number, number, number];
  colorCore?: string;
  colorRim?: string;
}

interface CreatureProps extends CreatureConfig {
  reduced: boolean;
}

/**
 * A single procedural deep-sea organism: an icosphere displaced by the custom
 * vertex shader and rim-lit by the Fresnel fragment shader. Driven by props so a
 * whole flock can be composed at varied positions, scales and phases.
 */
export default function Creature({
  position,
  scale,
  detail,
  phase,
  range,
  drift = 1,
  roam = [0.7, 0.55, 0.45],
  colorCore,
  colorRim,
  reduced,
}: CreatureProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const geometry = useMemo(() => new THREE.IcosahedronGeometry(2.0, detail), [detail]);
  const base = useMemo(() => new THREE.Vector3(...position), [position]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uScrollProgress: { value: 0 },
      uPresence: { value: 0 },
      uPointer: { value: new THREE.Vector2(0, 0) },
      uColorCore: { value: new THREE.Color(colorCore ?? PALETTE.bioluminescentBlue) },
      uColorRim: { value: new THREE.Color(colorRim ?? PALETTE.hydrothermalGold) },
      uColorDeep: { value: new THREE.Color('#05060f') },
    }),
    [colorCore, colorRim],
  );

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame((state, delta) => {
    const sp = scrollState.smoothProgress;
    const presence =
      smoothstep(range[0], range[1], sp) * (1 - smoothstep(range[2], range[3], sp));
    const t = state.clock.elapsedTime + phase;

    uniforms.uTime.value = t * (reduced ? 0.4 : 1);
    uniforms.uScrollProgress.value = sp;
    uniforms.uPresence.value = presence;
    uniforms.uPointer.value.set(
      reduced ? 0 : scrollState.smoothPointerX,
      reduced ? 0 : scrollState.smoothPointerY,
    );

    const mesh = meshRef.current;
    if (mesh) {
      mesh.visible = presence > 0.001;
      mesh.scale.setScalar(scale);
      const d = reduced ? 0.35 : 1;
      mesh.position.set(
        base.x + Math.sin(t * 0.2 * drift) * roam[0] * d,
        base.y + Math.cos(t * 0.15 * drift) * roam[1] * d,
        base.z + Math.sin(t * 0.12 * drift + phase * 0.5) * roam[2] * d,
      );
      mesh.rotation.y += delta * (reduced ? 0.04 : 0.08) * drift;
      mesh.rotation.x = Math.sin(t * 0.1) * 0.2;
    }
  });

  return (
    <mesh ref={meshRef} geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        vertexShader={CREATURE_VERTEX}
        fragmentShader={CREATURE_FRAGMENT}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}
