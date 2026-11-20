import { describe, expect, it } from "vitest";
import { MATE } from "@/features/analysis";
import { eloFromAccuracy, moveAccuracy, summarizeGame, winPercent, type SummaryEntry } from "@/features/analysis/summary";

describe("accuracy pieces", () => {
  it("turns evals into the mover's win chance, mates capped like lichess", () => {
    expect(winPercent(0, "w")).toBe(50);
    expect(winPercent(300, "w")).toBeCloseTo(75.1, 1);
    expect(winPercent(300, "b")).toBeCloseTo(24.9, 1);
    expect(winPercent(MATE - 2, "w")).toBeCloseTo(winPercent(1000, "w"), 5);
  });

  it("scores a move by the win chance it gave away", () => {
    expect(moveAccuracy(50, 55)).toBe(100);
    expect(moveAccuracy(50, 50)).toBe(100);
    expect(moveAccuracy(60, 55)).toBeCloseTo(80.8, 1);
    expect(moveAccuracy(70, 20)).toBeLessThan(10);
  });

  it("maps accuracy to a rough rating that only goes up", () => {
    expect(eloFromAccuracy(50)).toBe(600);
    expect(eloFromAccuracy(70)).toBe(1200);
    expect(eloFromAccuracy(80)).toBe(1600);
    expect(eloFromAccuracy(90)).toBe(2200);
    expect(eloFromAccuracy(97)).toBe(2800);
    expect(eloFromAccuracy(100)).toBe(2800);
    let last = 0;
    for (let a = 0; a <= 100; a += 0.5) {
      expect(eloFromAccuracy(a)).toBeGreaterThanOrEqual(last);
      last = eloFromAccuracy(a);
    }
  });
});

describe("game summary", () => {
  const game: SummaryEntry[] = [
    { color: "w", rating: "book", evalCp: 30 },
    { color: "b", rating: "book", evalCp: 25 },
    { color: "w", rating: "best", evalCp: 30 },
    { color: "b", rating: "blunder", evalCp: 900 },
    { color: "w", rating: "great", evalCp: 950 },
    { color: "b", rating: "best", evalCp: 950 },
    { color: "w", rating: "legendary", evalCp: MATE - 1 },
  ];

  it("counts every rating id per side", () => {
    const s = summarizeGame(game);
    expect(s.w.counts.book).toBe(1);
    expect(s.w.counts.legendary).toBe(1);
    expect(s.b.counts.blunder).toBe(1);
    expect(s.b.counts.brilliant).toBe(0);
    expect(s.w.rated).toBe(4);
    expect(s.b.rated).toBe(3);
  });

  it("treats book moves as perfect and punishes the blunder", () => {
    const s = summarizeGame(game);
    expect(s.w.accuracy).toBe(100);
    expect(s.w.estimatedElo).toBe(2800);
    expect(s.b.accuracy!).toBeCloseTo(71.1, 1);
    expect(s.b.measured).toBe(3);
  });

  it("skips moves it cannot measure instead of guessing", () => {
    const s = summarizeGame([
      { color: "w", rating: "best", evalCp: 20 },
      { color: "b", power: "freeze" },
      { color: "w", rating: "good", evalCp: 0 },
      { color: "b" },
      { color: "w", evalCp: -50 },
    ]);
    // The first move has no eval before it, the third follows a power, the last follows an unrated move.
    expect(s.w.measured).toBe(0);
    expect(s.w.accuracy).toBeNull();
    expect(s.w.estimatedElo).toBeNull();
    expect(summarizeGame([{ color: "w", rating: "best", evalCp: 20 }], { startEvalCp: 20 }).w.accuracy).toBe(100);
  });
});
