import type { PieceKind } from "../types";
import type { Vec } from "../geometry";

/** How a pattern may be used: to move, to capture, or both. */
export type PatternMode = "any" | "move" | "capture";

/**
 * Declarative movement. Every piece in the game, standard or custom, is a
 * list of these, so adding a new piece never touches the move generator.
 */
export type Pattern =
  /** Jump straight to the target, ignoring anything in between. */
  | { type: "leap"; vectors: Vec[]; mode?: PatternMode }
  /** Repeat a step until blocked. `fly` ignores blockers (Dragon, Rail). */
  | { type: "slide"; vectors: Vec[]; mode?: PatternMode; fly?: boolean; limit?: number }
  /** Grasshopper: land on the square right after the first piece in a line. */
  | { type: "hop"; vectors: Vec[] }
  /** Xiangqi cannon capture: jump exactly one screen, then hit the next piece. */
  | { type: "cannon"; vectors: Vec[] };

export interface PieceDef {
  kind: PieceKind;
  name: string;
  /** Single letter used in move notation. */
  letter: string;
  /** Rough material value in centipawns, used by the built in engine. */
  value: number;
  royal?: boolean;
  /** Pawns get double steps, en passant and promotion handled specially. */
  pawn?: boolean;
  /** Blows up everything around it when captured. */
  explodesOnCapture?: boolean;
  /** Belongs to nobody, cannot be captured, only moved by the duck rule. */
  neutral?: boolean;
  /** True for the six pieces Stockfish understands. */
  standard?: boolean;
  patterns: Pattern[];
  blurb: string;
}
