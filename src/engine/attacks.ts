/** Check and attack detection, shared by legality, castling and outcomes. */

import { neighbors, opposite } from "./geometry";
import { attackSquares } from "./movegen";
import { PIECES } from "./pieces";
import type { Color, Position } from "./types";

export function royalSquares(pos: Position, color: Color): number[] {
  const out: number[] = [];
  pos.board.forEach((p, i) => {
    if (p && p.color === color && PIECES[p.kind].royal) out.push(i);
  });
  return out;
}

/**
 * Is `square` attacked by `by`? Empty squares get a phantom enemy piece so
 * the normal capture logic can be reused for castling paths.
 */
export function isAttacked(pos: Position, square: number, by: Color): boolean {
  let probe = pos;
  const occupant = pos.board[square];
  if (!occupant || occupant.color !== opposite(by) || occupant.status?.shielded) {
    const board = pos.board.slice();
    board[square] = { id: -1, kind: "mann", color: opposite(by), moved: true };
    probe = { ...pos, board };
  }
  for (let i = 0; i < probe.board.length; i++) {
    const p = probe.board[i];
    if (!p || p.color !== by) continue;
    if (attackSquares(probe, i).includes(square)) return true;
  }
  return false;
}

/** In atomic chess, touching kings shield each other from check. */
function kingsTouch(pos: Position, color: Color): boolean {
  const mine = royalSquares(pos, color);
  const theirs = new Set(royalSquares(pos, opposite(color)));
  return mine.some((s) => neighbors(pos, s).some((n) => theirs.has(n)));
}

export function inCheck(pos: Position, color: Color): boolean {
  const royals = royalSquares(pos, color);
  if (royals.length === 0) return false;
  if (pos.rules.atomic && kingsTouch(pos, color)) return false;
  return royals.some((s) => isAttacked(pos, s, opposite(color)));
}
