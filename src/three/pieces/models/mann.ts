/** Mann: a commoner who steps like a king. A tall pawn with a plain band and a round head. */

import * as THREE from "three";
import { ball, lathe, merge, onPedestal } from "./shared";

export function mann(): THREE.BufferGeometry {
  const body = lathe([
    [0.235, 0], [0.21, 0.025], [0.17, 0.07], [0.135, 0.15], [0.112, 0.26], [0.1, 0.38], [0.098, 0.43],
    [0.155, 0.45], [0.16, 0.475], [0.105, 0.5], [0.08, 0.53], [0, 0.53],
  ], 40);
  // The plain band round the waist that sets the mann apart from a pawn.
  const band = new THREE.TorusGeometry(0.13, 0.017, 10, 40).rotateX(Math.PI / 2).translate(0, 0.17, 0);
  const head = ball(0.125, [0, 0.63, 0], [32, 22]);
  return onPedestal([merge([body, band, head])]);
}
