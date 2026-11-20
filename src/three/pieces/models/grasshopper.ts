/** Grasshopper: a crouched hopper with huge folded hind legs, wing covers and long swept antennae. */

import type * as THREE from "three";
import { ball, ellipsoid, merge, onPedestal, ramp, sweep, type V3 } from "./shared";

/** Mirrors a builder across the body's centre plane. */
function pair(make: (s: 1 | -1) => THREE.BufferGeometry[]): THREE.BufferGeometry[] {
  return [...make(1), ...make(-1)];
}

export function grasshopper(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  // Ringed abdomen tapering back from the thorax, lifted just clear of the pedestal.
  const abdomen: V3[] = [[0.0, 0.17, 0], [-0.12, 0.15, 0], [-0.24, 0.1, 0], [-0.3, 0.07, 0]];
  parts.push(sweep(abdomen, (t) => (0.068 - 0.05 * ramp(0.2, 1, t)) * (0.93 + 0.07 * Math.abs(Math.cos(t * Math.PI * 6))), { segments: 40, radial: 14, up: [0, 1, 0], squash: 0.85 }));
  // Saddle shaped thorax shield and the big blunt head.
  parts.push(ellipsoid([0.085, 0.07, 0.068], [0.05, 0.2, 0], [0, 0, 0.15], [20, 14]));
  parts.push(ellipsoid([0.06, 0.075, 0.056], [0.14, 0.24, 0], [0, 0, -0.45], [18, 14]));
  parts.push(ellipsoid([0.03, 0.022, 0.035], [0.18, 0.18, 0], [0, 0, -0.3], [10, 8]));
  // Folded wing covers lying along the back.
  parts.push(...pair((s) => [ellipsoid([0.17, 0.028, 0.045], [-0.1, 0.22, s * 0.035], [s * 0.25, 0, -0.17], [18, 10])]));
  parts.push(...pair((s) => [
    // Bulging compound eyes.
    ellipsoid([0.032, 0.036, 0.024], [0.155, 0.27, s * 0.046], [0, 0, -0.3], [12, 10]),
    // Antennae sweep up and back in a long arc.
    sweep([[0.16, 0.3, s * 0.02], [0.14, 0.45, s * 0.05], [0.04, 0.58, s * 0.09], [-0.1, 0.64, s * 0.12]], (t) => 0.009 * (1 - 0.6 * t), { segments: 16, radial: 6 }),
    // Hind leg: a thick drumstick femur to the high knee, then the thin shin back down to the foot.
    sweep([[0.02, 0.17, s * 0.075], [-0.06, 0.3, s * 0.1], [-0.13, 0.42, s * 0.11]], (t) => 0.036 - 0.022 * t, { segments: 14, radial: 12 }),
    ball(0.017, [-0.13, 0.42, s * 0.11], [10, 8]),
    sweep([[-0.13, 0.42, s * 0.11], [-0.2, 0.22, s * 0.115], [-0.26, 0.03, s * 0.115], [-0.2, 0.012, s * 0.115]], () => 0.011, { segments: 16, radial: 6 }),
    // Front and middle legs, short and bent.
    sweep([[0.1, 0.18, s * 0.04], [0.15, 0.12, s * 0.08], [0.17, 0.012, s * 0.09]], (t) => 0.011 - 0.003 * t, { segments: 10, radial: 6 }),
    sweep([[0.04, 0.16, s * 0.05], [0.04, 0.1, s * 0.12], [0.02, 0.012, s * 0.14]], (t) => 0.011 - 0.003 * t, { segments: 10, radial: 6 }),
  ]));
  return onPedestal([merge(parts).scale(1.08, 1.08, 1.08)]);
}
