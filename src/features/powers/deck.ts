/**
 * Free Deck budget. Players build their own hand from the whole catalog,
 * so rarer powers cost more points. Without a budget everyone would just
 * take the strongest chromatic and mythical cards every game.
 */

import { POWERS } from "./catalog";
import type { Rarity } from "./types";

export const RARITY_COST: Record<Rarity, number> = {
  rare: 1,
  epic: 2,
  legendary: 3,
  mythical: 4,
  chromatic: 5,
};

/** Points to spend on a deck of `size` powers. An average card is a little above epic. */
export function deckBudget(size: number): number {
  return Math.round(size * 2.5);
}

export function deckCost(ids: string[]): number {
  return ids.reduce((sum, id) => sum + (POWERS[id] ? RARITY_COST[POWERS[id].rarity] : 0), 0);
}

/** Why a deck is not allowed, or null when it is fine. */
export function deckProblem(ids: string[], size: number): string | null {
  if (ids.length !== size) return `Pick exactly ${size} powers`;
  if (new Set(ids).size !== ids.length) return "Each power can only be picked once";
  if (ids.some((id) => !POWERS[id])) return "Unknown power";
  if (deckCost(ids) > deckBudget(size)) return "That deck is over budget";
  return null;
}
