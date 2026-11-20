import { describe, expect, it } from "vitest";
import { legalMoves, playMove, sameMove, type GameState } from "@/engine";
import { scoreRootMoves } from "@/features/analysis/search";
import { BotBrain, MAX_ELO, MIN_ELO, timePlan, type BestMoveFn } from "@/features/bot";
import { DEFAULT_MODS, buildGame, type GameConfig, type ModeId } from "@/features/modes";
import { createRoom } from "@/features/room/reducer";
import { seeded } from "./seeded";

/** Runs the real search inline with a tiny node budget so the tests stay fast. */
const inlineSearch = async (pos: Parameters<typeof scoreRootMoves>[0], depth: number) => scoreRootMoves(pos, depth, 1200);

function config(mode: ModeId): GameConfig {
  return { ...createRoom("BOT", "me", "Me", 0).config, mode, mods: { ...DEFAULT_MODS, clock: null } };
}

// Depth 2 at most keeps the suite quick while still covering the softmax at both ends.
const plan = { ...timePlan(createRoom("BOT", "me", "Me", 0), "w", 1200, 0, () => 0), depthCap: 2 };

/** Lets the bot play both sides and fails on the first move the rules refuse. */
async function selfPlay(mode: ModeId, plies: number, brain: BotBrain, seed: number): Promise<GameState> {
  const random = seeded(seed);
  let game = buildGame(config(mode), random);
  for (let i = 0; i < plies && !game.result; i++) {
    const elo = i % 2 === 0 ? MIN_ELO : MAX_ELO;
    const move = await brain.chooseMove(game, mode, elo, plan);
    expect(move, `${mode} ply ${i}`).not.toBeNull();
    expect(legalMoves(game.pos).some((m) => sameMove(m, move!))).toBe(true);
    const next = playMove(game, move!);
    expect(next, `${mode} ply ${i} ${JSON.stringify(move)}`).not.toBeNull();
    game = next!;
  }
  return game;
}

describe("bot always plays legal moves", () => {
  const brain = new BotBrain({ search: inlineSearch }, seeded(1));
  const modes: ModeId[] = ["classic", "atomic", "double", "triple", "duck", "crazyhouse", "antichess", "koth", "three-check", "chess960", "superpowers"];

  for (const mode of modes) {
    it(`in ${mode}`, async () => {
      const game = await selfPlay(mode, 14, brain, mode.length);
      expect(game.history.length).toBeGreaterThan(0);
    });
  }

  it("places the duck on an empty square every move", async () => {
    const game = await selfPlay("duck", 12, brain, 3);
    for (const entry of game.history) expect(entry.move.duckTo).toBeGreaterThanOrEqual(0);
  });

  it("falls back to a legal move when Stockfish answers nonsense or nothing", async () => {
    const answers = ["zzzz", "", "e2e4"];
    const bestMove: BestMoveFn = async () => answers.shift() ?? "";
    const sf = new BotBrain({ search: inlineSearch, bestMove }, () => 0.99);
    const game = buildGame(config("classic"));
    for (let i = 0; i < 3; i++) {
      const move = await sf.chooseMove(game, "classic", 2000, plan);
      expect(playMove(game, move!)).not.toBeNull();
    }
  });
});
