import type { PowerDef, Rarity } from "../types";
import { CHROMATIC_POWERS } from "./chromatic";
import { EPIC_POWERS } from "./epic";
import { LEGENDARY_POWERS } from "./legendary";
import { MYTHICAL_POWERS } from "./mythical";
import { RARE_POWERS } from "./rare";

export const ALL_POWERS: PowerDef[] = [
  ...RARE_POWERS,
  ...EPIC_POWERS,
  ...LEGENDARY_POWERS,
  ...MYTHICAL_POWERS,
  ...CHROMATIC_POWERS,
];

export const POWERS: Record<string, PowerDef> = Object.fromEntries(ALL_POWERS.map((p) => [p.id, p]));

export function powersOfRarity(rarity: Rarity): PowerDef[] {
  return ALL_POWERS.filter((p) => p.rarity === rarity);
}
