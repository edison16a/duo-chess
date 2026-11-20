/** Classic carved Staunton knight: the horse head rising from a turned collar. */

import type * as THREE from "three";
import { horseHead } from "./horse";
import { collar } from "./parts";
import { onPedestal } from "./shared";

export function knight(): THREE.BufferGeometry {
  const head = horseHead();
  head.translate(0.01, 0.03, 0);
  return onPedestal([collar(), head]);
}
