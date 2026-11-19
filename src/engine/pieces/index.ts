import type { PieceKind } from "../types";
import { CUSTOM_PIECES } from "./custom";
import { BISHOP, DUCK, KING, KNIGHT_DEF, PAWN, QUEEN, ROOK } from "./standard";
import type { PieceDef } from "./types";

export type { PieceDef, Pattern, PatternMode } from "./types";

export const STANDARD_PIECES: PieceDef[] = [KING, QUEEN, ROOK, BISHOP, KNIGHT_DEF, PAWN];

const ALL: PieceDef[] = [...STANDARD_PIECES, ...CUSTOM_PIECES, DUCK];

export const PIECES: Record<PieceKind, PieceDef> = Object.fromEntries(
  ALL.map((def) => [def.kind, def]),
) as Record<PieceKind, PieceDef>;

export const CUSTOM_PIECE_DEFS = CUSTOM_PIECES;

/** Kinds a pawn may promote into. Antichess also allows the king. */
export const PROMOTIONS: PieceKind[] = ["queen", "rook", "bishop", "knight"];

export function pieceDef(kind: PieceKind): PieceDef {
  return PIECES[kind];
}

export function letterToKind(letter: string): PieceKind | undefined {
  return ALL.find((d) => d.letter === letter.toUpperCase() && d.letter !== "")?.kind;
}
