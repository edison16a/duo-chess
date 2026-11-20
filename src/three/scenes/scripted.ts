/** Turns a declarative scene spec (board, pieces, camera, cues) into a SceneDef. */

import * as THREE from "three";
import type { BoardShape } from "../board/boardMesh";
import { addBoard, orbit } from "./helpers";
import { Director, fxContext, type Cue } from "./director";
import type { SceneDef } from "./types";

export interface ScriptSpec {
  duration: number;
  fen: string;
  shape?: BoardShape;
  bloom?: number;
  camera: { radius: number; height: number; speed?: number; start?: number; target?: [number, number, number] };
  cues: Cue[];
  /** Runs once after pieces are placed, for scene dressing. */
  setup?: (d: Director) => void;
}

export function scripted(spec: ScriptSpec): SceneDef {
  return {
    duration: spec.duration,
    bloom: spec.bloom ?? 0.5,
    async setup(stage) {
      const shape = spec.shape ?? { width: 8, height: 8 };
      addBoard(stage, shape);
      const d = new Director(stage, shape, spec.cues, spec.duration);
      await d.place(spec.fen);
      spec.setup?.(d);
      const target = new THREE.Vector3(...(spec.camera.target ?? [0, 0, 0]));
      return {
        update(t, dt) {
          orbit(stage, t, { radius: spec.camera.radius, height: spec.camera.height, speed: spec.camera.speed ?? 0.05, start: spec.camera.start ?? 0.35, target });
          d.update(t, dt, fxContext(stage));
        },
      };
    },
  };
}

/** Shorthand for a cue. */
export const cue = (at: number, run: (d: Director) => void) => ({ at, run });
