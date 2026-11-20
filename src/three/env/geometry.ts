/** Procedural shapes for the environments: displaced shells, boulders and crystals. */

import * as THREE from "three";
import { mergeGeometries, mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { fbm3, rng } from "./noise";
import { v3 } from "./kit";

/**
 * Pushes every vertex along its normal by fractal noise. Seams are welded
 * first so the surface does not tear where a primitive had duplicate verts.
 */
export function displace(geo: THREE.BufferGeometry, amount: number, freq: number, seed = 0, octaves = 4): THREE.BufferGeometry {
  geo.deleteAttribute("uv");
  geo.deleteAttribute("normal");
  const g = mergeVertices(geo);
  g.computeVertexNormals();
  const p = g.attributes.position, n = g.attributes.normal;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const d = fbm3(x * freq + seed * 17.1, y * freq + seed * 3.7, z * freq, octaves) * amount;
    p.setXYZ(i, x + n.getX(i) * d, y + n.getY(i) * d, z + n.getZ(i) * d);
  }
  g.computeVertexNormals();
  return g;
}

/**
 * A boulder: a noisy sphere with a few flat planes cut into it, which reads
 * as fractured stone rather than a blob.
 */
export function rock(seed: number, sx: number, sy: number, sz: number, detail = 3, rough = 0.22): THREE.BufferGeometry {
  const r = rng(seed);
  const g = displace(new THREE.IcosahedronGeometry(1, detail), rough, 1.6, seed, 4);
  const p = g.attributes.position;
  const cuts = Array.from({ length: 5 }, () => ({ n: v3(r() - 0.5, r() - 0.5, r() - 0.5).normalize(), d: 0.62 + r() * 0.3 }));
  const tmp = v3();
  for (let i = 0; i < p.count; i++) {
    tmp.fromBufferAttribute(p, i);
    for (const c of cuts) {
      const over = tmp.dot(c.n) - c.d;
      if (over > 0) tmp.addScaledVector(c.n, -over);
    }
    p.setXYZ(i, tmp.x * sx, tmp.y * sy, tmp.z * sz);
  }
  g.computeVertexNormals();
  return g;
}

/**
 * Hard edged facets from per face normals. Used instead of the material's
 * flatShading, whose screen space derivatives can return NaN on grazing
 * faces and poison the baked reflection map.
 */
export function faceted(geo: THREE.BufferGeometry): THREE.BufferGeometry {
  const g = geo.index ? geo.toNonIndexed() : geo;
  g.computeVertexNormals();
  return g;
}

/**
 * Turns a closed shape inside out by mirroring it, which reverses the
 * winding. Domes seen from inside then use front faces, which the depth of
 * field depth pass draws (it ignores a material's BackSide).
 */
export function inside(geo: THREE.BufferGeometry): THREE.BufferGeometry {
  geo.scale(-1, 1, 1);
  return geo;
}

/** A hexagonal crystal standing on its base, slightly irregular so clusters do not look cloned. */
export function crystalGeo(height: number, radius: number, r: () => number, sides = 6): THREE.BufferGeometry {
  const body = new THREE.CylinderGeometry(radius, radius * (0.8 + r() * 0.4), height * 0.78, sides, 1);
  body.translate(0, height * 0.39, 0);
  const tip = new THREE.ConeGeometry(radius, height * 0.22, sides, 1);
  tip.translate((r() - 0.5) * radius * 0.5, height * 0.89, (r() - 0.5) * radius * 0.5);
  const g = mergeGeometries([body.toNonIndexed(), tip.toNonIndexed()])!;
  g.deleteAttribute("uv");
  g.computeVertexNormals();
  return g;
}

/** Several crystals fanning out of one base, tilted outward like a real geode cluster. */
export function crystalCluster(seed: number, count: number, height: number, radius: number): THREE.BufferGeometry {
  const r = rng(seed);
  const parts: THREE.BufferGeometry[] = [];
  for (let i = 0; i < count; i++) {
    const h = height * (0.35 + r() * 0.65) * (i === 0 ? 1.3 : 1);
    const g = crystalGeo(h, radius * (0.5 + r() * 0.6) * (i === 0 ? 1.25 : 1), r);
    const a = r() * Math.PI * 2;
    const tilt = i === 0 ? r() * 0.15 : 0.25 + r() * 0.55;
    g.rotateZ(tilt);
    g.rotateY(a);
    g.translate(Math.cos(a) * radius * 0.6 * (i ? 1 : 0), -0.04, Math.sin(a) * radius * 0.6 * (i ? 1 : 0));
    parts.push(g);
  }
  return mergeGeometries(parts)!;
}
