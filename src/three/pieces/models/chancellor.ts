/** Chancellor: rook and knight in one, a horse rearing out of a castle tower. */

import type * as THREE from "three";
import { horseHead } from "./horse";
import { battlements, turned } from "./parts";
import { onPedestal, place } from "./shared";

export function chancellor(): THREE.BufferGeometry {
  const tower = turned([[0.235, 0], [0.21, 0.03], [0.19, 0.08], [0.178, 0.28], [0.215, 0.31], [0.222, 0.42], [0.172, 0.42], [0.172, 0.36], [0, 0.36]]);
  const merlons = battlements(0.197, 6, [0.095, 0.075, 0.05]).translate(0, 0.415, 0);
  const head = place(horseHead(), [0.015, 0.3, 0], [0, 0, 0], 0.75);
  return onPedestal([tower, merlons, head]);
}
