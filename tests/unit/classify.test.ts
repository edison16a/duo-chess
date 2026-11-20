import { describe, expect, it } from "vitest";
import { fromFen, makeMove, parseSquare } from "@/engine";
import { classifyMove } from "@/features/analysis";
import { isSacrifice } from "@/features/analysis/sacrifice";

const base = { mover: "w" as const, second: null, sacrifice: false, deliversMate: false };

describe("classification", () => {
  it("rates by win chance lost", () => {
    expect(classifyMove({ ...base, best: 30, played: 30, playedIsBest: true })).toBe("best");
    expect(classifyMove({ ...base, best: 30, played: 0, playedIsBest: false })).toBe("excellent");
    expect(classifyMove({ ...base, best: 30, played: -200, playedIsBest: false })).toBe("mistake");
    expect(classifyMove({ ...base, best: 30, played: -900, playedIsBest: false })).toBe("blunder");
  });

  it("works from Black's side", () => {
    expect(classifyMove({ ...base, mover: "b", best: -50, played: 800, playedIsBest: false })).toBe("blunder");
  });

  it("flags only moves as great and sacs as brilliant", () => {
    expect(classifyMove({ ...base, best: 50, second: -300, played: 50, playedIsBest: true })).toBe("great");
    expect(classifyMove({ ...base, best: 250, played: 250, playedIsBest: true, sacrifice: true })).toBe("brilliant");
    expect(classifyMove({ ...base, best: 0, played: 0, playedIsBest: true, deliversMate: true })).toBe("legendary");
  });

  it("detects a hanging piece sacrifice", () => {
    const before = fromFen("r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 1");
    const move = { from: parseSquare(before, "c4"), to: parseSquare(before, "f7") };
    const { pos: after } = makeMove(before, move);
    expect(isSacrifice(before, move, after)).toBe(true);
    const quiet = { from: parseSquare(before, "b1"), to: parseSquare(before, "c3") };
    expect(isSacrifice(before, quiet, makeMove(before, quiet).pos)).toBe(false);
  });
});
