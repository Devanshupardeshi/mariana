/**
 * The Creature — a procedural deep-sea organism.
 *
 * Vertex shader: displaces the icosphere along its normals using layered 3D
 * simplex noise driven by `uTime` (the breathing pulse) and `uScrollProgress`
 * (the organism wakes and grows more agitated as the descent deepens).
 *
 * Fragment shader: a Fresnel term blends the bioluminescent blue core with the
 * hydrothermal gold rim at grazing angles, simulating light refracting through a
 * gelatinous, translucent body. Alpha falls off on facing surfaces so the form
 * reads as glass-like rather than solid, then bloom does the rest.
 */

import { NOISE_GLSL } from './noise.glsl';

export const CREATURE_VERTEX = /* glsl */ `
uniform float uTime;
uniform float uScrollProgress;
uniform float uPresence;
uniform vec2  uPointer;

varying vec3  vNormal;
varying vec3  vViewDir;
varying float vDisplacement;
varying vec3  vWorldPos;

${NOISE_GLSL}

void main() {
  vec3 pos = position;

  // Breathing: a slow base pulse plus higher-frequency surface ripples.
  // Kept gentle so the form stays smooth and gelatinous rather than spiky.
  float t = uTime * 0.32;
  float agitation = mix(0.3, 0.85, uScrollProgress);

  float slow = snoise(normal * 1.05 + vec3(0.0, t, 0.0));
  float fast = fbm(normal * 2.4 + vec3(t * 1.4, t * 0.7, t));
  float breathe = sin(uTime * 0.6) * 0.5 + 0.5;

  float displacement =
      slow * 0.24 * agitation
    + fast * 0.11 * agitation
    + breathe * 0.07;

  // The pointer gently tugs the surface toward the cursor for a tactile feel.
  float tug = dot(normalize(normal.xy + 0.0001), normalize(uPointer + 0.0001));
  displacement += tug * 0.05 * length(uPointer);

  // uPresence scales the whole organism in/out across acts.
  displacement *= uPresence;
  pos += normal * displacement;
  pos *= mix(0.55, 1.0, uPresence);

  vec4 worldPos = modelMatrix * vec4(pos, 1.0);
  vec4 mvPosition = viewMatrix * worldPos;

  vNormal = normalize(normalMatrix * normal);
  vViewDir = normalize(-mvPosition.xyz);
  vDisplacement = displacement;
  vWorldPos = worldPos.xyz;

  gl_Position = projectionMatrix * mvPosition;
}
`;

export const CREATURE_FRAGMENT = /* glsl */ `
precision highp float;

uniform float uTime;
uniform float uScrollProgress;
uniform float uPresence;
uniform vec3  uColorCore;   // bioluminescent blue
uniform vec3  uColorRim;    // hydrothermal gold
uniform vec3  uColorDeep;   // near-void interior

varying vec3  vNormal;
varying vec3  vViewDir;
varying float vDisplacement;
varying vec3  vWorldPos;

void main() {
  vec3 normal = normalize(vNormal);
  vec3 viewDir = normalize(vViewDir);

  // Fresnel: 0 facing the camera, 1 at grazing angles. abs() so the double-sided
  // back faces (whose normals point away) are treated as facing too — otherwise
  // every back face reads as full grazing and floods the body with rim colour.
  float fresnel = pow(1.0 - abs(dot(normal, viewDir)), 2.4);

  // Living light pulse travels across the body using the displacement value.
  float pulse = 0.5 + 0.5 * sin(uTime * 1.4 + vDisplacement * 6.0 + vWorldPos.y * 1.5);

  // Blend interior -> bioluminescent core -> gold rim. The indigo core fills the
  // body; gold is reserved for the extreme grazing edge so the organism reads as
  // a glowing blue jelly with a warm rim, not a solid amber egg.
  vec3 color = mix(uColorDeep, uColorCore, smoothstep(0.0, 0.38, fresnel));
  color = mix(color, uColorRim, smoothstep(0.74, 1.0, fresnel));

  // Bioluminescent veins: faint gold flecks riding the noise displacement.
  float veins = smoothstep(0.22, 0.46, abs(vDisplacement)) * pulse;
  color += uColorRim * veins * 0.2;

  // Core glow brightens gently with depth (the organism grows more luminous).
  float glow = mix(0.12, 0.45, uScrollProgress);
  color *= glow + fresnel * 0.7;

  // Translucent glass: facing surfaces are sheer, rims catch the light.
  float alpha = (0.05 + fresnel * 0.7) * uPresence;
  alpha = clamp(alpha, 0.0, 1.0);

  gl_FragColor = vec4(color, alpha);
}
`;
