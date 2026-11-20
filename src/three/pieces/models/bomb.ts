/** Bomb: a round cast iron bomb in a cradle, with a curling fuse and a glowing spark at its tip. */

import * as THREE from "three";
import { sparkMaterial } from "./accents";
import type { PieceModel } from "./index";
import { ball, faceForward, lathe, merge, onPedestal, PEDESTAL_TOP, sweep, type V3 } from "./shared";

const R = 0.2;
const CENTRE_Y = 0.24;
/** The fuse leans this far (radians) from straight up, toward the front. */
const LEAN = 0.5;
const SPARK: V3 = [0.17, 0.6, 0];

function spark(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [ball(0.022, [0, 0, 0], [10, 8])];
  // Rays spread evenly over a sphere (golden angle spiral) so the burst looks the same from every side.
  const n = 10;
  for (let i = 0; i < n; i++) {
    const y = 1 - (2 * (i + 0.5)) / n;
    const a = i * 2.39996;
    const dir = new THREE.Vector3(Math.cos(a) * Math.sqrt(1 - y * y), y, Math.sin(a) * Math.sqrt(1 - y * y));
    const ray = new THREE.ConeGeometry(0.007, 0.05 + (i % 3) * 0.012, 5).translate(0, 0.045, 0);
    ray.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir));
    parts.push(ray);
  }
  const g = merge(parts);
  g.translate(SPARK[0], SPARK[1] + PEDESTAL_TOP, SPARK[2]);
  return faceForward(g);
}

export function bomb(): PieceModel {
  const parts: THREE.BufferGeometry[] = [];
  parts.push(lathe([[0.17, 0], [0.175, 0.02], [0.15, 0.05], [0.1, 0.07], [0, 0.07]], 36));
  parts.push(ball(R, [0, CENTRE_Y, 0], [40, 28]));
  // Riveted band round the waist of the casing.
  parts.push(new THREE.TorusGeometry(R * 1.0, 0.011, 8, 48).rotateX(Math.PI / 2).translate(0, CENTRE_Y, 0));
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    parts.push(ball(0.011, [Math.cos(a) * R * 1.04, CENTRE_Y + 0.022, Math.sin(a) * R * 1.04], [6, 5]));
  }
  // Fuse collar set into the top of the casing, leaning forward.
  const collarAt: V3 = [Math.sin(LEAN) * R * 0.96, CENTRE_Y + Math.cos(LEAN) * R * 0.96, 0];
  parts.push(lathe([[0, 0], [0.055, 0], [0.058, 0.022], [0.048, 0.06], [0.044, 0.068], [0, 0.068]], 20).rotateZ(-LEAN).translate(...collarAt));
  const top: V3 = [collarAt[0] + Math.sin(LEAN) * 0.066, collarAt[1] + Math.cos(LEAN) * 0.066, 0];
  parts.push(sweep([top, [top[0] + 0.03, top[1] + 0.04, 0], [0.135, 0.54, 0.01], [0.145, 0.575, 0], SPARK], (t) => 0.013 - 0.004 * t, { segments: 20, radial: 8 }));
  return { body: onPedestal(parts), accents: [{ geometry: spark(), material: sparkMaterial }] };
}
