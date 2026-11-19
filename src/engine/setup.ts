/** Builds starting positions from layouts (standard, Chess960, custom maps). */

import { sq } from "./geometry";
import { PIECES } from "./pieces";
import type { Color, Piece, PieceKind, Position, Rules } from "./types";

export interface LayoutPiece {
  square: number;
  kind: PieceKind;
  color: Color | "n";
}

/** A board shape plus piece placement. Maps and modes all reduce to this. */
export interface Layout {
  width: number;
  height: number;
  pieces: LayoutPiece[];
  holes?: number[];
}

export const DEFAULT_RULES: Rules = {
  checkRules: true, castling: true, atomic: false, mustCapture: false, giveaway: false,
  drops: false, kingOfTheHill: false, checksToWin: 0, movesPerTurn: 1, duck: false, chess960: false,
};

const BACK_RANK: PieceKind[] = ["rook", "knight", "bishop", "queen", "king", "bishop", "knight", "rook"];

function mirrorRows(back: PieceKind[]): LayoutPiece[] {
  const pieces: LayoutPiece[] = [];
  back.forEach((kind, x) => {
    pieces.push({ square: sq({ width: 8 }, x, 0), kind, color: "w" });
    pieces.push({ square: sq({ width: 8 }, x, 1), kind: "pawn", color: "w" });
    pieces.push({ square: sq({ width: 8 }, x, 6), kind: "pawn", color: "b" });
    pieces.push({ square: sq({ width: 8 }, x, 7), kind, color: "b" });
  });
  return pieces;
}

export function standardLayout(): Layout {
  return { width: 8, height: 8, pieces: mirrorRows(BACK_RANK) };
}

/**
 * Random Fischer back rank: bishops on opposite colors, king between rooks.
 * `random` is injectable so the host can pick and tests can be repeatable.
 */
export function chess960Layout(random: () => number = Math.random): Layout {
  const rank: (PieceKind | null)[] = Array(8).fill(null);
  const pick = (slots: number[]) => slots[Math.floor(random() * slots.length)];
  rank[pick([0, 2, 4, 6])] = "bishop";
  rank[pick([1, 3, 5, 7])] = "bishop";
  const free = () => rank.map((p, i) => (p ? -1 : i)).filter((i) => i >= 0);
  rank[pick(free())] = "queen";
  rank[pick(free())] = "knight";
  rank[pick(free())] = "knight";
  const [a, b, c] = free();
  rank[a] = "rook";
  rank[b] = "king";
  rank[c] = "rook";
  return { width: 8, height: 8, pieces: mirrorRows(rank as PieceKind[]) };
}

export function createPosition(layout: Layout, rules: Rules = DEFAULT_RULES): Position {
  const board: (Piece | null)[] = Array(layout.width * layout.height).fill(null);
  let nextId = 1;
  for (const p of layout.pieces) {
    board[p.square] = { id: nextId++, kind: p.kind, color: p.color, moved: false };
  }
  const royalStart = (color: Color) => layout.pieces.some((p) => p.color === color && PIECES[p.kind].royal);
  return {
    width: layout.width,
    height: layout.height,
    board,
    holes: layout.holes ?? [],
    turn: "w",
    movesLeft: rules.movesPerTurn,
    ep: null,
    halfmove: 0,
    fullmove: 1,
    pockets: { w: [], b: [] },
    checks: { w: 0, b: 0 },
    effects: [],
    skip: { w: 0, b: 0 },
    bonus: { w: { turns: 0, extra: 0 }, b: { turns: 0, extra: 0 } },
    rules,
    royalStart: { w: royalStart("w"), b: royalStart("b") },
    nextId,
  };
}
