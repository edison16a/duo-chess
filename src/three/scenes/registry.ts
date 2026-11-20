import { closeup, showcase } from "./showcase";
import type { SceneDef } from "./types";

/** Every scene the render route can show, by name ("mode:atomic", "power:frostbite", ...). */
export const SCENES: Record<string, () => Promise<SceneDef>> = {
  showcase: async () => showcase,
  ...Object.fromEntries(["knight", "dragon", "wizard", "king", "rail"].map((k) => [`piece:${k}`, async () => closeup(k)])),
};
