import type { Stage } from "../core/stage";

/**
 * A themed world around a cinematic shot: floor, walls or sky, lighting,
 * atmosphere and ambient motion. The hero piece stands at the origin on
 * the floor (y = 0) and the camera looks at it from roughly +z, so the
 * environment puts its detail behind and around that spot.
 */
export interface Environment {
  update: (t: number, dt: number) => void;
  dispose: () => void;
}

export type EnvironmentId =
  | "ice-cave" | "volcano" | "storm" | "void" | "temple" | "sanctum"
  | "arcane" | "canyon" | "marsh" | "tunnel" | "prism" | "grassland";

export type EnvironmentBuilder = (stage: Stage) => Environment;
