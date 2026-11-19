/**
 * The power draft. Players take turns: each sees three random powers, keeps
 * one, hands one to the opponent, and crosses the last one out.
 */

import type { Color } from "@/engine";
import { ALL_POWERS, powersOfRarity } from "./catalog";
import { RARITIES, RARITY_WEIGHT } from "./rarity";

export interface DraftPick {
  by: Color;
  keep: string;
  give: string;
  banned: string;
}

export interface DraftState {
  turn: Color;
  /** Total picks in the draft, both players together. */
  total: number;
  options: string[];
  inventory: Record<Color, string[]>;
  log: DraftPick[];
}

function rollRarity(random: () => number) {
  const total = RARITIES.reduce((sum, r) => sum + RARITY_WEIGHT[r], 0);
  let roll = random() * total;
  for (const r of RARITIES) {
    roll -= RARITY_WEIGHT[r];
    if (roll < 0) return r;
  }
  return "rare" as const;
}

/** Three distinct powers, each rolled by rarity first so the odds hold. */
export function rollOptions(random: () => number, exclude: string[] = []): string[] {
  const picked: string[] = [];
  let guard = 0;
  while (picked.length < 3 && guard++ < 200) {
    const pool = powersOfRarity(rollRarity(random)).filter((p) => !picked.includes(p.id) && !exclude.includes(p.id));
    if (!pool.length) continue;
    picked.push(pool[Math.floor(random() * pool.length)].id);
  }
  while (picked.length < 3) {
    const fallback = ALL_POWERS.find((p) => !picked.includes(p.id))!;
    picked.push(fallback.id);
  }
  return picked;
}

export function createDraft(roundsEach: number, random: () => number): DraftState {
  return { turn: "w", total: roundsEach * 2, options: rollOptions(random), inventory: { w: [], b: [] }, log: [] };
}

export function draftDone(draft: DraftState): boolean {
  return draft.log.length >= draft.total;
}

export function applyDraftPick(draft: DraftState, by: Color, keep: string, give: string, random: () => number): DraftState | string {
  if (draftDone(draft)) return "The draft is over";
  if (draft.turn !== by) return "Not your pick";
  if (keep === give || !draft.options.includes(keep) || !draft.options.includes(give)) return "Pick one to keep and a different one to give";
  const other: Color = by === "w" ? "b" : "w";
  const banned = draft.options.find((o) => o !== keep && o !== give)!;
  const inventory = { w: draft.inventory.w.slice(), b: draft.inventory.b.slice() };
  inventory[by].push(keep);
  inventory[other].push(give);
  const log = [...draft.log, { by, keep, give, banned }];
  const next: DraftState = { ...draft, inventory, log, turn: other, options: [] };
  if (!draftDone(next)) next.options = rollOptions(random);
  return next;
}
