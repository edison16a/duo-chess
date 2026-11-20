/**
 * Turns engine numbers into a move rating. The idea follows how the big
 * sites do it: convert evals to win chance and look at how much win chance
 * the move threw away compared to the best move.
 */

import type { Color, RatingId } from "@/engine";
import { MATE } from "./search";

/** Logistic curve lichess uses to map centipawns to a 0..100 win chance. */
export function winChance(cp: number): number {
  if (Math.abs(cp) >= MATE - 1000) return cp > 0 ? 100 : 0;
  const clamped = Math.max(-1500, Math.min(1500, cp));
  return 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * clamped)) - 1);
}

export interface ClassifyInput {
  mover: Color;
  /** All scores in centipawns from White's view. */
  best: number;
  second: number | null;
  played: number;
  playedIsBest: boolean;
  sacrifice: boolean;
  deliversMate: boolean;
}

export function classifyMove(input: ClassifyInput): RatingId {
  const sign = input.mover === "w" ? 1 : -1;
  const bestWin = winChance(sign * input.best);
  const playedWin = winChance(sign * input.played);
  const loss = Math.max(0, bestWin - playedWin);
  const secondWin = input.second === null ? null : winChance(sign * input.second);

  if (input.deliversMate) return "legendary";
  const nearBest = input.playedIsBest || loss <= 2;
  if (nearBest && input.sacrifice && playedWin >= 50 && bestWin < 97) {
    return playedWin >= 99 ? "legendary" : "brilliant";
  }
  if (input.playedIsBest && secondWin !== null && bestWin - secondWin >= 15 && bestWin < 97) return "great";
  if (input.playedIsBest || loss <= 0.6) return "best";
  if (loss <= 3.5) return "excellent";
  if (loss <= 7) return "good";
  if (loss <= 13) return "inaccuracy";
  if (loss <= 24) return "mistake";
  return "blunder";
}
