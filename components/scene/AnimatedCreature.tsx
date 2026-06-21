'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import { clone as skeletonClone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import * as THREE from 'three';

import { scrollState } from '@/lib/scroll-state';
import { smoothstep } from '@/lib/math';

export interface AnimatedCreatureConfig {
  url: string;
  position: [number, number, number];
  scale: number;
  rotationY?: number;
  phase: number;
  /** Presence windows in scroll progress: [inStart, inEnd, outStart, outEnd]. */
  range: [number, number, number, number];
  /** Body tint. */
  color: string;
  /** Emissive glow colour. */
  glow?: string;
  /** Skeletal animation playback rate (the wing-flap becomes a slow swim). */
  speed?: number;
  drift?: number;
  /** Keep the model's original textures/materials (for real, detailed fish). */
  keepMaterial?: boolean;
}

interface Props extends AnimatedCreatureConfig {
  reduced: boolean;
}

/**
 * A real, rigged GLB creature (three.js' CC-BY Flamingo / Parrot / Stork),
 * re-skinned as a translucent bioluminescent organism and re-timed so its
 * wing-flap reads as a graceful deep-sea glide. Cloned via SkeletonUtils so each
 * instance carries its own skeleton + animation mixer.
 */
export default function AnimatedCreature({
  url,
  position,
  scale,
  rotationY = 0,
  phase,
  range,
  color,
  glow,
  speed = 0.5,
  drift = 1,
  keepMaterial = false,
  reduced,
}: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const matRef = useRef<THREE.MeshBasicMaterial | null>(null);
  const { scene, animations } = useGLTF(url);

  const model = useMemo(() => {
    const c = skeletonClone(scene);
    if (keepMaterial) {
      // Real, detailed fish: keep its textures, just disable culling.
      c.traverse((o) => {
        if ((o as THREE.Mesh).isMesh) (o as THREE.Mesh).frustumCulled = false;
      });
      return c;
    }
    // Lighting-independent glow so the organism always reads in our palette
    // (the original bird texture is intentionally replaced by bioluminescence),
    // and so it never collapses into a black silhouette in the dark.
    const mat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(glow ?? color),
      transparent: true,
      opacity: 0.72,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.NormalBlending,
    });
    matRef.current = mat;
    c.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.material = mat;
        mesh.frustumCulled = false;
      }
    });
    return c;
  }, [scene, color, glow, keepMaterial]);

  const { actions, names } = useAnimations(animations, model);

  useEffect(() => {
    const first = names[0] ? actions[names[0]] : null;
    if (first) {
      first.reset().play();
      first.timeScale = reduced ? 0.0001 : speed;
    }
    return () => {
      first?.stop();
    };
  }, [actions, names, speed, reduced]);

  const base = useMemo(() => new THREE.Vector3(...position), [position]);

  useFrame((state) => {
    const sp = scrollState.smoothProgress;
    const presence =
      smoothstep(range[0], range[1], sp) * (1 - smoothstep(range[2], range[3], sp));
    const t = state.clock.elapsedTime + phase;
    const g = groupRef.current;
    if (!g) return;
    g.visible = presence > 0.001;
    // Grow + fade in for a soft materialising transition.
    g.scale.setScalar(scale * (0.7 + 0.3 * presence));
    if (matRef.current) matRef.current.opacity = 0.74 * smoothstep(0.0, 0.5, presence);
    const d = reduced ? 0.3 : 1;
    g.position.set(
      base.x + Math.sin(t * 0.12 * drift) * 1.6 * d,
      base.y + Math.cos(t * 0.1 * drift) * 0.9 * d,
      base.z + Math.sin(t * 0.08 * drift + phase) * 1.1 * d,
    );
    g.rotation.y = rotationY + Math.sin(t * 0.1 * drift) * 0.5;
    g.rotation.z = Math.sin(t * 0.13 * drift + phase) * 0.12;
  });

  return (
    <group ref={groupRef} visible={false}>
      <primitive object={model} />
    </group>
  );
}

useGLTF.preload('/models/Flamingo.glb');
useGLTF.preload('/models/Parrot.glb');
useGLTF.preload('/models/Stork.glb');
useGLTF.preload('/models/BarramundiFish.glb');
