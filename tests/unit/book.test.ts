import { describe, expect, it } from "vitest";
import { bookErrors, bookSize, isBookPosition } from "@/features/analysis/book";
import { newGame, playLine } from "./lines";

describe("opening book", () => {
  it("parses every line", () => {
    expect(bookErrors()).toEqual([]);
    expect(bookSize()).toBeGreaterThan(1000);
  });

  it("knows main lines and transpositions", () => {
    const ruy = playLine(newGame("classic"), ["e4", "e5", "Nf3", "Nc6", "Bb5", "a6"]);
    expect(ruy.slice(1).every((g) => isBookPosition(g.pos))).toBe(true);
    // The Queen's Gambit Declined reached through 1.Nf3.
    const qgd = playLine(newGame("classic"), ["Nf3", "d5", "d4", "Nf6", "c4", "e6"]);
    expect(isBookPosition(qgd[6].pos)).toBe(true);
  });

  it("does not know nonsense", () => {
    const states = playLine(newGame("classic"), ["e4", "e5", "Ke2", "Ke7"]);
    expect(isBookPosition(states[3].pos)).toBe(false);
    expect(isBookPosition(states[4].pos)).toBe(false);
  });
});
