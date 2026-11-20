/**
 * Spots material sacrifices, the ingredient that turns a best move into a
 * brilliant one. After the move we look at every piece of the mover that
 * the opponent can legally take, and estimate what that capture nets them
 * with a one step exchange: the piece's value, minus our recapture of the
 * cheapest taker when the square is defended. Whatever the move itself
 * captured and whatever we now threaten in return are credited back.
 * That covers the moved piece hanging (Bxf7+) and a piece left hanging on
 * purpose (Legal's mate), while ordinary trades and recaptures do not count.
 */

import {
  PIECES, attackSquaresFor, clonePosition, isAttacked, isCapture, legalMoves, opposite,
  type Color, type Move, type Piece, type Position,
} from "@/engine";

/** Net material, in centipawns, that has to be offered before we call it a sacrifice. */
const SAC_MARGIN = 150;
/** Pawns are not "pieces"; a gambit pawn never makes a move brilliant. */
const MIN_PIECE_VALUE = 300;

const valueOf = (p: Piece | null | undefined) => (p && p.color !== "n" ? PIECES[p.kind].value : 0);

/** The position with `color` to move, so we can ask what that side could capture. */
function withTurn(pos: Position, color: Color): Position {
  if (pos.turn === color) return pos;
  return { ...clonePosition(pos), turn: color, movesLeft: 1 };
}

interface Grab {
  value: number;
  /** Square of the piece that would do the taking, or -1. */
  by: number;
}

/**
 * Biggest one step material win `taker` has against `owner`'s pieces.
 * With `captures` it only counts legal captures; without, plain attacks.
 * `skip` leaves out one owner square, used for the piece that just moved
 * away to make the capture.
 */
function biggestGrab(pos: Position, owner: Color, captures: Move[] | null, skip = -1): Grab {
  const taker = opposite(owner);
  let best: Grab = { value: 0, by: -1 };
  for (let s = 0; s < pos.board.length; s++) {
    const p = pos.board[s];
    if (s === skip || !p || p.color !== owner || PIECES[p.kind].royal) continue;
    const value = valueOf(p);
    if (value < MIN_PIECE_VALUE && captures) continue;
    const defended = isAttacked(pos, s, owner);
    const attackers = captures
      ? captures.filter((m) => (m.epVictim ?? m.to) === s).map((m) => m.from)
      // Bare attacks include a king that could never take a defended piece.
      : attackSquaresFor(pos, s, taker).filter((a) => !defended || !PIECES[pos.board[a]!.kind].royal);
    if (!attackers.length) continue;
    const by = attackers.reduce((a, b) => (valueOf(pos.board[b]) < valueOf(pos.board[a]) ? b : a));
    const net = value - (defended ? valueOf(pos.board[by]) : 0);
    if (net > best.value) best = { value: net, by };
  }
  return best;
}

export function isSacrifice(before: Position, move: Move, after: Position): boolean {
  // Atomic captures destroy the capturer and antichess wants to lose material, so the idea does not apply.
  if (before.rules.atomic || before.rules.giveaway || move.castle) return false;
  const mover = before.turn;
  const enemy = opposite(mover);
  const gained = move.drop ? 0 : valueOf(before.board[move.epVictim ?? move.to]);
  const view = withTurn(after, enemy);
  const replies = legalMoves(view).filter((m) => isCapture(view, m));
  const offered = biggestGrab(after, mover, replies);
  if (offered.value < MIN_PIECE_VALUE - 100) return false;
  // A counter threat on an equal piece is a trade offer, not a sacrifice.
  // The piece that takes is moving anyway, so a threat against it does not count.
  const threatened = biggestGrab(after, enemy, null, offered.by);
  return offered.value - gained - threatened.value >= SAC_MARGIN;
}
