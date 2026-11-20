/**
 * Random style powers. There is no draft: each player starts with a row of
 * randomly rolled powers, and those are slots rather than one shot cards.
 * Firing a power puts its slot on cooldown, and when the cooldown runs out
 * the slot gets a fresh roll.
 *
 * The cooldown is counted in the owner's own turns and depends on rarity,
 * so the big powers come around less often:
 * rare 2, epic 3, legendary 4, mythical 5, chromatic 6.
 * A cooldown of 3 means the slot is back on your third turn after the one
 * you used it on, so you sit out two turns without it. Free powers and
 * powers that use your move start the cooldown the same way.
 */

import type { Color, GameState, PowerState, Position } from "@/engine";
import { POWERS } from "./catalog";
import { rollOptions } from "./draft";
import type { Rarity } from "./types";

export const COOLDOWN: Record<Rarity, number> = {
  rare: 2,
  epic: 3,
  legendary: 4,
  mythical: 5,
  chromatic: 6,
};

/**
 * How many turns this color has finished. Worked out from the move number
 * so it holds up through skipped turns and powers that keep the turn going,
 * and nothing has to remember to count.
 */
export function turnsDone(pos: Position, color: Color): number {
  return pos.fullmove - 1 + (color === "w" && pos.turn === "b" ? 1 : 0);
}

/** Both players' opening hands, all slots ready. */
export function createSlots(size: number, random: () => number): PowerState {
  return {
    inventory: { w: rollOptions(random, size), b: rollOptions(random, size) },
    usedTurn: null,
    refillAt: { w: Array(size).fill(null), b: Array(size).fill(null) },
  };
}

/** The slot holding `id` that can fire now, or -1. Without slots any held copy counts. */
export function readySlot(powers: PowerState, color: Color, id: string): number {
  const hand = powers.inventory[color];
  return hand.findIndex((p, i) => p === id && (powers.refillAt?.[color][i] ?? null) === null);
}

/** Powers this color could fire right now, ignoring whose turn it is. */
export function readyPowers(powers: PowerState, color: Color): string[] {
  return powers.inventory[color].filter((_, i) => (powers.refillAt?.[color][i] ?? null) === null);
}

/** Turns of its owner until a slot is back, or 0 when it is ready. Never below 1 while cooling. */
export function turnsLeft(game: GameState, color: Color, slot: number): number {
  const at = game.powers?.refillAt?.[color][slot] ?? null;
  return at === null ? 0 : Math.max(1, at - turnsDone(game.pos, color));
}

/**
 * Takes a used power out of play. In the drafted styles it leaves the hand.
 * In Random style it stays in its slot, which starts cooling down from the
 * position the power was fired in.
 */
export function spendPower(powers: PowerState, color: Color, id: string, before: Position, turn: string): PowerState {
  const slot = readySlot(powers, color, id);
  if (!powers.refillAt) {
    const hand = powers.inventory[color].slice();
    hand.splice(slot, 1);
    return { inventory: { ...powers.inventory, [color]: hand }, usedTurn: turn };
  }
  const timers = powers.refillAt[color].slice();
  timers[slot] = turnsDone(before, color) + COOLDOWN[POWERS[id].rarity];
  return { ...powers, usedTurn: turn, refillAt: { ...powers.refillAt, [color]: timers } };
}

/**
 * Rolls a new power into every slot whose cooldown has run out. The host
 * calls this after each action. A roll never repeats anything in the same
 * hand, including the spent power it replaces.
 */
export function refillSlots(game: GameState, random: () => number): GameState {
  const powers = game.powers;
  if (!powers?.refillAt) return game;
  let next = powers;
  for (const color of ["w", "b"] as Color[]) {
    const done = turnsDone(game.pos, color);
    const timers = powers.refillAt[color];
    if (!timers.some((at) => at !== null && at <= done)) continue;
    const hand = powers.inventory[color].slice();
    const fresh = timers.map((at, i) => {
      if (at === null || at > done) return at;
      hand[i] = rollOptions(random, 1, hand)[0];
      return null;
    });
    next = { ...next, inventory: { ...next.inventory, [color]: hand }, refillAt: { ...next.refillAt!, [color]: fresh } };
  }
  return next === powers ? game : { ...game, powers: next };
}
