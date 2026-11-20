import { describe, expect, it } from "vitest";
import { classifyMove, MATE, winChance } from "@/features/analysis";

const base = { mover: "w" as const, second: null, sacrifice: false, deliversMate: false };

describe("win chance", () => {
  it("follows the lichess curve and caps big evals", () => {
    expect(winChance(0)).toBe(50);
    expect(winChance(100)).toBeCloseTo(59.1, 1);
    expect(winChance(-300)).toBeCloseTo(24.9, 1);
    expect(winChance(1000)).toBeCloseTo(winChance(2500), 5);
    expect(winChance(MATE - 3)).toBe(100);
    expect(winChance(-MATE + 3)).toBe(0);
  });
});

describe("classification", () => {
  it("rates by win chance lost, in chess.com's bands", () => {
    expect(classifyMove({ ...base, best: 30, played: 30, playedIsBest: true })).toBe("best");
    expect(classifyMove({ ...base, best: 30, played: 15, playedIsBest: false })).toBe("excellent");
    expect(classifyMove({ ...base, best: 30, played: -20, playedIsBest: false })).toBe("good");
    expect(classifyMove({ ...base, best: 30, played: -70, playedIsBest: false })).toBe("inaccuracy");
    expect(classifyMove({ ...base, best: 30, played: -150, playedIsBest: false })).toBe("mistake");
    expect(classifyMove({ ...base, best: 30, played: -900, playedIsBest: false })).toBe("blunder");
  });

  it("works from Black's side", () => {
    expect(classifyMove({ ...base, mover: "b", best: -50, played: 800, playedIsBest: false })).toBe("blunder");
    expect(classifyMove({ ...base, mover: "b", best: -50, played: -50, playedIsBest: true })).toBe("best");
  });

  it("rates a hanging queen as a blunder", () => {
    expect(classifyMove({ ...base, best: 20, played: -880, playedIsBest: false })).toBe("blunder");
  });

  it("does not punish moves when the game is already decided", () => {
    // +15 to +9 is still completely winning.
    expect(classifyMove({ ...base, best: 1500, played: 900, playedIsBest: false })).toBe("excellent");
    // Mate in two traded for a rook up is still a win.
    expect(classifyMove({ ...base, best: MATE - 3, played: 1100, playedIsBest: false })).toBe("good");
    // Getting mated a move sooner when it is lost anyway.
    expect(classifyMove({ ...base, best: -MATE + 8, played: -MATE + 4, playedIsBest: false })).toBe("excellent");
    expect(classifyMove({ ...base, mover: "b", best: 1400, played: 2000, playedIsBest: false })).toBe("excellent");
  });

  it("calls a slower mate excellent, not best", () => {
    expect(classifyMove({ ...base, best: MATE - 3, played: MATE - 9, playedIsBest: false })).toBe("excellent");
    expect(classifyMove({ ...base, best: 200, played: 190, playedIsBest: false })).toBe("best");
  });

  it("flags only moves as great", () => {
    expect(classifyMove({ ...base, best: 50, second: -300, played: 50, playedIsBest: true })).toBe("great");
    // Grabbing a free piece is obvious, so it stays best.
    expect(classifyMove({ ...base, best: 50, second: -300, played: 50, playedIsBest: true, obvious: true })).toBe("best");
    // The only move that keeps a lost game lost is nothing special.
    expect(classifyMove({ ...base, best: -500, second: -1200, played: -500, playedIsBest: true })).toBe("best");
    // When the runner up wins too, the move was not critical.
    expect(classifyMove({ ...base, best: MATE - 5, second: 900, played: MATE - 5, playedIsBest: true })).toBe("best");
  });

  it("rates good sacrifices as brilliant, but not when already winning", () => {
    expect(classifyMove({ ...base, best: 250, played: 250, playedIsBest: true, sacrifice: true })).toBe("brilliant");
    expect(classifyMove({ ...base, best: 250, second: 200, played: 230, playedIsBest: false, sacrifice: true })).toBe("brilliant");
    expect(classifyMove({ ...base, best: 900, second: 800, played: 900, playedIsBest: true, sacrifice: true })).toBe("best");
    // A sacrifice that leaves the mover worse off is just a loss of material.
    expect(classifyMove({ ...base, best: 0, played: -200, playedIsBest: false, sacrifice: true })).toBe("mistake");
  });

  it("saves legendary for mates and sacrifices that force mate", () => {
    expect(classifyMove({ ...base, best: 0, played: 0, playedIsBest: true, deliversMate: true })).toBe("legendary");
    expect(classifyMove({ ...base, best: MATE - 7, second: 100, played: MATE - 7, playedIsBest: true, sacrifice: true })).toBe("legendary");
  });

  it("rates a forced move as best", () => {
    expect(classifyMove({ ...base, best: -400, played: -400, playedIsBest: true, forced: true })).toBe("best");
  });
});
