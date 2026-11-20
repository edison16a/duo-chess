/**
 * Rates a move that was just played. Standard games ask Stockfish; every
 * variant uses the built in search. The host runs this and broadcasts the
 * rating so both players see the same badge.
 */

import { moveToUci, toFen, type Color, type Move, type Position } from "@/engine";
import type { AnalysisKind } from "@/features/modes";
import { isBookPosition, loadBook } from "./book";
import { classifyMove } from "./classify";
import { moveFacts, rateFromScores, type MoveRating } from "./judge";
import { InternalEngine } from "./internal";
import type { RootScore, SearchLimits } from "./search";
import { StockfishClient, type AnalyseOptions, type EngineLine } from "./stockfish";

export type { MoveRating };

/** Engines the analyzer talks to. Tests pass inline versions; the app uses workers. */
export interface AnalyzerDeps {
  search: (pos: Position, depth: number, limits: SearchLimits) => Promise<RootScore[] | null>;
  analyse: (fen: string, opts: AnalyseOptions) => Promise<EngineLine[]>;
  dispose?: () => void;
}

/**
 * Built in search budget. It deepens until about a second has passed, so a
 * quiet position reaches depth 4 or 5 and a messy one still finishes depth 3.
 */
export const INTERNAL_LIMITS = { depth: 5, nodes: 200_000, timeMs: 1000 };
/**
 * Stockfish budget. Depth caps fast machines and movetime caps slow ones,
 * so the two searches together stay near one second on a laptop.
 */
export const STOCKFISH_LIMITS = { depth: 18, movetime: 650, playedDepth: 16, playedMovetime: 350, bookMovetime: 250 };

const toWhite = (score: number, sideToMove: Color) => (sideToMove === "w" ? score : -score);

export class MoveAnalyzer {
  private deps: AnalyzerDeps | null;

  constructor(private kind: AnalysisKind, deps?: AnalyzerDeps) {
    this.deps = deps ?? null;
  }

  private engines(): AnalyzerDeps {
    return (this.deps ??= workerDeps());
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
    const { analyse } = this.engines();
    const mover = before.turn;
    const chess960 = before.rules.chess960;
    const L = STOCKFISH_LIMITS;
    if (!chess960 && !deliversMate) {
      await loadBook();
      if (isBookPosition(after)) {
        const [line] = await analyse(toFen(after), { depth: L.playedDepth, movetime: L.bookMovetime, multipv: 1, chess960 });
        return { rating: "book", evalCp: line ? toWhite(line.score, after.turn) : 0 };
      }
    }
    const fen = toFen(before);
    const lines = await analyse(fen, { depth: L.depth, movetime: L.movetime, multipv: 2, chess960 });
    if (!lines.length) return null;
    const uci = moveToUci(before, move);
    let playedLine = lines.find((l) => l.move === uci);
    // Score the played move from the same position with searchmoves, so both
    // numbers come from the same root and the same side's point of view.
    playedLine ??= (await analyse(fen, { depth: L.playedDepth, movetime: L.playedMovetime, multipv: 1, chess960, searchmoves: [uci] }))[0];
    if (!playedLine) return null;
    const best = toWhite(lines[0].score, mover);
    const played = toWhite(playedLine.score, mover);
    const rating = classifyMove({
      mover,
      best,
      second: lines[1] ? toWhite(lines[1].score, mover) : null,
      played,
      playedIsBest: lines[0].move === uci,
      deliversMate,
      ...moveFacts(before, move, after),
    });
    return { rating, evalCp: played };
  }

  private async rateInternally(before: Position, move: Move, after: Position, deliversMate: boolean): Promise<MoveRating | null> {
    const { depth, ...limits } = INTERNAL_LIMITS;
    const scores = await this.engines().search(before, depth, limits);
    return scores ? rateFromScores(before, move, after, deliversMate, scores) : null;
  }

  dispose(): void {
    this.deps?.dispose?.();
  }
}

/** Lazily started workers, so a variant game never loads Stockfish and the other way round. */
function workerDeps(): AnalyzerDeps {
  let sf: StockfishClient | null = null;
  let internal: InternalEngine | null = null;
  return {
    search: (pos, depth, limits) => (internal ??= new InternalEngine()).scoreMoves(pos, depth, limits),
    analyse: (fen, opts) => (sf ??= new StockfishClient()).analyse(fen, opts),
    dispose: () => {
      sf?.dispose();
      internal?.dispose();
    },
  };
}
