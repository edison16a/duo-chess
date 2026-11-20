import type { GameResult } from "@/engine";

/** How a game ended, worded to follow "<name> wins". */
export const REASONS: Record<GameResult["reason"], string> = {
  checkmate: "by checkmate",
  stalemate: "by stalemate",
  resign: "by resignation",
  timeout: "on time",
  "king-captured": "by capturing the king",
  "king-exploded": "by blowing up the king",
  hill: "by taking the hill",
  "three-check": "by three checks",
  repetition: "by repetition",
  "fifty-move": "by the fifty move rule",
  insufficient: "by insufficient material",
  agreement: "by agreement",
  annihilation: "by wiping out every piece",
  giveaway: "by losing everything",
  abandoned: "because the opponent left",
};
