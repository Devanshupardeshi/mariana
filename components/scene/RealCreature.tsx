'use client';

import { Suspense, useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import { clone as skeletonClone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import * as THREE from 'three';

import { scrollState } from '@/lib/scroll-state';
import { smoothstep } from '@/lib/math';
import ErrorBoundary from './ErrorBoundary';

export interface RealCreatureConfig {
  url: string;
  position: [number, number, number];
  /** Target world size (largest dimension). Auto-fits any model to this. */
  size: number;
  rotationY?: number;
  phase: number;
  /** Presence windows in scroll progress: [inStart, inEnd, outStart, outEnd]. */
  range: [number, number, number, number];
  /** Skeletal animation playback rate. */
  speed?: number;
  drift?: number;
  /** Wide roaming amplitude across x/y/z, used for hero-scale actors. */
  roam?: [number, number, number];
  /** Per-model material grading while preserving source texture maps. */
  materialGrade?: 'abyssAlien';
  /** Constant Y spin (e.g. for an octopus tumbling); 0 = gentle sway. */
  spin?: number;
}

interface Props extends RealCreatureConfig {
  reduced: boolean;
}

function Model({
  url,
  position,
  size,
  rotationY = 0,
  phase,
  range,
  speed = 0.5,
  drift = 1,
  roam = [1.3, 0.7, 0.8],
  materialGrade,
  spin = 0,
  reduced,
}: Props) {
  const outer = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF(url, true);
  const matsRef = useRef<{ mat: THREE.Material; base: number }[]>([]);

  // Clone, centre, auto-fit to `size`, and isolate materials so we can fade
  // each instance without mutating the cached original.
  const fitted = useMemo(() => {
    const c = skeletonClone(scene);
    const box = new THREE.Box3().setFromObject(c);
    const center = box.getCenter(new THREE.Vector3());
    const dim = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(dim.x, dim.y, dim.z) || 1;
    const fit = size / maxDim;

    c.position.sub(center);
    const wrap = new THREE.Group();
    wrap.add(c);
    wrap.scale.setScalar(fit);

    const mats: { mat: THREE.Material; base: number }[] = [];
    const prep = (mat: THREE.Material) => {
      const cm = mat.clone();
      cm.transparent = true;
      if (materialGrade === 'abyssAlien' && cm instanceof THREE.MeshStandardMaterial) {
        // The alien fish ships with a strong emissive texture that blows out to
        // white under bloom. Keep its base/normal maps, but grade it into the
        // scene so the texture remains visible.
        cm.color.multiplyScalar(0.42);
        cm.emissive = new THREE.Color('#1d2d72');
        cm.emissiveMap = null;
        cm.emissiveIntensity = 0.18;
        cm.roughness = Math.min(1, (cm.roughness ?? 0.65) + 0.18);
        cm.metalness = Math.max(0, Math.min(0.25, cm.metalness ?? 0));
        cm.envMapIntensity = 0.35;
        cm.needsUpdate = true;
      }
      mats.push({ mat: cm, base: (cm as THREE.MeshStandardMaterial).opacity ?? 1 });
      return cm;
    };
    c.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) {
        m.frustumCulled = false;
        m.material = Array.isArray(m.material) ? m.material.map(prep) : prep(m.material);
      }
    });
    matsRef.current = mats;
    return wrap;
  }, [scene, size]);

  useEffect(() => {
    const mats = matsRef.current;
    return () => mats.forEach(({ mat }) => mat.dispose());
  }, [fitted]);

  const { actions, names } = useAnimations(animations, fitted);
  useEffect(() => {
    const a = names[0] ? actions[names[0]] : null;
    if (a) {
      a.reset().play();
      a.timeScale = reduced ? 0.0001 : speed;
    }
    return () => {
      a?.stop();
    };
  }, [actions, names, speed, reduced]);

  const base = useMemo(() => new THREE.Vector3(...position), [position]);

  useFrame((state) => {
    const sp = scrollState.smoothProgress;
    const presence =
      smoothstep(range[0], range[1], sp) * (1 - smoothstep(range[2], range[3], sp));
    const fade = smoothstep(0, 0.45, presence);
    const t = state.clock.elapsedTime + phase;
    const g = outer.current;
    if (!g) return;
    g.visible = presence > 0.001;
    const d = reduced ? 0.3 : 1;
    const swimX = Math.sin(t * 0.13 * drift + phase * 0.37);
    const swimY = Math.cos(t * 0.1 * drift + phase * 0.51);
    const swimZ = Math.sin(t * 0.08 * drift + phase * 0.71);
    g.position.set(
      base.x + swimX * roam[0] * d,
      base.y + swimY * roam[1] * d,
      base.z + swimZ * roam[2] * d,
    );
    g.rotation.y = rotationY + (spin ? t * spin : Math.sin(t * 0.08 * drift) * 0.3);
    g.rotation.x = Math.sin(t * 0.09 * drift + phase) * 0.08;
    g.rotation.z = Math.sin(t * 0.12 * drift + phase) * 0.1;
    for (const { mat, base: b } of matsRef.current) mat.opacity = b * fade;
  });

  return (
    <group ref={outer} visible={false}>
      <primitive object={fitted} />
    </group>
  );
}

/**
 * Loads a real GLB creature with its own textures and colours, auto-fitted to a
 * target size, gently drifting, fading in/out across its act, and playing its
 * own animation if it has one. Wrapped so a failed/missing model never breaks
 * the scene.
 */
export default function RealCreature(props: Props) {
  return (
    <ErrorBoundary fallback={null}>
      <Suspense fallback={null}>
        <Model {...props} />
      </Suspense>
    </ErrorBoundary>
  );
}
