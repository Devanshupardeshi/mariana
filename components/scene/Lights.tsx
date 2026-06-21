'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import * as THREE from 'three';

import { scrollState } from '@/lib/scroll-state';
import { PALETTE } from '@/lib/constants';

/**
 * Custom three-point rig: a cool primary key from above, a warm gold point light
 * that orbits the creature, and an ultra-dim ambient so the void keeps its
 * contrast. The environment is built procedurally from Lightformers (no remote
 * HDR — the spec forbids it, and presets fetch over the network) so the salvage
 * GLB still receives believable reflections.
 */
export default function Lights() {
  const goldLight = useRef<THREE.PointLight>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const sp = scrollState.smoothProgress;
    if (goldLight.current) {
      const radius = 3.4;
      goldLight.current.position.set(
        Math.cos(t * 0.5) * radius,
        Math.sin(t * 0.35) * 1.6,
        Math.sin(t * 0.5) * radius,
      );
      // The hydrothermal warmth swells as we approach the trench floor.
      goldLight.current.intensity = 6 + Math.sin(t * 0.8) * 1.5 + sp * 22;
    }
  });

  return (
    <>
      {/* A dim blue fill so real, textured creatures read without washing the
          void; the glowing abstractions are unlit and unaffected. */}
      <ambientLight color="#121a38" intensity={0.9} />
      <hemisphereLight
        color={PALETTE.bioluminescentBlue}
        groundColor="#04060f"
        intensity={0.5}
      />
      <directionalLight
        position={[0, 12, 4]}
        color={PALETTE.bioluminescentBlue}
        intensity={2.2}
      />
      {/* Soft key from the camera so creatures facing us catch the light. */}
      <directionalLight position={[2.5, 3, 9]} color="#cdd6ff" intensity={1.0} />
      <pointLight
        ref={goldLight}
        color={PALETTE.hydrothermalGold}
        intensity={6}
        distance={28}
        decay={1.6}
      />

      <Environment resolution={64} frames={1}>
        <color attach="background" args={[PALETTE.voidBlack]} />
        <Lightformer
          form="rect"
          intensity={1.4}
          color={PALETTE.bioluminescentBlue}
          position={[0, 6, -4]}
          scale={[12, 12, 1]}
        />
        <Lightformer
          form="circle"
          intensity={1.1}
          color={PALETTE.hydrothermalGold}
          position={[5, -2, 2]}
          scale={[6, 6, 1]}
        />
        <Lightformer
          form="rect"
          intensity={0.4}
          color={PALETTE.bioluminescentBlue}
          position={[-6, 0, 3]}
          scale={[5, 10, 1]}
        />
      </Environment>
    </>
  );
}
