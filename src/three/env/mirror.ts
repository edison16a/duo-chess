/** Additive planar reflections for glossy floors and still water. */

import * as THREE from "three";
import { Reflector } from "three/examples/jsm/objects/Reflector.js";
import type { Kit } from "./kit";
import { NOISE_GLSL } from "./noise";

export interface MirrorOptions {
  size?: number;
  /** Overall reflection brightness. */
  strength?: number;
  tint?: THREE.ColorRepresentation;
  /** Ripple distortion in uv units: 0 for polished stone, a few thousandths for water. */
  ripple?: number;
  /** Blur radius in uv units, for glossy rather than mirror floors. */
  blur?: number;
  /** Distance from the origin where the reflection fades out. */
  fade?: number;
  y?: number;
}

/**
 * Adds a planar reflection on top of an opaque floor with additive blending,
 * so the floor keeps its own lighting and shadows and the reflection reads
 * as a gloss layer. It skips the depth of field depth pass to save a render.
 */
export function mirror(kit: Kit, o: MirrorOptions = {}): Reflector {
  const canvas = kit.stage.renderer.domElement;
  const shader = {
    name: "EnvMirror",
    uniforms: {
      color: { value: null }, tDiffuse: { value: null }, textureMatrix: { value: null },
      uStrength: { value: o.strength ?? 0.5 }, uRipple: { value: o.ripple ?? 0 }, uBlur: { value: o.blur ?? 0.002 }, uFade: { value: o.fade ?? 14 }, uTime: kit.time,
    },
    vertexShader: /* glsl */ `
      uniform mat4 textureMatrix; varying vec4 vUv; varying vec3 vWorld;
      void main() { vUv = textureMatrix * vec4(position, 1.0); vWorld = (modelMatrix * vec4(position, 1.0)).xyz; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 color; uniform sampler2D tDiffuse; uniform float uStrength, uRipple, uBlur, uFade, uTime;
      varying vec4 vUv; varying vec3 vWorld;
      ${NOISE_GLSL}
      void main() {
        vec2 uv = vUv.xy / vUv.w;
        vec2 w = vWorld.xz * 3.0;
        uv += uRipple * vec2(vnoise(vec3(w, uTime * 0.6)) - 0.5, vnoise(vec3(w + 7.3, uTime * 0.6)) - 0.5);
        vec3 c = texture2D(tDiffuse, uv).rgb * 0.36;
        c += texture2D(tDiffuse, uv + vec2(uBlur, 0.0)).rgb * 0.16 + texture2D(tDiffuse, uv - vec2(uBlur, 0.0)).rgb * 0.16;
        c += texture2D(tDiffuse, uv + vec2(0.0, uBlur)).rgb * 0.16 + texture2D(tDiffuse, uv - vec2(0.0, uBlur)).rgb * 0.16;
        vec3 view = normalize(cameraPosition - vWorld);
        float fresnel = mix(0.35, 1.0, pow(1.0 - max(view.y, 0.0), 3.0));
        float fade = 1.0 - smoothstep(uFade * 0.5, uFade, length(vWorld.xz));
        gl_FragColor = vec4(c * color * uStrength * fresnel * fade, 1.0);
      }
    `,
  };
  const size = o.size ?? 60;
  const r = new Reflector(new THREE.PlaneGeometry(size, size), {
    shader, color: o.tint ?? 0xffffff, multisample: 0,
    textureWidth: Math.max(256, Math.round(canvas.width * 0.6)), textureHeight: Math.max(256, Math.round(canvas.height * 0.6)),
  });
  const mat = r.material as THREE.ShaderMaterial;
  mat.transparent = true;
  mat.depthWrite = false;
  mat.blending = THREE.AdditiveBlending;
  r.rotation.x = -Math.PI / 2;
  r.position.y = o.y ?? 0.004;
  const render = r.onBeforeRender;
  r.onBeforeRender = function (renderer, scene, camera, geometry, material, group) {
    if (scene.overrideMaterial) return;
    render.call(this, renderer, scene, camera, geometry, material, group);
  };
  kit.own(r);
  kit.root.add(r);
  return r;
}
