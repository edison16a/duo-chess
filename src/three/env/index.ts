/** Every cinematic environment by id. "grassland" is added separately. */

import { arcane } from "./arcane";
import { canyon } from "./canyon";
import { iceCave } from "./iceCave";
import { marsh } from "./marsh";
import { prism } from "./prism";
import { sanctum } from "./sanctum";
import { storm } from "./storm";
import { temple } from "./temple";
import { tunnel } from "./tunnel";
import { voidEnv } from "./void";
import { volcano } from "./volcano";
import type { EnvironmentBuilder, EnvironmentId } from "./types";

export const ENVIRONMENTS: Record<Exclude<EnvironmentId, "grassland">, EnvironmentBuilder> = {
  "ice-cave": iceCave,
  volcano,
  storm,
  void: voidEnv,
  temple,
  sanctum,
  arcane,
  canyon,
  marsh,
  tunnel,
  prism,
};
