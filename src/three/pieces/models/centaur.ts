/** Centaur: a knight that moves like a king too, so its head wears a small crown. */

import type * as THREE from "three";
import { horseHead, POLL } from "./horse";
import { collar, crown } from "./parts";
import { onPedestal, place } from "./shared";

const HEAD_SCALE = 0.94;

export function centaur(): THREE.BufferGeometry {
  const head = place(horseHead(), [0.015, 0.03, 0], [0, 0, 0], HEAD_SCALE);
  // Crown rests on the poll, tilted forward to follow the slope of the forehead.
  const circlet = place(crown(0.085, 0.15, 5, { pearl: 0.014 }), [POLL[0] * HEAD_SCALE + 0.02, 0.03 + POLL[1] * HEAD_SCALE - 0.03, 0], [0, 0, -0.18]);
  return onPedestal([collar(), head, circlet]);
}
