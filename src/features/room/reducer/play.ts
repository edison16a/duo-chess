/** In game actions: moves, powers, the draft, clocks and endings. */

import { opposite, playMove, type Move } from "@/engine";
import { activatePower, applyDraft, draftDone } from "@/features/powers";
import { chargeMove, remaining } from "../clock";
import type { ReduceCtx, RoomAction, RoomState } from "../types";
import { beginGame, colorOf, finish, nextDeadline, notice, randomMove, startPlay } from "./helpers";

type PlayAction = Extract<RoomAction, { type: "draft" | "move" | "power" | "resign" | "draw-offer" | "draw-answer" | "rematch" | "annotate" | "tick" }>;

/** Applies a move for `id` and handles clocks, deadlines and the end of the game. */
function applyMove(state: RoomState, id: string, move: Move, ctx: ReduceCtx): RoomState {
  const color = colorOf(state, id);
  const game = state.game;
  if (state.phase !== "playing" || !game || !color || game.pos.turn !== color) return state;
  const next = playMove(game, move);
  if (!next) return notice(state, id, "That move is not allowed", ctx);
  const passed = next.pos.turn !== color;
  const clock = state.clock && state.config.mods.clock
    ? chargeMove(state.clock, color, passed, state.config.mods.clock.increment, ctx.now)
    : state.clock;
  const updated: RoomState = { ...state, game: next, clock, drawOffer: null, notice: null, moveDeadline: nextDeadline(state, ctx) };
  return next.result ? finish(updated, next.result, ctx) : updated;
}

export function reducePlay(state: RoomState, action: PlayAction, ctx: ReduceCtx): RoomState {
  switch (action.type) {
    case "move":
      return applyMove(state, action.id, action.move, ctx);

    case "power": {
      const color = colorOf(state, action.id);
      if (state.phase !== "playing" || !state.game || !color) return state;
      const result = activatePower(state.game, color, action.power, action.squares, ctx.random);
      if (typeof result === "string") return notice(state, action.id, result, ctx);
      const passed = result.pos.turn !== color;
      const clock = state.clock && state.config.mods.clock && passed
        ? chargeMove(state.clock, color, true, state.config.mods.clock.increment, ctx.now)
        : state.clock;
      const updated: RoomState = { ...state, game: result, clock, notice: null, moveDeadline: passed ? nextDeadline(state, ctx) : state.moveDeadline };
      return result.result ? finish(updated, result.result, ctx) : updated;
    }

    case "draft": {
      const color = colorOf(state, action.id);
      if (state.phase !== "draft" || !state.draft || !color) return state;
      const draft = applyDraft(state.draft, color, action.picks, ctx.random);
      if (typeof draft === "string") return notice(state, action.id, draft, ctx);
      const next = { ...state, draft };
      return draftDone(draft) ? startPlay(next, ctx) : next;
    }

    case "resign": {
      const color = colorOf(state, action.id);
      if (!color || (state.phase !== "playing" && state.phase !== "draft")) return state;
      return finish(state, { winner: opposite(color), reason: "resign" }, ctx);
    }

    case "draw-offer": {
      const color = colorOf(state, action.id);
      if (!color || state.phase !== "playing") return state;
      return { ...state, drawOffer: color };
    }

    case "draw-answer": {
      const color = colorOf(state, action.id);
      if (!color || !state.drawOffer || state.drawOffer === color) return state;
      return action.accept ? finish(state, { winner: null, reason: "agreement" }, ctx) : { ...state, drawOffer: null };
    }

    case "rematch": {
      if (state.phase !== "over" || !colorOf(state, action.id)) return state;
      const votes = state.rematch.includes(action.id) ? state.rematch : [...state.rematch, action.id];
      const { w, b } = state.seats;
      if (w && b && votes.includes(w) && votes.includes(b)) return beginGame(state, ctx, { w: b, b: w });
      return { ...state, rematch: votes };
    }

    case "annotate": {
      const game = state.game;
      if (!game || !game.history[action.ply]) return state;
      const history = game.history.slice();
      history[action.ply] = { ...history[action.ply], rating: action.rating, evalCp: action.evalCp };
      return { ...state, game: { ...game, history } };
    }

    case "tick": {
      const game = state.game;
      if (state.phase !== "playing" || !game) return state;
      const turn = game.pos.turn;
      if (state.clock && remaining(state.clock, turn, turn, ctx.now) <= 0) {
        return finish(state, { winner: opposite(turn), reason: "timeout" }, ctx);
      }
      if (state.moveDeadline !== null && ctx.now >= state.moveDeadline) {
        const move = randomMove(state, ctx);
        const id = state.seats[turn];
        if (move && id) {
          const moved = applyMove(state, id, move, ctx);
          // applyMove clears notices, so say why the piece moved after it.
          return moved === state ? moved : notice(moved, id, "Out of time for that move, so one was played for you", ctx);
        }
      }
      return state;
    }
  }
}
