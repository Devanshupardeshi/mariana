/**
 * Particle shaders.
 *
 * MARINE SNOW — thousands of motes drifting *upward* relative to the camera to
 * sell the illusion of a downward dive. Cold and near-invisible at the surface,
 * they ignite with bioluminescence in the midnight zone and gather toward the
 * centre (`uGather`) to swarm around the waking creature.
 *
 * GOLDEN RING — a dense torus of motes that fades in at the trench floor
 * (`uReveal`), orbits slowly and settles into a calm planetary rotation for the
 * sanctuary.
 */

import { NOISE_GLSL } from './noise.glsl';

export const MARINE_SNOW_VERTEX = /* glsl */ `
uniform float uTime;
uniform float uScrollProgress;
uniform float uVelocityPressure;
uniform float uSize;
uniform float uPixelRatio;
uniform float uGather;     // 0..1 pull toward the centre shell
uniform float uCeremony;   // 0..1 final inward spiral
uniform float uFieldDepth; // half-height of the drift volume

attribute float aSeed;
attribute float aScale;

varying float vSeed;
varying float vGlow;
varying float vPressure;

${NOISE_GLSL}

void main() {
  vSeed = aSeed;
  float pressure = smoothstep(0.0, 1.0, uVelocityPressure);
  float ceremony = smoothstep(0.0, 1.0, uCeremony);
  vPressure = pressure;

  vec3 pos = position;

  // Upward drift, wrapped within the field so the stream is endless.
  float speed = mix(2.2, 6.5, uScrollProgress) * (0.6 + aSeed * 0.8) * (1.0 + pressure * 1.85);
  pos.y = mod(pos.y + uTime * speed + aSeed * 100.0, uFieldDepth * 2.0) - uFieldDepth;

  // Lateral sway so the column feels alive, not mechanical.
  float sway = snoise(vec3(aSeed * 12.0, uTime * 0.15, pos.y * 0.05));
  pos.x += sway * (1.4 + pressure * 2.2);
  pos.z += snoise(vec3(uTime * 0.12, aSeed * 7.0, pos.y * 0.04)) * (1.4 + pressure * 1.6);
  pos.y += sin(uTime * 8.0 + aSeed * 40.0) * pressure * 0.42;

  // Gather: ease each mote toward a noisy shell around the origin for the swarm.
  vec3 dir = normalize(pos + 0.0001);
  float radius = mix(3.2, 5.4, fract(aSeed * 3.17));
  vec3 shell = dir * radius;
  shell += vec3(
    snoise(vec3(aSeed * 4.0, uTime * 0.4, 0.0)),
    snoise(vec3(0.0, aSeed * 4.0, uTime * 0.4)),
    snoise(vec3(uTime * 0.4, 0.0, aSeed * 4.0))
  ) * 1.1;
  pos = mix(pos, shell, smoothstep(0.0, 1.0, uGather));

  // Final ceremony: motes stop behaving like dust and spiral inward to feed the ring.
  float angle = atan(pos.z, pos.x);
  float radius = length(pos.xz);
  angle += ceremony * (2.4 + aSeed * 3.0) - uTime * 0.52 * ceremony;
  radius = mix(radius, mix(2.4, 5.6, fract(aSeed * 4.71)), ceremony * 0.72);
  pos.x = cos(angle) * radius;
  pos.z = sin(angle) * radius;
  pos.y = mix(pos.y, pos.y * 0.42 + sin(angle * 3.0 + uTime + aSeed * 8.0) * 0.72, ceremony * 0.62);

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);

  // Twinkle drives both size and brightness.
  float twinkle = 0.6 + 0.4 * sin(uTime * 2.0 + aSeed * 30.0);
  vGlow = twinkle;

  // Large, soft, perspective-scaled motes that overlap into a luminous nebula.
  float size = uSize * aScale * twinkle * (1.0 + pressure * 0.18 + ceremony * 0.2) * uPixelRatio / -mvPosition.z;
  gl_PointSize = clamp(size, 1.0, 84.0);
  gl_Position = projectionMatrix * mvPosition;
}
`;

export const MARINE_SNOW_FRAGMENT = /* glsl */ `
precision highp float;

uniform float uScrollProgress;
uniform float uOpacity;
uniform vec3  uColorCold;
uniform vec3  uColorBio;
uniform vec3  uColorGold;

varying float vSeed;
varying float vGlow;
varying float vPressure;

void main() {
  // Very soft circular sprite (cloud-like falloff) so dense overlaps read as
  // billowing snow rather than hard dots.
  vec2 uv = gl_PointCoord - 0.5;
  vec2 streakUv = vec2(uv.x, uv.y * mix(1.0, 0.46, vPressure));
  float d = length(streakUv);
  float mask = pow(smoothstep(0.5, 0.0, d), 1.5);
  if (mask <= 0.001) discard;

  // Cold dust -> bioluminescent blue -> gold as the descent deepens.
  vec3 color = mix(uColorCold, uColorBio, smoothstep(0.25, 0.6, uScrollProgress));
  color = mix(color, uColorGold, smoothstep(0.62, 0.9, uScrollProgress) * step(0.4, fract(vSeed * 5.0)));

  float brightness = mix(0.45, 0.9, smoothstep(0.1, 0.7, uScrollProgress)) * vGlow;
  // A bright core inside a soft halo.
  float core = smoothstep(0.42, 0.0, d);
  vec3 finalColor = color * (brightness + core * 0.6);

  // Per-mote alpha tuned so a dense field reads as a substantial, luminous
  // nebula (not faint specks) while still accumulating with structure.
  float alpha = mask * uOpacity * (0.12 + brightness * 0.42 + vPressure * 0.08);
  gl_FragColor = vec4(finalColor, alpha);
}
`;

export const RING_VERTEX = /* glsl */ `
uniform float uTime;
uniform float uSize;
uniform float uPixelRatio;
uniform float uReveal;   // 0..1 fade/assemble
uniform float uOrbit;    // orbital speed multiplier (eases down for sanctuary)
uniform float uCeremony; // 0..1 final inward spiral and breath

attribute float aSeed;
attribute float aScale;
attribute float aAngle;
attribute float aRadius;

varying float vSeed;
varying float vGlow;

${NOISE_GLSL}

void main() {
  vSeed = aSeed;

  float ceremony = smoothstep(0.0, 1.0, uCeremony);
  float angle = aAngle + uTime * 0.12 * uOrbit * (0.8 + aSeed * 0.4);
  angle += ceremony * (2.0 + aSeed * 1.8) + uTime * 0.34 * ceremony;
  float radius = aRadius * mix(0.2, 1.0, smoothstep(0.0, 1.0, uReveal));
  radius = mix(radius, radius * 0.72, ceremony * 0.78);

  vec3 pos;
  pos.x = cos(angle) * radius;
  pos.z = sin(angle) * radius;
  // Gentle vertical bob, thicker ring at reveal then flattening into orbit.
  pos.y = sin(angle * 3.0 + uTime * 0.4 + aSeed * 10.0) * mix(1.4, 0.5, uReveal);
  pos.y += (aSeed - 0.5) * 1.6 * (1.0 - uReveal * 0.6);
  pos.y *= mix(1.0, 0.48, ceremony);

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);

  float twinkle = 0.55 + 0.45 * sin(uTime * 1.6 + aSeed * 24.0);
  vGlow = twinkle * uReveal * (1.0 + ceremony * 0.45);

  float size = uSize * aScale * twinkle * uPixelRatio / -mvPosition.z;
  gl_PointSize = clamp(size, 0.5, 44.0);
  gl_Position = projectionMatrix * mvPosition;
}
`;

export const RING_FRAGMENT = /* glsl */ `
precision highp float;

uniform vec3  uColorGold;
uniform vec3  uColorHot;
uniform float uOpacity;

varying float vSeed;
varying float vGlow;

void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  float mask = smoothstep(0.5, 0.0, d);
  if (mask <= 0.001) discard;

  float core = smoothstep(0.5, 0.04, d);
  vec3 color = mix(uColorGold, uColorHot, core * (0.4 + vSeed * 0.6));
  vec3 finalColor = color * (0.45 + vGlow * 0.95 + core * 1.0);

  gl_FragColor = vec4(finalColor, mask * uOpacity * vGlow * 0.85);
}
`;
