/** Archbishop: bishop and knight in one, a horse head wearing a bishop's mitre on a bishop's stem. */

import type * as THREE from "three";
import { horseHead, POLL } from "./horse";
import { mitre, turned } from "./parts";
import { onPedestal, place } from "./shared";

const HEAD_SCALE = 0.7;
const NECK = 0.27;

export function archbishop(): THREE.BufferGeometry {
  const stem = turned([[0.235, 0], [0.2, 0.03], [0.15, 0.09], [0.118, 0.17], [0.112, 0.21], [0.165, 0.235], [0.165, 0.26], [0.12, 0.28], [0, 0.28]]);
  const head = place(horseHead(), [0.03, NECK, 0], [0, 0, 0], HEAD_SCALE);
  // The mitre sits on the poll, tipped back a little like a hat worn at ease.
  const hat = place(mitre(0.088), [POLL[0] * HEAD_SCALE + 0.015, NECK + POLL[1] * HEAD_SCALE - 0.045, 0], [0, 0, 0.16]);
  return onPedestal([stem, head, hat]);
}
