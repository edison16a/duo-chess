/**
 * The power draft, in three styles the host picks from:
 *
 * Split: you see two powers, take one, and the opponent gets the other.
 * Triple: you see three powers and keep one. The rest are gone.
 * Deck: both players build their own hand at once within a point budget.
 *
 * Split and Triple alternate turns. Deck waits until both hands are locked.
 */

import type { Color } from "@/engine";
import { ALL_POWERS, powersOfRarity } from "./catalog";
import { deckProblem } from "./deck";
import { RARITIES, RARITY_WEIGHT } from "./rarity";

export type DraftStyle = "split" | "triple" | "deck";

export const DRAFT_STYLES: { id: DraftStyle; label: string }[] = [
  { id: "split", label: "Take & give" },
  { id: "triple", label: "Triple draft" },
  { id: "deck", label: "Free deck" },
];

export interface DraftPick {
  by: Color;
  keep: string;
  /** What the opponent received (Split only). */
  give: string | null;
}

export interface DraftState {
  style: DraftStyle;
  /** Powers each player ends up with. */
  size: number;
  turn: Color;
  /** Total picks in a Split or Triple draft, both players together. */
  total: number;
  options: string[];
  inventory: Record<Color, string[]>;
  log: DraftPick[];
  /** Deck style: who has locked in their hand. */
  locked: Record<Color, boolean>;
}

const OPTION_COUNT: Record<DraftStyle, number> = { split: 2, triple: 3, deck: 0 };

function rollRarity(random: () => number) {
  const total = RARITIES.reduce((sum, r) => sum + RARITY_WEIGHT[r], 0);
  let roll = random() * total;
  for (const r of RARITIES) {
    roll -= RARITY_WEIGHT[r];
    if (roll < 0) return r;
  }
  return "rare" as const;
}

/** Distinct powers, each rolled by rarity first so the odds hold. */
export function rollOptions(random: () => number, count = 3): string[] {
  const picked: string[] = [];
  let guard = 0;
  while (picked.length < count && guard++ < 200) {
    const pool = powersOfRarity(rollRarity(random)).filter((p) => !picked.includes(p.id));
    if (!pool.length) continue;
    picked.push(pool[Math.floor(random() * pool.length)].id);
  }
  while (picked.length < count) picked.push(ALL_POWERS.find((p) => !picked.includes(p.id))!.id);
  return picked;
}

export function createDraft(style: DraftStyle, size: number, random: () => number): DraftState {
  // A Split pick hands out two powers, so it takes half as many picks to fill both hands.
  const total = style === "split" ? size : style === "triple" ? size * 2 : 0;
  return {
    style,
    size,
    turn: "w",
    total,
    options: rollOptions(random, OPTION_COUNT[style]),
    inventory: { w: [], b: [] },
    log: [],
    locked: { w: false, b: false },
  };
}

export function draftDone(draft: DraftState): boolean {
  if (draft.style === "deck") return draft.locked.w && draft.locked.b;
  return draft.log.length >= draft.total;
}

/** Applies one player's choice. `picks` is one power, or a whole hand in Deck style. */
export function applyDraft(draft: DraftState, by: Color, picks: string[], random: () => number): DraftState | string {
  if (draftDone(draft)) return "The draft is over";
  const other: Color = by === "w" ? "b" : "w";
  const inventory = { w: draft.inventory.w.slice(), b: draft.inventory.b.slice() };

  if (draft.style === "deck") {
    if (draft.locked[by]) return "Your deck is already locked in";
    const problem = deckProblem(picks, draft.size);
    if (problem) return problem;
    inventory[by] = picks.slice();
    return { ...draft, inventory, locked: { ...draft.locked, [by]: true } };
  }

  if (draft.turn !== by) return "Not your pick";
  const keep = picks[0];
  if (picks.length !== 1 || !draft.options.includes(keep)) return "Pick one of the offered powers";
  inventory[by].push(keep);
  const give = draft.style === "split" ? draft.options.find((o) => o !== keep)! : null;
  if (give) inventory[other].push(give);
  const next: DraftState = { ...draft, inventory, log: [...draft.log, { by, keep, give }], turn: other, options: [] };
  if (!draftDone(next)) next.options = rollOptions(random, OPTION_COUNT[draft.style]);
  return next;
}
