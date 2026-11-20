/**
 * Dragon: a coiled serpent body rising in an S to a horned head, with bat
 * wings spread up and back. Matches the 2D art's rearing dragon with a wing.
 */

import * as THREE from "three";
import { ball, deform, ellipsoid, merge, onPedestal, place, ramp, slab, sweep, type V3 } from "./shared";

/** Spine of the body, from the tail tip coiled round the pedestal up to the back of the head. */
const SPINE: V3[] = [
  [-0.15, 0.13, 0.04], [-0.2, 0.06, 0.12], [-0.05, 0.04, 0.2], [0.12, 0.06, 0.15], [0.18, 0.08, -0.02], [0.08, 0.12, -0.16], [-0.08, 0.13, -0.14],
  [-0.1, 0.22, 0], [-0.03, 0.38, 0], [0.04, 0.5, 0], [0.01, 0.62, 0], [0.06, 0.7, 0],
];

function bodyRadius(t: number): number {
  // Thin tail, thick coil, slimmer neck, slight swell where the head joins.
  return 0.014 + 0.08 * ramp(0, 0.4, t) - 0.018 * ramp(0.55, 0.85, t) + 0.008 * ramp(0.9, 1, t);
}

function headProfile(): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(-0.07, -0.05);
  s.bezierCurveTo(-0.09, 0.0, -0.07, 0.07, -0.02, 0.09);
  // Heavy brow, then the long snout sloping down to flared nostrils.
  s.bezierCurveTo(0.03, 0.11, 0.07, 0.09, 0.1, 0.065);
  s.bezierCurveTo(0.14, 0.045, 0.19, 0.045, 0.215, 0.03);
  s.bezierCurveTo(0.235, 0.015, 0.23, -0.01, 0.21, -0.015);
  // Jaw line back to the cheek and under the skull.
  s.bezierCurveTo(0.16, -0.03, 0.11, -0.04, 0.06, -0.065);
  s.bezierCurveTo(0.02, -0.085, -0.04, -0.08, -0.07, -0.05);
  return s;
}

function head(): THREE.BufferGeometry {
  const skull = slab(headProfile(), { thickness: 0.15, bevel: 0.055, inset: 0.03, curveSegments: 8, bevelSegments: 4, refine: 0.06 });
  // Narrow the snout so the head tapers to a muzzle from above.
  deform(skull, (v) => { v.z *= 1 - 0.4 * ramp(0.04, 0.22, v.x); });
  const parts: THREE.BufferGeometry[] = [skull];
  for (const s of [1, -1]) {
    // Swept back horns curling up at the tips.
    parts.push(sweep([[-0.01, 0.08, s * 0.04], [-0.08, 0.12, s * 0.06], [-0.14, 0.13, s * 0.075], [-0.18, 0.17, s * 0.08]], (t) => 0.024 * (1 - t) + 0.002, { segments: 12, radial: 8 }));
    parts.push(ellipsoid([0.024, 0.02, 0.016], [0.06, 0.055, s * 0.052], [0, 0, -0.2], [12, 8]));
    parts.push(ellipsoid([0.045, 0.014, 0.02], [0.055, 0.078, s * 0.05], [0, 0, -0.35], [10, 6]));
    parts.push(ball(0.013, [0.205, 0.035, s * 0.028], [8, 6]));
    // Cheek spike behind the jaw.
    parts.push(sweep([[-0.03, -0.03, s * 0.05], [-0.09, -0.02, s * 0.07], [-0.13, 0.0, s * 0.08]], (t) => 0.016 * (1 - t) + 0.001, { segments: 8, radial: 6 }));
  }
  return merge(parts);
}

/** Bat wing outline: leading edge rising to the tip, scalloped membrane between finger bones. */
function wingShape(): THREE.Shape {
  // Drawn pointing toward -x, the "back" of the figure, so no mirroring is needed later.
  const pts: [number, number][][] = [[[0.03, 0.12], [0.05, 0.28], [0.1, 0.4]], [[0.14, 0.3], [0.22, 0.31]], [[0.22, 0.2], [0.28, 0.15]], [[0.2, 0.07], [0.2, 0]], [[0.1, 0.02], [0, 0]]];
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.bezierCurveTo(-pts[0][0][0], pts[0][0][1], -pts[0][1][0], pts[0][1][1], -pts[0][2][0], pts[0][2][1]);
  for (const [[cx, cy], [x, y]] of pts.slice(1)) s.quadraticCurveTo(-cx, cy, -x, y);
  return s;
}

function wing(side: 1 | -1): THREE.BufferGeometry {
  const membrane = slab(wingShape(), { thickness: 0.028, bevel: 0.011, inset: 0.009, curveSegments: 10, bevelSegments: 3 });
  // Finger bones from the wrist out to each point of the membrane.
  const bones = ([[0.1, 0.4], [0.22, 0.31], [0.28, 0.15]] as const).map(([x, y]) =>
    sweep([[-0.02, 0.06, 0], [-x * 0.5 - 0.02, y * 0.55 + 0.03, 0], [-x, y, 0]], (t) => 0.015 * (1 - t) + 0.002, { segments: 10, radial: 6 }));
  // Spread outward and raised, swept back from the shoulders.
  return place(merge([membrane, ...bones]), [-0.06, 0.4, side * 0.07], [side * 0.55, side * -0.45, 0.2]);
}

export function dragon(): THREE.BufferGeometry {
  const body = sweep(SPINE, bodyRadius, { segments: 72, radial: 14 });
  const curve = new THREE.CatmullRomCurve3(SPINE.map((p) => new THREE.Vector3(...p)));
  const parts: THREE.BufferGeometry[] = [body];
  // Dorsal spikes along the back of the neck, pointing away from the curve.
  for (let i = 0; i < 6; i++) {
    const t = 0.6 + i * 0.065;
    const p = curve.getPointAt(t);
    const d = curve.getTangentAt(t);
    const back = new THREE.Vector3(-d.y, d.x, 0).normalize().multiplyScalar(-1);
    const spike = new THREE.ConeGeometry(0.026, 0.075, 8).scale(1, 1, 0.5);
    spike.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), back));
    parts.push(spike.translate(...p.addScaledVector(back, bodyRadius(t) + 0.02).toArray()));
  }
  parts.push(place(head(), [0.1, 0.75, 0], [0, 0, -0.22], 1.3));
  parts.push(wing(1), wing(-1));
  return onPedestal(parts);
}
