/**
 * Mate scores and the cheap game over checks the search runs at every
 * node. Wins are scored as MATE minus the ply they happen at, so a faster
 * win always scores higher and a slower loss always scores less badly.
 */

import { hillSquares, opposite, royalSquares, type Color, type Position } from "@/engine";

export const MATE = 100000;

/** Scores within this distance of MATE are forced wins, not material. */
export const MATE_BAND = 1000;

export function isMateScore(score: number): boolean {
  return Math.abs(score) >= MATE - MATE_BAND;
}

/** Returns a White view mate score when the game just ended, or null. */
export function terminal(pos: Position, mover: Color, ply: number): number | null {
  const win = (c: Color) => (c === "w" ? 1 : -1) * (MATE - ply);
  for (const c of ["w", "b"] as Color[]) {
    if (pos.royalStart[c] && royalSquares(pos, c).length === 0) return win(opposite(c));
  }
  if (pos.rules.giveaway) {
    for (const c of ["w", "b"] as Color[]) if (!pos.board.some((p) => p?.color === c)) return win(c);
  } else {
    for (const c of ["w", "b"] as Color[]) {
      if (!pos.royalStart[c] && !pos.board.some((p) => p?.color === c)) return win(opposite(c));
    }
  }
  if (pos.rules.kingOfTheHill) {
    const hill = new Set(hillSquares(pos));
    if (royalSquares(pos, mover).some((s) => hill.has(s))) return win(mover);
  }
  if (pos.rules.checksToWin > 0 && pos.checks[mover] >= pos.rules.checksToWin) return win(mover);
  return null;
}
