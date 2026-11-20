/** Zebra: a horse head with a stiff brush mane and raised stripes wrapped around neck and face. */

import * as THREE from "three";
import { horseHead } from "./horse";
import { collar } from "./parts";
import { onPedestal, sweep, type V3 } from "./shared";

/**
 * Each stripe is where a slanted plane cuts the head: a centre on z = 0,
 * the plane's normal in xy, and how far round from the top or back it reaches.
 */
const STRIPES: { at: [number, number]; normal: [number, number]; width: number; reach: number }[] = [
  { at: [-0.02, 0.05], normal: [0.4, 1], width: 0.02, reach: 0.62 },
  { at: [-0.04, 0.14], normal: [0.5, 1], width: 0.024, reach: 0.66 },
  { at: [-0.05, 0.23], normal: [0.62, 1], width: 0.024, reach: 0.68 },
  { at: [-0.06, 0.32], normal: [0.8, 1], width: 0.022, reach: 0.66 },
  { at: [-0.06, 0.41], normal: [1.1, 1], width: 0.018, reach: 0.6 },
  { at: [0.14, 0.47], normal: [1, -0.72], width: 0.016, reach: 0.55 },
  { at: [0.2, 0.425], normal: [1, -0.8], width: 0.015, reach: 0.5 },
];

/**
 * Lays a flat tapered band over the surface where the stripe's plane cuts
 * it. Rays are cast from the centre point outward within the plane and the
 * hits, lifted a hair off the surface, become the band's path.
 */
function stripe(target: THREE.Mesh, s: (typeof STRIPES)[number]): THREE.BufferGeometry {
  const centre = new THREE.Vector3(s.at[0], s.at[1], 0);
  const across = new THREE.Vector3(-s.normal[1], s.normal[0], 0).normalize();
  const side = new THREE.Vector3(0, 0, 1);
  const ray = new THREE.Raycaster();
  const path: V3[] = [];
  const steps = 16;
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps - 0.5) * 2 * s.reach * Math.PI;
    const dir = across.clone().multiplyScalar(Math.cos(a)).addScaledVector(side, Math.sin(a)).normalize();
    ray.set(centre, dir);
    const hit = ray.intersectObject(target, false)[0];
    if (hit) path.push(hit.point.addScaledVector(dir, 0.001).toArray() as V3);
  }
  return sweep(path, (t) => s.width * Math.pow(Math.sin(Math.PI * t), 0.5), { around: [centre.x, centre.y, 0], squash: 0.4, segments: 26, radial: 6 });
}

export function zebra(): THREE.BufferGeometry {
  const bare = horseHead({ noMane: true });
  const target = new THREE.Mesh(bare, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }));
  const stripes = STRIPES.map((s) => stripe(target, s));
  const head = horseHead({ mane: "brush" });
  for (const g of [head, ...stripes]) g.translate(0.01, 0.03, 0);
  return onPedestal([collar(), head, ...stripes]);
}
