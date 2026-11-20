/** Small choice helpers shared by the move, duck and power logic. */

import { legalMoves, moveToUci, type Color, type Move, type Position } from "@/engine";
import type { RootScore } from "@/features/analysis/search";

export function randomItem<T>(items: T[], random: () => number): T {
  return items[Math.min(items.length - 1, Math.floor(random() * items.length))];
}

export function shuffle<T>(items: T[], random: () => number): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Picks a root move with a softmax over the scores. Near equal moves get
 * near equal odds and worse moves fade out faster as the temperature drops,
 * which is how weak bots blunder now and then while strong ones rarely do.
 */
export function pickByTemperature(scores: RootScore[], color: Color, temperature: number, random: () => number): Move {
  const sign = color === "w" ? 1 : -1;
  const values = scores.map((s) => s.score * sign);
  const best = Math.max(...values);
  const t = Math.max(1, temperature);
  const weights = values.map((v) => Math.exp((v - best) / t));
  const total = weights.reduce((sum, w) => sum + w, 0);
  let roll = random() * total;
  for (let i = 0; i < scores.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return scores[i].move;
  }
  return scores[0].move;
}

/**
 * Maps Stockfish's answer back to one of our legal moves. Comparing in
 * UCI form handles promotions and both castling notations, since
 * moveToUci writes Chess960 castling as king takes own rook.
 */
export function uciToMove(pos: Position, uci: string, legal: Move[] = legalMoves(pos)): Move | null {
  if (!uci) return null;
  return legal.find((m) => moveToUci(pos, m) === uci) ?? null;
}
