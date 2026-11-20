import { createGame, fromFen, moveToUci, playMove, type GameState, type RatingId } from "@/engine";
import { MoveAnalyzer, type AnalyzerDeps } from "@/features/analysis";
import { scoreRootMoves } from "@/features/analysis/search";
import type { AnalyseOptions, EngineLine } from "@/features/analysis/stockfish";
import type { ModeId } from "@/features/modes";
import { MODE_BY_ID } from "@/features/modes";
import { newGame, sanMove } from "./lines";

/** Depth and nodes for tests: deep enough for short tactics, quick enough for CI. */
const DEPTH = 4;
const NODES = 60_000;

/**
 * Stands in for Stockfish with the built in search, answering in UCI with
 * scores from the side to move, exactly the shape StockfishClient returns.
 */
function fakeStockfish(fen: string, opts: AnalyseOptions): EngineLine[] {
  const pos = fromFen(fen);
  // The book only wants a rough eval, so it gets a quick search like the real short movetime.
  const quick = opts.multipv === 1 && !opts.searchmoves;
  let scores = scoreRootMoves(pos, quick ? 2 : DEPTH, NODES);
  if (opts.searchmoves) scores = scores.filter((s) => opts.searchmoves!.includes(moveToUci(pos, s.move)));
  const sign = pos.turn === "w" ? 1 : -1;
  return scores.slice(0, opts.multipv).map((s) => ({ move: moveToUci(pos, s.move), score: sign * s.score }));
}

/** Inline engines, no workers, no wasm, node limited so results do not depend on the machine. */
export function inlineDeps(): AnalyzerDeps {
  return {
    search: async (pos, depth) => scoreRootMoves(pos, Math.min(depth, DEPTH), NODES),
    analyse: async (fen, opts) => fakeStockfish(fen, opts),
  };
}

export interface RatedPly {
  san: string;
  rating: RatingId | null;
  evalCp: number | null;
}

/** Duck squares that stay out of the way of the short lines the tests play. */
const DUCK_SPOTS = [16, 47, 40, 23];

/**
 * Plays a line the way a room does and rates every move the way the host
 * does: same analyzer, same before and after positions, same mate flag.
 */
export async function rateLine(mode: ModeId, sans: string[]): Promise<RatedPly[]> {
  const analyzer = new MoveAnalyzer(MODE_BY_ID[mode].analysis, inlineDeps());
  let game: GameState = newGame(mode);
  const out: RatedPly[] = [];
  for (const san of sans) {
    const move = sanMove(game, san);
    if (game.pos.rules.duck) {
      const duck = game.pos.board.findIndex((p) => p?.kind === "duck");
      move.duckTo = DUCK_SPOTS.find((s) => s !== duck && !game.pos.board[s] && s !== move.to);
    }
    const next = playMove(game, move);
    if (!next) throw new Error(`illegal ${san}`);
    const entry = next.history[next.history.length - 1];
    const deliversMate = !!next.result && next.result.winner === entry.color;
    const rated = await analyzer.rate(game.pos, entry.move, next.pos, deliversMate);
    out.push({ san, rating: rated?.rating ?? null, evalCp: rated?.evalCp ?? null });
    game = next;
  }
  return out;
}

/** Rates one move from a FEN through the same analyzer, for hand built tactics. */
export async function rateFen(mode: ModeId, fen: string, san: string): Promise<RatedPly> {
  const game = createGame(fromFen(fen));
  const move = sanMove(game, san);
  const next = playMove(game, move)!;
  const deliversMate = !!next.result && next.result.winner === game.pos.turn;
  const analyzer = new MoveAnalyzer(MODE_BY_ID[mode].analysis, inlineDeps());
  const rated = await analyzer.rate(game.pos, next.history[0].move, next.pos, deliversMate);
  return { san, rating: rated?.rating ?? null, evalCp: rated?.evalCp ?? null };
}

/** The ratings only, handy for compact expectations. */
export const ratingsOf = (plies: RatedPly[]) => plies.map((p) => p.rating);
