/** Camel: a resting dromedary with one big hump, its long neck curving up to a heavy browed head. */

import * as THREE from "three";
import { ball, ellipsoid, merge, onPedestal, place, rounded, sweep, type V3 } from "./shared";

function head(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [
    // Skull and the long drooping muzzle with its split upper lip.
    ellipsoid([0.075, 0.06, 0.058], [0, 0, 0], [0, 0, -0.15], [18, 12]),
    ellipsoid([0.085, 0.048, 0.046], [0.085, -0.03, 0], [0, 0, -0.35], [18, 12]),
    ellipsoid([0.03, 0.026, 0.044], [0.155, -0.07, 0], [0, 0, -0.3], [12, 8]),
    ellipsoid([0.05, 0.02, 0.04], [0.125, -0.085, 0], [0, 0, -0.2], [12, 8]),
  ];
  for (const s of [1, -1]) {
    parts.push(ellipsoid([0.02, 0.018, 0.012], [0.035, 0.022, s * 0.05], [0, 0, 0], [10, 8]));
    parts.push(ellipsoid([0.034, 0.012, 0.016], [0.03, 0.04, s * 0.046], [0, 0, -0.25], [10, 6]));
    parts.push(ellipsoid([0.012, 0.007, 0.006], [0.155, -0.045, s * 0.03], [0, s * 0.5, -0.5], [8, 6]));
    // Small rounded ears set far back.
    parts.push(ellipsoid([0.016, 0.03, 0.01], [-0.045, 0.06, s * 0.04], [s * 0.4, 0, 0.5], [10, 6]));
  }
  return merge(parts);
}

export function camel(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  // Body resting on folded legs: one swept form whose girth swells into the hump.
  const spine: V3[] = [[-0.28, 0.12, 0], [-0.16, 0.15, 0], [-0.05, 0.18, 0], [0.06, 0.15, 0], [0.16, 0.12, 0]];
  const hump = (t: number) => Math.pow(Math.sin(Math.PI * Math.min(1, Math.max(0, (t - 0.05) / 0.75))), 1.5);
  parts.push(sweep(spine, (t) => (0.085 + 0.075 * hump(t)) * rounded(t, 0.16), { segments: 30, radial: 18, up: [0, 1, 0], squash: 1.1 }));
  // Folded legs tucked under the body, shins lying along the pedestal.
  for (const z of [0.1, -0.1]) {
    parts.push(sweep([[0.17, 0.03, z * 1.0], [0.06, 0.035, z * 1.12], [-0.06, 0.04, z * 1.12]], (t) => (0.036 - 0.008 * t) * rounded(t, 0.25), { segments: 12, radial: 10 }));
    parts.push(sweep([[-0.26, 0.035, z * 0.9], [-0.14, 0.035, z * 1.15], [-0.02, 0.04, z * 1.15]], (t) => (0.042 - 0.012 * t) * rounded(t, 0.25), { segments: 12, radial: 10 }));
  }
  // Neck reaches forward from the chest, then lifts the head high.
  const neck: V3[] = [[0.04, 0.14, 0], [0.18, 0.19, 0], [0.245, 0.31, 0], [0.23, 0.45, 0], [0.24, 0.54, 0]];
  parts.push(sweep(neck, (t) => 0.08 - 0.03 * t, { segments: 24, radial: 14, up: [0, 0, 1], squash: 0.85 }));
  parts.push(place(head(), [0.28, 0.6, 0], [0, 0, -0.05], 1.25));
  // Tail hanging over the rump.
  parts.push(sweep([[-0.24, 0.17, 0], [-0.28, 0.12, 0], [-0.28, 0.05, 0]], (t) => 0.016 * (1 - t) + 0.006, { segments: 8, radial: 6 }));
  parts.push(ball(0.016, [-0.28, 0.045, 0], [8, 6]));
  return onPedestal(parts);
}
