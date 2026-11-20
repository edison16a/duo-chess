import type { Color, GameResult, GameState, Move, RatingId } from "@/engine";
import type { GameConfig } from "@/features/modes";
import type { DraftState } from "@/features/powers";

export interface Player {
  id: string;
  name: string;
  online: boolean;
}

/**
 * Remaining time per side. `runningSince` is a host timestamp; clients add
 * their measured offset to the host clock before drawing the countdown.
 */
export interface ClockState {
  w: number;
  b: number;
  runningSince: number | null;
}

export type RoomPhase = "lobby" | "draft" | "playing" | "over";

/** Everything about a room. The host owns it and publishes it as a retained message. */
export interface RoomState {
  v: 1;
  code: string;
  hostId: string;
  /** Host clock when this snapshot was published. */
  updatedAt: number;
  players: Player[];
  seats: Record<Color, string | null>;
  phase: RoomPhase;
  config: GameConfig;
  draft: DraftState | null;
  game: GameState | null;
  clock: ClockState | null;
  /** Host time when the per move timer runs out. */
  moveDeadline: number | null;
  drawOffer: Color | null;
  rematch: string[];
  /** Short message for both players, e.g. why a power was refused. */
  notice: { text: string; to: string; at: number } | null;
}

export type RoomAction =
  | { type: "join"; id: string; name: string }
  | { type: "rename"; id: string; name: string }
  | { type: "leave"; id: string }
  | { type: "config"; id: string; config: Partial<GameConfig> }
  | { type: "swap"; id: string }
  | { type: "start"; id: string }
  | { type: "draft"; id: string; keep: string; give: string }
  | { type: "move"; id: string; move: Move }
  | { type: "power"; id: string; power: string; squares: number[] }
  | { type: "resign"; id: string }
  | { type: "draw-offer"; id: string }
  | { type: "draw-answer"; id: string; accept: boolean }
  | { type: "rematch"; id: string }
  | { type: "presence"; id: string; online: boolean }
  | { type: "annotate"; ply: number; rating: RatingId; evalCp: number }
  | { type: "tick" };

/** Host side inputs that keep the reducer pure and testable. */
export interface ReduceCtx {
  now: number;
  random: () => number;
}

export type { GameResult };
