/**
 * Duck placement. The search ignores the duck, so after picking a move we
 * try every empty square and keep the one that leaves the opponent the
 * least to capture, nudged toward their king to cramp it.
 */

import {
  PIECES, hasWall, legalMoves, opposite, royalSquares, xy,
  type Color, type Move, type Piece, type Position,
} from "@/engine";
import { child } from "@/features/analysis/search";

const DUCK: Piece = { id: -1, kind: "duck", color: "n", moved: true };
const KING_VALUE = 100000;

/** Squares the duck may land on once `after` is on the board. */
export function duckCandidates(after: Position): number[] {
  const out: number[] = [];
  for (let s = 0; s < after.board.length; s++) {
    if (!after.board[s] && !after.holes.includes(s) && !hasWall(after, s)) out.push(s);
  }
  return out;
}

/** The opponent's turn with the duck moved to `square`. */
function withDuck(after: Position, oldDuck: number, square: number, opponent: Color): Position {
  const board = after.board.slice();
  if (oldDuck >= 0) board[oldDuck] = null;
  board[square] = DUCK;
  return { ...after, board, turn: opponent, movesLeft: 1 };
}

/** Value of the best thing the side to move could capture. Kings count as everything. */
function biggestThreat(pos: Position): number {
  let worst = 0;
  for (const m of legalMoves(pos)) {
    const victim = pos.board[m.epVictim ?? m.to];
    if (!victim || victim.color === pos.turn || victim.color === "n") continue;
    worst = Math.max(worst, PIECES[victim.kind].royal ? KING_VALUE : PIECES[victim.kind].value);
  }
  return worst;
}

function distance(pos: Position, a: number, b: number): number {
  const [ax, ay] = xy(pos, a);
  const [bx, by] = xy(pos, b);
  return Math.max(Math.abs(ax - bx), Math.abs(ay - by));
}

/**
 * `aim` runs from 0 (mostly random) to 1 (always the best square). Weak
 * bots still never leave their king hanging when a square can stop it,
 * because the king threat dwarfs the noise.
 */
export function chooseDuckSquare(pos: Position, move: Move, aim: number, random: () => number): number {
  const me = pos.turn;
  const after = child(pos, { ...move, duckTo: undefined });
  const candidates = duckCandidates(after);
  if (!candidates.length) return -1;
  const oldDuck = after.board.findIndex((p) => p?.kind === "duck");
  const enemyKing = royalSquares(after, opposite(me))[0];
  const noise = (1 - aim) * 900;
  let best = candidates[0];
  let bestScore = -Infinity;
  for (const s of candidates) {
    const trial = withDuck(after, oldDuck, s, opposite(me));
    const near = enemyKing === undefined ? 0 : -15 * distance(pos, s, enemyKing);
    const score = -biggestThreat(trial) + near + random() * noise;
    if (score > bestScore) {
      bestScore = score;
      best = s;
    }
  }
  return best;
}
