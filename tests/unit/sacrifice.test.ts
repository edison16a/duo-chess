import { describe, expect, it } from "vitest";
import { fromFen, makeMove, parseSquare, type Position } from "@/engine";
import { child } from "@/features/analysis/search";
import { isSacrifice } from "@/features/analysis/sacrifice";
import { newGame, playLine, sanMove } from "./lines";

function sac(fen: string, from: string, to: string): boolean {
  const before = fromFen(fen);
  const move = { from: parseSquare(before, from), to: parseSquare(before, to) };
  return isSacrifice(before, move, makeMove(before, move).pos);
}

/** Plays a line in classic chess and asks about its last move. */
function lastIsSac(sans: string[]): boolean {
  const states = playLine(newGame("classic"), sans.slice(0, -1));
  const game = states[states.length - 1];
  const move = sanMove(game, sans[sans.length - 1]);
  const before: Position = game.pos;
  return isSacrifice(before, move, child(before, move));
}

describe("sacrifice detection", () => {
  it("sees a bishop thrown onto f7", () => {
    expect(sac("r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 1", "c4", "f7")).toBe(true);
    expect(sac("r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 1", "b1", "c3")).toBe(false);
  });

  it("sees a queen left hanging on purpose (Legal's mate)", () => {
    expect(lastIsSac(["e4", "e5", "Nf3", "d6", "Bc4", "Bg4", "Nc3", "g6", "Nxe5"])).toBe(true);
  });

  it("ignores ordinary trades and recaptures", () => {
    expect(lastIsSac(["e4", "e5", "Nf3", "Nc6", "Bb5", "a6", "Bxc6"])).toBe(false);
    expect(lastIsSac(["e4", "e5", "Nf3", "Nc6", "Bb5", "a6", "Bxc6", "dxc6"])).toBe(false);
    expect(lastIsSac(["d4", "d5", "c4", "dxc4"])).toBe(false);
  });

  it("does not count a gambit pawn", () => {
    expect(lastIsSac(["e4", "e5", "f4"])).toBe(false);
  });
});
