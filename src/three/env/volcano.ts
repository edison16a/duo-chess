/**
 * Volcano: black basalt split by glowing lava cracks, a lava river crossing
 * the background, jagged rocks and a distant erupting cone under a burning
 * sky, with embers rising and smoke rolling through.
 */

import * as THREE from "three";
import { glowTexture } from "../core/textures";
import { behind, CLEAR, drift, faceted, glow, Kit, lamp, mirror, mist, NOISE_GLSL, rimGlow, rng, rock, sky, solid, spot, v3 } from "./shared";
import type { EnvironmentBuilder } from "./types";

/** Lateral and depth axes of the shot on the floor, so the river runs across the frame. */
const DEPTH = [-0.498, -0.867];
const SIDE = [0.867, -0.498];

const LAVA_GLSL = /* glsl */ `
  ${NOISE_GLSL}
  vec2 hash22(vec2 p) { p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3))); return fract(sin(p) * 43758.5453); }
  // Distance to the nearest Voronoi cell border: small values trace a network of cracks.
  float cracks(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    float d1 = 8.0, d2 = 8.0;
    for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
      vec2 g = vec2(float(x), float(y));
      vec2 o = hash22(i + g);
      float d = length(g + o - f);
      if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) d2 = d;
    }
    return d2 - d1;
  }
  vec3 lavaRamp(float h) {
    return mix(mix(vec3(0.05, 0.01, 0.0), vec3(2.6, 0.55, 0.08), smoothstep(0.0, 0.55, h)), vec3(4.0, 2.0, 0.5), smoothstep(0.6, 1.0, h));
  }
  float riverMask(vec2 w, out float along) {
    float u = dot(w, vec2(${DEPTH[0]}, ${DEPTH[1]}));
    along = dot(w, vec2(${SIDE[0]}, ${SIDE[1]}));
    float centre = 9.4 + sin(along * 0.33) * 1.1 + sin(along * 0.9 + 1.0) * 0.3;
    return 1.0 - smoothstep(1.0, 1.5, abs(u - centre));
  }
`;

/** Basalt floor with animated lava cracks and the river, all in one lit material. */
function basalt(kit: Kit): THREE.MeshStandardMaterial {
  const mat = new THREE.MeshStandardMaterial({ color: 0x141110, roughness: 0.86, metalness: 0.05, envMapIntensity: 0.35 });
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = kit.time;
    shader.vertexShader = "varying vec2 vW;\n" + shader.vertexShader.replace("#include <project_vertex>", "#include <project_vertex>\n vW = (modelMatrix * vec4(transformed, 1.0)).xz;");
    shader.fragmentShader = "varying vec2 vW;\nuniform float uTime;\n" + LAVA_GLSL + shader.fragmentShader
      .replace("#include <color_fragment>", `#include <color_fragment>
        float along; float river = riverMask(vW, along);
        float e = cracks(vW * vec2(0.9, 1.3) + vec2(fbm(vec3(vW * 0.7, 1.0)), fbm(vec3(vW * 0.7, 9.0))) * 2.2);
        float live = smoothstep(0.45, 0.6, fbm(vec3(vW * 0.3, 5.0)));
        float rough = fbm(vec3(vW * 2.2, 3.0));
        diffuseColor.rgb *= 0.55 + rough * 0.9;
        diffuseColor.rgb *= 1.0 - river * 0.9;`)
      .replace("#include <emissivemap_fragment>", `#include <emissivemap_fragment>
        float near = smoothstep(0.8, 4.0, length(vW));
        float pulse = 0.65 + 0.35 * sin(uTime * 1.3 + vW.x * 0.7 + vW.y * 0.4);
        float heat = (1.0 - smoothstep(0.0, 0.03 + 0.05 * fbm(vec3(vW * 1.7, 2.0)), e)) * live * (0.25 + 0.75 * near) * pulse * (0.4 + 0.8 * fbm(vec3(vW * 0.5, uTime * 0.1)));
        float halo = (1.0 - smoothstep(0.0, 0.3, e)) * 0.1 * near * live;
        float flow = fbm(vec3(dot(vW, vec2(${DEPTH[0]}, ${DEPTH[1]})) * 0.9, along * 0.35 - uTime * 0.25, uTime * 0.12));
        float crust = smoothstep(0.55, 0.7, fbm(vec3(along * 0.6 - uTime * 0.25, dot(vW, vec2(${DEPTH[0]}, ${DEPTH[1]})) * 1.5, 7.0)));
        totalEmissiveRadiance += lavaRamp(heat) * step(0.001, heat) + vec3(1.0, 0.25, 0.04) * halo;
        totalEmissiveRadiance += river * lavaRamp(clamp(flow * 1.2 - crust * 0.6, 0.0, 1.0)) * 0.9;`);
  };
  mat.customProgramCacheKey = () => "volcano-basalt";
  return mat;
}

export const volcano: EnvironmentBuilder = (stage) => {
  const kit = new Kit(stage);
  const r = rng(23);
  kit.sky(0x1a0705, new THREE.FogExp2(0x1c0805, 0.02));
  sky(kit, {
    top: 0x040102, horizon: 0x6a1e08, bottom: 0x1a0705,
    sun: { dir: v3(-0.5, 0.12, -0.86), color: 0x8a2a0a, size: 0.12, power: 0.8 },
    clouds: { amount: 0.85, color: 0x0a0405, lit: 0x8a2c0c, scale: 1.4, speed: 0.015 },
  });

  // Hot back light and lava bounce from below; a neutral spot keeps the hero readable.
  kit.key.color.set(0xffb27a);
  kit.key.intensity = 0.3;
  kit.rim.color.set(0xff6a28);
  kit.rim.intensity = 2.4;
  kit.rim.position.set(-4, 6, -8);
  kit.hemi.color.set(0x6a2a18);
  kit.hemi.groundColor.set(0x3a0c04);
  kit.hemi.intensity = 0.22;
  spot(kit, 0xffe2c8, 55, v3(-1.4, 4.4, 3.6), 0.32);
  lamp(kit, 0xff5a14, 3, 7, v3(1.6, 0.35, 0.6));
  for (const a of [-0.5, 0, 0.5]) {
    const [x, z] = behind(a, 9.3);
    lamp(kit, 0xff6a1a, 14, 12, v3(x, 0.8, z));
  }

  const floor = solid(new THREE.CircleGeometry(60, 64), basalt(kit), false);
  floor.rotation.x = -Math.PI / 2;
  kit.add(floor);
  mirror(kit, { strength: 0.16, blur: 0.004, fade: 16, tint: 0xffb080 });

  // Jagged basalt: boulders along the river banks and tall spires against the sky.
  const rockMat = rimGlow(new THREE.MeshStandardMaterial({ color: 0x2a2220, roughness: 0.85 }), 0xff4a10, 0.35, 3);
  for (let i = 0; i < 26; i++) {
    const far = i < 10;
    const [x, z] = behind((r() - 0.5) * (far ? 2.2 : 3.2), far ? 11.5 + r() * 6 : CLEAR + 0.3 + r() * 1.6 + (r() > 0.5 ? 4.6 : 0));
    const h = far ? 2.5 + r() * 4.5 : 0.4 + r() * 1.1;
    const w = far ? 0.9 + r() * 1.2 : 0.5 + r() * 0.9;
    const m = solid(faceted(rock(100 + i, w, h, w * (0.7 + r() * 0.5), far ? 3 : 2, 0.3)), rockMat);
    m.position.set(x, far ? h * 0.35 : h * 0.25, z);
    m.rotation.set((r() - 0.5) * 0.3, r() * Math.PI, (r() - 0.5) * 0.3);
    kit.add(m);
  }

  // A distant cone with a glowing crater and a plume of smoke.
  const [vx, vz] = behind(-0.36, 58);
  const cone = new THREE.Mesh(rock(7, 17, 10, 15, 4, 0.12), new THREE.MeshStandardMaterial({ color: 0x140c0a, roughness: 1 }));
  cone.position.set(vx, -1, vz);
  kit.add(cone);
  glow(kit, glowTexture(), 0xff7a2a, 10, 1, v3(vx * 0.97, 8, vz * 0.97));
  mist(kit, { color: 0x221010, opacity: 0.55, width: 30, height: 26, position: v3(vx * 0.95, 19, vz * 0.95), scale: 1.4, speed: 0.05 });

  // Heat haze and smoke drifting across the river.
  for (let i = 0; i < 3; i++) {
    const [x, z] = behind((i - 1) * 0.45, 6.5 + i * 2.2);
    mist(kit, { color: i === 0 ? 0x5a1a0c : 0x24100c, opacity: 0.35, width: 16, height: 4, position: v3(x, 1.6 + i * 0.6, z), scale: 1.5, speed: 0.08 });
  }

  // Embers rising from the river, and a few big slow ones close to the hero.
  drift(kit, {
    capacity: 300, texture: glowTexture(), rate: 70, prewarm: 6, drag: 0.4,
    emit: { position: v3(-3.2, 0.3, -5.6), spread: v3(5, 0.3, 4), velocity: v3(0.15, 0.7, 0.2), velocityJitter: v3(0.3, 0.25, 0.3), life: [2.5, 4.5], size: [0.02, 0.06], colors: ["#ffb347", "#ff7a1a", "#ffd27a"] },
  });
  drift(kit, {
    capacity: 50, texture: glowTexture(), rate: 10, prewarm: 5, drag: 0.6,
    emit: { position: v3(-0.4, 0.4, -0.8), spread: v3(1.8, 0.4, 1.6), velocity: v3(0.05, 0.35, 0.05), velocityJitter: v3(0.15, 0.1, 0.15), life: [2, 3.5], size: [0.04, 0.08], colors: ["#ff9a3a", "#ffcf6a"] },
  });

  // Flicker the lava lights so the whole scene breathes with the heat.
  const lights = kit.root.children.filter((o): o is THREE.PointLight => o instanceof THREE.PointLight);
  kit.tick((t) => lights.forEach((l, i) => (l.intensity = (i === 0 ? 3 : 14) * (0.85 + 0.15 * Math.sin(t * 3.1 + i * 1.7) * Math.sin(t * 1.3 + i)))));

  kit.bake(0.8);
  return kit.done();
};
