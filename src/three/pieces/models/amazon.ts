/** Amazon: queen and knight in one, a horse head rising from a queen's coronet. */

import type * as THREE from "three";
import { horseHead } from "./horse";
import { crown, turned } from "./parts";
import { onPedestal, place } from "./shared";

export function amazon(): THREE.BufferGeometry {
  const body = turned([[0.24, 0], [0.2, 0.04], [0.15, 0.12], [0.12, 0.3], [0.11, 0.36], [0.17, 0.4], [0.17, 0.43], [0.13, 0.45], [0, 0.45]]);
  const head = place(horseHead(), [0.02, 0.42, 0], [0, 0, 0], 0.8);
  const coronet = crown(0.185, 0.2, 8).translate(0, 0.42, 0);
  return onPedestal([body, head, coronet]);
}
