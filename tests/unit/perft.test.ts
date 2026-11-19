import { describe, expect, it } from "vitest";
import { afterMove, fromFen, legalMoves, makeMove, type Position } from "@/engine";

/**
 * Perft counts every leaf at a fixed depth. Matching the published numbers
 * is the standard way to prove a move generator handles castling, en
 * passant, promotion and pins exactly right.
 */
function perft(pos: Position, depth: number): number {
  if (depth === 0) return 1;
  const moves = legalMoves(pos);
  if (depth === 1) return moves.length;
  let total = 0;
  for (const move of moves) {
    const { pos: next } = makeMove(pos, move);
    afterMove(next, false, []);
    total += perft(next, depth - 1);
  }
  return total;
}

describe("perft", () => {
  it("start position", () => {
    const pos = fromFen("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
    expect(perft(pos, 1)).toBe(20);
    expect(perft(pos, 2)).toBe(400);
    expect(perft(pos, 3)).toBe(8902);
  });

  it("kiwipete (castling, pins, en passant)", () => {
    const pos = fromFen("r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1");
    expect(perft(pos, 1)).toBe(48);
    expect(perft(pos, 2)).toBe(2039);
    expect(perft(pos, 3)).toBe(97862);
  });

  it("position 3 (en passant edge cases)", () => {
    const pos = fromFen("8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1");
    expect(perft(pos, 4)).toBe(43238);
  });

  it("position 4 (promotions and checks)", () => {
    const pos = fromFen("r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1 w kq - 0 1");
    expect(perft(pos, 3)).toBe(9467);
  });

  it("position 5", () => {
    const pos = fromFen("rnbq1k1r/pp1Pbppp/2p5/8/2B5/8/PPP1NnPP/RNBQK2R w KQ - 1 8");
    expect(perft(pos, 3)).toBe(62379);
  });
});
