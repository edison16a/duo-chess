import type { Stage } from "../core/stage";

/**
 * A self contained animated 3D scene. `update` receives absolute time in
 * seconds so the offline renderer can step frames deterministically, and
 * live views can just pass the clock.
 */
export interface SceneInstance {
  update: (t: number, dt: number) => void;
  dispose?: () => void;
}

export interface SceneDef {
  /** Loop length in seconds for rendered clips. */
  duration: number;
  bloom?: number;
  /** Depth of field for cinematic stills and previews. */
  dof?: { focus: number; aperture: number; maxblur: number };
  /** Best moment (seconds) for a still poster of this scene. */
  poster?: number;
  setup: (stage: Stage) => Promise<SceneInstance>;
}
