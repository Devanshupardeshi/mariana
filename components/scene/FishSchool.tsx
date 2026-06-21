'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

import { scrollState } from '@/lib/scroll-state';
import { smoothstep } from '@/lib/math';

export interface FishSchoolConfig {
  count: number;
  color: string;
  center: [number, number, number];
  spread: [number, number, number];
  scale: number;
  speed: number;
  /** Presence window in scroll progress: [inStart, inEnd, outStart, outEnd]. */
  range: [number, number, number, number];
  /** Travel direction: 1 = left→right, -1 = right→left. */
  dir?: number;
}

interface Props extends FishSchoolConfig {
  reduced: boolean;
}

const dummy = new THREE.Object3D();

/**
 * A school of small glowing fish streaming across the frame, each with its own
 * speed, depth and tail-wiggle. Rendered as a single InstancedMesh so a dense
 * school costs one draw call. Re-skinned to the bioluminescent palette.
 */
export default function FishSchool({
  count,
  color,
  center,
  spread,
  scale,
  speed,
  range,
  dir = 1,
  reduced,
}: Props) {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const geometry = useMemo(() => {
    // A six-sided cone, laid on its side, reads as a darting fish silhouette.
    const g = new THREE.ConeGeometry(0.34, 1.4, 6);
    g.rotateZ(-Math.PI / 2);
    return g;
  }, []);

  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(color),
        transparent: true,
        opacity: 0.85,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.NormalBlending,
      }),
    [color],
  );

  const seeds = useMemo(
    () =>
      Array.from({ length: count }, () => ({
        x: Math.random(),
        y: Math.random() - 0.5,
        z: Math.random() - 0.5,
        ph: Math.random() * Math.PI * 2,
        sp: 0.6 + Math.random() * 0.8,
        sc: 0.6 + Math.random() * 0.9,
      })),
    [count],
  );

  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  useFrame((state) => {
    const sp = scrollState.smoothProgress;
    const presence =
      smoothstep(range[0], range[1], sp) * (1 - smoothstep(range[2], range[3], sp));
    const inst = meshRef.current;
    if (!inst) return;
    inst.visible = presence > 0.001;
    material.opacity = 0.85 * presence;

    const t = state.clock.elapsedTime * (reduced ? 0.25 : 1);
    const span = spread[0];
    for (let i = 0; i < count; i++) {
      const s = seeds[i];
      const travel = ((s.x + t * 0.05 * s.sp * speed) % 1) * span - span / 2;
      const wy = Math.sin(t * 0.8 * s.sp + s.ph) * 0.5;
      const wz = Math.cos(t * 0.6 * s.sp + s.ph) * 0.5;
      dummy.position.set(
        center[0] + dir * travel,
        center[1] + s.y * spread[1] + wy,
        center[2] + s.z * spread[2] + wz,
      );
      dummy.rotation.set(
        0,
        dir > 0 ? 0 : Math.PI,
        Math.sin(t * 6 * s.sp + s.ph) * 0.28,
      );
      const sc = scale * s.sc;
      dummy.scale.set(sc, sc, sc);
      dummy.updateMatrix();
      inst.setMatrixAt(i, dummy.matrix);
    }
    inst.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, count]}
      frustumCulled={false}
    />
  );
}
