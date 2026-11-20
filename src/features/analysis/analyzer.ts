/**
 * Rates a move that was just played. Standard games ask Stockfish; every
 * variant uses the built in search. The host runs this and broadcasts the
 * rating so both players see the same badge.
 */

import { moveToUci, sameMove, toFen, type Color, type Move, type Position, type RatingId } from "@/engine";
import type { AnalysisKind } from "@/features/modes";
import { classifyMove } from "./classify";
import { InternalEngine } from "./internal";
import { isSacrifice } from "./sacrifice";
import { StockfishClient } from "./stockfish";

export interface MoveRating {
  rating: RatingId;
  /** Evaluation after the move, centipawns from White's view. */
  evalCp: number;
}

const toWhite = (score: number, sideToMove: Color) => (sideToMove === "w" ? score : -score);

export class MoveAnalyzer {
  private stockfish: StockfishClient | null = null;
  private internal: InternalEngine | null = null;

  constructor(private kind: AnalysisKind) {}

  private sf(): StockfishClient {
    return (this.stockfish ??= new StockfishClient());
  }

  private engine(): InternalEngine {
    return (this.internal ??= new InternalEngine());
  }

  async rate(before: Position, move: Move, after: Position, deliversMate: boolean): Promise<MoveRating | null> {
    try {
      return this.kind === "stockfish"
        ? await this.rateWithStockfish(before, move, after, deliversMate)
        : await this.rateInternally(before, move, after, deliversMate);
    } catch {
      return null;
    }
  }

  private async rateWithStockfish(before: Position, move: Move, after: Position, deliversMate: boolean): Promise<MoveRating | null> {
    const mover = before.turn;
    const chess960 = before.rules.chess960;
    const lines = await this.sf().analyse(toFen(before), { depth: 12, multipv: 2, chess960 });
    if (!lines.length) return null;
    const best = toWhite(lines[0].score, mover);
    const second = lines[1] ? toWhite(lines[1].score, mover) : null;
    const playedIsBest = lines[0].move === moveToUci(before, move);
    let played = best;
    if (!playedIsBest) {
      const [reply] = await this.sf().analyse(toFen(after), { depth: 11, multipv: 1, chess960 });
      if (!reply) return null;
      played = toWhite(reply.score, after.turn);
    }
    const rating = classifyMove({ mover, best, second, played, playedIsBest, deliversMate, sacrifice: isSacrifice(before, move, after) });
    return { rating, evalCp: played };
  }

  private async rateInternally(before: Position, move: Move, after: Position, deliversMate: boolean): Promise<MoveRating | null> {
    const scores = await this.engine().scoreMoves(before, 3);
    if (!scores?.length) return null;
    const played = scores.find((s) => sameMove(s.move, move)) ?? scores[scores.length - 1];
    const rating = classifyMove({
      mover: before.turn,
      best: scores[0].score,
      second: scores[1]?.score ?? null,
      played: played.score,
      playedIsBest: sameMove(scores[0].move, move) || played.score === scores[0].score,
      deliversMate,
      sacrifice: isSacrifice(before, move, after),
    });
    return { rating, evalCp: played.score };
  }

  dispose(): void {
    this.stockfish?.dispose();
    this.internal?.dispose();
  }
}
