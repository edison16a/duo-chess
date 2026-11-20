import { describe, expect, it } from "vitest";
import { createGame, createPosition, DEFAULT_RULES, fromFen, standardLayout } from "@/engine";
import { scoreRootMoves } from "@/features/analysis/search";
import {
  DEFAULT_ELO, MAX_ELO, MIN_ELO, STOCKFISH_MIN_ELO, botName, clampElo, levelLabel, powerChance,
  searchStrength, stockfishStrength, timePlan, uciToMove, pickByTemperature, wantsDraw,
} from "@/features/bot";
import { createRoom } from "@/features/room/reducer";
import type { RoomState } from "@/features/room/types";
import { seeded } from "./seeded";
describe("bot elo mapping", () => {
  it("clamps and rounds ratings to the slider", () => {
    expect(clampElo(10)).toBe(MIN_ELO);
    expect(clampElo(9999)).toBe(MAX_ELO);
    expect(clampElo(1523)).toBe(1500);
    expect(clampElo(Number.NaN)).toBe(DEFAULT_ELO);
    expect(botName(1500)).toBe("Bot 1500");
    expect(levelLabel(620)).toBe("Beginner");
    expect(levelLabel(2900)).toBe("Master");
  });

  it("uses UCI_Elo from 1320 up and random moves below", () => {
    const strong = stockfishStrength(2000);
    expect(strong).toMatchObject({ elo: 2000, randomChance: 0 });
    const edge = stockfishStrength(STOCKFISH_MIN_ELO + 30);
    expect(edge.elo).not.toBeNull();
    const weak = stockfishStrength(1000);
    const weakest = stockfishStrength(MIN_ELO);
    expect(weak.elo).toBeNull();
    expect(weak.skill).toBe(0);
    expect(weakest.randomChance).toBeGreaterThan(weak.randomChance);
    expect(weak.randomChance).toBeGreaterThan(stockfishStrength(1300).randomChance);
    for (const elo of [MIN_ELO, 1200, 2000, MAX_ELO]) {
      const { movetime } = stockfishStrength(elo);
      expect(movetime).toBeGreaterThanOrEqual(300);
      expect(movetime).toBeLessThanOrEqual(800);
    }
  });

  it("searches deeper and colder as the rating grows", () => {
    expect(searchStrength(MIN_ELO).depth).toBe(1);
    expect(searchStrength(1500).depth).toBe(2);
    expect(searchStrength(MAX_ELO).depth).toBe(3);
    let last = Infinity;
    for (let elo = MIN_ELO; elo <= MAX_ELO; elo += 200) {
      const { temperature } = searchStrength(elo);
      expect(temperature).toBeLessThan(last);
      last = temperature;
    }
    expect(powerChance(MAX_ELO)).toBeGreaterThan(powerChance(MIN_ELO));
  });
});

describe("bot move picking", () => {
  it("strong bots take the free queen, weak ones sometimes miss it", () => {
    const pos = fromFen("4k3/8/8/3q4/8/8/3R4/4K3 w - - 0 1");
    const scores = scoreRootMoves(pos, 2);
    const best = scores[0].move;
    const random = seeded(7);
    const pick = (t: number) => pickByTemperature(scores, "w", t, random);
    const cold = Array.from({ length: 50 }, () => pick(searchStrength(MAX_ELO).temperature));
    expect(cold.every((m) => m.to === best.to && m.from === best.from)).toBe(true);
    const hot = Array.from({ length: 200 }, () => pick(searchStrength(MIN_ELO).temperature));
    expect(hot.some((m) => m.to !== best.to)).toBe(true);
  });

  it("maps Stockfish answers back to legal moves, including 960 castling", () => {
    const pos = createPosition(standardLayout(), DEFAULT_RULES);
    expect(uciToMove(pos, "e2e4")).toMatchObject({ from: 12, to: 28 });
    expect(uciToMove(pos, "e2e5")).toBeNull();
    expect(uciToMove(pos, "")).toBeNull();
    const castle = fromFen("4k3/8/8/8/8/8/8/4K2R w K - 0 1");
    expect(uciToMove(castle, "e1g1")?.castle).toBeTruthy();
    // Chess960 sends castling as king takes own rook.
    const pieces = [
      { square: 4, kind: "king", color: "w" },
      { square: 7, kind: "rook", color: "w" },
      { square: 60, kind: "king", color: "b" },
    ] as const;
    const nine = createPosition({ width: 8, height: 8, pieces: [...pieces] }, { ...DEFAULT_RULES, chess960: true });
    expect(uciToMove(nine, "e1h1")?.castle).toBeTruthy();
    expect(uciToMove(nine, "e1g1")?.castle).toBeFalsy();
  });

  it("keeps thinking inside the Lightning timer", () => {
    const now = 50_000;
    const base = createRoom("BOT", "me", "Me", now);
    const state: RoomState = {
      ...base,
      phase: "playing",
      game: createGame(createPosition(standardLayout(), DEFAULT_RULES)),
      seats: { w: "bot", b: "me" },
      moveDeadline: now + 1000,
    };
    const plan = timePlan(state, "w", MAX_ELO, now, () => 0.99);
    expect(plan.delay).toBeLessThanOrEqual(500);
    expect(plan.movetime).toBeLessThanOrEqual(300);
    expect(plan.depthCap).toBe(1);
    const relaxed = timePlan({ ...state, moveDeadline: null }, "w", 1200, now, () => 0);
    expect(relaxed.delay).toBeGreaterThanOrEqual(400);
    expect(relaxed.depthCap).toBe(3);
  });
});

describe("bot draw answers", () => {
  const room = (fen: string): RoomState => ({
    ...createRoom("BOT", "me", "Me", 0),
    phase: "playing",
    seats: { w: "me", b: "bot" },
    game: createGame(fromFen(fen)),
  });

  it("declines in a level position and accepts when clearly lost", () => {
    expect(wantsDraw(room("rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1"), "b")).toBe(false);
    expect(wantsDraw(room("4k3/8/8/8/8/8/8/QQ2K3 b - - 0 1"), "b")).toBe(true);
    expect(wantsDraw(room("4k3/8/8/8/8/8/8/QQ2K3 b - - 0 1"), "w")).toBe(false);
  });
});
