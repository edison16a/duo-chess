import { describe, expect, it } from "vitest";
import { createGame, createPosition, DEFAULT_RULES, legalMoves, parseSquare, playMove, standardLayout, type GameState } from "@/engine";
import { scoreRootMoves } from "@/features/analysis/search";
import { BOT_ID, BotBrain, BotPlayer, buildDeck, chooseDraft, chooseDuckSquare, planPower } from "@/features/bot";
import { DEFAULT_MODS } from "@/features/modes";
import { ALL_POWERS, activatePower, createDraft, deckBudget, deckCost, deckProblem, powersOfRarity, readySlot } from "@/features/powers";
import { createRoom, reduceRoom } from "@/features/room/reducer";
import { randomMove } from "@/features/room/reducer/helpers";
import type { RoomAction, RoomState } from "@/features/room/types";
import { seeded } from "./seeded";

const sq = (name: string) => parseSquare({ width: 8 }, name);

/** A started superpowers game after 1. e4 e5 with chosen inventories. */
function powerGame(w: string[], b: string[] = []): GameState {
  let game = createGame(createPosition(standardLayout(), DEFAULT_RULES));
  game = playMove(game, { from: sq("e2"), to: sq("e4") })!;
  game = playMove(game, { from: sq("e7"), to: sq("e5") })!;
  return { ...game, powers: { inventory: { w, b }, usedTurn: null } };
}

describe("bot superpowers", () => {
  it("keeps the rarest draft option", () => {
    const rare = powersOfRarity("rare")[0].id;
    const epic = powersOfRarity("epic")[0].id;
    const mythical = powersOfRarity("mythical")[0].id;
    const offer = (options: string[]) => ({ ...createDraft("triple", 2, seeded(1)), options: { w: options, b: [] } });
    for (let seed = 1; seed < 6; seed++) {
      expect(chooseDraft(offer([epic, rare, mythical]), "w", seeded(seed))).toEqual([mythical]);
    }
    expect(chooseDraft(offer([rare, powersOfRarity("rare")[1].id, epic]), "w", seeded(9))).toEqual([epic]);
  });

  it("builds a Free Deck that fits the budget and spends most of it", () => {
    for (const size of [2, 4, 6, 8]) {
      for (let seed = 1; seed < 5; seed++) {
        const deck = buildDeck(size, seeded(seed));
        expect(deckProblem(deck, size)).toBeNull();
        expect(deckCost(deck)).toBeGreaterThanOrEqual(deckBudget(size) - 2);
      }
    }
  });

  it("aims harmful powers at valuable enemy pieces", () => {
    const game = powerGame(["meteor"]);
    const plan = planPower(game, "w", 1, seeded(2))!;
    expect(plan.power).toBe("meteor");
    expect(game.pos.board[plan.squares[0]]).toMatchObject({ color: "b", kind: "rook" });
    expect(typeof activatePower(game, "w", plan.power, plan.squares)).not.toBe("string");
  });

  it("plans targets the host accepts for nearly every power", () => {
    let planned = 0, accepted = 0;
    for (const def of ALL_POWERS) {
      const game = powerGame([def.id]);
      const plan = planPower(game, "w", 0.7, seeded(def.id.length));
      if (!plan) continue;
      planned++;
      if (typeof activatePower(game, "w", plan.power, plan.squares, seeded(4)) !== "string") accepted++;
    }
    expect(planned).toBeGreaterThan(ALL_POWERS.length * 0.8);
    expect(accepted / planned).toBeGreaterThan(0.8);
  });
});

describe("bot duck placement", () => {
  it("blocks a rook that would take its king", () => {
    const pieces = [
      { square: sq("e1"), kind: "king", color: "w" },
      { square: sq("a2"), kind: "pawn", color: "w" },
      { square: sq("e8"), kind: "rook", color: "b" },
      { square: sq("a8"), kind: "king", color: "b" },
    ] as const;
    const pos = createPosition({ width: 8, height: 8, pieces: [...pieces] }, { ...DEFAULT_RULES, duck: true, checkRules: false });
    const move = legalMoves(pos).find((m) => m.from === sq("a2") && m.to === sq("a3"))!;
    const blockers = ["e2", "e3", "e4", "e5", "e6", "e7"].map(sq);
    for (let seed = 1; seed < 8; seed++) {
      expect(blockers).toContain(chooseDuckSquare(pos, move, 0, seeded(seed)));
    }
  });
});

describe("bot player in a room", () => {
  it.each(["split", "random"] as const)("plays a %s style game, firing powers and moving", async (draftStyle) => {
    const random = seeded(11);
    const ctx = () => ({ now: Date.now(), random });
    const base = createRoom("BOT", "me", "Me", Date.now());
    let room: RoomState = {
      ...base,
      config: { ...base.config, mode: "superpowers", hostColor: "w", draftStyle, powersEach: 6, mods: { ...DEFAULT_MODS, clock: null } },
    };
    const brain = new BotBrain({ search: async (pos, depth) => scoreRootMoves(pos, depth, 600) }, random);
    let coolingTries = 0;
    const dispatch = (action: RoomAction) => {
      // The bot should never reach for a slot that is still recharging.
      if (action.type === "power" && action.id === BOT_ID && room.game?.powers && readySlot(room.game.powers, "b", action.power) < 0) coolingTries++;
      const next = reduceRoom(room, action, ctx());
      if (next === room) return;
      room = next;
      bot.observe(room);
    };
    const bot = new BotPlayer({ state: () => room, dispatch }, { elo: 3000, brain, random, pace: 0 });
    dispatch({ type: "join", id: BOT_ID, name: "Bot 3000" });
    dispatch({ type: "start", id: "me" });
    // Random style has no draft, so the bot must not wait on one.
    expect(room.phase).toBe(draftStyle === "random" ? "playing" : "draft");
    const opening = room.game!.powers?.inventory.b.slice();

    for (let step = 0; step < 400 && room.phase !== "over" && (room.game?.history.length ?? 0) < 40; step++) {
      if (room.phase === "draft" && room.draft && room.draft.options.w.length) {
        dispatch({ type: "draft", id: "me", picks: [room.draft.options.w[0]] });
      } else if (room.phase === "playing" && room.game?.pos.turn === "w") {
        dispatch({ type: "move", id: "me", move: randomMove(room, ctx())! });
      }
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
    bot.dispose();

    const history = room.game!.history;
    expect(history.length).toBeGreaterThan(10);
    expect(history.some((h) => h.color === "b" && h.power)).toBe(true);
    expect(history.filter((h) => h.color === "b" && !h.power).length).toBeGreaterThan(4);
    expect(coolingTries).toBe(0);
    if (draftStyle === "random") {
      expect(room.game!.powers!.inventory.b).toHaveLength(6);
      expect(room.game!.powers!.inventory.b).not.toEqual(opening);
    }
  });
});
