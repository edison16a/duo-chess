/**
 * Environment previews: the white queen as hero in each cinematic
 * environment, two blurred pieces behind her for depth, and the slow
 * cinematic push in. Used to tune environments and as their posters.
 */

import { ENVIRONMENTS } from "../env";
import type { EnvironmentId } from "../env/types";
import { shootCamera, stageHero } from "./cinematic";
import type { SceneDef } from "./types";

export type PreviewEnvId = Exclude<EnvironmentId, "grassland">;

export const ENV_PREVIEW_IDS = Object.keys(ENVIRONMENTS) as PreviewEnvId[];

export function envPreview(id: PreviewEnvId): SceneDef {
  return {
    duration: 8,
    bloom: 0.6,
    // Focus is retargeted on the hero every frame by shootCamera; this aperture keeps her sharp and melts the set.
    dof: { focus: 2.7, aperture: 0.006, maxblur: 0.016 },
    poster: 3,
    async setup(stage) {
      const env = ENVIRONMENTS[id](stage);
      // Off axis and well behind the hero so they read as soft shapes in the depth.
      await stageHero(stage, { kind: "queen", color: "w" }, [
        { kind: "rook", color: "b", at: [-0.3, -2.0] },
        { kind: "knight", color: "b", at: [-2.1, -1.8] },
      ]);
      return {
        update(t, dt) {
          shootCamera(stage, t);
          env.update(t, dt);
        },
        dispose: () => env.dispose(),
      };
    },
  };
}
