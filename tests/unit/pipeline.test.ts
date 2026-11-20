/**
 * End to end checks of move rating: real games played through playMove and
 * rated the way the room host rates them. Stockfish is replaced by the
 * built in search answering in Stockfish's shape, so these run anywhere.
 */

import { describe, expect, it } from "vitest";
import { playMove, type RatingId } from "@/engine";
import { scoreRootMoves } from "@/features/analysis/search";
import { newGame, playLine, sanMove } from "./lines";
import { rateFen, rateLine, ratingsOf } from "./rate-helpers";

const BAD: (RatingId | null)[] = ["inaccuracy", "mistake", "blunder", null];
const SLOW = 60_000;

describe("standard games", () => {
  it("rates opening theory as book, then a hanging queen as a blunder", async () => {
    const plies = await rateLine("classic", ["e4", "e5", "Nf3", "Qh4"]);
    expect(ratingsOf(plies)).toEqual(["book", "book", "book", "blunder"]);
    // Every rating carries an eval for the eval bar, book moves included.
    expect(plies.every((p) => typeof p.evalCp === "number")).toBe(true);
  }, SLOW);

  it("rates a rook sacrifice that sets up a fork as brilliant", async () => {
    // Rf8+ Kxf8 Nd7+ wins the queen on b6 for the rook.
    const ply = await rateFen("classic", "6k1/6pp/1q6/4N3/8/8/6PP/5R1K w - - 0 1", "Rf8");
    expect(ply.rating).toBe("brilliant");
  }, SLOW);

  it("rates a queen sacrifice that forces mate as legendary", async () => {
    // Qe8+ Rxe8 Rxe8 is a back rank mate; anything else leaves the game level.
    const ply = await rateFen("classic", "2r3k1/5ppp/q7/8/4Q3/8/6PP/4R2K w - - 0 1", "Qe8");
    expect(ply.rating).toBe("legendary");
  }, SLOW);

  it("calls a sacrifice merely best when another move mates too", async () => {
    // Qg8+ is the famous smothered mate, but Nf7+ first mates as well, so nothing was risked.
    const ply = await rateFen("classic", "4r2k/pp4pp/7N/8/2Q5/8/PPP3PP/6K1 w - - 0 1", "Qg8");
    expect(ply.rating).toBe("best");
  }, SLOW);

  it("rates the mate itself as legendary", async () => {
    const ply = await rateFen("classic", "6rk/pp4pp/7N/8/8/8/PPP3PP/6K1 w - - 0 1", "Nf7");
    expect(ply.rating).toBe("legendary");
  }, SLOW);
});

describe("atomic", () => {
  // Reported from a live game: 1.e4 d5 2.Nf3 Bg4 3.exd5.
  it("rates the reported line and explains each verdict", async () => {
    const plies = await rateLine("atomic", ["e4", "d5", "Nf3", "Bg4", "exd5"]);
    const [e4, d5, nf3, bg4, exd5] = ratingsOf(plies);
    expect(BAD).not.toContain(e4);
    expect(BAD).not.toContain(d5);
    // 2.Nf3 really drops a piece: 2...dxe4 explodes on e4 and the blast takes the knight on f3.
    expect(nf3).toBe("blunder");
    // 2...Bg4 misses that free knight, and 3.exd5 opens the d file so 3...Qxd2 blows up the king.
    expect(bg4).toBe("blunder");
    expect(exd5).toBe("blunder");
  }, SLOW);

  it("backs those verdicts with the actual explosions", () => {
    const [, , afterNf3] = playLine(newGame("atomic"), ["e4", "d5", "Nf3"]).slice(1);
    const blast = playMove(afterNf3, sanMove(afterNf3, "dxe4"))!;
    expect(blast.lost.w).toContain("knight");
    const afterExd5 = playLine(newGame("atomic"), ["e4", "d5", "Nf3", "Bg4", "exd5"])[5];
    const mate = playMove(afterExd5, sanMove(afterExd5, "Qxd2"))!;
    expect(mate.result).toEqual({ winner: "b", reason: "king-exploded" });
  });

  it("scores from the right side: Black's best reply to 2.Nf3 is the capture", () => {
    const pos = playLine(newGame("atomic"), ["e4", "d5", "Nf3"])[3].pos;
    const [best] = scoreRootMoves(pos, 3, 40_000);
    expect(best.score).toBeLessThan(-150);
  });
});

describe("variants keep the side to move straight", () => {
  it("double move: hanging the queen is a blunder for either colour", async () => {
    const white = ratingsOf(await rateLine("double", ["e4", "Qg4", "d5", "Bxg4"]));
    expect(white[1]).toBe("blunder");
    expect(BAD).not.toContain(white[3]);
    const black = ratingsOf(await rateLine("double", ["Nc3", "Nf3", "e5", "Qg5"]));
    expect(black[3]).toBe("blunder");
  }, SLOW);

  it("triple move: quiet opening moves are fine, a hanging queen is not", async () => {
    const plies = ratingsOf(await rateLine("triple", ["e4", "d4", "Qg4"]));
    expect(BAD).not.toContain(plies[0]);
    expect(BAD).not.toContain(plies[1]);
    expect(plies[2]).toBe("blunder");
  }, SLOW);

  it("crazyhouse: a hanging queen is a blunder for either colour", async () => {
    expect(ratingsOf(await rateLine("crazyhouse", ["e4", "d5", "Qg4"]))[2]).toBe("blunder");
    expect(ratingsOf(await rateLine("crazyhouse", ["e4", "e5", "Nf3", "Qh4"]))[3]).toBe("blunder");
  }, SLOW);

  it("duck: a hanging queen is a blunder and normal moves are not", async () => {
    const plies = ratingsOf(await rateLine("duck", ["e4", "e5", "Nf3", "Qh4"]));
    expect(plies.slice(0, 3).some((r) => BAD.includes(r))).toBe(false);
    expect(plies[3]).toBe("blunder");
  }, SLOW);
});
