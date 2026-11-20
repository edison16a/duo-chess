import { closeup, portrait, showcase } from "./showcase";
import type { SceneDef } from "./types";
import { FX_LAB, fxLab } from "./fxLab";

/** Every scene the render route can show, by name ("mode:atomic", "power:frostbite", ...). */
export const SCENES: Record<string, () => Promise<SceneDef>> = {
  ...Object.fromEntries(Object.keys(FX_LAB).map((k) => [`fx:${k}`, async () => fxLab(k)])),
  showcase: async () => showcase,
  ...Object.fromEntries([
    "pawn", "rook", "bishop", "queen", "king", "knight", "archbishop", "chancellor", "amazon", "dragon", "rail", "camel", "zebra",
    "nightrider", "cannon", "grasshopper", "wizard", "champion", "centaur", "mann", "bomb", "phoenix", "duck",
  ].flatMap((k) => [[`piece:${k}`, async () => closeup(k)], [`model:${k}`, async () => portrait(k)]])),
};
