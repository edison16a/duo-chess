import { endGame, legalMoves, opposite, type Color, type GameResult, type Move } from "@/engine";
import { buildGame, effectiveMoveTimer } from "@/features/modes";
import { MODE_BY_ID } from "@/features/modes";
import { createDraft, createSlots } from "@/features/powers";
import { startClock, stopClock } from "../clock";
import type { ReduceCtx, RoomState } from "../types";

export const MAX_NAME = 24;

export function cleanName(name: string): string {
  return name.replace(/\s+/g, " ").trim().slice(0, MAX_NAME) || "Player";
}

export function colorOf(state: RoomState, id: string): Color | null {
  if (state.seats.w === id) return "w";
  if (state.seats.b === id) return "b";
  return null;
}

export function notice(state: RoomState, to: string, text: string, ctx: ReduceCtx): RoomState {
  return { ...state, notice: { text, to, at: ctx.now } };
}

/** Deadline for the per move timer, or null when it is off. */
export function nextDeadline(state: RoomState, ctx: ReduceCtx): number | null {
  const seconds = effectiveMoveTimer(state.config);
  return seconds > 0 ? ctx.now + seconds * 1000 : null;
}

/**
 * Seats the first two players and starts the draft or the game itself.
 * Random style has nothing to draft, so both hands are rolled here and the
 * game starts straight away.
 */
export function beginGame(state: RoomState, ctx: ReduceCtx, seats: Record<Color, string>): RoomState {
  const game = buildGame(state.config, ctx.random);
  const base: RoomState = { ...state, seats, game, drawOffer: null, rematch: [], notice: null, clock: null, moveDeadline: null };
  if (MODE_BY_ID[state.config.mode].powers) {
    const style = state.config.draftStyle ?? "split";
    const size = state.config.powersEach ?? 4;
    if (style === "random") return startPlay({ ...base, game: { ...game, powers: createSlots(size, ctx.random) }, draft: null }, ctx);
    return { ...base, phase: "draft", draft: createDraft(style, size, ctx.random) };
  }
  return startPlay({ ...base, draft: null }, ctx);
}

/** Moves from draft (or straight from the lobby) into actual play. */
export function startPlay(state: RoomState, ctx: ReduceCtx): RoomState {
  const clock = state.config.mods.clock ? startClock(state.config.mods.clock.minutes, ctx.now) : null;
  const game = state.draft && state.game
    ? { ...state.game, powers: { inventory: state.draft.inventory, usedTurn: null } }
    : state.game;
  return { ...state, game, phase: "playing", clock, moveDeadline: nextDeadline(state, ctx) };
}

export function finish(state: RoomState, result: GameResult, ctx: ReduceCtx): RoomState {
  if (!state.game) return state;
  const clock = state.clock ? stopClock(state.clock, state.game.pos.turn, ctx.now) : null;
  return { ...state, game: endGame(state.game, result), phase: "over", clock, moveDeadline: null, drawOffer: null };
}

/** A random legal move, used when the per move timer runs out. Adds a duck square in duck chess. */
export function randomMove(state: RoomState, ctx: ReduceCtx): Move | null {
  const pos = state.game!.pos;
  const moves = legalMoves(pos);
  if (!moves.length) return null;
  const move: Move = { ...moves[Math.floor(ctx.random() * moves.length)] };
  if (pos.rules.duck) {
    const duck = pos.board.findIndex((p) => p?.kind === "duck");
    const empty = pos.board
      .map((_, i) => i)
      .filter((i) => i !== duck && i !== move.to && !pos.holes.includes(i) && (!pos.board[i] || i === move.from));
    move.duckTo = empty[Math.floor(ctx.random() * empty.length)];
  }
  return move;
}

export const other = opposite;
