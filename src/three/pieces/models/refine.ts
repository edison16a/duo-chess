/** Crack free mesh refinement used before bending flat extrusions. */

import * as THREE from "three";

/**
 * Splits every edge longer than `maxEdge` until none is left. The split
 * decision depends only on the edge itself, so both triangles sharing an
 * edge agree and no cracks open when the surface is later deformed (which
 * is what goes wrong with a longest edge tessellator).
 */
export function refine(g: THREE.BufferGeometry, maxEdge: number): THREE.BufferGeometry {
  const src = (g.index ? g.toNonIndexed() : g).getAttribute("position");
  let tris: THREE.Vector3[] = [];
  for (let i = 0; i < src.count; i++) tris.push(new THREE.Vector3().fromBufferAttribute(src, i));
  const max2 = maxEdge * maxEdge;
  const mid = (a: THREE.Vector3, b: THREE.Vector3) => a.clone().add(b).multiplyScalar(0.5);
  for (let pass = 0; pass < 8; pass++) {
    const out: THREE.Vector3[] = [];
    let split = false;
    for (let i = 0; i < tris.length; i += 3) {
      let v = [tris[i], tris[i + 1], tris[i + 2]];
      let long = [0, 1, 2].map((k) => v[k].distanceToSquared(v[(k + 1) % 3]) > max2);
      const count = long.filter(Boolean).length;
      if (count === 0) { out.push(...v); continue; }
      split = true;
      if (count === 3) {
        const [m0, m1, m2] = [mid(v[0], v[1]), mid(v[1], v[2]), mid(v[2], v[0])];
        out.push(v[0], m0, m2, m0, v[1], m1, m2, m1, v[2], m0, m1, m2);
        continue;
      }
      // Rotate so edge 0 (v0 to v1) is split, and for two splits edge 1 is the other one.
      while (!long[0] || (count === 2 && !long[1])) {
        v = [v[1], v[2], v[0]];
        long = [long[1], long[2], long[0]];
      }
      const m0 = mid(v[0], v[1]);
      if (count === 1) out.push(v[0], m0, v[2], m0, v[1], v[2]);
      else {
        const m1 = mid(v[1], v[2]);
        out.push(m0, v[1], m1, v[0], m0, m1, v[0], m1, v[2]);
      }
    }
    tris = out;
    if (!split) break;
  }
  const res = new THREE.BufferGeometry();
  res.setAttribute("position", new THREE.Float32BufferAttribute(tris.flatMap((p) => [p.x, p.y, p.z]), 3));
  return res;
}
