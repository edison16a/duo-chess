/**
 * Runs in the host's tab. Folds actions into the room state, publishes each
 * new snapshot, ticks the clocks and asks the analyzer to rate moves.
 */

import { MoveAnalyzer } from "@/features/analysis";
import { analysisFor } from "@/features/modes";
import { reduceRoom } from "./reducer";
import type { RoomAction, RoomState } from "./types";

const TICK_MS = 200;

/**
 * Where the host sends each snapshot. RoomChannel fills this over MQTT;
 * a local bot game passes LOCAL_CHANNEL so nothing leaves the tab.
 */
export interface StatePublisher {
  publishState(state: RoomState): void;
  clearState(): void;
}

export const LOCAL_CHANNEL: StatePublisher = {
  publishState: () => undefined,
  clearState: () => undefined,
};

export class HostController {
  private timer: ReturnType<typeof setInterval>;
  private analyzer: MoveAnalyzer | null = null;
  private analyzerMode: string | null = null;

  constructor(
    private state: RoomState,
    private channel: StatePublisher,
    private onChange: (state: RoomState) => void,
  ) {
    this.publish(state);
    this.timer = setInterval(() => {
      if (this.state.phase === "playing" && (this.state.clock || this.state.moveDeadline)) this.dispatch({ type: "tick" });
    }, TICK_MS);
  }

  get current(): RoomState {
    return this.state;
  }

  dispatch(action: RoomAction): void {
    const prev = this.state;
    const next = reduceRoom(prev, action, { now: Date.now(), random: Math.random });
    if (next === prev) return;
    this.publish(next);
    this.maybeAnalyse(prev, next);
  }

  private publish(state: RoomState): void {
    this.state = { ...state, updatedAt: Date.now() };
    this.channel.publishState(this.state);
    this.onChange(this.state);
  }

  /**
   * Rates every new move. Even with ratings hidden the game over screen
   * needs them for accuracy, the estimated rating and the move counts.
   */
  private maybeAnalyse(prev: RoomState, next: RoomState): void {
    const before = prev.game, after = next.game;
    if (!before || !after || after.history.length !== before.history.length + 1) return;
    const entry = after.history[after.history.length - 1];
    if (entry.power) return;
    // Keyed by mode and engine: the same mode on a map needs our own search instead of Stockfish.
    const analyzerKey = `${next.config.mode}:${analysisFor(next.config)}`;
    if (this.analyzerMode !== analyzerKey) {
      this.analyzer?.dispose();
      this.analyzer = new MoveAnalyzer(analysisFor(next.config));
      this.analyzerMode = analyzerKey;
    }
    // Any move that wins on the spot (mate, an exploded king, the hill) counts as legendary.
    const deliversMate = !!after.result && after.result.winner === entry.color;
    this.analyzer!.rate(before.pos, entry.move, after.pos, deliversMate).then((rating) => {
      if (rating) this.dispatch({ type: "annotate", ply: entry.ply, rating: rating.rating, evalCp: rating.evalCp });
    });
  }

  /** Deletes the room from the broker so the code stops working. */
  closeRoom(): void {
    this.channel.clearState();
  }

  dispose(): void {
    clearInterval(this.timer);
    this.analyzer?.dispose();
  }
}
