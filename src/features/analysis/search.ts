/**
 * Root of the built in search, used for every rule set Stockfish cannot
 * play and by the bot in those modes. It deepens one ply at a time and
 * keeps the last iteration that finished inside the budget, so a busy
 * position gives a shallower but consistent answer instead of a mix of
 * deep scores and half searched garbage.
 */

import { afterMove, inCheck, legalMoves, makeMove, opposite, type Move, type Position } from "@/engine";
import { Ordering } from "./ordering";
import { MATE, isMateScore } from "./terminal";
import { Abort, childScore, negamax, nextDepth, type Ctx, type Made } from "./tree";

export { MATE, isMateScore };

export interface RootScore {
  move: Move;
  /** Centipawns from White's view. */
  score: number;
}

/** Rough cost of one more ply compared to the last one, after alpha beta. */
const GROWTH = 4;

export interface SearchLimits {
  /** Total nodes for the whole search, across all iterations. */
  nodes?: number;
  /** Wall clock budget in milliseconds. Only used where timing does not matter for tests. */
  timeMs?: number;
}

/** The exact position after a move, turn bookkeeping included. */
export function child(pos: Position, move: Move): Position {
  return made(pos, move).pos;
}

function made(pos: Position, move: Move): Made {
  const mover = pos.turn;
  const { pos: next } = makeMove(pos, move);
  const check = next.rules.checkRules && inCheck(next, opposite(mover));
  if (check) next.checks[mover]++;
  afterMove(next, check, []);
  return { pos: next, check };
}

/** One full width pass over every root move at a fixed depth. */
function iterate(pos: Position, roots: Made[], moves: Move[], depth: number, ctx: Ctx): RootScore[] {
  const sign = pos.turn === "w" ? 1 : -1;
  ctx.maxPly = depth * 2;
  return moves.map((move, i) => {
    const recurse = (n: Position, a: number, b: number, c: boolean) => negamax(n, nextDepth(depth, 0, c, ctx), a, b, 1, ctx, c, n.turn === pos.turn);
    const score = childScore(pos, roots[i], 0, -Infinity, Infinity, recurse);
    return { move, score: sign * score };
  });
}

/**
 * Scores every root move, best first, from White's view. Every move gets a
 * full window because classification needs the played move's real score
 * and the gap between the best and second best, not just the best move.
 * Depth one always completes; deeper passes stop at the budget.
 */
export function scoreRootMoves(pos: Position, depth = 3, nodeLimit = 150000, limits: SearchLimits = {}): RootScore[] {
  const deadline = limits.timeMs === undefined ? Infinity : Date.now() + limits.timeMs;
  const ctx: Ctx = { nodes: 0, limit: Infinity, deadline: Infinity, order: new Ordering(pos.board.length), maxPly: 2 };
  let moves = legalMoves(pos);
  const roots = new Map(moves.map((m) => [m, made(pos, m)]));
  const sign = pos.turn === "w" ? 1 : -1;
  const sorted = (scores: RootScore[]) => scores.slice().sort((a, b) => sign * (b.score - a.score));

  let best = sorted(iterate(pos, moves.map((m) => roots.get(m)!), moves, 1, ctx));
  let settled = endsTurn(pos, 1) ? { depth: 1, scores: best } : null;
  let reached = 1;
  ctx.limit = limits.nodes ?? nodeLimit;
  ctx.deadline = deadline;
  for (let d = 2; d <= depth; d++) {
    // A forced mate found at a shallower depth will not get any better.
    if (best.length && isMateScore(best[0].score) && sign * best[0].score > 0) break;
    moves = best.map((s) => s.move);
    const startNodes = ctx.nodes, startTime = Date.now();
    try {
      best = sorted(iterate(pos, moves.map((m) => roots.get(m)!), moves, d, ctx));
      reached = d;
      if (endsTurn(pos, d)) settled = { depth: d, scores: best };
    } catch (error) {
      if (error instanceof Abort) break;
      throw error;
    }
    // Each ply costs several times the last one. Skip a pass that cannot finish anyway.
    const nodes = ctx.nodes - startNodes, ms = Date.now() - startTime;
    if (ctx.nodes + nodes * GROWTH > ctx.limit || Date.now() + ms * GROWTH > ctx.deadline) break;
  }
  // One ply shallower is a fair price for a clean horizon; two plies would hide real tactics.
  return settled && reached - settled.depth <= 1 ? settled.scores : best;
}

/**
 * Whether a search this deep stops between turns. In double and triple
 * move chess a horizon in the middle of a turn lets the side with moves
 * left grab things for free, which made quiet opening moves look like
 * mistakes. So we prefer a pass that ends on a turn boundary when it is
 * at most one ply shallower than the deepest one.
 */
function endsTurn(pos: Position, depth: number): boolean {
  const perTurn = pos.rules.movesPerTurn;
  if (perTurn <= 1) return true;
  return depth >= pos.movesLeft && (depth - pos.movesLeft) % perTurn === 0;
}
