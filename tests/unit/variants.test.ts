import { describe, expect, it } from "vitest";
import { createGame, createPosition, DEFAULT_RULES, fromFen, legalMoves, parseSquare, playMove, standardLayout, type GameState, type Rules } from "@/engine";

const rules = (patch: Partial<Rules>): Rules => ({ ...DEFAULT_RULES, ...patch });

function play(game: GameState, ...moves: string[]): GameState {
  for (const m of moves) {
    const from = parseSquare(game.pos, m.slice(0, 2));
    const to = parseSquare(game.pos, m.slice(2, 4));
    const next = playMove(game, { from, to, ...(m[4] ? { promotion: "queen" as const } : {}) });
    if (!next) throw new Error(`illegal ${m}`);
    game = next;
  }
  return game;
}

describe("classic", () => {
  it("detects fool's mate", () => {
    const game = play(createGame(createPosition(standardLayout())), "f2f3", "e7e5", "g2g4", "d8h4");
    expect(game.result).toEqual({ winner: "b", reason: "checkmate" });
    expect(game.history.at(-1)!.san).toBe("Qh4#");
  });

  it("castles kingside", () => {
    const game = play(createGame(createPosition(standardLayout())), "e2e4", "e7e5", "g1f3", "b8c6", "f1c4", "g8f6", "e1g1");
    expect(game.history.at(-1)!.san).toBe("O-O");
    expect(game.pos.board[parseSquare(game.pos, "f1")]?.kind).toBe("rook");
  });
});

describe("atomic", () => {
  it("captures explode surrounding pieces but not pawns", () => {
    const pos = createPosition(standardLayout(), rules({ atomic: true }));
    const game = play(createGame(pos), "g1f3", "d7d5", "f3e5", "d8d6", "e5f7");
    expect(game.pos.board[parseSquare(game.pos, "f7")]).toBeNull();
    expect(game.pos.board[parseSquare(game.pos, "g8")]).toBeNull();
    expect(game.pos.board[parseSquare(game.pos, "g7")]?.kind).toBe("pawn");
    expect(game.result).toEqual({ winner: "w", reason: "king-exploded" });
  });

  it("kings cannot capture", () => {
    const pos = fromFen("8/8/8/8/8/8/4p3/4K2k w - - 0 1", rules({ atomic: true }));
    expect(legalMoves(pos).some((m) => m.to === parseSquare(pos, "e2"))).toBe(false);
  });
});

describe("multi move", () => {
  it("double move gives two moves and check ends the turn", () => {
    const pos = createPosition(standardLayout(), rules({ movesPerTurn: 2 }));
    const game = play(createGame(pos), "e2e4", "d2d4");
    expect(game.pos.turn).toBe("b");
    const checked = play(createGame(fromFen("4k3/8/8/8/8/8/8/R3K3 w - - 0 1", rules({ movesPerTurn: 2 }))), "a1a8");
    expect(checked.pos.turn).toBe("b");
  });
});

describe("other variants", () => {
  it("king of the hill wins on the center", () => {
    const pos = fromFen("8/8/8/8/8/4K3/8/7k w - - 0 1", rules({ kingOfTheHill: true }));
    const game = play(createGame(pos), "e3e4");
    expect(game.result?.reason).toBe("hill");
  });

  it("three check counts checks", () => {
    const pos = createPosition(standardLayout(), rules({ checksToWin: 1 }));
    const game = play(createGame(pos), "e2e4", "f7f6", "d1h5");
    expect(game.result).toEqual({ winner: "w", reason: "three-check" });
  });

  it("antichess forces captures", () => {
    const pos = createPosition(standardLayout(), rules({ giveaway: true, mustCapture: true, checkRules: false, castling: false }));
    const game = play(createGame(pos), "e2e4", "d7d5");
    expect(legalMoves(game.pos).every((m) => m.to === parseSquare(game.pos, "d5"))).toBe(true);
  });

  it("crazyhouse puts captures in the pocket and allows drops", () => {
    const pos = createPosition(standardLayout(), rules({ drops: true }));
    const game = play(createGame(pos), "e2e4", "d7d5", "e4d5");
    expect(game.pos.pockets.w).toEqual(["pawn"]);
    const after = play(game, "g8f6");
    const drop = playMove(after, { from: -1, to: parseSquare(game.pos, "e6"), drop: "pawn" });
    expect(drop?.pos.board[parseSquare(game.pos, "e6")]?.kind).toBe("pawn");
  });

  it("duck chess requires a duck square", () => {
    const pos = createPosition(standardLayout(), rules({ duck: true, checkRules: false }));
    const game = createGame(pos);
    expect(playMove(game, { from: parseSquare(pos, "e2"), to: parseSquare(pos, "e4") })).toBeNull();
    const next = playMove(game, { from: parseSquare(pos, "e2"), to: parseSquare(pos, "e4"), duckTo: parseSquare(pos, "e5") });
    expect(next?.pos.board[parseSquare(pos, "e5")]?.kind).toBe("duck");
  });

  it("fairy pieces move by their patterns", () => {
    const pos = createPosition({ width: 8, height: 8, pieces: [
      { square: 0, kind: "dragon", color: "w" }, { square: 9, kind: "pawn", color: "b" }, { square: 63, kind: "king", color: "b" }, { square: 7, kind: "king", color: "w" },
    ] });
    const targets = legalMoves(pos).filter((m) => m.from === 0).map((m) => m.to);
    expect(targets).toContain(27);
  });
});
