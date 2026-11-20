/**
 * Turns engine numbers into a move rating, the way chess.com and lichess
 * do it: convert evals to win chance and look at how much win chance the
 * move threw away compared to the engine's best move. Win chance flattens
 * out near both ends, so shuffling while totally winning or totally lost
 * costs almost nothing, which is what players expect.
 */

import type { Color, RatingId } from "@/engine";
import { isMateScore } from "./terminal";

/** Lichess caps evals here before converting, so +10 and +20 both read as won. */
const CP_CEILING = 1000;

/** Logistic curve lichess uses to map centipawns to a 0 to 100 win chance. Forced mates are 0 or 100. */
export function winChance(cp: number): number {
  if (isMateScore(cp)) return cp > 0 ? 100 : 0;
  const clamped = Math.max(-CP_CEILING, Math.min(CP_CEILING, cp));
  return 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * clamped)) - 1);
}

/**
 * Win chance lost, in percentage points, at which each rating stops. These
 * are chess.com's expected points bands: 2, 5, 10 and 20 points.
 */
export const LOSS_LIMITS = { best: 1, excellent: 2, good: 5, inaccuracy: 10, mistake: 20 } as const;
/** A brilliant sacrifice may be this far from the top move, since engines disagree by a hair. */
const BRILLIANT_SLACK = 2;
/** How much better the only good move must be than the runner up to count as great. */
const GREAT_GAP = 15;
/** At or above this the game is already won, so finding a sacrifice or only move proves little. */
const ALREADY_WON = 90;

export interface ClassifyInput {
  mover: Color;
  /** All scores in centipawns from White's view. */
  best: number;
  /** Second best move, when the engine reported one. */
  second: number | null;
  played: number;
  playedIsBest: boolean;
  sacrifice: boolean;
  deliversMate: boolean;
  /** The mover had exactly one legal move. */
  forced?: boolean;
  /** A capture any player would see, such as taking back or grabbing a free piece. Never great. */
  obvious?: boolean;
}

export function classifyMove(input: ClassifyInput): RatingId {
  if (input.deliversMate) return "legendary";
  if (input.forced) return "best";
  const sign = input.mover === "w" ? 1 : -1;
  const bestWin = winChance(sign * input.best);
  const playedWin = winChance(sign * input.played);
  const secondWin = input.second === null ? null : winChance(sign * input.second);
  const loss = Math.max(0, bestWin - playedWin);
  // What the mover would have had without this move: the runner up when this was the top move.
  const otherwise = input.playedIsBest ? (secondWin ?? bestWin) : bestWin;

  const nearBest = input.playedIsBest || loss <= BRILLIANT_SLACK;
  if (input.sacrifice && nearBest && playedWin >= 45 && otherwise < ALREADY_WON) {
    const forcesMate = isMateScore(input.played) && sign * input.played > 0;
    return forcesMate ? "legendary" : "brilliant";
  }
  if (input.playedIsBest && !input.obvious && secondWin !== null && bestWin - secondWin >= GREAT_GAP && bestWin >= 35 && secondWin < ALREADY_WON) {
    return "great";
  }
  if (input.playedIsBest || (loss <= LOSS_LIMITS.best && equalScore(sign * input.best, sign * input.played))) return "best";
  if (loss <= LOSS_LIMITS.excellent) return "excellent";
  if (loss <= LOSS_LIMITS.good) return "good";
  if (loss <= LOSS_LIMITS.inaccuracy) return "inaccuracy";
  if (loss <= LOSS_LIMITS.mistake) return "mistake";
  return "blunder";
}

/**
 * Another move only counts as best when its score really matches. Win
 * chance hides the gap between mate in two and mate in six, and between
 * +12 and +20, so we compare the raw scores too.
 */
function equalScore(best: number, played: number): boolean {
  if (isMateScore(best)) return played >= best;
  return best - played <= 30;
}
