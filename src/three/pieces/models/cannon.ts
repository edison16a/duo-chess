/** Cannon: a bronze field gun on a wheeled carriage, muzzle raised toward the enemy. */

import * as THREE from "three";
import { ball, lathe, merge, onPedestal, slab, type V3 } from "./shared";

/** Barrel profile along its axis (radius, distance from the breech). */
const BARREL: [number, number][] = [
  [0, -0.02], [0.03, -0.015], [0.055, 0.0], [0.062, 0.02], [0.064, 0.06], [0.058, 0.065], [0.056, 0.15], [0.06, 0.155], [0.06, 0.17],
  [0.052, 0.18], [0.047, 0.32], [0.054, 0.335], [0.058, 0.36], [0.05, 0.37], [0.03, 0.37], [0.03, 0.34], [0, 0.34],
];

/** Spoked wooden wheel lying in the xy plane: tyre, felloe, spokes and hub. */
function wheel(r: number): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [new THREE.TorusGeometry(r, 0.02, 8, 28), new THREE.TorusGeometry(r - 0.025, 0.012, 6, 28)];
  for (let i = 0; i < 8; i++) {
    const spoke = new THREE.CylinderGeometry(0.008, 0.011, r - 0.03, 6).translate(0, (r - 0.03) / 2, 0);
    parts.push(spoke.rotateZ((i / 8) * Math.PI * 2));
  }
  parts.push(lathe([[0, -0.035], [0.03, -0.035], [0.034, -0.02], [0.034, 0.02], [0.022, 0.035], [0, 0.035]], 14).rotateX(Math.PI / 2));
  return merge(parts);
}

/** Side cheek of the carriage: a stepped bracket that runs down into the trail. */
function cheek(): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(-0.3, 0.0);
  s.lineTo(-0.26, 0.0);
  s.quadraticCurveTo(-0.08, 0.1, 0.1, 0.12);
  s.lineTo(0.1, 0.2);
  s.lineTo(0.05, 0.25);
  s.lineTo(-0.02, 0.25);
  s.lineTo(-0.06, 0.2);
  s.quadraticCurveTo(-0.18, 0.12, -0.3, 0.05);
  s.closePath();
  return s;
}

export function cannon(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  for (const z of [0.07, -0.07]) parts.push(slab(cheek(), { thickness: 0.035, bevel: 0.012, inset: 0.008, curveSegments: 6, bevelSegments: 2 }).translate(0, 0, z));
  // Transom tying the cheeks together, and the axle with its two wheels.
  parts.push(new THREE.BoxGeometry(0.06, 0.04, 0.14).translate(-0.22, 0.06, 0));
  parts.push(new THREE.CylinderGeometry(0.018, 0.018, 0.36, 10).rotateX(Math.PI / 2).translate(0.03, 0.17, 0));
  for (const z of [0.15, -0.15]) parts.push(wheel(0.17).translate(0.03, 0.17, z));
  // Barrel resting on its trunnions, raised about twenty five degrees.
  const pitch = 0.5;
  const barrel = lathe(BARREL, 24);
  barrel.rotateZ(-Math.PI / 2);
  barrel.translate(-0.13, 0, 0);
  parts.push(...[barrel, ball(0.03, [-0.165, 0, 0], [10, 8])].map((g) => g.rotateZ(pitch).translate(0.02, 0.27, 0)));
  parts.push(new THREE.CylinderGeometry(0.022, 0.022, 0.17, 10).rotateX(Math.PI / 2).translate(0.02, 0.27, 0));
  // Elevation wedge under the breech.
  const at: V3 = [-0.12, 0.215, 0];
  parts.push(new THREE.BoxGeometry(0.07, 0.03, 0.1).rotateZ(0.2).translate(...at));
  // Scaled so the gun stands about as tall as its neighbours.
  return onPedestal([merge(parts).scale(1.15, 1.15, 1.05)]);
}
