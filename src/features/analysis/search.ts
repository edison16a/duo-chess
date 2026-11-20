/**
 * Minimax with alpha beta for any rule set the engine supports. Scores are
 * always from White's view and the maximizing side is whoever is to move,
 * which makes double and triple move turns work without special cases.
 */

import {
  afterMove, inCheck, isCapture, legalMoves, makeMove, opposite, royalSquares, hillSquares, PIECES,
  type Color, type Move, type Position,
} from "@/engine";
import { evaluate } from "./evaluate";

export const MATE = 100000;

export interface RootScore {
  move: Move;
  score: number;
}

interface Ctx {
  nodes: number;
  limit: number;
}

/** Game over checks that are cheap enough to run at every node. */
function terminal(pos: Position, mover: Color, ply: number): number | null {
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

/** Captures first, biggest victim first, so alpha beta cuts more. */
function order(pos: Position, moves: Move[]): Move[] {
  const weight = (m: Move) => {
    if (!isCapture(pos, m)) return m.promotion ? 800 : 0;
    const victim = pos.board[m.epVictim ?? m.to];
    const attacker = pos.board[m.from];
    return 1000 + (victim ? PIECES[victim.kind].value : 100) - (attacker ? PIECES[attacker.kind].value / 10 : 0);
  };
  return moves.slice().sort((a, b) => weight(b) - weight(a));
}

export function child(pos: Position, move: Move): Position {
  const mover = pos.turn;
  const { pos: next } = makeMove(pos, move);
  const gaveCheck = next.rules.checkRules && inCheck(next, opposite(mover));
  if (gaveCheck) next.checks[mover]++;
  afterMove(next, gaveCheck, []);
  return next;
}

function search(pos: Position, depth: number, alpha: number, beta: number, ply: number, ctx: Ctx): number {
  ctx.nodes++;
  // Leaves skip move generation: it is the expensive part and a stalemate
  // one ply past the horizon rarely changes a rating.
  if (depth <= 0 || ctx.nodes > ctx.limit) return evaluate(pos);
  const moves = legalMoves(pos);
  if (moves.length === 0) {
    const side = pos.turn;
    if (pos.rules.giveaway || pos.rules.duck) return (side === "w" ? 1 : -1) * (MATE - ply);
    if (pos.rules.checkRules && inCheck(pos, side)) return (side === "w" ? -1 : 1) * (MATE - ply);
    return 0;
  }

  const maximizing = pos.turn === "w";
  let best = maximizing ? -Infinity : Infinity;
  for (const move of order(pos, moves)) {
    const next = child(pos, move);
    const end = terminal(next, pos.turn, ply + 1);
    const score = end ?? search(next, depth - 1, alpha, beta, ply + 1, ctx);
    if (maximizing) {
      best = Math.max(best, score);
      alpha = Math.max(alpha, score);
    } else {
      best = Math.min(best, score);
      beta = Math.min(beta, score);
    }
    if (beta <= alpha) break;
  }
  return best;
}

/**
 * Scores every root move. Classification needs the played move's score
 * and the gap between the best and second best, so we search all of them
 * with a full window instead of just finding the best.
 */
export function scoreRootMoves(pos: Position, depth = 3, nodeLimit = 60000): RootScore[] {
  const out: RootScore[] = [];
  const moves = order(pos, legalMoves(pos));
  for (const move of moves) {
    // Each root move gets the same budget so late moves are not starved.
    const ctx: Ctx = { nodes: 0, limit: nodeLimit / Math.max(1, moves.length) };
    const next = child(pos, move);
    const end = terminal(next, pos.turn, 1);
    const score = end ?? search(next, depth - 1, -Infinity, Infinity, 1, ctx);
    out.push({ move, score });
  }
  const sign = pos.turn === "w" ? -1 : 1;
  return out.sort((a, b) => sign * (a.score - b.score));
}
