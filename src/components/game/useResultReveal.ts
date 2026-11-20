"use client";

import { useEffect, useRef, useState } from "react";
import type { GameEvent, GameResult } from "@/engine";

/** How long the ending gets before the result covers the board, by how loud it was. */
const BLAST_HOLD = { full: 2200, low: 1000 };
const QUIET_HOLD = 700;

/**
 * Holds the result back for a moment so the move that ended the game can
 * play out: an atomic king blast gets its full explosion instead of being
 * covered by the result card the same frame. A result that was already
 * there when the page loaded shows at once.
 */
export function useResultReveal(result: GameResult | null, events: GameEvent[], fx: "full" | "low"): boolean {
  const initial = useRef(result);
  const [shown, setShown] = useState(!!result);

  useEffect(() => {
    if (!result) {
      setShown(false);
      initial.current = null;
      return;
    }
    if (shown || initial.current === result) return;
    // Resignations, timeouts and agreed draws have no move to watch.
    const moved = ["checkmate", "king-captured", "king-exploded", "hill", "three-check", "annihilation", "giveaway", "stalemate"].includes(result.reason);
    const blast = events.some((e) => e.type === "explosion" || e.type === "mine");
    const hold = !moved ? 0 : blast ? BLAST_HOLD[fx] : QUIET_HOLD;
    const timer = setTimeout(() => setShown(true), hold);
    return () => clearTimeout(timer);
  }, [result]); // eslint-disable-line react-hooks/exhaustive-deps

  return !!result && shown;
}
