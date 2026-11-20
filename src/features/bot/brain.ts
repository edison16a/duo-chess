/**
 * Picks the bot's move. Standard rule modes ask Stockfish at a limited
 * strength; every variant uses the built in search plus a softmax so the
 * bot makes human looking mistakes. Engines are injected so tests can run
 * the search inline instead of in a worker.
 */

import { legalMoves, toFen, type GameState, type Move, type Position } from "@/engine";
import type { BestMoveOptions } from "@/features/analysis/stockfish";
import { scoreRootMoves, type RootScore } from "@/features/analysis/search";
import { MODE_BY_ID, type ModeId } from "@/features/modes";
import { chooseDuckSquare } from "./duck";
import { aimSkill, searchStrength, stockfishStrength } from "./elo";
import { pickByTemperature, randomItem, uciToMove } from "./pick";
import type { TimePlan } from "./timing";

/** Scores every root move, best first, from White's point of view. */
export type RootSearch = (pos: Position, depth: number) => Promise<RootScore[] | null>;
/** One Stockfish move in UCI notation, or "" on failure or timeout. */
export type BestMoveFn = (fen: string, opts: BestMoveOptions, timeoutMs: number) => Promise<string>;

export interface BrainDeps {
  search: RootSearch;
  /** Leave out to play standard modes with the built in search too. */
  bestMove?: BestMoveFn;
}

/** Tiny main thread search for when an engine is missing, broken or too slow. */
export function quickMove(pos: Position, legal: Move[], random: () => number): Move {
  try {
    const [best] = scoreRootMoves(pos, 1, 2000);
    if (best) return best.move;
  } catch {
    // Fall through to a random move; any legal move beats no move.
  }
  return randomItem(legal, random);
}

export class BotBrain {
  constructor(private deps: BrainDeps, private random: () => number = Math.random) {}

  /** A legal move for the side to move, with a duck square in duck chess. Null when there is none. */
  async chooseMove(game: GameState, mode: ModeId, elo: number, plan: TimePlan): Promise<Move | null> {
    const pos = game.pos;
    const legal = legalMoves(pos);
    if (!legal.length) return null;
    let move: Move | null = null;
    try {
      move = MODE_BY_ID[mode].analysis === "stockfish" && this.deps.bestMove
        ? await this.stockfishMove(pos, legal, elo, plan)
        : await this.searchMove(pos, elo, plan);
    } catch {
      move = null;
    }
    move ??= quickMove(pos, legal, this.random);
    if (!pos.rules.duck) return move;
    return { ...move, duckTo: chooseDuckSquare(pos, move, aimSkill(elo), this.random) };
  }

  private async stockfishMove(pos: Position, legal: Move[], elo: number, plan: TimePlan): Promise<Move | null> {
    const s = stockfishStrength(elo);
    if (this.random() < s.randomChance) return randomItem(legal, this.random);
    const opts: BestMoveOptions = { movetime: plan.movetime, chess960: pos.rules.chess960, elo: s.elo, skill: s.skill };
    const uci = await this.deps.bestMove!(toFen(pos), opts, plan.timeout);
    return uciToMove(pos, uci, legal);
  }

  private async searchMove(pos: Position, elo: number, plan: TimePlan): Promise<Move | null> {
    const { depth, temperature } = searchStrength(elo);
    const scores = await this.deps.search(pos, Math.min(depth, plan.depthCap));
    if (!scores?.length) return null;
    return pickByTemperature(scores, pos.turn, temperature, this.random);
  }
}
