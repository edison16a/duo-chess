/** Every sculpted (non lathe) piece model, by kind. */

import type * as THREE from "three";
import type { PieceKind } from "@/engine";
import { amazon } from "./amazon";
import { archbishop } from "./archbishop";
import { centaur } from "./centaur";
import { chancellor } from "./chancellor";
import { dragon } from "./dragon";
import { rail } from "./rail";
import { camel } from "./camel";
import { cannon } from "./cannon";
import { grasshopper } from "./grasshopper";
import { mann } from "./mann";
import { wizard } from "./wizard";
import { champion } from "./champion";
import { bomb } from "./bomb";
import { phoenix } from "./phoenix";
import { duck } from "./duck";
import { knight } from "./knight";
import { nightrider } from "./nightrider";
import { zebra } from "./zebra";

/** A part drawn with its own material instead of the piece colour (a spark, a beak). */
export interface Accent {
  geometry: THREE.BufferGeometry;
  material: () => THREE.Material;
}

/** Body uses the piece material; accents are optional extra meshes. */
export interface PieceModel {
  body: THREE.BufferGeometry;
  accents?: Accent[];
}

export type SculptedKind = Exclude<PieceKind, "pawn" | "rook" | "bishop" | "queen" | "king">;

/** Builders return a bare geometry when the whole piece is in the piece colour. */
export const MODELS: Record<SculptedKind, () => PieceModel | THREE.BufferGeometry> = {
  knight, archbishop, chancellor, amazon, dragon, rail, camel, zebra, nightrider,
  cannon, grasshopper, wizard, champion, centaur, mann, bomb, phoenix, duck,
};
