/**
 * Maps are written as rows of letters, top row first, the way you would
 * draw them on paper. Uppercase is White, lowercase is Black, "." is empty
 * and "#" is a hole in the board.
 */

import { letterToKind, type Color, type LayoutPiece, type PieceKind } from "@/engine";
import type { ChessMap } from "./types";

export function parseRows(rows: string[]): Pick<ChessMap, "width" | "height" | "pieces" | "holes"> {
  const height = rows.length;
  const width = rows[0].length;
  const pieces: LayoutPiece[] = [];
  const holes: number[] = [];
  rows.forEach((row, i) => {
    const y = height - 1 - i;
    [...row].forEach((ch, x) => {
      const square = y * width + x;
      if (ch === ".") return;
      if (ch === "#") { holes.push(square); return; }
      if (ch === "@") { pieces.push({ square, kind: "duck", color: "n" }); return; }
      const kind: PieceKind | undefined = ch.toUpperCase() === "P" ? "pawn" : letterToKind(ch);
      if (!kind) throw new Error(`Unknown piece letter ${ch}`);
      const color: Color = ch === ch.toUpperCase() ? "w" : "b";
      pieces.push({ square, kind, color });
    });
  });
  return { width, height, pieces, holes };
}
