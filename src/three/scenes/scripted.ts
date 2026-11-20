/** Turns a declarative scene spec (board, pieces, camera, cues) into a SceneDef. */

import * as THREE from "three";
import type { BoardShape } from "../board/boardMesh";
import { ENVIRONMENTS } from "../env";
import { grassland } from "../env/grassland";
import type { Environment, EnvironmentId } from "../env/types";
import { addBoard, orbit } from "./helpers";
import { Director, fxContext, type Cue } from "./director";
import type { SceneDef } from "./types";

export interface ScriptSpec {
  duration: number;
  fen: string;
  shape?: BoardShape;
  bloom?: number;
  poster?: number;
  /** Themed world around the board. Without one the board sits on a plain table. */
  env?: EnvironmentId;
  camera: { radius: number; height: number; speed?: number; start?: number; target?: [number, number, number] };
  cues: Cue[];
  /** Runs once after pieces are placed, for scene dressing. */
  setup?: (d: Director) => void;
}

export function scripted(spec: ScriptSpec): SceneDef {
  return {
    duration: spec.duration,
    bloom: spec.bloom ?? 0.5,
    poster: spec.poster,
    dof: spec.env ? { focus: spec.camera.radius, aperture: 0.0035, maxblur: 0.006 } : undefined,
    async setup(stage) {
      const shape = spec.shape ?? { width: 8, height: 8 };
      let env: Environment | null = null;
      if (spec.env === "grassland") env = grassland(stage, { blades: 40000, clear: [-shape.width / 2 - 0.6, shape.width / 2 + 0.6, -shape.height / 2 - 0.6, shape.height / 2 + 0.6] });
      else if (spec.env) {
        // Environments put their floor at y = 0, exactly where the squares are. Sink the
        // world a little so the board rests on it as a slab instead of fighting it for depth.
        const before = new Set(stage.scene.children);
        env = ENVIRONMENTS[spec.env](stage);
        stage.scene.children.filter((c) => !before.has(c) && !(c as THREE.Light).isLight).forEach((c) => { c.position.y -= 0.36; });
      }
      addBoard(stage, shape, !env);
      const d = new Director(stage, shape, spec.cues, spec.duration);
      await d.place(spec.fen);
      spec.setup?.(d);
      const target = new THREE.Vector3(...(spec.camera.target ?? [0, 0, 0]));
      return {
        update(t, dt) {
          env?.update(t, dt);
          orbit(stage, t, { radius: spec.camera.radius, height: spec.camera.height, speed: spec.camera.speed ?? 0.05, start: spec.camera.start ?? 0.35, target });
          d.update(t, dt, fxContext(stage));
          if (env) stage.setFocus(stage.camera.position.distanceTo(target));
        },
        dispose: () => env?.dispose(),
      };
    },
  };
}

/** Shorthand for a cue. */
export const cue = (at: number, run: (d: Director) => void) => ({ at, run });
