/**
 * Pure glue between engine output and classifyMove. Both engines end up
 * here, which keeps the rules for "forced", "obvious" and "sacrifice" in
 * one place and lets tests rate moves without a worker or Stockfish.
 */

import { PIECES, isAttacked, isCapture, legalMoves, opposite, sameMove, type Move, type Position, type RatingId } from "@/engine";
import { classifyMove } from "./classify";
import { isSacrifice } from "./sacrifice";
import type { RootScore } from "./search";

export interface MoveRating {
  rating: RatingId;
  /** Evaluation after the move, centipawns from White's view. */
  evalCp: number;
}

/** Facts about the move itself that change how it is rated. */
export interface MoveFacts {
  forced: boolean;
  obvious: boolean;
  sacrifice: boolean;
}

/**
 * A capture anyone would play: it takes at least as much as it risks, or
 * the piece that took cannot be taken back. Finding it is not "great".
 */
export function isObviousCapture(before: Position, move: Move, after: Position): boolean {
  if (!isCapture(before, move)) return false;
  const victim = before.board[move.epVictim ?? move.to];
  const attacker = before.board[move.from];
  if (!victim || !attacker) return true;
  if (PIECES[victim.kind].value >= PIECES[attacker.kind].value) return true;
  return !isAttacked(after, move.to, opposite(before.turn));
}

export function moveFacts(before: Position, move: Move, after: Position): MoveFacts {
  return {
    forced: legalMoves(before).length === 1,
    obvious: isObviousCapture(before, move, after),
    sacrifice: isSacrifice(before, move, after),
  };
}

/** Rates a move from the built in search's scores for every root move. */
export function rateFromScores(before: Position, move: Move, after: Position, deliversMate: boolean, scores: RootScore[]): MoveRating | null {
  if (!scores.length) return null;
  const played = scores.find((s) => sameMove(s.move, move));
  // A move the search never saw (the duck square, a stale request) cannot be judged fairly.
  if (!played) return null;
  const rating = classifyMove({
    mover: before.turn,
    best: scores[0].score,
    second: scores[1]?.score ?? null,
    played: played.score,
    playedIsBest: played === scores[0] || played.score === scores[0].score,
    deliversMate,
    ...moveFacts(before, move, after),
  });
  return { rating, evalCp: played.score };
}
