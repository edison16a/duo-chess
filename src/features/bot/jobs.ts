/** Pure answers to "what does the bot owe the room right now". */

import type { Color } from "@/engine";
import { evaluate } from "@/features/analysis/evaluate";
import { playerDone } from "@/features/powers";
import { colorOf } from "@/features/room/reducer";
import type { RoomState } from "@/features/room/types";

export interface BotJob {
  kind: "draft" | "move";
  /** Changes whenever the answer could change, so a stale job can tell it is stale. */
  key: string;
  color: Color;
}

/** Centipawns the bot must be behind before it takes a draw. */
const DRAW_THRESHOLD = 300;

export function jobFor(state: RoomState, id: string): BotJob | null {
  const color = colorOf(state, id);
  if (!color) return null;
  const draft = state.draft;
  if (state.phase === "draft" && draft) {
    // Everyone drafts at once, so the bot owes a pick until its own part is done.
    if (!playerDone(draft, color)) return { kind: "draft", key: `draft:${draft.picks?.[color] ?? 0}`, color };
  }
  const game = state.game;
  if (state.phase === "playing" && game && !game.result && game.pos.turn === color) {
    return { kind: "move", key: `move:${game.eventSeq}`, color };
  }
  return null;
}

/** True while the opponent has a draw offer waiting on the bot. */
export function drawPending(state: RoomState, id: string): boolean {
  const color = colorOf(state, id);
  return !!color && state.phase === "playing" && !!state.drawOffer && state.drawOffer !== color;
}

/**
 * Takes a draw only when clearly worse. Prefers the latest engine rating
 * on the move list and falls back to a quick static evaluation.
 */
export function wantsDraw(state: RoomState, color: Color): boolean {
  const game = state.game;
  if (!game) return false;
  const rated = [...game.history].reverse().find((h) => h.evalCp !== undefined)?.evalCp;
  const white = rated ?? evaluate(game.pos);
  const mine = color === "w" ? white : -white;
  return mine <= -DRAW_THRESHOLD;
}

/** The bot never refuses a rematch, it just waits for the player to ask. */
export function rematchPending(state: RoomState, id: string): boolean {
  return state.phase === "over" && !!colorOf(state, id) && state.rematch.length > 0 && !state.rematch.includes(id);
}
