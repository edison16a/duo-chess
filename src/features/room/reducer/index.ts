/**
 * The room reducer. Only the host runs it: guests send actions, the host
 * folds them into the room state and publishes the result. Keeping it pure
 * makes the whole multiplayer flow testable without a network.
 */

import { DEFAULT_MODS, STANDARD_MAP } from "@/features/modes";
import type { ReduceCtx, RoomAction, RoomState } from "../types";
import { cleanName } from "./helpers";
import { reduceLobby } from "./lobby";
import { reducePlay } from "./play";

export function createRoom(code: string, hostId: string, hostName: string, now: number): RoomState {
  return {
    v: 1,
    code,
    hostId,
    updatedAt: now,
    players: [{ id: hostId, name: cleanName(hostName), online: true }],
    seats: { w: null, b: null },
    phase: "lobby",
    config: { mode: "classic", mods: DEFAULT_MODS, mapId: STANDARD_MAP, customMap: null, hostColor: "random", draftStyle: "split", powersEach: 4 },
    draft: null,
    game: null,
    clock: null,
    moveDeadline: null,
    drawOffer: null,
    rematch: [],
    notice: null,
  };
}

export function reduceRoom(state: RoomState, action: RoomAction, ctx: ReduceCtx): RoomState {
  switch (action.type) {
    case "join":
    case "rename":
    case "leave":
    case "config":
    case "swap":
    case "start":
    case "presence":
      return reduceLobby(state, action, ctx);
    default:
      return reducePlay(state, action, ctx);
  }
}

export { colorOf } from "./helpers";
