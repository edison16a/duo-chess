/**
 * The power draft, in three styles the host picks from. Both players draft
 * at the same time, each from their own offers:
 *
 * Split: you see two powers, take one, and the opponent gets the other.
 * Triple: you see three powers and keep one. The rest are gone.
 * Deck: you build your own hand within a point budget.
 *
 * The game starts once both players are done.
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
  /** Picks each player makes in Split or Triple. */
  rounds: number;
  /** Each player's current offer. */
  options: Record<Color, string[]>;
  /** Picks each player has made so far. */
  picks: Record<Color, number>;
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
  // A Split pick hands out two powers, one to each player, so it takes half as many picks.
  const rounds = style === "split" ? Math.ceil(size / 2) : style === "triple" ? size : 0;
  const count = OPTION_COUNT[style];
  return {
    style,
    size,
    rounds,
    options: { w: rollOptions(random, count), b: rollOptions(random, count) },
    picks: { w: 0, b: 0 },
    inventory: { w: [], b: [] },
    log: [],
    locked: { w: false, b: false },
  };
}

/** True once this player has nothing left to choose. */
export function playerDone(draft: DraftState, color: Color): boolean {
  return draft.style === "deck" ? draft.locked[color] : draft.picks[color] >= draft.rounds;
}

export function draftDone(draft: DraftState): boolean {
  return playerDone(draft, "w") && playerDone(draft, "b");
}

/** Applies one player's choice. `picks` is one power, or a whole hand in Deck style. */
export function applyDraft(draft: DraftState, by: Color, picks: string[], random: () => number): DraftState | string {
  if (playerDone(draft, by)) return "You are done drafting";
  const other: Color = by === "w" ? "b" : "w";
  const inventory = { w: draft.inventory.w.slice(), b: draft.inventory.b.slice() };

  if (draft.style === "deck") {
    const problem = deckProblem(picks, draft.size);
    if (problem) return problem;
    inventory[by] = picks.slice();
    return { ...draft, inventory, locked: { ...draft.locked, [by]: true } };
  }

  const offer = draft.options[by];
  const keep = picks[0];
  if (picks.length !== 1 || !offer.includes(keep)) return "Pick one of the offered powers";
  inventory[by].push(keep);
  const give = draft.style === "split" ? offer.find((o) => o !== keep)! : null;
  if (give) inventory[other].push(give);
  const made = draft.picks[by] + 1;
  const next = made < draft.rounds ? rollOptions(random, OPTION_COUNT[draft.style]) : [];
  return {
    ...draft,
    inventory,
    log: [...draft.log, { by, keep, give }],
    picks: { ...draft.picks, [by]: made },
    options: { ...draft.options, [by]: next },
  };
}
