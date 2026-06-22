'use client';

import { useEffect, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

import { useExperience } from '@/lib/store';
import { scrollState } from '@/lib/scroll-state';
import { clamp, damp, lerp, smoothstep } from '@/lib/math';

import Lights from './Lights';
import WaterSurface from './WaterSurface';
import GodRays from './GodRays';
import MarineSnow from './MarineSnow';
import Creature, { type CreatureConfig } from './Creature';
import RealCreature, { type RealCreatureConfig } from './RealCreature';
import LazyByRange from './LazyByRange';
import GoldenRing from './GoldenRing';
import SunkenSalvage, { type SalvageConfig } from './SunkenSalvage';

/**
 * Per-frame conductor: eases the raw scroll/pointer values into their smoothed
 * counterparts, dollies the camera through the dive, applies pointer parallax,
 * and grades the background/fog from surface indigo to abyssal black. In
 * reduced-motion mode it leaves the camera still and only grades the colour.
 */
function SceneController({ reduced }: { reduced: boolean }) {
  const { camera, scene } = useThree();

  const colors = useMemo(
    () => ({
      bgSurface: new THREE.Color('#0b0b0b').lerp(new THREE.Color('#6366f1'), 0.1),
      bgDeep: new THREE.Color('#040406'),
      fogSurface: new THREE.Color('#11132e'),
      fogDeep: new THREE.Color('#020203'),
    }),
    [],
  );

  useEffect(() => {
    scene.background = colors.bgSurface.clone();
    scene.fog = new THREE.Fog(colors.fogSurface.clone(), 11, 34);
    return () => {
      scene.fog = null;
    };
  }, [scene, colors]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const targetPressure = reduced
      ? 0
      : clamp((Math.abs(scrollState.velocity) - 420) / 6200);

    scrollState.smoothProgress = damp(
      scrollState.smoothProgress,
      scrollState.progress,
      3.4,
      dt,
    );
    scrollState.pressure = damp(
      scrollState.pressure,
      targetPressure,
      targetPressure > scrollState.pressure ? 7.2 : 3.1,
      dt,
    );
    const sp = scrollState.smoothProgress;
    const pressure = scrollState.pressure;

    if (!reduced) {
      scrollState.smoothPointerX = damp(
        scrollState.smoothPointerX,
        scrollState.pointerX,
        2.6,
        dt,
      );
      scrollState.smoothPointerY = damp(
        scrollState.smoothPointerY,
        scrollState.pointerY,
        2.6,
        dt,
      );

      const px = scrollState.smoothPointerX;
      const py = scrollState.smoothPointerY;
      camera.position.x = damp(camera.position.x, px * 1.2, 5, dt);
      camera.position.y = damp(
        camera.position.y,
        py * 0.8 - Math.sin(sp * Math.PI) * 0.6 - pressure * 0.58,
        5,
        dt,
      );
      camera.position.z = damp(
        camera.position.z,
        9.2 - Math.sin(sp * Math.PI) * 1.6 - pressure * 0.42,
        6,
        dt,
      );
      const lookY = lerp(3.4, -pressure * 0.55, smoothstep(0, 0.2, sp));
      camera.lookAt(0, lookY, 0);
    }

    const bg = scene.background as THREE.Color | null;
    if (bg && (bg as THREE.Color).isColor) {
      bg.copy(colors.bgSurface).lerp(colors.bgDeep, smoothstep(0.05, 0.45, sp));
    }
    const fog = scene.fog as THREE.Fog | null;
    if (fog) {
      fog.color.copy(colors.fogSurface).lerp(colors.fogDeep, smoothstep(0.05, 0.45, sp));
      fog.near = lerp(11, 5, sp);
      fog.far = lerp(34, 18, sp);
    }
  });

  return null;
}

export default function Experience() {
  const isCompact = useExperience((s) => s.isCompact);
  const quality = useExperience((s) => s.quality);
  const reduced = useExperience((s) => s.reducedMotion);

  const snowCount = reduced ? 4000 : isCompact ? 6000 : quality === 'low' ? 9000 : 13000;
  const ringCount = reduced ? 1800 : isCompact ? 2200 : quality === 'low' ? 3400 : 4800;
  const jellyDetail = reduced ? 12 : isCompact ? 12 : quality === 'low' ? 16 : 22;

  // A few abstract bioluminescent jellies — ambient light, kept subtle and to
  // the sides so the real creatures and the copy can breathe.
  const flock: CreatureConfig[] = [
    { position: [5.2, 2.15, -2.4], scale: 1.05, detail: jellyDetail, phase: 0, range: [0.34, 0.49, 0.7, 0.86], drift: 0.65, roam: [1.45, 0.85, 0.55] },
    { position: [-7.1, -1.35, -2.8], scale: 0.58, detail: 10, phase: 17, range: [0.4, 0.53, 0.74, 0.88], drift: 1.1, roam: [1.0, 0.85, 0.55], colorCore: '#7c83ff' },
    { position: [7.6, -2.6, -3.4], scale: 0.52, detail: 10, phase: 33, range: [0.46, 0.58, 0.78, 0.9], drift: 1.2, roam: [1.15, 0.75, 0.6], colorCore: '#5d7cff' },
  ];
  const flockVisible = reduced || isCompact ? flock.slice(0, 2) : flock;

  const salvage: SalvageConfig[] = [
    { position: [7.6, 1.2, -4.2], scale: 2.35, phase: 0, range: [0.18, 0.25, 0.34, 0.43], reduced },
  ];

  // The real, textured creatures — placed sparsely, one focus per zone, kept
  // clear of the centred copy. Each keeps its own materials/colours and plays
  // its own animation.
  const real: RealCreatureConfig[] = [
    // Real fish families visible from the surface. No procedural triangles.
    { url: '/models/fish_school.glb', position: [-5.1, -2.2, -5.2], size: 10.4, rotationY: -0.18, phase: 2, range: [-0.06, 0.0, 0.23, 0.32], speed: 0.9, drift: 1.05, roam: [2.4, 0.54, 0.5], travel: [4.6, 0.35, -0.4], bank: -0.08 },
    { url: '/models/fish_school.glb', position: [5.6, 1.15, -5.8], size: 8.4, rotationY: 2.75, phase: 13, range: [-0.04, 0.02, 0.2, 0.3], speed: 0.78, drift: 0.95, roam: [2.0, 0.5, 0.5], travel: [-3.8, -0.2, -0.25], bank: 0.07 },
    // Surface heroes: animated manta above, turtle below, framing the first act.
    { url: '/models/model_84b_-_manta_ray_swimming.glb', position: [8.9, 4.55, -20], size: 0.42, rotationY: -0.72, phase: 5, range: [-0.04, 0.02, 0.16, 0.24], speed: 0.72, drift: 0.78, roam: [0.55, 0.14, 0.16] },
    { url: '/models/sea_turtle.glb', position: [-6.4, 1.65, -4.7], size: 14.4, rotationY: 0.78, phase: 9, range: [-0.04, 0.01, 0.18, 0.28], speed: 0.85, drift: 0.9, roam: [0.85, 0.22, 0.35], travel: [2.8, 0.32, -0.2], bank: -0.06 },
    // A stingray gliding through the upper twilight into the midnight.
    { url: '/models/common_stingray.glb', position: [-7.7, 1.45, -5.3], size: 12.8, rotationY: 0.58, phase: 0, range: [0.17, 0.24, 0.34, 0.43], speed: 0.62, drift: 0.82, roam: [0.9, 0.38, 0.48], travel: [3.4, -0.25, -0.3], bank: -0.12 },
    // A real fish school crossing the lower frame.
    { url: '/models/fish_school.glb', position: [-6.9, -4.25, -9.4], size: 10.5, rotationY: -0.2, phase: 7, range: [0.22, 0.34, 0.68, 0.82], speed: 0.9, drift: 1.15, roam: [1.8, 0.55, 0.8], travel: [4.2, 0.35, -0.4], bank: -0.08 },
    // The octopus — a midnight centrepiece set off to the left of the copy.
    { url: '/models/octpus.glb', position: [7.2, -3.2, -7.1], size: 7.8, rotationY: -0.65, phase: 4, range: [0.36, 0.5, 0.6, 0.68], speed: 0.55, drift: 0.8, spin: 0.055, roam: [1.25, 0.6, 0.7], travel: [-2.4, 0.55, -0.5] },
    // A detailed fish accent on the right as we approach the floor.
    { url: '/models/BarramundiFish.glb', position: [-7.4, 0.65, -6.4], size: 12.2, rotationY: 0.7, phase: 11, range: [0.62, 0.7, 0.88, 0.96], speed: 0.62, drift: 1.05, roam: [1.1, 0.55, 0.55], travel: [2.3, -0.2, -0.35], bank: -0.1 },
    // Alien abyss fish: big right-side hero for the last deep phase.
    { url: '/models/alien_fish_animated.glb', position: [7.4, -0.15, -6.1], size: 13.6, rotationY: -0.75, phase: 19, range: [0.64, 0.72, 0.9, 0.98], speed: 0.7, drift: 0.95, roam: [1.0, 0.55, 0.55], travel: [-2.2, 0.28, -0.35], bank: 0.1, materialGrade: 'abyssAlien' },
    // Bottom-dwelling isopod for the hadal floor.
    { url: '/models/giant_isopod.glb', position: [-7.0, 3.35, -6.2], size: 7.2, rotationY: 0.72, phase: 23, range: [0.38, 0.48, 0.6, 0.7], speed: 0.35, drift: 0.55, roam: [0.42, 0.12, 0.28], travel: [1.4, -0.24, -0.15] },
  ];
  const realVisible = reduced ? real.slice(0, 4) : isCompact ? real.slice(0, 5) : real;

  return (
    <>
      <SceneController reduced={reduced} />
      <Lights />
      <WaterSurface reduced={reduced} />
      {/* Surface sun-rays (top) + hydrothermal shafts rising in the deep (gold). */}
      <GodRays reduced={reduced} />
      <GodRays
        reduced={reduced}
        color="#d4af7a"
        fromBottom
        shaftCount={5}
        maxOpacity={0.6}
        position={[0, -7, -13]}
        size={[64, 48]}
        range={[0.58, 0.74, 1.1, 1.2]}
      />
      <MarineSnow count={snowCount} reduced={reduced} />
      {flockVisible.map((c, i) => (
        <Creature key={i} {...c} reduced={reduced} />
      ))}
      {realVisible.map((r, i) => (
        <LazyByRange key={`${r.url}-${i}`} range={r.range} margin={0.12}>
          <RealCreature {...r} reduced={reduced} />
        </LazyByRange>
      ))}
      <GoldenRing count={ringCount} reduced={reduced} />
      {salvage.map((s, i) => (
        <SunkenSalvage key={i} {...s} />
      ))}
    </>
  );
}
