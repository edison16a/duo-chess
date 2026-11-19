import { ALL8, DIAG, KNIGHT, ORTHO } from "../geometry";
import type { PieceDef } from "./types";

export const KING: PieceDef = {
  kind: "king", name: "King", letter: "K", value: 0, royal: true, standard: true,
  patterns: [{ type: "leap", vectors: ALL8 }],
  blurb: "One square in any direction. Keep it safe.",
};

export const QUEEN: PieceDef = {
  kind: "queen", name: "Queen", letter: "Q", value: 900, standard: true,
  patterns: [{ type: "slide", vectors: ALL8 }],
  blurb: "Any distance in a straight line or diagonal.",
};

export const ROOK: PieceDef = {
  kind: "rook", name: "Rook", letter: "R", value: 500, standard: true,
  patterns: [{ type: "slide", vectors: ORTHO }],
  blurb: "Any distance along a rank or file.",
};

export const BISHOP: PieceDef = {
  kind: "bishop", name: "Bishop", letter: "B", value: 330, standard: true,
  patterns: [{ type: "slide", vectors: DIAG }],
  blurb: "Any distance diagonally.",
};

export const KNIGHT_DEF: PieceDef = {
  kind: "knight", name: "Knight", letter: "N", value: 320, standard: true,
  patterns: [{ type: "leap", vectors: KNIGHT }],
  blurb: "Jumps in an L shape, over anything in the way.",
};

/** Pawn movement is special cased in the generator; patterns here are only for diagrams. */
export const PAWN: PieceDef = {
  kind: "pawn", name: "Pawn", letter: "", value: 100, pawn: true, standard: true,
  patterns: [
    { type: "leap", vectors: [[0, 1]], mode: "move" },
    { type: "leap", vectors: [[1, 1], [-1, 1]], mode: "capture" },
  ],
  blurb: "Steps forward, two on its first move, captures diagonally and promotes on the last rank.",
};

export const DUCK: PieceDef = {
  kind: "duck", name: "Duck", letter: "@", value: 0, neutral: true,
  patterns: [],
  blurb: "Blocks a square. After every move the mover places it somewhere new.",
};
