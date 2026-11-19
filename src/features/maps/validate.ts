import { PIECES } from "@/engine";
import type { ChessMap } from "./types";

/** Returns a reason the map cannot be played, or null when it is fine. */
export function mapProblem(map: ChessMap): string | null {
  for (const color of ["w", "b"] as const) {
    const mine = map.pieces.filter((p) => p.color === color);
    if (mine.length === 0) return `${color === "w" ? "White" : "Black"} needs at least one piece`;
    if (mine.filter((p) => PIECES[p.kind].royal).length > 1) return "Each side can have at most one king";
  }
  // Pawns may sit on their own back rank (Horde does), never on the rank they promote on.
  const promoRank = (color: string) => (color === "w" ? map.height - 1 : 0);
  if (map.pieces.some((p) => p.kind === "pawn" && Math.floor(p.square / map.width) === promoRank(p.color))) {
    return "Pawns cannot start on their promotion rank";
  }
  return null;
}
