import { describe, expect, it } from "vitest";
import { parseSquare } from "@/engine";
import { DEFAULT_MODS } from "@/features/modes";
import { powersOfRarity } from "@/features/powers";
import { createRoom, reduceRoom } from "@/features/room/reducer";
import type { RoomAction, RoomState } from "@/features/room/types";

let now = 1_000;
const ctx = () => ({ now, random: () => 0.1 });
const run = (state: RoomState, ...actions: RoomAction[]) => actions.reduce((s, a) => reduceRoom(s, a, ctx()), state);
const sq = (name: string) => parseSquare({ width: 8 }, name);

function lobby(patch: Partial<RoomState["config"]> = {}): RoomState {
  const room = createRoom("ABC123", "host", "Ada", now);
  return run({ ...room, config: { ...room.config, hostColor: "w", ...patch } }, { type: "join", id: "guest", name: "  Bo  " });
}

describe("room reducer", () => {
  it("joins, names and seats players", () => {
    const room = run(lobby(), { type: "start", id: "host" });
    expect(room.players.map((p) => p.name)).toEqual(["Ada", "Bo"]);
    expect(room.seats).toEqual({ w: "host", b: "guest" });
    expect(room.phase).toBe("playing");
  });

  it("lets both players change settings but only the host start", () => {
    let room = run(lobby(), { type: "config", id: "guest", config: { mode: "atomic" } }, { type: "start", id: "guest" });
    expect(room.config.mode).toBe("atomic");
    expect(room.phase).toBe("lobby");
    room = run(room, { type: "join", id: "watcher", name: "Cy" }, { type: "config", id: "watcher", config: { mode: "classic" } });
    expect(room.config.mode).toBe("atomic");
  });

  it("plays moves in turn and rejects out of turn moves", () => {
    let room = run(lobby(), { type: "start", id: "host" });
    room = run(room, { type: "move", id: "guest", move: { from: sq("e7"), to: sq("e5") } });
    expect(room.game!.history).toHaveLength(0);
    room = run(room, { type: "move", id: "host", move: { from: sq("e2"), to: sq("e4") } });
    expect(room.game!.history[0].san).toBe("e4");
  });

  it("flags a player who runs out of time", () => {
    let room = run(lobby({ mods: { ...DEFAULT_MODS, clock: { minutes: 1, increment: 0 } } }), { type: "start", id: "host" });
    now += 61_000;
    room = run(room, { type: "tick" });
    expect(room.game!.result).toEqual({ winner: "b", reason: "timeout" });
    expect(room.phase).toBe("over");
  });

  it("plays a random move when the move timer expires", () => {
    let room = run(lobby({ mode: "lightning", mods: { ...DEFAULT_MODS, clock: null } }), { type: "start", id: "host" });
    now += 1_500;
    room = run(room, { type: "tick" });
    expect(room.game!.history).toHaveLength(1);
    expect(room.notice?.to).toBe("host");
  });

  it("never moves for anyone by default", () => {
    let room = run(lobby(), { type: "start", id: "host" });
    expect(room.clock).toBeNull();
    expect(room.moveDeadline).toBeNull();
    now += 600_000;
    room = run(room, { type: "tick" });
    expect(room.game!.history).toHaveLength(0);
  });

  it("runs the superpower draft before play", () => {
    let room = run(lobby({ mode: "superpowers" }), { type: "start", id: "host" });
    expect(room.phase).toBe("draft");
    // Both draft at once: two Take & give picks each fill both hands to four.
    for (let i = 0; i < 2; i++) {
      room = run(room, { type: "draft", id: "guest", picks: [room.draft!.options.b[0]] });
      room = run(room, { type: "draft", id: "host", picks: [room.draft!.options.w[0]] });
    }
    expect(room.phase).toBe("playing");
    expect(room.game!.powers!.inventory.w).toHaveLength(4);
  });

  it("starts a Free Deck game once both hands are locked in", () => {
    let room = run(lobby({ mode: "superpowers", draftStyle: "deck", powersEach: 2 }), { type: "start", id: "host" });
    const deck = [powersOfRarity("rare")[0].id, powersOfRarity("legendary")[0].id];
    room = run(room, { type: "draft", id: "guest", picks: deck });
    expect(room.phase).toBe("draft");
    expect(room.draft!.locked).toEqual({ w: false, b: true });
    // Two mythicals cost 8 points, over the 5 point budget for two powers.
    const greedy = powersOfRarity("mythical").slice(0, 2).map((p) => p.id);
    expect(run(room, { type: "draft", id: "host", picks: greedy }).phase).toBe("draft");
    room = run(room, { type: "draft", id: "host", picks: deck });
    expect(room.phase).toBe("playing");
    expect(room.game!.powers!.inventory.b).toEqual(deck);
  });

  it("resigns, then rematches with swapped colors", () => {
    let room = run(lobby(), { type: "start", id: "host" }, { type: "resign", id: "guest" });
    expect(room.game!.result).toEqual({ winner: "w", reason: "resign" });
    room = run(room, { type: "rematch", id: "host" }, { type: "rematch", id: "guest" });
    expect(room.seats).toEqual({ w: "guest", b: "host" });
    expect(room.phase).toBe("playing");
  });

  it("records ratings from the analyzer", () => {
    let room = run(lobby(), { type: "start", id: "host" }, { type: "move", id: "host", move: { from: sq("e2"), to: sq("e4") } });
    room = run(room, { type: "annotate", ply: 0, rating: "best", evalCp: 30 });
    expect(room.game!.history[0].rating).toBe("best");
  });
});
