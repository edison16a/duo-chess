/**
 * Spots material sacrifices, the ingredient that turns a best move into a
 * brilliant one. A move counts as a sac when the piece that moved can now
 * be taken for less than it is worth, or is simply hanging.
 */

import { PIECES, attackSquaresFor, isAttacked, opposite, type Move, type Position } from "@/engine";

export function isSacrifice(before: Position, move: Move, after: Position): boolean {
  if (move.drop || move.castle) return false;
  const piece = before.board[move.from];
  if (!piece || piece.color === "n") return false;
  const landed = after.board[move.to];
  if (!landed || landed.id !== piece.id) return false;
  const value = PIECES[landed.kind].value;
  if (value < 300 || PIECES[landed.kind].royal) return false;
  const captured = before.board[move.epVictim ?? move.to];
  const gained = captured ? PIECES[captured.kind].value : 0;
  if (gained >= value) return false;

  const enemy = opposite(piece.color);
  if (!isAttacked(after, move.to, enemy)) return false;
  const cheapest = Math.min(...attackSquaresFor(after, move.to, enemy).map((s) => PIECES[after.board[s]!.kind].value || 10000));
  const defended = isAttacked(after, move.to, piece.color);
  return cheapest < value - 50 || !defended;
}
