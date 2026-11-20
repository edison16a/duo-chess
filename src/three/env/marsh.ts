/**
 * Marsh: a mossy patch of ground in a still black swamp at dusk. Dead trees
 * stand in silhouette against the last light, reeds fringe the water, low
 * fog rolls over the surface and fireflies drift in the gloom.
 */

import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { glowTexture } from "../core/textures";
import { behind, CLEAR, DEPTH, drift, fbm3, Kit, mirror, mist, noiseFill, paint, rng, shotPos, SIDE, sky, solid, spot, v3 } from "./shared";
import type { EnvironmentBuilder } from "./types";

const WATER = -0.14;

/** A gnarled dead tree: a leaning trunk that forks into ever thinner bare branches. */
function deadTree(r: () => number, height: number): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const grow = (from: THREE.Vector3, dir: THREE.Vector3, len: number, radius: number, depth: number) => {
    const to = from.clone().addScaledVector(dir, len);
    const g = new THREE.CylinderGeometry(radius * 0.68, radius, len, 6, 1, true);
    g.translate(0, len / 2, 0);
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(v3(0, 1, 0), dir));
    g.translate(from.x, from.y, from.z);
    parts.push(g.toNonIndexed());
    if (depth === 0) return;
    const forks = depth > 3 ? 2 : 1 + Math.floor(r() * 2);
    for (let i = 0; i < forks; i++) {
      const d = dir.clone().add(v3((r() - 0.5) * 1.3, (r() - 0.2) * 0.6, (r() - 0.5) * 1.3)).normalize();
      grow(to, d, len * (0.6 + r() * 0.25), radius * 0.66, depth - 1);
    }
  };
  grow(v3(0, -0.5, 0), v3((r() - 0.5) * 0.4, 1, (r() - 0.5) * 0.4).normalize(), height * 0.38, height * 0.03, 5);
  const g = mergeGeometries(parts)!;
  g.deleteAttribute("uv");
  g.computeVertexNormals();
  return g;
}

/** The mossy ground: flat over the clear radius, its uneven shore sloping down into the water. */
function ground(): THREE.BufferGeometry {
  const g = new THREE.CircleGeometry(1, 96, 0, Math.PI * 2);
  const ring = new THREE.RingGeometry(1, 1.35, 96, 4);
  const merged = mergeGeometries([g, ring])!;
  const p = merged.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i);
    const k = Math.hypot(x, y), a = Math.atan2(y, x);
    const shore = CLEAR + 0.5 + fbm3(Math.cos(a) * 2, Math.sin(a) * 2, 4, 4) * 2.5;
    const t = Math.max(0, k - 1) / 0.35;
    p.setXYZ(i, (x / Math.max(k, 1e-6)) * (Math.min(k, 1) * shore + t * 2.2) || 0, (y / Math.max(k, 1e-6)) * (Math.min(k, 1) * shore + t * 2.2) || 0, -t * 0.45);
  }
  merged.rotateX(-Math.PI / 2);
  merged.computeVertexNormals();
  return merged;
}

export const marsh: EnvironmentBuilder = (stage) => {
  const kit = new Kit(stage);
  const r = rng(97);
  kit.sky(0x161a28, new THREE.FogExp2(0x2a3040, 0.04));
  const glowDir = v3(0, 0, 0).addScaledVector(DEPTH, 1).addScaledVector(SIDE, 0.35).setY(0.04).normalize();
  sky(kit, {
    top: 0x0a0e1c, horizon: 0x8a5a5a, bottom: 0x1a1e2a,
    sun: { dir: glowDir, color: 0xff9a5a, size: 0.12, power: 0.9 },
    clouds: { amount: 0.5, color: 0x1a1c2a, lit: 0x6a4a5a, scale: 1.5, speed: 0.01 },
  });

  // Cold dusk ambience, the last warm glow behind, a moonlit spot on the hero.
  kit.key.color.set(0x9ab0e0);
  kit.key.intensity = 0.4;
  kit.rim.color.set(0xffa070);
  kit.rim.intensity = 1.6;
  kit.rim.position.copy(glowDir).multiplyScalar(10).setY(4);
  kit.hemi.color.set(0x4a5a7a);
  kit.hemi.groundColor.set(0x101408);
  kit.hemi.intensity = 0.35;
  spot(kit, 0xd0dcff, 55, v3(-1.2, 4.6, 3.6), 0.32);

  // Black water: a dark bed with a still, slightly rippled mirror over it.
  const bed = new THREE.Mesh(new THREE.CircleGeometry(90, 48), new THREE.MeshBasicMaterial({ color: 0x05070a }));
  bed.rotation.x = -Math.PI / 2;
  bed.position.y = WATER - 0.02;
  kit.add(bed);
  mirror(kit, { size: 180, y: WATER, strength: 0.85, ripple: 0.0025, blur: 0.0015, fade: 70, tint: 0xc0c8d8 });

  const moss = paint(kit, 256, (ctx, s) => noiseFill(ctx, s, (n) => {
    const lush = Math.max(0, n - 0.45) * 2;
    return [40 + n * 40 - lush * 10, 48 + n * 50 + lush * 30, 22 + n * 20];
  }, 9, 53), 9);
  kit.add(solid(ground(), new THREE.MeshStandardMaterial({ color: 0x6a9a4a, map: moss, roughness: 0.9 }), false));

  // Dead trees standing in the water, nearer ones larger and darker against the glow.
  const bark = new THREE.MeshStandardMaterial({ color: 0x1a1612, roughness: 1 });
  const trees: [number, number, number][] = [[-0.5, 12, 7], [0.42, 14, 8.5], [-0.18, 19, 6], [0.12, 26, 9], [-0.9, 16, 8], [0.8, 11, 6.5], [0.3, 34, 10], [-0.42, 30, 9]];
  trees.forEach(([a, d, h]) => {
    const [x, z] = behind(a, d);
    const t = solid(deadTree(r, h), bark);
    t.position.set(x, WATER, z);
    t.rotation.y = r() * Math.PI * 2;
    kit.add(t);
  });

  // Reeds and cattails crowding the shoreline.
  const reedGeo = new THREE.ConeGeometry(0.025, 1, 4, 1);
  reedGeo.translate(0, 0.5, 0);
  const reeds = new THREE.InstancedMesh(reedGeo, new THREE.MeshStandardMaterial({ color: 0x3a4a22, roughness: 0.9 }), 260);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion();
  for (let i = 0; i < 260; i++) {
    const a = r() * Math.PI * 2;
    const d = CLEAR + 0.6 + fbm3(Math.cos(a) * 2, Math.sin(a) * 2, 4, 4) * 2.5 + r() * 1.6;
    q.setFromEuler(new THREE.Euler((r() - 0.5) * 0.35, 0, (r() - 0.5) * 0.35));
    const h = 0.6 + r() * 1.2;
    reeds.setMatrixAt(i, m.compose(v3(Math.cos(a) * d, WATER, Math.sin(a) * d), q, v3(1 + r(), h, 1 + r())));
  }
  kit.add(reeds);

  // Fog: low banks rolling over the water and a thin veil across the ground.
  for (let i = 0; i < 4; i++) mist(kit, { color: 0x9aa4b8, opacity: 0.45, width: 26, height: 3.2, position: shotPos((i - 1.5) * 4, 7 + i * 4, 0.9), scale: 1.4, speed: 0.08 });

  // Fireflies wandering slowly, bright enough to bloom.
  drift(kit, {
    capacity: 70, texture: glowTexture(), rate: 12, prewarm: 8, drag: 0.6,
    emit: { position: shotPos(0, 3, 1), spread: v3(4.5, 0.8, 4.5), velocity: v3(0, 0.03, 0), velocityJitter: v3(0.18, 0.08, 0.18), life: [4, 7], size: [0.04, 0.08], colors: ["#e8ff7a", "#c8ff5a", "#fff2a0"] },
  });

  kit.bake(0.6);
  return kit.done();
};
