/** Phoenix: a firebird rising from flames, wings raised high, crest plumes and a flowing flame tail. */

import * as THREE from "three";
import { ball, ellipsoid, merge, onPedestal, place, slab, sweep } from "./shared";

/** Stylised carved flame: a teardrop whose tip flicks over to one side. */
function flameShape(w: number, h: number): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(-w * 0.5, 0);
  s.bezierCurveTo(-w * 0.75, h * 0.35, -w * 0.1, h * 0.55, -w * 0.15, h * 0.75);
  s.bezierCurveTo(-w * 0.2, h * 0.9, w * 0.1, h * 0.95, w * 0.25, h);
  s.bezierCurveTo(w * 0.1, h * 0.85, w * 0.45, h * 0.6, w * 0.5, h * 0.4);
  s.bezierCurveTo(w * 0.55, h * 0.2, w * 0.45, h * 0.05, w * 0.5, 0);
  s.closePath();
  return s;
}

/** A flame standing on the ring at angle `a`, facing outward and leaning in toward the bird. */
function flame(a: number, h: number): THREE.BufferGeometry {
  const g = slab(flameShape(0.11, h), { thickness: 0.05, bevel: 0.02, inset: 0.012, curveSegments: 4, bevelSegments: 2 });
  g.rotateX(-0.25);
  g.rotateY(Math.PI / 2 - a);
  return g.translate(Math.cos(a) * 0.12, 0, Math.sin(a) * 0.12);
}

/** Wing outline in its own plane: x runs outward from the shoulder, y up, feathers along the outer edge. */
function wingShape(): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.bezierCurveTo(-0.03, 0.12, 0.0, 0.28, 0.06, 0.4);
  const tips: [number, number][] = [[0.115, 0.34], [0.16, 0.26], [0.185, 0.17], [0.18, 0.08], [0.13, 0.0]];
  let prev: [number, number] = [0.06, 0.4];
  for (const tip of tips) {
    // Cut a notch toward the shoulder, then swing out in a rounded lobe to the next feather tip.
    const mx = (prev[0] + tip[0]) / 2, my = (prev[1] + tip[1]) / 2;
    const len = Math.hypot(mx, my - 0.08);
    const nx = mx - (mx / len) * 0.03, ny = my - ((my - 0.08) / len) * 0.03;
    s.lineTo(nx, ny);
    s.quadraticCurveTo(tip[0] - 0.005, tip[1] + 0.03, tip[0], tip[1]);
    prev = tip;
  }
  s.quadraticCurveTo(0.06, 0.0, 0, 0);
  return s;
}

function wing(side: 1 | -1): THREE.BufferGeometry {
  const plate = slab(wingShape(), { thickness: 0.04, bevel: 0.016, inset: 0.01, curveSegments: 6, bevelSegments: 3 });
  // Raised quills from the shoulder out to each feather tip.
  const quills = ([[0.06, 0.4], [0.11, 0.33], [0.155, 0.25], [0.18, 0.16]] as const).map(([x, y]) =>
    sweep([[0.01, 0.03, 0.016], [x * 0.55, y * 0.6, 0.02], [x * 0.92, y * 0.92, 0.016]], (t) => 0.01 * (1 - 0.7 * t), { segments: 8, radial: 6 }));
  const g = merge([plate, ...quills]);
  // Turn the wing plane to face forward with its feathers spreading out to this side. A half turn
  // stands in for a mirror on the other side, which keeps the triangle winding (and lighting) correct.
  g.rotateY(side > 0 ? -Math.PI / 2 : Math.PI / 2);
  // Tilt the tips outward into a V and sweep them back.
  return place(g, [-0.02, 0.43, side * 0.045], [side * 0.3, -side * 0.55, 0]);
}

export function phoenix(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  // Ring of flames the bird rises from, taller at the back.
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2 + 0.45;
    parts.push(flame(a, 0.17 + 0.11 * (0.5 - 0.5 * Math.cos(a))));
  }
  parts.push(ellipsoid([0.12, 0.08, 0.12], [0, 0.05, 0], [0, 0, 0], [20, 10]));
  // Plump body with the breast thrust forward, a slim neck and the head with its hooked beak.
  parts.push(ellipsoid([0.095, 0.15, 0.085], [-0.01, 0.33, 0], [0, 0, -0.3], [22, 16]));
  parts.push(ellipsoid([0.075, 0.09, 0.07], [0.04, 0.4, 0], [0, 0, -0.2], [18, 12]));
  parts.push(sweep([[0.02, 0.42, 0], [0.06, 0.5, 0], [0.07, 0.58, 0]], (t) => 0.05 - 0.012 * t, { segments: 10, radial: 14 }));
  parts.push(ball(0.06, [0.07, 0.6, 0], [20, 14]));
  parts.push(sweep([[0.11, 0.61, 0], [0.155, 0.6, 0], [0.17, 0.57, 0]], (t) => 0.024 * (1 - t) + 0.002, { segments: 10, radial: 10, up: [0, 1, 0], squash: 1.2 }));
  for (const s of [1, -1]) parts.push(ellipsoid([0.018, 0.02, 0.012], [0.1, 0.625, s * 0.042], [0, 0, 0], [10, 8]));
  // Crest plumes flaring up and back from the crown like a small fire of their own.
  for (const [dz, h] of [[0, 0.17], [0.022, 0.12], [-0.022, 0.12]] as const) {
    parts.push(sweep([[0.075, 0.63, dz], [0.06, 0.63 + h * 0.6, dz * 1.4], [0.0, 0.64 + h, dz * 2], [-0.05, 0.63 + h * 0.9, dz * 2.2]], (t) => 0.02 * Math.pow(1 - t, 0.8) + 0.002, { segments: 12, radial: 8 }));
  }
  parts.push(wing(1), wing(-1));
  // Long tail plumes sweeping down the back into the flames.
  for (const dz of [-0.04, 0, 0.04]) {
    parts.push(sweep([[-0.04, 0.24, dz * 0.5], [-0.14, 0.18, dz], [-0.2, 0.08, dz * 1.4], [-0.15, 0.02, dz * 1.6]], (t) => 0.03 * Math.pow(1 - t, 0.7) + 0.003, { segments: 14, radial: 8 }));
  }
  return onPedestal(parts);
}
