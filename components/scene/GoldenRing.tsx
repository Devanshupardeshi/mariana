'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

import { scrollState } from '@/lib/scroll-state';
import { PALETTE } from '@/lib/constants';
import { smoothstep, lerp } from '@/lib/math';
import { RING_VERTEX, RING_FRAGMENT } from '@/lib/shaders/particles.glsl';

interface GoldenRingProps {
  count: number;
  reduced: boolean;
}

/**
 * The golden ring — the bioluminescent field disperses into a dense torus of
 * light on the trench floor (Act IV), then settles into a slow planetary orbit
 * for the sanctuary (Act V). Position is computed entirely in the vertex shader
 * from per-mote angle/radius attributes.
 */
export default function GoldenRing({ count, reduced }: GoldenRingProps) {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const groupRef = useRef<THREE.Points>(null);
  const { gl } = useThree();

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3); // computed in-shader
    const seeds = new Float32Array(count);
    const scales = new Float32Array(count);
    const angles = new Float32Array(count);
    const radii = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      seeds[i] = Math.random();
      scales[i] = 0.5 + Math.random() * 1.6;
      angles[i] = Math.random() * Math.PI * 2;
      // A ring with soft inner/outer falloff.
      radii[i] = 5.8 + (Math.random() - 0.5) * 2.8;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
    geo.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));
    geo.setAttribute('aAngle', new THREE.BufferAttribute(angles, 1));
    geo.setAttribute('aRadius', new THREE.BufferAttribute(radii, 1));
    return geo;
  }, [count]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSize: { value: 34 },
      uPixelRatio: { value: 1 },
      uReveal: { value: 0 },
      uOrbit: { value: 1.2 },
      uCeremony: { value: 0 },
      uOpacity: { value: 1 },
      uColorGold: { value: new THREE.Color(PALETTE.hydrothermalGold) },
      uColorHot: { value: new THREE.Color('#fff0d6') },
    }),
    [],
  );

  useEffect(() => {
    uniforms.uPixelRatio.value = Math.min(gl.getPixelRatio(), 2);
  }, [gl, uniforms]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame((state) => {
    const sp = scrollState.smoothProgress;
    uniforms.uTime.value = state.clock.elapsedTime * (reduced ? 0.4 : 1);
    const reveal = smoothstep(0.66, 0.84, sp);
    const ceremony = smoothstep(0.86, 0.98, sp);
    uniforms.uReveal.value = reveal;
    uniforms.uCeremony.value = ceremony;
    // Energetic assembly, then a calm planetary rotation for the sanctuary.
    uniforms.uOrbit.value = lerp(1.4, 0.5, smoothstep(0.84, 1.0, sp)) + ceremony * 0.35;

    if (groupRef.current) {
      groupRef.current.visible = reveal > 0.001;
      // The whole ring tips toward the viewer as it settles.
      groupRef.current.rotation.x = lerp(0.0, -0.32, reveal);
      groupRef.current.rotation.z = ceremony * 0.12;
      groupRef.current.scale.setScalar(1 + Math.sin(ceremony * Math.PI) * 0.08);
    }
  });

  return (
    <points ref={groupRef} geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        ref={matRef}
        vertexShader={RING_VERTEX}
        fragmentShader={RING_FRAGMENT}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
