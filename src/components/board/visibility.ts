/** Fog of war and smoke screen visibility. */

import { attackSquares, pieceMoves, type Color, type Position } from "@/engine";

/** Squares the viewer can see in fog of war: their own pieces plus every square those pieces reach. */
export function fogVisible(pos: Position, viewer: Color): Set<number> {
  const seen = new Set<number>();
  pos.board.forEach((p, s) => {
    if (!p || p.color !== viewer) return;
    seen.add(s);
    for (const m of pieceMoves(pos, s)) seen.add(m.to);
    for (const a of attackSquares(pos, s)) seen.add(a);
  });
  return seen;
}
