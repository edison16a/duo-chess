/** Lobby actions: joining, naming, settings and starting the game. */

import type { RoomAction, ReduceCtx, RoomState } from "../types";
import { beginGame, cleanName, colorOf, finish } from "./helpers";

/** The first two players are the ones who will play, so either may change settings. Later joiners only watch. */
export function canConfigure(state: RoomState, id: string): boolean {
  return state.phase === "lobby" && state.players.slice(0, 2).some((p) => p.id === id);
}

type LobbyAction = Extract<RoomAction, { type: "join" | "rename" | "leave" | "config" | "swap" | "start" | "presence" }>;

export function reduceLobby(state: RoomState, action: LobbyAction, ctx: ReduceCtx): RoomState {
  switch (action.type) {
    case "join": {
      const existing = state.players.find((p) => p.id === action.id);
      if (existing) {
        return { ...state, players: state.players.map((p) => (p.id === action.id ? { ...p, online: true, name: cleanName(action.name) } : p)) };
      }
      return { ...state, players: [...state.players, { id: action.id, name: cleanName(action.name), online: true }] };
    }
    case "rename":
      return { ...state, players: state.players.map((p) => (p.id === action.id ? { ...p, name: cleanName(action.name) } : p)) };
    case "presence":
      return { ...state, players: state.players.map((p) => (p.id === action.id ? { ...p, online: action.online } : p)) };
    case "leave": {
      let next: RoomState = { ...state, players: state.players.filter((p) => p.id !== action.id) };
      const color = colorOf(state, action.id);
      if (color && state.phase !== "lobby" && state.phase !== "over") {
        next = finish(next, { winner: color === "w" ? "b" : "w", reason: "abandoned" }, ctx);
      }
      if (next.phase === "lobby" || next.phase === "over") next = { ...next, seats: { w: null, b: null } };
      return next;
    }
    // Both players shape the game together; only the host starts it.
    case "config":
      if (!canConfigure(state, action.id)) return state;
      return { ...state, config: { ...state.config, ...action.config } };
    case "swap": {
      if (!canConfigure(state, action.id)) return state;
      const order = { w: "b", b: "random", random: "w" } as const;
      return { ...state, config: { ...state.config, hostColor: order[state.config.hostColor] } };
    }
    case "start": {
      if (action.id !== state.hostId || state.phase !== "lobby") return state;
      const [host, guest] = state.players;
      if (!host || !guest) return state;
      const hostWhite = state.config.hostColor === "random" ? ctx.random() < 0.5 : state.config.hostColor === "w";
      return beginGame(state, ctx, hostWhite ? { w: host.id, b: guest.id } : { w: guest.id, b: host.id });
    }
  }
}
