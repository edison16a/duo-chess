/**
 * The rubber duck: a plump floating body with an upturned tail, a big round
 * head, a wide flat bill, eyes on both sides and moulded wings. It has no
 * pedestal; it sits right on the square. Faces -x like the 2D art.
 */

import * as THREE from "three";
import { materials } from "../../core/materials";
import type { PieceModel } from "./index";
import { ball, deform, ellipsoid, merge, ramp, slab } from "./shared";

const HEAD = new THREE.Vector3(0.13, 0.44, 0);
const HEAD_R = 0.15;

function body(): THREE.BufferGeometry {
  const g = new THREE.SphereGeometry(1, 40, 26).scale(0.28, 0.19, 0.22).translate(-0.02, 0.19, 0);
  return deform(g, (v) => {
    const back = -(v.x + 0.02);
    // Sweep the rear up into the classic pointed tail.
    const tail = ramp(0.06, 0.3, back) * ramp(0.1, 0.3, v.y);
    v.y += 0.17 * tail * tail;
    v.x -= 0.07 * tail;
    v.z *= 1 - 0.3 * tail * ramp(0.24, 0.36, v.y);
    // A flat bottom so it stands steady, with a rounded edge.
    if (v.y < 0.03) v.y = 0.03 - (0.03 - v.y) * 0.15;
  });
}

/** Wing shape: a rounded leaf with two feather notches at the back. */
function wingShape(): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(0.1, 0.02);
  s.bezierCurveTo(0.08, 0.1, -0.04, 0.12, -0.13, 0.08);
  s.quadraticCurveTo(-0.11, 0.06, -0.15, 0.04);
  s.quadraticCurveTo(-0.11, 0.025, -0.14, 0.0);
  s.bezierCurveTo(-0.06, -0.04, 0.08, -0.04, 0.1, 0.02);
  return s;
}

function wing(side: 1 | -1): THREE.BufferGeometry {
  const g = slab(wingShape(), { thickness: 0.05, bevel: 0.02, inset: 0.014, curveSegments: 8, bevelSegments: 3, refine: 0.05 });
  // Bend the wing round the body so it lies flush along the side.
  deform(g, (v) => { v.z -= 0.9 * v.x * v.x + 0.6 * Math.max(0, v.y - 0.04) ** 2; });
  if (side < 0) g.rotateY(Math.PI);
  return g.translate(-0.04, 0.2, side * 0.2);
}

/** Wide flat bill with a slight upturned smile, lower mandible tucked under. */
function bill(): THREE.BufferGeometry {
  const upper = ellipsoid([0.105, 0.034, 0.085], [0, 0, 0], [0, 0, 0.12], [22, 12]);
  deform(upper, (v) => { v.y += 0.25 * v.x * v.x - 0.6 * v.z * v.z * Math.max(0, v.x); });
  const lower = ellipsoid([0.08, 0.024, 0.068], [-0.01, -0.028, 0], [0, 0, 0.05], [16, 10]);
  return merge([upper, lower]).translate(HEAD.x + HEAD_R * 0.86, HEAD.y - 0.035, 0);
}

export function duck(): PieceModel {
  const head = ball(HEAD_R, HEAD.toArray(), [30, 22]);
  // Chubby cheeks under the eyes.
  const cheeks = [1, -1].map((s) => ellipsoid([0.07, 0.06, 0.05], [HEAD.x + 0.05, HEAD.y - 0.05, s * 0.085], [0, 0, 0], [14, 10]));
  const yellow = merge([body(), head, ...cheeks, wing(1), wing(-1)]);
  const whites: THREE.BufferGeometry[] = [];
  const pupils: THREE.BufferGeometry[] = [];
  for (const s of [1, -1]) {
    const dir = new THREE.Vector3(0.55, 0.35, s * 0.76).normalize();
    const at = HEAD.clone().addScaledVector(dir, HEAD_R * 0.93);
    whites.push(ellipsoid([0.034, 0.042, 0.022], at.toArray(), [0, s * -0.95, 0], [14, 10]));
    const pupil = at.clone().addScaledVector(dir, 0.016).add(new THREE.Vector3(0.008, 0.004, 0));
    pupils.push(ball(0.021, pupil.toArray(), [12, 8]));
    // A catch light so the eyes look glossy.
    whites.push(ball(0.006, pupil.clone().addScaledVector(dir, 0.018).add(new THREE.Vector3(0.004, 0.008, 0)).toArray(), [6, 4]));
  }
  const m = materials();
  // Built facing +x; turn it round so it faces -x like the 2D art.
  const face = (g: THREE.BufferGeometry) => g.rotateY(Math.PI);
  return {
    body: face(yellow),
    accents: [
      { geometry: face(bill()), material: () => m.beak },
      { geometry: face(merge(whites)), material: () => m.white },
      { geometry: face(merge(pupils)), material: () => m.eye },
    ],
  };
}
