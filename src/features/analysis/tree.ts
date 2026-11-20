/**
 * The recursive part of the built in search: negamax with alpha beta and a
 * quiescence search. Scores are from the side to move. In multi move modes
 * a child can have the same side to move as its parent, so we only negate
 * when the turn actually passed. Moves are generated pseudo legally and
 * checked after they are made, because legalMoves would make every move
 * twice and making moves is the slowest thing the engine does.
 */

import {
  afterMove, clonePosition, endTurn, inCheck, isCapture, makeMove, opposite, pieceMoves, pseudoMoves, royalSquares,
  type Color, type Move, type Position,
} from "@/engine";
import { evaluate } from "./evaluate";
import { Ordering } from "./ordering";
import { MATE, terminal } from "./terminal";

/** Thrown when the node or time budget runs out so the root can keep its last full iteration. */
export class Abort extends Error {}

export interface Ctx {
  nodes: number;
  limit: number;
  deadline: number;
  order: Ordering;
}

/** How many capture plies quiescence may add past the horizon. */
const QDEPTH = 6;

export interface Made {
  pos: Position;
  /** True when the move put the other side in check. */
  check: boolean;
}

/** Same test legalMoves uses: your own royalty may not be left in check or blown up. */
function safeFor(before: Position, after: Position, color: Color): boolean {
  if (!before.rules.checkRules) return true;
  if (before.royalStart[color] && royalSquares(after, color).length === 0) return false;
  const enemy = opposite(color);
  if (before.rules.atomic && before.royalStart[enemy] && royalSquares(after, enemy).length === 0) return true;
  return !inCheck(after, color);
}

/** Plays a pseudo legal move with full turn bookkeeping, or returns null if it is illegal. */
export function tryMove(pos: Position, move: Move): Made | null {
  const mover = pos.turn;
  const { pos: next } = makeMove(pos, move);
  if (!safeFor(pos, next, mover)) return null;
  const check = next.rules.checkRules && inCheck(next, opposite(mover));
  if (check) next.checks[mover]++;
  afterMove(next, check, []);
  return { pos: next, check };
}

function tick(ctx: Ctx): void {
  ctx.nodes++;
  if (ctx.nodes > ctx.limit || ((ctx.nodes & 511) === 0 && Date.now() > ctx.deadline)) throw new Abort();
}

const pov = (side: Color, whiteScore: number) => (side === "w" ? whiteScore : -whiteScore);

type Recurse = (pos: Position, alpha: number, beta: number, check: boolean) => number;

/** Scores a child from the parent's side, handling wins on the spot and turns that do not pass. */
export function childScore(parent: Position, made: Made, ply: number, alpha: number, beta: number, recurse: Recurse): number {
  const end = terminal(made.pos, parent.turn, ply + 1);
  if (end !== null) return pov(parent.turn, end);
  const passed = made.pos.turn !== parent.turn;
  // A check only binds the side that has to answer it.
  const check = passed && made.check;
  return passed ? -recurse(made.pos, -beta, -alpha, check) : recurse(made.pos, alpha, beta, check);
}

/**
 * What a side with no legal move gets. Mid turn the turn simply ends, the
 * same way playMove handles it; otherwise the rule set decides.
 */
function noMoves(pos: Position, ply: number, continuing: boolean, check: boolean, recurse: Recurse): number {
  if (continuing) {
    const next = clonePosition(pos);
    endTurn(next, []);
    if (next.turn === pos.turn) return 0;
    const checked = next.rules.checkRules && inCheck(next, next.turn);
    return -recurse(next, -Infinity, Infinity, checked);
  }
  if (pos.rules.giveaway || pos.rules.duck) return MATE - ply;
  if (pos.rules.checkRules && (check || inCheck(pos, pos.turn))) return -(MATE - ply);
  return 0;
}

export function negamax(pos: Position, depth: number, alpha: number, beta: number, ply: number, ctx: Ctx, check: boolean, continuing = false): number {
  if (depth <= 0) return quiesce(pos, alpha, beta, ply, ctx, QDEPTH, check, continuing);
  tick(ctx);
  const moves = ctx.order.sort(pos, pseudoMoves(pos), ply);
  let best = -Infinity, legal = 0, captures = 0;
  for (const move of moves) {
    const capture = isCapture(pos, move);
    if (!capture && pos.rules.mustCapture && captures > 0) break;
    const made = tryMove(pos, move);
    if (!made) continue;
    legal++;
    if (capture) captures++;
    const score = childScore(pos, made, ply, alpha, beta, (n, a, b, c) => negamax(n, depth - 1, a, b, ply + 1, ctx, c, n.turn === pos.turn));
    if (score > best) best = score;
    if (score > alpha) alpha = score;
    if (alpha >= beta) {
      ctx.order.reward(move, ply, depth, capture);
      break;
    }
  }
  if (legal === 0) return noMoves(pos, ply, continuing, check, (n, a, b, c) => negamax(n, depth, a, b, ply, ctx, c));
  return best;
}

/**
 * Captures and queen promotions only. Built from pieceMoves directly so
 * quiescence skips castling checks and the hundreds of crazyhouse drops
 * that pseudoMoves would generate just to throw away.
 */
function noisyMoves(pos: Position): Move[] {
  const out: Move[] = [];
  for (let s = 0; s < pos.board.length; s++) {
    if (pos.board[s]?.color !== pos.turn) continue;
    for (const m of pieceMoves(pos, s)) if (isCapture(pos, m) || m.promotion === "queen") out.push(m);
  }
  return out;
}

/**
 * Resolves captures past the horizon so the search never stops in the
 * middle of a trade. That matters most in atomic, where one capture can
 * wipe out half a board. When the side to move is in check there is no
 * standing pat: every evasion is searched, so mates at the horizon count.
 */
export function quiesce(pos: Position, alpha: number, beta: number, ply: number, ctx: Ctx, qdepth: number, check: boolean, continuing: boolean): number {
  tick(ctx);
  const stand = pov(pos.turn, evaluate(pos));
  if (qdepth <= 0) return stand;
  const candidates = check ? pseudoMoves(pos) : noisyMoves(pos);
  // In antichess a capture is compulsory, so standing pat is not an option either.
  const forced = check || (pos.rules.mustCapture && candidates.some((m) => isCapture(pos, m)));
  let best = -Infinity;
  if (!forced) {
    if (stand >= beta) return stand;
    if (stand > alpha) alpha = stand;
    best = stand;
  }
  let legal = 0, captures = 0;
  for (const move of ctx.order.sort(pos, candidates, ply)) {
    const capture = isCapture(pos, move);
    if (!capture && pos.rules.mustCapture && captures > 0) break;
    const made = tryMove(pos, move);
    if (!made) continue;
    legal++;
    if (capture) captures++;
    const score = childScore(pos, made, ply, alpha, beta, (n, a, b, c) => quiesce(n, a, b, ply + 1, ctx, qdepth - 1, c, n.turn === pos.turn));
    if (score > best) best = score;
    if (score > alpha) alpha = score;
    if (alpha >= beta) break;
  }
  if (legal === 0) {
    return check ? noMoves(pos, ply, continuing, check, (n, a, b, c) => quiesce(n, a, b, ply, ctx, qdepth, c, false)) : stand;
  }
  return best;
}
