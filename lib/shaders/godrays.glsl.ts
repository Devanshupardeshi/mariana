/**
 * God rays — volumetric light shafts piercing down from the surface.
 *
 * Rendered on a tall, camera-facing quad with additive blending. The fragment
 * shader carves soft vertical shafts out of noise, brightest at the top and
 * dissolving toward the deep. The pointer skews the shafts so moving the cursor
 * feels like shifting one's gaze through drifting light. Used for both the Act I
 * sun rays and the preloader's single volumetric shaft.
 */

import { NOISE_GLSL } from './noise.glsl';

export const GODRAYS_VERTEX = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const GODRAYS_FRAGMENT = /* glsl */ `
precision highp float;

uniform float uTime;
uniform float uOpacity;
uniform float uShaftCount;
uniform float uFlip;      // 0 = shafts from top, 1 = rising from below
uniform vec2  uPointer;
uniform vec3  uColor;

varying vec2 vUv;

${NOISE_GLSL}

void main() {
  vec2 uv = vUv;
  // Origin: top for sun rays, bottom for hydrothermal shafts.
  float uvy = mix(uv.y, 1.0 - uv.y, uFlip);

  // Skew columns toward the source and with the pointer — a perspective fan.
  float skew = (uvy - 1.0) * 0.35 + uPointer.x * 0.18;
  float x = uv.x + skew;

  // Banded shafts modulated by slow-moving noise so they shimmer.
  float bands = sin(x * uShaftCount * 3.14159);
  float drift = fbm(vec3(x * 4.0, uvy * 1.5 - uTime * 0.08, uTime * 0.05));
  float shafts = smoothstep(0.2, 1.0, bands * 0.5 + 0.5) * (0.5 + drift * 0.6);

  // Bright at the source, fading along the shaft.
  float sourceFade = smoothstep(0.0, 0.85, uvy);
  float sideFade = smoothstep(0.0, 0.18, uv.x) * smoothstep(1.0, 0.82, uv.x);

  // Overall presence is driven from JS via uOpacity (per-act window).
  float intensity = shafts * sourceFade * sideFade * uOpacity;
  gl_FragColor = vec4(uColor * intensity, intensity);
}
`;
