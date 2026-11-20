/** Wizard: a robed figure with a long beard under a bent, star badged pointed hat. */

import * as THREE from "three";
import { ball, deform, ellipsoid, lathe, merge, onPedestal, place, slab, sweep } from "./shared";

/** Five pointed star outline, used for the wizard's hat badge. */
export function starShape(outer: number, inner: number, points = 5): THREE.Shape {
  const s = new THREE.Shape();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 ? inner : outer;
    const a = Math.PI / 2 + (i * Math.PI) / points;
    if (i === 0) s.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    else s.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  s.closePath();
  return s;
}

/** Long robe flaring to the hem, with soft vertical folds pressed into it. */
function robe(): THREE.BufferGeometry {
  const g = lathe([[0.215, 0], [0.205, 0.02], [0.17, 0.12], [0.135, 0.26], [0.11, 0.38], [0.1, 0.43], [0.06, 0.46], [0, 0.46]], 48);
  return deform(g, (v) => {
    const a = Math.atan2(v.z, v.x);
    // Folds fade out toward the shoulders.
    const fold = 1 + 0.06 * Math.cos(a * 7) * Math.max(0, 1 - v.y / 0.36);
    v.x *= fold;
    v.z *= fold;
  });
}

export function wizard(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [robe()];
  // Rope belt.
  parts.push(new THREE.TorusGeometry(0.13, 0.014, 8, 40).rotateX(Math.PI / 2).translate(0, 0.25, 0));
  // Sleeves folded across the front, hands hidden.
  for (const s of [1, -1]) {
    parts.push(sweep([[-0.02, 0.42, s * 0.1], [0.07, 0.36, s * 0.11], [0.11, 0.31, s * 0.04]], (t) => 0.045 + 0.015 * t, { segments: 12, radial: 12 }));
  }
  // Head with a big nose, and a long pointed beard down the chest.
  parts.push(ball(0.085, [0.0, 0.53, 0], [24, 16]));
  parts.push(ellipsoid([0.025, 0.02, 0.02], [0.085, 0.52, 0], [0, 0, -0.3], [10, 8]));
  parts.push(sweep([[0.06, 0.5, 0], [0.1, 0.42, 0], [0.12, 0.32, 0], [0.13, 0.24, 0]], (t) => 0.06 * Math.pow(1 - t, 0.8) + 0.003, { segments: 16, radial: 12, up: [1, 0, 0], squash: 0.6 }));
  parts.push(...[1, -1].map((s) => ellipsoid([0.04, 0.018, 0.035], [0.07, 0.505, s * 0.03], [0, s * 0.4, 0.2], [10, 8])));
  // Brim, then the tall cone that bends back near the tip.
  parts.push(lathe([[0, 0], [0.17, 0.0], [0.185, 0.01], [0.175, 0.024], [0.1, 0.035], [0, 0.04]], 40).translate(0, 0.58, 0));
  parts.push(sweep([[0, 0.6, 0], [0, 0.72, 0], [-0.02, 0.82, 0], [-0.08, 0.9, 0], [-0.13, 0.9, 0]], (t) => 0.105 * Math.pow(1 - t, 1.1) + 0.004, { segments: 28, radial: 18 }));
  parts.push(ball(0.018, [-0.135, 0.9, 0], [8, 6]));
  parts.push(new THREE.TorusGeometry(0.1, 0.012, 6, 32).rotateX(Math.PI / 2).translate(0, 0.625, 0));
  // Star badge on the front of the hat.
  const star = slab(starShape(0.05, 0.022), { thickness: 0.022, bevel: 0.008, inset: 0.004, curveSegments: 1, bevelSegments: 2 });
  parts.push(place(star, [0.085, 0.7, 0], [0, Math.PI / 2, 0.15]));
  return onPedestal(parts);
}
