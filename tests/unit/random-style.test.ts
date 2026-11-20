import { describe, expect, it } from "vitest";
import { createGame, createPosition, DEFAULT_RULES, legalMoves, parseSquare, playMove, standardLayout, turnKey, type Color, type GameState } from "@/engine";
import { COOLDOWN, RARITIES, POWERS, activatePower, createSlots, handView, powersOfRarity, refillSlots, spendPower, turnsLeft } from "@/features/powers";
import { createRoom, reduceRoom } from "@/features/room/reducer";
import type { RoomAction, RoomState } from "@/features/room/types";
import { seeded } from "./seeded";

const random = seeded(7);
const ctx = () => ({ now: 1_000, random });
const run = (state: RoomState, ...actions: RoomAction[]) => actions.reduce((s, a) => reduceRoom(s, a, ctx()), state);
const sq = (name: string) => parseSquare({ width: 8 }, name);
const move = (id: string, from: string, to: string): RoomAction => ({ type: "move", id, move: { from: sq(from), to: sq(to) } });

function started(patch: Partial<RoomState["config"]> = {}): RoomState {
  const room = createRoom("RND123", "host", "Ada", 1_000);
  const lobby = { ...room, config: { ...room.config, hostColor: "w" as const, mode: "superpowers" as const, draftStyle: "random" as const, ...patch } };
  return run(lobby, { type: "join", id: "guest", name: "Bo" }, { type: "start", id: "host" });
}

/** A started Random style room with hands we choose, so the test knows each cooldown. */
function withHands(w: string[], b: string[]): RoomState {
  const room = started({ powersEach: w.length });
  const refillAt = { w: w.map(() => null), b: b.map(() => null) };
  return { ...room, game: { ...room.game!, powers: { inventory: { w, b }, usedTurn: null, refillAt } } };
}

describe("random power style", () => {
  it("skips the draft and rolls distinct ready hands", () => {
    for (const size of [2, 4, 6, 8]) {
      const room = started({ powersEach: size });
      expect(room.phase).toBe("playing");
      expect(room.draft).toBeNull();
      for (const color of ["w", "b"] as Color[]) {
        const hand = room.game!.powers!.inventory[color];
        expect(hand).toHaveLength(size);
        expect(new Set(hand).size).toBe(size);
        expect(room.game!.powers!.refillAt![color]).toEqual(Array(size).fill(null));
      }
    }
  });

  it("cools down a free power and refills the slot on the owner's third turn", () => {
    let room = withHands(["smoke-screen", "pawn-storm"], ["frostbite"]);
    room = run(room, { type: "power", id: "host", power: "smoke-screen", squares: [] });
    expect(room.game!.history[0].power).toBe("smoke-screen");
    expect(turnsLeft(room.game!, "w", 0)).toBe(COOLDOWN.rare);
    expect(room.game!.powers!.inventory.w).toEqual(["smoke-screen", "pawn-storm"]);

    room = run(room, move("host", "e2", "e4"), move("guest", "e7", "e5"));
    expect(turnsLeft(room.game!, "w", 0)).toBe(1);
    const refused = run(room, { type: "power", id: "host", power: "smoke-screen", squares: [] });
    expect(refused.notice?.text).toBe("That power is still recharging");
    expect(refused.game).toBe(room.game);

    // Finishing the second turn ends the cooldown and the slot rolls something new.
    room = run(room, move("host", "d2", "d4"));
    const hand = room.game!.powers!.inventory.w;
    expect(room.game!.powers!.refillAt!.w).toEqual([null, null]);
    expect(hand[0]).not.toBe("smoke-screen");
    expect(hand[0]).not.toBe("pawn-storm");
    expect(hand[1]).toBe("pawn-storm");
    expect(handView(room.game!, "w").every((s) => s.left === 0)).toBe(true);
  });

  it("starts the cooldown for a power that uses the move too", () => {
    let room = withHands(["pawn-storm", "smoke-screen"], ["frostbite"]);
    room = run(room, { type: "power", id: "host", power: "pawn-storm", squares: [] });
    expect(room.game!.pos.turn).toBe("b");
    // The turn it was used on is already over, so one turn of waiting is left.
    expect(turnsLeft(room.game!, "w", 0)).toBe(1);
    room = run(room, move("guest", "e7", "e5"));
    expect(room.game!.powers!.inventory.w[0]).toBe("pawn-storm");
    room = run(room, move("host", "e3", "e4"));
    expect(room.game!.powers!.inventory.w[0]).not.toBe("pawn-storm");
    expect(room.game!.powers!.refillAt!.w[0]).toBeNull();
  });

  it("scales the cooldown with rarity for both colors", () => {
    for (const rarity of RARITIES) {
      for (const owner of ["w", "b"] as Color[]) {
        const id = powersOfRarity(rarity)[0].id;
        const pick = seeded(rarity.length);
        let game: GameState = createGame(createPosition(standardLayout(), DEFAULT_RULES));
        game = { ...game, powers: { ...createSlots(1, pick), inventory: { w: [id], b: [id] } } };
        if (owner === "b") game = playMove(game, legalMoves(game.pos)[0])!;
        // Spend the slot directly so every rarity is covered, whatever its targets need.
        game = { ...game, powers: spendPower(game.powers!, owner, id, game.pos, turnKey(game.pos)) };
        let turns = 0;
        while (game.powers!.refillAt![owner][0] !== null) {
          const moves = legalMoves(game.pos);
          if (game.pos.turn === owner) turns++;
          game = refillSlots(playMove(game, moves[Math.floor(pick() * moves.length)])!, pick);
        }
        expect(turns).toBe(COOLDOWN[rarity]);
        expect(game.pos.turn).not.toBe(owner);
      }
    }
  });

  it("leaves the drafted styles as one shot cards", () => {
    let game: GameState = createGame(createPosition(standardLayout(), DEFAULT_RULES));
    game = { ...game, powers: { inventory: { w: ["smoke-screen", "fortify"], b: [] }, usedTurn: null } };
    const next = activatePower(game, "w", "smoke-screen", [], seeded(3)) as GameState;
    expect(next.powers).toEqual({ inventory: { w: ["fortify"], b: [] }, usedTurn: "1w" });
    expect(POWERS["smoke-screen"].costsMove).toBe(false);
  });

  it("keeps the state plain JSON", () => {
    const room = run(withHands(["smoke-screen"], ["frostbite"]), { type: "power", id: "host", power: "smoke-screen", squares: [] });
    expect(JSON.parse(JSON.stringify(room.game!.powers))).toEqual(room.game!.powers);
  });
});
