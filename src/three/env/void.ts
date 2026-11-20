/**
 * Void: deep space with a starfield and coloured nebula, a broken slab of
 * rock floating in it as the stage, a dim planet on the horizon, and debris
 * turning slowly in the dark under a violet rim light.
 */

import * as THREE from "three";
import { glowTexture, sparkTexture } from "../core/textures";
import { behind, CLEAR, faceted, inside, drift, fbm3, Kit, lamp, NOISE_GLSL, noiseFill, paint, rimGlow, rng, rock, solid, spot, v3 } from "./shared";
import type { EnvironmentBuilder } from "./types";

/** Nebula dome: layered noise in violet, magenta and teal with dark dust lanes. */
function nebula(kit: Kit): void {
  const mat = new THREE.ShaderMaterial({
    depthWrite: false, fog: false,
    uniforms: { uTime: kit.time },
    vertexShader: "varying vec3 vDir; void main() { vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
    fragmentShader: /* glsl */ `
      uniform float uTime; varying vec3 vDir;
      ${NOISE_GLSL}
      void main() {
        vec3 d = normalize(vDir);
        // A band of gas across the view, thickest just above the horizon behind the hero.
        float bd = dot(d, normalize(vec3(0.25, 0.9, -0.2))) * 2.6;
        float band = exp(-bd * bd);
        vec3 p = d * 2.2 + vec3(0.0, 0.0, uTime * 0.004);
        float n = fbm(p), m = fbm(p * 2.3 + 4.0), dust = fbm(p * 4.0 + 9.0);
        vec3 col = mix(vec3(0.32, 0.08, 0.55), vec3(0.75, 0.12, 0.45), smoothstep(0.35, 0.7, m));
        col = mix(col, vec3(0.05, 0.45, 0.6), smoothstep(0.55, 0.8, fbm(p * 1.3 + 2.0)));
        float gas = smoothstep(0.3, 0.75, n) * (0.25 + band) * (1.0 - smoothstep(0.45, 0.7, dust) * 0.7);
        vec3 c = col * gas * 0.55 + vec3(0.008, 0.004, 0.02);
        gl_FragColor = vec4(c, 1.0);
      }
    `,
  });
  const dome = new THREE.Mesh(inside(new THREE.SphereGeometry(95, 48, 24)), mat);
  dome.renderOrder = -10;
  kit.add(dome);
}

/**
 * The floating island: flat on top out to an uneven broken edge beyond the
 * clear radius, tapering underneath into a jagged root of rock.
 */
function island(): THREE.BufferGeometry {
  const g = new THREE.CylinderGeometry(1, 0.06, 1, 72, 12, false);
  g.deleteAttribute("uv");
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const a = Math.atan2(z, x);
    const edge = CLEAR + 0.6 + fbm3(Math.cos(a) * 1.8, Math.sin(a) * 1.8, 2, 4) * 2.2 + Math.max(0, Math.sin(a * 5.0)) * 0.4;
    const k = Math.hypot(x, z);
    if (y > 0.49) { p.setXYZ(i, x * edge, 0, z * edge); continue; }
    const depth = (0.5 - y) * 7.5;
    const jag = 1 + fbm3(x * 3, y * 4, z * 3, 4) * 0.5;
    p.setXYZ(i, x * edge * jag, -0.15 - depth * (1 + fbm3(x * 2, 5, z * 2, 3) * 0.6), z * edge * jag);
    if (k < 1e-4) p.setY(i, -0.15 - depth);
  }
  g.computeVertexNormals();
  // Planar uvs so the vein texture tiles evenly across the top.
  const uv: number[] = [];
  for (let i = 0; i < p.count; i++) uv.push(p.getX(i) / 4, p.getZ(i) / 4);
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  return g;
}

export const voidEnv: EnvironmentBuilder = (stage) => {
  const kit = new Kit(stage);
  const r = rng(47);
  kit.sky(0x010004, new THREE.FogExp2(0x0a0414, 0.012));
  nebula(kit);

  // Stars: one static point cloud, big enough to survive the depth of field blur.
  const stars: number[] = [], tint: number[] = [];
  for (let i = 0; i < 1400; i++) {
    const d = v3(r() - 0.5, r() - 0.5, r() - 0.5).normalize().multiplyScalar(85);
    stars.push(d.x, d.y, d.z);
    const c = new THREE.Color().setHSL(0.6 + r() * 0.25, 0.5, 0.6 + r() * 0.4).multiplyScalar(r() < 0.06 ? 3 : 0.5 + r());
    tint.push(c.r, c.g, c.b);
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute("position", new THREE.Float32BufferAttribute(stars, 3));
  starGeo.setAttribute("color", new THREE.Float32BufferAttribute(tint, 3));
  kit.add(new THREE.Points(starGeo, new THREE.PointsMaterial({ size: 0.55, map: glowTexture(), vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })));

  kit.key.color.set(0xd8d0ff);
  kit.key.intensity = 0.45;
  kit.rim.color.set(0xb070ff);
  kit.rim.intensity = 2.6;
  kit.rim.position.set(-3, 6, -8);
  kit.hemi.color.set(0x3a2a6a);
  kit.hemi.groundColor.set(0x08040e);
  kit.hemi.intensity = 0.18;
  spot(kit, 0xece4ff, 60, v3(-1.4, 4.4, 3.6), 0.32);
  lamp(kit, 0xff3ac8, 3, 7, v3(2.2, 0.8, 0.2));
  lamp(kit, 0x5a8aff, 6, 9, v3(-3.5, 1.5, -3.5));

  // Cracked dark stone with faint violet veins.
  const veins = paint(kit, 256, (ctx, s) => noiseFill(ctx, s, (n) => {
    const v = 26 + n * 60;
    const vein = Math.max(0, 1 - Math.abs(n - 0.52) * 45) * 80;
    return [v + vein * 0.7, v * 0.9 + vein * 0.3, v * 1.1 + vein];
  }, 5, 13), 2.5);
  const glowVeins = paint(kit, 256, (ctx, s) => noiseFill(ctx, s, (n) => {
    const vein = Math.max(0, 1 - Math.abs(n - 0.52) * 45);
    return [vein * 190, vein * 70, vein * 255];
  }, 5, 13), 2.5);
  const slab = solid(island(), new THREE.MeshStandardMaterial({ color: 0x46405a, map: veins, emissive: 0xffffff, emissiveMap: glowVeins, emissiveIntensity: 0.3, roughness: 0.85, metalness: 0.05, envMapIntensity: 0.35 }), false);
  kit.add(slab);

  // A dim planet low on the horizon with a violet atmosphere rim.
  const planet = new THREE.Mesh(new THREE.SphereGeometry(16, 48, 32), rimGlow(new THREE.MeshStandardMaterial({ color: 0x1a1428, roughness: 1, fog: false }), 0x9a5aff, 1.1, 3.5));
  const [px, pz] = behind(0.42, 75);
  planet.position.set(px, -4, pz);
  kit.add(planet);

  // Debris: rocks orbiting slowly at different distances, tumbling as they go.
  const debrisMat = new THREE.MeshStandardMaterial({ color: 0x4a4458, roughness: 0.7 });
  const debris: { m: THREE.Mesh; a: number; d: number; y: number; spin: THREE.Vector3; speed: number }[] = [];
  for (let i = 0; i < 22; i++) {
    const s = 0.15 + Math.pow(r(), 2) * 1.4;
    const m = solid(faceted(rock(300 + i, s, s * (0.6 + r() * 0.6), s, 1, 0.3)), debrisMat);
    const d = CLEAR + 3 + r() * 16;
    debris.push({ m, a: (r() - 0.5) * 3, d, y: -4 + r() * 9, spin: v3(r(), r(), r()).multiplyScalar(0.3), speed: (0.004 + r() * 0.01) * (r() < 0.5 ? 1 : -1) });
    kit.add(m);
  }
  kit.tick((t) => {
    for (const b of debris) {
      const [x, z] = behind(b.a + t * b.speed, b.d);
      b.m.position.set(x, b.y + Math.sin(t * 0.4 + b.d) * 0.15, z);
      b.m.rotation.set(b.spin.x * t, b.spin.y * t, b.spin.z * t);
    }
  });

  // Glittering void dust drifting upward around the island.
  drift(kit, {
    capacity: 160, texture: sparkTexture(), rate: 30, prewarm: 6, drag: 0.2,
    emit: { position: v3(-2, 1.2, -3), spread: v3(5, 2, 5), velocity: v3(0.02, 0.06, 0.02), velocityJitter: v3(0.05, 0.04, 0.05), life: [3, 6], size: [0.03, 0.08], colors: ["#c9a2ff", "#ff7ad9", "#8ab4ff"] },
  });

  kit.bake(0.7);
  return kit.done();
};
