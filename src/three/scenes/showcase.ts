import * as THREE from "three";
import type { PieceKind } from "@/engine";
import { createPiece } from "../pieces/factory";
import { addBoard, orbit } from "./helpers";
import type { SceneDef } from "./types";

const KINDS: PieceKind[] = ["king", "queen", "rook", "bishop", "knight", "pawn", "archbishop", "chancellor", "amazon", "dragon", "rail", "camel", "zebra", "nightrider", "cannon", "grasshopper", "wizard", "champion", "centaur", "mann", "bomb", "phoenix", "duck"];

/** Every piece in a grid. Used to eyeball the models. */
export const showcase: SceneDef = {
  duration: 8,
  bloom: 0.25,
  async setup(stage) {
    addBoard(stage, { width: 8, height: 8 });
    for (let i = 0; i < KINDS.length; i++) {
      const mesh = await createPiece(KINDS[i], i % 2 ? "b" : "w");
      mesh.position.set((i % 8) - 3.5, 0, Math.floor(i / 8) * 1.4 - 1.5);
      stage.scene.add(mesh);
    }
    return { update: (t) => orbit(stage, t, { radius: 9, height: 6, speed: 0.15 }) };
  },
};

/** One piece up close, for checking a model. */
export function closeup(kind: string): SceneDef {
  return {
    duration: 6,
    bloom: 0.15,
    async setup(stage) {
      addBoard(stage, { width: 2, height: 2 });
      const a = await createPiece(kind as PieceKind, "w");
      const b = await createPiece(kind as PieceKind, "b");
      a.position.set(-0.5, 0, 0.5);
      b.position.set(0.5, 0, -0.5);
      stage.scene.add(a, b);
      return { update: (t) => orbit(stage, t, { radius: 3.1, height: 1.7, speed: 0.4, target: new THREE.Vector3(0, 0.42, 0) }) };
    },
  };
}

/** A tighter close up than `closeup`, for judging the details of a sculpted model. */
export function portrait(kind: string): SceneDef {
  return {
    duration: 16,
    bloom: 0.1,
    async setup(stage) {
      addBoard(stage, { width: 2, height: 2 });
      const a = await createPiece(kind as PieceKind, "w");
      const b = await createPiece(kind as PieceKind, "b");
      a.position.set(-0.35, 0, 0.35);
      b.position.set(0.35, 0, -0.35);
      stage.scene.add(a, b);
      return { update: (t) => orbit(stage, t, { radius: 2.1, height: 1.15, speed: 0.4, target: new THREE.Vector3(0, 0.45, 0) }) };
    },
  };
}
