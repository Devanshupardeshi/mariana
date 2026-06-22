/**
 * Water surface — viewed from just beneath. A plane (laid flat by the mesh's
 * rotation) is displaced by layered travelling waves. Seen from below it reads
 * as the shifting underside of the sea, indigo in the troughs and luminous along
 * the crests. The whole sheet recedes and dims as the descent begins.
 */

import { NOISE_GLSL } from './noise.glsl';

export const WATER_VERTEX = /* glsl */ `
uniform float uTime;
uniform float uScrollProgress;
uniform float uVelocityPressure;
uniform vec2  uPointer;

varying float vCrest;
varying vec2  vUv;

${NOISE_GLSL}

void main() {
  vUv = uv;
  vec3 pos = position;

  float depth = smoothstep(0.04, 0.92, uScrollProgress);
  float pressure = smoothstep(0.0, 1.0, uVelocityPressure);
  float storm = mix(1.0, 2.9, depth) + pressure * mix(0.45, 1.35, depth);
  float tempo = mix(1.0, 1.85, depth) + pressure * 1.15;

  // Travelling wave sets plus increasingly aggressive deep-current chop.
  float w1 = sin(pos.x * mix(0.18, 0.32, depth) + uTime * 0.6 * tempo) *
    cos(pos.y * mix(0.15, 0.28, depth) + uTime * 0.45 * tempo);
  float w2 = sin((pos.x + pos.y) * mix(0.09, 0.18, depth) - uTime * 0.4 * tempo);
  float w3 = sin(pos.x * 0.52 - pos.y * 0.2 + uTime * 1.15) * depth;
  float chop = fbm(vec3(pos.xy * mix(0.08, 0.16, depth), uTime * mix(0.15, 0.32, depth)));
  float shear = sin(pos.x * 1.12 + pos.y * 0.43 - uTime * 2.35) * pressure * mix(0.45, 1.25, depth);

  float height = (w1 * 1.6 + w2 * 1.2 + w3 * 0.75 + chop * 1.7 + shear * 1.15) * storm;

  // The pointer subtly tilts the sheet, so peering around distorts the surface.
  height += (uPointer.x * pos.x + uPointer.y * pos.y) * 0.01;

  pos.z += height;
  vCrest = height;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

export const WATER_FRAGMENT = /* glsl */ `
precision highp float;

uniform float uScrollProgress;
uniform float uVelocityPressure;
uniform float uOpacity;
uniform vec3  uColorDeep;    // indigo trough
uniform vec3  uColorLight;   // luminous crest

varying float vCrest;
varying vec2  vUv;

void main() {
  float depth = smoothstep(0.04, 0.95, uScrollProgress);
  float pressure = smoothstep(0.0, 1.0, uVelocityPressure);
  // Crest height -> brightness.
  float crest = smoothstep(-1.2, mix(2.4, 5.4, depth), vCrest);
  vec3 deepVoid = vec3(0.018, 0.018, 0.04);
  vec3 coldBlue = mix(uColorDeep, deepVoid, depth * 0.72);
  vec3 electricCrest = mix(uColorLight, vec3(0.42, 0.48, 1.0), depth * 0.55);
  vec3 color = mix(coldBlue, electricCrest, crest);

  // Radial vignette so the sheet dissolves toward its edges into the void.
  float vignette = smoothstep(0.95, 0.35, distance(vUv, vec2(0.5)));

  // Keep the wave field alive through the entire descent, but let the deep
  // compress it into a darker, harder glint instead of a bright surface sheet.
  float depthPresence = mix(1.0, 0.46, depth);
  float abyssGlint = smoothstep(0.58, 0.95, uScrollProgress) * smoothstep(0.18, 0.86, crest);
  abyssGlint += pressure * 0.16 * smoothstep(0.08, 0.9, crest);

  float alpha = (0.1 + crest * mix(0.5, 0.34, depth) + abyssGlint * 0.16) *
    vignette * depthPresence * uOpacity;
  gl_FragColor = vec4(color, clamp(alpha, 0.0, 1.0));
}
`;
