'use client';

import { Suspense, useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

import { scrollState } from '@/lib/scroll-state';
import { PALETTE } from '@/lib/constants';
import { smoothstep, lerp } from '@/lib/math';
import ErrorBoundary from './ErrorBoundary';

const MODEL_URL = '/models/salvage.glb';

export interface SalvageConfig {
  position: [number, number, number];
  scale: number;
  phase: number;
  /** Presence windows in scroll progress: [inStart, inEnd, outStart, outEnd]. */
  range: [number, number, number, number];
  reduced: boolean;
}

/** Shared slow-tumble drift + act-gated presence for both real and fallback. */
function useSalvageMotion(ref: React.RefObject<THREE.Object3D>, cfg: SalvageConfig) {
  const base = useMemo(() => new THREE.Vector3(...cfg.position), [cfg.position]);
  useFrame((state, delta) => {
    const obj = ref.current;
    if (!obj) return;
    const sp = scrollState.smoothProgress;
    const t = state.clock.elapsedTime + cfg.phase;

    const presence =
      smoothstep(cfg.range[0], cfg.range[1], sp) * (1 - smoothstep(cfg.range[2], cfg.range[3], sp));
    const local = cfg.range[3] > cfg.range[0]
      ? Math.min(Math.max((sp - cfg.range[0]) / (cfg.range[3] - cfg.range[0]), 0), 1)
      : 0;
    obj.visible = presence > 0.001;
    obj.scale.setScalar(lerp(0.72, 1, smoothstep(0, 0.55, presence)) * presence * cfg.scale);

    if (!cfg.reduced) {
      obj.rotation.x += delta * 0.06;
      obj.rotation.y += delta * 0.09;
    }
    // Slow sink with a gentle sway, descending as the dive deepens.
    obj.position.set(
      base.x + Math.sin(t * 0.18) * 0.55,
      base.y - local * 0.8 + Math.sin(t * 0.25) * 0.35,
      base.z + Math.cos(t * 0.16) * 0.45,
    );
  });
}

/** The verified Khronos GLB — kept detailed so it reads as a sunken relic. */
function SalvageModel({ cfg }: { cfg: SalvageConfig }) {
  const ref = useRef<THREE.Group>(null);
  const { scene } = useGLTF(MODEL_URL);

  const model = useMemo(() => {
    const clone = scene.clone(true);
    // Keep the original detailed materials, but corrode them toward the deep:
    // darker, more metallic, with a faint hydrothermal glow catching the gloom.
    clone.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (mesh.isMesh) {
        const src = mesh.material as THREE.MeshStandardMaterial;
        const mat = (src.clone ? src.clone() : src) as THREE.MeshStandardMaterial;
        if (mat) {
          mat.metalness = Math.min(1, (mat.metalness ?? 0.5) + 0.25);
          mat.roughness = Math.min(1, (mat.roughness ?? 0.5) + 0.15);
          mat.color?.multiplyScalar(0.55);
          mat.emissive = new THREE.Color(PALETTE.hydrothermalGold);
          mat.emissiveIntensity = 0.18;
          mat.envMapIntensity = 0.6;
          mat.needsUpdate = true;
          mesh.material = mat;
        }
        mesh.castShadow = false;
        mesh.receiveShadow = false;
      }
    });
    return clone;
  }, [scene]);

  useSalvageMotion(ref, cfg);

  return (
    <group ref={ref} visible={false}>
      <primitive object={model} />
    </group>
  );
}

/** Procedural fallback: a corroded rock, used if the GLB can't be fetched. */
function SalvageFallback({ cfg }: { cfg: SalvageConfig }) {
  const ref = useRef<THREE.Group>(null);
  const geometry = useMemo(() => new THREE.DodecahedronGeometry(1.6, 0), []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useSalvageMotion(ref, cfg);

  return (
    <group ref={ref} visible={false}>
      <mesh geometry={geometry}>
        <meshStandardMaterial
          color="#1a1d28"
          metalness={0.85}
          roughness={0.6}
          emissive={PALETTE.hydrothermalGold}
          emissiveIntensity={0.14}
          flatShading
        />
      </mesh>
    </group>
  );
}

/**
 * Environmental debris — a piece of sunken salvage. Loaded from a local copy of
 * a verified, CORS-safe Khronos sample asset; if the file is unavailable it
 * degrades to a procedural rock, so the scene never breaks.
 */
export default function SunkenSalvage(cfg: SalvageConfig) {
  return (
    <ErrorBoundary fallback={<SalvageFallback cfg={cfg} />}>
      <Suspense fallback={<SalvageFallback cfg={cfg} />}>
        <SalvageModel cfg={cfg} />
      </Suspense>
    </ErrorBoundary>
  );
}

// Best-effort warm cache; failures are caught at render time.
useGLTF.preload(MODEL_URL);
