/** Nightrider: a knight that rides on through the night, with a crescent moon over its mane. */

import * as THREE from "three";
import { horseHead } from "./horse";
import { collar } from "./parts";
import { onPedestal, place, slab } from "./shared";

/** Crescent outline: an outer disc with an offset bite taken out of it. */
function crescent(r: number): THREE.Shape {
  const s = new THREE.Shape();
  s.absarc(0, 0, r, Math.PI * 0.32, Math.PI * 1.68, false);
  s.absarc(r * 0.42, r * 0.12, r * 0.78, Math.PI * 1.45, Math.PI * 0.6, true);
  s.closePath();
  return s;
}

export function nightrider(): THREE.BufferGeometry {
  const head = place(horseHead(), [0.02, 0.03, 0], [0, 0, 0], 0.97);
  const moon = slab(crescent(0.15), { thickness: 0.075, bevel: 0.03, inset: 0.018, curveSegments: 20, bevelSegments: 4 });
  // The moon cradles the back of the head, its horns reaching forward over the poll.
  place(moon, [-0.13, 0.66, 0], [0, 0, 0.35]);
  return onPedestal([collar(), head, moon]);
}
