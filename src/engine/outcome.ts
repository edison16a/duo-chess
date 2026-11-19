/** Decides whether the game is over after a move. */

import { inCheck, royalSquares } from "./attacks";
import { opposite, xy } from "./geometry";
import { legalMoves } from "./legal";
import { PIECES } from "./pieces";
import type { Color, GameResult, Position } from "./types";

function pieceCount(pos: Position, color: Color): number {
  return pos.board.filter((p) => p && p.color === color).length;
}

/** The central 2x2 (or the single center on odd boards). */
export function hillSquares(pos: Position): number[] {
  const xs = pos.width % 2 ? [(pos.width - 1) / 2] : [pos.width / 2 - 1, pos.width / 2];
  const ys = pos.height % 2 ? [(pos.height - 1) / 2] : [pos.height / 2 - 1, pos.height / 2];
  return ys.flatMap((y) => xs.map((x) => y * pos.width + x));
}

/** Bare kings, or a king plus a single minor piece, cannot mate. */
function insufficientMaterial(pos: Position): boolean {
  const pieces = pos.board.filter((p) => p && p.color !== "n");
  if (pieces.some((p) => !PIECES[p!.kind].standard)) return false;
  const minors = pieces.filter((p) => p!.kind === "bishop" || p!.kind === "knight").length;
  const others = pieces.filter((p) => p!.kind !== "king" && p!.kind !== "bishop" && p!.kind !== "knight").length;
  return others === 0 && minors <= 1;
}

/**
 * `lastMover` is whoever just moved; `repeats` is how many times the current
 * position has now occurred.
 */
export function evaluateOutcome(pos: Position, lastMover: Color, repeats: number): GameResult | null {
  const rules = pos.rules;
  for (const color of [opposite(lastMover), lastMover]) {
    if (pos.royalStart[color] && royalSquares(pos, color).length === 0) {
      return { winner: opposite(color), reason: rules.atomic ? "king-exploded" : "king-captured" };
    }
  }
  for (const color of [opposite(lastMover), lastMover]) {
    if (pieceCount(pos, color) > 0) continue;
    if (rules.giveaway) return { winner: color, reason: "giveaway" };
    if (!pos.royalStart[color]) return { winner: opposite(color), reason: "annihilation" };
  }
  if (rules.kingOfTheHill) {
    const hill = new Set(hillSquares(pos));
    if (royalSquares(pos, lastMover).some((s) => hill.has(s))) return { winner: lastMover, reason: "hill" };
  }
  if (rules.checksToWin > 0 && pos.checks[lastMover] >= rules.checksToWin) {
    return { winner: lastMover, reason: "three-check" };
  }

  const toMove = pos.turn;
  if (legalMoves(pos).length === 0) {
    if (rules.giveaway || rules.duck) return { winner: toMove, reason: "stalemate" };
    if (rules.checkRules && inCheck(pos, toMove)) return { winner: opposite(toMove), reason: "checkmate" };
    return { winner: null, reason: "stalemate" };
  }
  if (repeats >= 3) return { winner: null, reason: "repetition" };
  if (rules.checkRules && pos.halfmove >= 100) return { winner: null, reason: "fifty-move" };
  if (rules.checkRules && !rules.atomic && !rules.drops && insufficientMaterial(pos)) {
    return { winner: null, reason: "insufficient" };
  }
  return null;
}

/** Row index helper the UI uses to flip the board. */
export function rankOf(pos: Position, square: number): number {
  return xy(pos, square)[1];
}
