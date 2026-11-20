/**
 * Numbers for a game over screen: how many moves of each rating each side
 * played, an accuracy percentage and a rough playing strength. It only
 * reads what the move list already stores, the rating and the eval after
 * each move, so it works for any finished game without new analysis.
 *
 * Accuracy follows lichess. The eval before a move is the eval after the
 * previous move, both turned into the mover's win chance, and the drop
 * gives a per move accuracy. Book moves count as perfect. A move whose
 * eval before is unknown (the first move, or right after a superpower,
 * which is not analysed) is left out rather than guessed.
 */

import type { Color, HistoryEntry, RatingId } from "@/engine";
import { isMateScore } from "./terminal";

export type RatingCounts = Record<RatingId, number>;

/** The parts of a history entry the summary reads. */
export type SummaryEntry = Pick<HistoryEntry, "color" | "rating" | "evalCp" | "power">;

export interface ColorSummary {
  /** Moves per rating, every id present. */
  counts: RatingCounts;
  /** Moves of this colour that carry a rating. */
  rated: number;
  /** Moves that went into the accuracy. */
  measured: number;
  /** Mean per move accuracy, 0 to 100, or null when no move could be measured. */
  accuracy: number | null;
  /** A rough performance rating guessed from accuracy alone. An estimate, not a real Elo. */
  estimatedElo: number | null;
}

export type GameSummary = Record<Color, ColorSummary>;

export interface SummaryOptions {
  /** Eval of the starting position, White's view, so the first move can be measured too. */
  startEvalCp?: number;
}

const RATING_IDS: RatingId[] = [
  "legendary", "brilliant", "great", "best", "excellent", "good", "inaccuracy", "mistake", "blunder", "book",
];

/**
 * Lichess win chance for accuracy. Unlike the rating curve, a forced mate
 * counts as 1000 centipawns here, exactly as lichess does it, so missing a
 * mate while staying a rook up is not punished like a blunder.
 */
export function winPercent(cpWhite: number, mover: Color): number {
  const cp = isMateScore(cpWhite) ? Math.sign(cpWhite) * 1000 : Math.max(-1000, Math.min(1000, cpWhite));
  const white = 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * cp)) - 1);
  return mover === "w" ? white : 100 - white;
}

/**
 * Lichess per move accuracy from the mover's win chance before and after.
 * The extra point is lichess's allowance for engine noise.
 */
export function moveAccuracy(winBefore: number, winAfter: number): number {
  if (winAfter >= winBefore) return 100;
  const raw = 103.1668100711649 * Math.exp(-0.04354415386753951 * (winBefore - winAfter)) - 3.166924740191411;
  return Math.max(0, Math.min(100, raw + 1));
}

/** Accuracy and the performance it roughly matches. Points between them are joined by straight lines. */
const ELO_POINTS: [number, number][] = [[0, 100], [50, 600], [70, 1200], [80, 1600], [90, 2200], [97, 2800]];

/**
 * A rough rating from accuracy alone, rounded to 50. It is a ballpark for
 * fun: accuracy depends a lot on how sharp the game was, so the same
 * player can look 400 points apart in two games.
 */
export function eloFromAccuracy(accuracy: number): number {
  const a = Math.max(0, Math.min(100, accuracy));
  let elo = ELO_POINTS[ELO_POINTS.length - 1][1];
  for (let i = 1; i < ELO_POINTS.length; i++) {
    const [a0, e0] = ELO_POINTS[i - 1], [a1, e1] = ELO_POINTS[i];
    if (a <= a1) {
      elo = e0 + ((a - a0) / (a1 - a0)) * (e1 - e0);
      break;
    }
  }
  return Math.round(elo / 50) * 50;
}

function emptySide(): { counts: RatingCounts; rated: number; scores: number[] } {
  const counts = Object.fromEntries(RATING_IDS.map((id) => [id, 0])) as RatingCounts;
  return { counts, rated: 0, scores: [] };
}

export function summarizeGame(history: readonly SummaryEntry[], options: SummaryOptions = {}): GameSummary {
  const sides = { w: emptySide(), b: emptySide() };
  let previous: number | null = options.startEvalCp ?? null;
  for (const entry of history) {
    // A superpower is not analysed, so the eval chain breaks until the next analysed move.
    if (entry.power) {
      previous = null;
      continue;
    }
    const side = sides[entry.color];
    if (entry.rating) {
      side.counts[entry.rating]++;
      side.rated++;
    }
    if (entry.rating === "book") side.scores.push(100);
    else if (entry.evalCp !== undefined && previous !== null) {
      side.scores.push(moveAccuracy(winPercent(previous, entry.color), winPercent(entry.evalCp, entry.color)));
    }
    previous = entry.evalCp ?? null;
  }
  const finish = (s: ReturnType<typeof emptySide>): ColorSummary => {
    const accuracy = s.scores.length ? Math.round((s.scores.reduce((a, b) => a + b, 0) / s.scores.length) * 10) / 10 : null;
    return { counts: s.counts, rated: s.rated, measured: s.scores.length, accuracy, estimatedElo: accuracy === null ? null : eloFromAccuracy(accuracy) };
  };
  return { w: finish(sides.w), b: finish(sides.b) };
}
