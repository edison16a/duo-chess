/**
 * How long the bot waits and thinks. A short pause makes it feel human,
 * but it must never lose on time, so clocks and move timers cap it.
 */

import type { Color } from "@/engine";
import { remaining } from "@/features/room/clock";
import type { RoomState } from "@/features/room/types";
import { stockfishStrength } from "./elo";

export interface TimePlan {
  /** Minimum time before the move is sent, engine time included. */
  delay: number;
  /** Stockfish thinking time. */
  movetime: number;
  /** Deepest built in search that still fits the time we have. */
  depthCap: number;
  /** Give up on Stockfish after this long and fall back to a quick search. */
  timeout: number;
}

const MIN_DELAY = 400;
const MAX_DELAY = 1200;
/** Generous wait for the first Stockfish answer, which includes loading the wasm. */
const RELAXED_TIMEOUT = 5000;

/** Time we can safely spend, or Infinity when nothing is ticking. */
export function timeBudget(state: RoomState, color: Color, now: number): number {
  let budget = Infinity;
  if (state.moveDeadline !== null) budget = Math.max(0, state.moveDeadline - now) * 0.5;
  if (state.clock && state.game) {
    const left = remaining(state.clock, color, state.game.pos.turn, now);
    budget = Math.min(budget, Math.max(0, left) / 25);
  }
  return budget;
}

export function timePlan(state: RoomState, color: Color, elo: number, now: number, random: () => number): TimePlan {
  const budget = timeBudget(state, color, now);
  let delay = MIN_DELAY + random() * (MAX_DELAY - MIN_DELAY);
  // Follow up moves in a multi move turn come quicker, like a person who planned them.
  const last = state.game?.history[state.game.history.length - 1];
  if (last && last.color === color) delay *= 0.6;
  delay = Math.min(delay, budget);
  const movetime = Math.max(60, Math.min(stockfishStrength(elo).movetime, budget * 0.6));
  const depthCap = budget < 1200 ? 1 : budget < 3000 ? 2 : 3;
  const timeout = Number.isFinite(budget) ? Math.max(movetime + 150, budget) : movetime + RELAXED_TIMEOUT;
  return { delay, movetime, depthCap, timeout };
}
