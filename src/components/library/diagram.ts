/**
 * Works out a movement diagram for any piece by asking the real move
 * generator, so the library can never disagree with the rules.
 */

import { createPosition, pieceMoves, PIECES, type PieceKind } from "@/engine";

export type Mark = "move" | "capture" | "both" | "ray";

export const DIAGRAM_SIZE = 9;

export function movementDiagram(kind: PieceKind): Map<number, Mark> {
  const n = DIAGRAM_SIZE;
  const center = Math.floor((n * n) / 2);
  const marks = new Map<number, Mark>();
  const base = () => createPosition({ width: n, height: n, pieces: [{ square: center, kind, color: "w" }] });

  const quiet = new Set(pieceMoves(base(), center).map((m) => m.to));
  const captures = new Set<number>();
  for (let s = 0; s < n * n; s++) {
    if (s === center) continue;
    const pos = base();
    pos.board[s] = { id: 99, kind: "pawn", color: "b", moved: true };
    if (pieceMoves(pos, center).some((m) => m.to === s)) captures.add(s);
  }
  for (let s = 0; s < n * n; s++) {
    if (quiet.has(s) && captures.has(s)) marks.set(s, "both");
    else if (quiet.has(s)) marks.set(s, "move");
    else if (captures.has(s)) marks.set(s, "capture");
  }

  // Hoppers need something to jump over, so on an empty board they show their lines instead.
  for (const p of PIECES[kind].patterns) {
    if (p.type !== "hop" && p.type !== "cannon") continue;
    for (const [dx, dy] of p.vectors) {
      for (let k = 1; k < n; k++) {
        const x = 4 + dx * k, y = 4 + dy * k;
        if (x < 0 || y < 0 || x >= n || y >= n) break;
        const s = y * n + x;
        if (!marks.has(s)) marks.set(s, "ray");
      }
    }
  }
  return marks;
}
