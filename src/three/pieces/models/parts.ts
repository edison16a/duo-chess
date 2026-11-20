/** Turned and cast ornaments shared by several pieces: collars, crowns, mitres, battlements. */

import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { ball, ellipsoid, lathe, merge, sweep, type V2, type V3 } from "./shared";

/** Cushion ring that hides the joint between a turned body and the figure on it. */
export function collar(radius = 0.235): THREE.BufferGeometry {
  return lathe([[0, -0.01], [radius - 0.02, -0.01], [radius, 0.012], [radius - 0.01, 0.035], [radius - 0.05, 0.05], [0, 0.05]], 32);
}

/** A turned body from radius/height pairs, closed at the top. */
export function turned(profile: V2[], segments = 40): THREE.BufferGeometry {
  return lathe(profile, segments);
}

/**
 * Open crown: a flared band with leaf shaped tines, each tipped with a
 * pearl, and a beaded rim. Built around the y axis with its base at y = 0.
 */
export function crown(radius: number, height: number, tines: number, opts: { pearl?: number } = {}): THREE.BufferGeometry {
  const wall = radius * 0.16;
  const band = lathe([[radius * 0.82, 0], [radius * 0.86, 0], [radius, height * 0.42], [radius - wall, height * 0.44], [radius * 0.82 - wall, 0.004]], 32);
  const parts: THREE.BufferGeometry[] = [band];
  const pearl = opts.pearl ?? radius * 0.15;
  for (let i = 0; i < tines; i++) {
    const a = (i / tines) * Math.PI * 2;
    const r = radius - wall * 0.4;
    // Leaves stand on the rim with their thin side facing out, so the crown reads solid from any angle.
    parts.push(ellipsoid([radius * 0.24, height * 0.36, radius * 0.08], [Math.cos(a) * r, height * 0.48, Math.sin(a) * r], [0, Math.PI / 2 - a, 0], [10, 6]));
    parts.push(ball(pearl, [Math.cos(a) * r, height * 0.86, Math.sin(a) * r], [8, 6]));
  }
  parts.push(new THREE.TorusGeometry(radius * 0.92, radius * 0.07, 6, 32).rotateX(Math.PI / 2).translate(0, height * 0.06, 0));
  parts.push(new THREE.TorusGeometry(radius - wall * 0.4, radius * 0.06, 6, 32).rotateX(Math.PI / 2).translate(0, height * 0.42, 0));
  return merge(parts);
}

/** Bishop's mitre: an ogive cap with a band round its base, an orphrey over the top and a ball finial. Base at y = 0. */
export function mitre(r: number): THREE.BufferGeometry {
  const profile: V2[] = [[0, 0], [r * 0.85, 0], [r, r * 0.35], [r * 0.95, r * 0.8], [r * 0.7, r * 1.3], [r * 0.3, r * 1.68], [0, r * 1.8]];
  const cap = lathe(profile, 32);
  const base = new THREE.TorusGeometry(r * 0.9, r * 0.1, 6, 32).rotateX(Math.PI / 2).translate(0, r * 0.12, 0);
  // The orphrey runs front to back over the crown, following the cap's own profile.
  const half = profile.slice(1, -1);
  const path: V3[] = [...half.map(([x, y]): V3 => [-x, y, 0]), [0, r * 1.8, 0], ...half.reverse().map(([x, y]): V3 => [x, y, 0])];
  const orphrey = sweep(path, () => r * 0.12, { around: [0, r * 0.7, 0], squash: 0.45, segments: 30, radial: 6 });
  return merge([cap, base, orphrey, ball(r * 0.2, [0, r * 1.9, 0], [12, 10])]);
}

/** Rook battlement ring: alternating merlons around a rim of given radius, base at y = 0. */
export function battlements(radius: number, count: number, size: [number, number, number]): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    const g = new RoundedBoxGeometry(...size, 1, Math.min(...size) * 0.22);
    g.rotateY(-a);
    parts.push(g.translate(Math.cos(a) * radius, size[1] / 2, Math.sin(a) * radius));
  }
  return merge(parts);
}
