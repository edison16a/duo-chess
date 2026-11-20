/**
 * Canyon: a red rock gorge at golden hour. Layered sandstone walls rise on
 * both sides, one in warm sun and one in cool shadow, mesas fade into the
 * haze beyond, and dust drifts through the low light over the sand.
 */

import * as THREE from "three";
import { glowTexture } from "../core/textures";
import { CLEAR, DEPTH, drift, faceted, fbm3, Kit, mist, noiseFill, paint, rng, rock, shotPos, SIDE, sky, solid, spot, v3 } from "./shared";
import type { EnvironmentBuilder } from "./types";

const BANDS = [0x7a2e16, 0xb4521f, 0xd88a4e, 0x9a3e1a, 0xe2a86a, 0x6a2812].map((c) => new THREE.Color(c));

/**
 * One canyon wall: a vertical sheet bent into ledges and overhangs, leaning
 * back as it rises, painted with sedimentary bands by height.
 */
function wall(side: number, seed: number): THREE.BufferGeometry {
  const g = new THREE.PlaneGeometry(110, 26, 180, 64);
  const p = g.attributes.position;
  const col: number[] = [];
  const c = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    const depth = p.getX(i) + 30, y = p.getY(i) + 11;
    // Terraces: the wall steps out a little at the base of each harder layer.
    const layer = y / 1.7 + fbm3(depth * 0.05, seed, 0, 2) * 1.5;
    const terrace = Math.pow(layer - Math.floor(layer), 3) * 0.7;
    const out = fbm3(depth * 0.07, y * 0.12, seed, 5) * 4.5 + terrace + Math.max(0, y) * 0.32 + Math.max(0, fbm3(depth * 0.03, seed + 5, 0, 2)) * 6;
    const lateral = side * (CLEAR + 3.2 + out);
    const w = shotPos(lateral, depth, y);
    p.setXYZ(i, w.x, w.y, w.z);
    const band = Math.floor(layer + fbm3(depth * 0.2, y * 0.5, seed, 2) * 0.6);
    c.copy(BANDS[((band % BANDS.length) + BANDS.length) % BANDS.length]).multiplyScalar(0.8 + fbm3(depth * 0.4, y * 0.6, seed, 3) * 0.5);
    col.push(c.r, c.g, c.b);
  }
  g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  g.deleteAttribute("uv");
  // The sheet faces +z before bending; flip the right wall so both face the canyon floor.
  if (side > 0) g.index!.array.reverse();
  g.computeVertexNormals();
  return g;
}

export const canyon: EnvironmentBuilder = (stage) => {
  const kit = new Kit(stage);
  const r = rng(83);
  kit.sky(0xd08a58, new THREE.FogExp2(0xc8845a, 0.009));
  // Low sun ahead and to the left: it back lights the hero and rakes across the right wall.
  const sunDir = v3(0, 0, 0).addScaledVector(DEPTH, 1).addScaledVector(SIDE, -0.9).setY(0.18).normalize();
  sky(kit, {
    top: 0x3a5a8a, horizon: 0xf0a060, bottom: 0xc07a48,
    sun: { dir: sunDir, color: 0xffc070, size: 0.04, power: 1.6 },
    clouds: { amount: 0.35, color: 0x8a5a5a, lit: 0xffb070, scale: 1.2, speed: 0.008 },
  });

  kit.key.color.set(0xffb066);
  kit.key.intensity = 2.6;
  kit.key.position.copy(sunDir).multiplyScalar(30);
  kit.rim.color.set(0xffd090);
  kit.rim.intensity = 1.2;
  kit.rim.position.copy(sunDir).multiplyScalar(10).setY(6);
  kit.hemi.color.set(0x7a90c0);
  kit.hemi.groundColor.set(0x8a4a28);
  kit.hemi.intensity = 0.45;
  spot(kit, 0xffe0c0, 45, v3(-1.0, 4.4, 3.8), 0.32, false);

  const sand = paint(kit, 256, (ctx, s) => noiseFill(ctx, s, (n, x, y) => {
    const ripple = Math.sin((x + y * 0.3) * 0.35 + n * 8) * 10;
    const v = 150 + n * 70 + ripple;
    return [v, v * 0.68, v * 0.45];
  }, 10, 41), 14);
  const floor = solid(new THREE.CircleGeometry(80, 64), new THREE.MeshStandardMaterial({ color: 0xe0a070, map: sand, roughness: 0.95 }), false);
  floor.rotation.x = -Math.PI / 2;
  kit.add(floor);

  const rockMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9 });
  for (const side of [-1, 1]) kit.add(solid(wall(side, side > 0 ? 3 : 8), rockMat, false));

  // Mesas and buttes far down the canyon, softened by haze.
  const mesaMat = new THREE.MeshStandardMaterial({ color: 0x9a4a28, roughness: 1 });
  for (let i = 0; i < 5; i++) {
    const m = new THREE.Mesh(faceted(rock(400 + i, 6 + r() * 8, 10 + r() * 10, 6 + r() * 6, 2, 0.15)), mesaMat);
    m.position.copy(shotPos((r() - 0.5) * 30, 60 + r() * 30, 2));
    kit.add(m);
  }

  // Boulders and pebbles strewn beyond the clearing.
  const boulderMat = new THREE.MeshStandardMaterial({ color: 0xa0502a, roughness: 0.9 });
  for (let i = 0; i < 10; i++) {
    const s = 0.5 + r() * 1.4;
    const m = solid(faceted(rock(500 + i, s, s * 0.7, s, 2, 0.3)), boulderMat);
    const side = (r() < 0.5 ? -1 : 1) * (CLEAR + 1 + r() * 2.5);
    m.position.copy(shotPos(side, -4 + r() * 30, s * 0.25));
    m.rotation.y = r() * 6;
    kit.add(m);
  }
  const pebbles = new THREE.InstancedMesh(faceted(rock(600, 1, 0.6, 1, 1, 0.3)), boulderMat, 140);
  const mtx = new THREE.Matrix4();
  for (let i = 0; i < 140; i++) {
    const a = r() * Math.PI * 2, d = CLEAR + 0.3 + Math.pow(r(), 0.7) * 14;
    const s = 0.04 + r() * 0.12;
    mtx.makeRotationY(r() * 6).scale(v3(s, s, s)).setPosition(Math.cos(a) * d, s * 0.2, Math.sin(a) * d);
    pebbles.setMatrixAt(i, mtx);
  }
  pebbles.castShadow = pebbles.receiveShadow = true;
  kit.add(pebbles);

  // Golden dust: hazy sheets in the light and fine grains drifting on the wind.
  for (let i = 0; i < 3; i++) mist(kit, { color: 0xffc080, opacity: 0.12, width: 22, height: 5, position: shotPos((i - 1) * 3, 8 + i * 6, 1.8), scale: 1.3, speed: 0.05, additive: true });
  drift(kit, {
    capacity: 220, texture: glowTexture(), rate: 45, prewarm: 6, drag: 0.1,
    emit: { position: shotPos(0, 2, 1.2), spread: v3(5, 1.2, 5), velocity: SIDE.clone().multiplyScalar(0.25).setY(0.02), velocityJitter: v3(0.06, 0.04, 0.06), life: [3, 6], size: [0.015, 0.04], colors: ["#ffd8a0", "#ffc070", "#fff0d0"] },
  });

  kit.bake(0.7);
  return kit.done();
};
