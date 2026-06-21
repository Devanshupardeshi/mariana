'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import { scrollState } from '@/lib/scroll-state';
import { PALETTE } from '@/lib/constants';
import { lerp, smoothstep } from '@/lib/math';
import { WATER_VERTEX, WATER_FRAGMENT } from '@/lib/shaders/water.glsl';

interface WaterSurfaceProps {
  reduced: boolean;
}

/**
 * The underside of the sea, seen from just beneath in the epipelagic zone.
 * Travelling waves displace the sheet; it dims and recedes as the descent
 * leaves the surface behind.
 */
export default function WaterSurface({ reduced }: WaterSurfaceProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  const geometry = useMemo(
    () => new THREE.PlaneGeometry(80, 80, 96, 96),
    [],
  );

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uScrollProgress: { value: 0 },
      uOpacity: { value: 1 },
      uPointer: { value: new THREE.Vector2(0, 0) },
      uColorDeep: { value: new THREE.Color('#1a1f4d') },
      uColorLight: { value: new THREE.Color('#aeb6ff') },
    }),
    [],
  );

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame((state) => {
    const sp = scrollState.smoothProgress;
    const deep = smoothstep(0.08, 0.95, sp);
    uniforms.uTime.value = state.clock.elapsedTime * (reduced ? 0.3 : 1);
    uniforms.uScrollProgress.value = sp;
    uniforms.uOpacity.value = lerp(1, 0.82, deep);
    uniforms.uPointer.value.set(
      reduced ? 0 : scrollState.smoothPointerX,
      reduced ? 0 : scrollState.smoothPointerY,
    );
    if (meshRef.current) {
      // The wave field remains as a descending current motif, not only a surface.
      meshRef.current.visible = true;
      meshRef.current.position.y = lerp(11, 6.2, deep);
      meshRef.current.position.z = lerp(-3, -8.2, deep);
      meshRef.current.rotation.x = -Math.PI / 2 + lerp(0.16, 0.25, deep);
      meshRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.16) * lerp(0.006, 0.026, deep);
      meshRef.current.scale.setScalar(lerp(1, 1.22, deep));
    }
  });

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      position={[0, 11, -3]}
      rotation={[-Math.PI / 2 + 0.16, 0, 0]}
      frustumCulled={false}
    >
      <shaderMaterial
        vertexShader={WATER_VERTEX}
        fragmentShader={WATER_FRAGMENT}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}
