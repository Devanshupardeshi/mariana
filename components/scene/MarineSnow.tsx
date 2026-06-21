'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

import { scrollState } from '@/lib/scroll-state';
import { PALETTE } from '@/lib/constants';
import { smoothstep } from '@/lib/math';
import { MARINE_SNOW_VERTEX, MARINE_SNOW_FRAGMENT } from '@/lib/shaders/particles.glsl';

interface MarineSnowProps {
  count: number;
  reduced: boolean;
}

const FIELD_DEPTH = 14;

/**
 * Marine snow — the drifting motes that sell the dive. They stream upward past
 * the camera (faster as the descent deepens), ignite with bioluminescence in the
 * midnight zone, gather toward the centre to swarm the creature, then warm to
 * gold as the trench floor approaches.
 */
export default function MarineSnow({ count, reduced }: MarineSnowProps) {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const { gl } = useThree();

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    const scales = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 34;
      positions[i * 3 + 1] = (Math.random() - 0.5) * FIELD_DEPTH * 2;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 28 - 2;
      seeds[i] = Math.random();
      scales[i] = 0.4 + Math.random() * 1.7;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
    geo.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));
    return geo;
  }, [count]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uScrollProgress: { value: 0 },
      uSize: { value: 58 },
      uPixelRatio: { value: 1 },
      uGather: { value: 0 },
      uFieldDepth: { value: FIELD_DEPTH },
      uOpacity: { value: 0 },
      uColorCold: { value: new THREE.Color('#9aa6d8') },
      uColorBio: { value: new THREE.Color(PALETTE.bioluminescentBlue) },
      uColorGold: { value: new THREE.Color(PALETTE.hydrothermalGold) },
    }),
    [],
  );

  useEffect(() => {
    uniforms.uPixelRatio.value = Math.min(gl.getPixelRatio(), 2);
  }, [gl, uniforms]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame((state) => {
    const sp = scrollState.smoothProgress;
    uniforms.uTime.value = state.clock.elapsedTime * (reduced ? 0.18 : 1);
    uniforms.uScrollProgress.value = sp;
    // Gather into a swarm through the midnight zone, then release for the ring.
    uniforms.uGather.value = reduced
      ? 0
      : smoothstep(0.4, 0.58, sp) * (1 - smoothstep(0.66, 0.8, sp));
    // Present from just beneath the surface (a 30% floor of drifting plankton),
    // swelling to a full field through the twilight and deep.
    uniforms.uOpacity.value = 0.3 + 0.7 * smoothstep(0.0, 0.2, sp);
  });

  return (
    <points geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        ref={matRef}
        vertexShader={MARINE_SNOW_VERTEX}
        fragmentShader={MARINE_SNOW_FRAGMENT}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
