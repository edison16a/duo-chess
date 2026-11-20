"use client";

import { useEffect, useState } from "react";
import styles from "./game.module.css";

/**
 * Countdown for the per move timer. Without it a player has no idea a
 * random move is about to be played for them, so it sits on the strip of
 * whoever is to move and turns red near the end.
 */
export function MoveTimer({ deadline, hostOffset }: { deadline: number; hostOffset: number }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(id);
  }, []);
  // The deadline is host time; the offset turns our clock into the host's.
  const left = Math.max(0, deadline - (now - hostOffset));
  const urgent = left < 3000;
  return (
    <span className={`${styles.moveTimer} ${urgent ? styles.moveTimerLow : ""}`} data-testid="move-timer" title="Time left for this move">
      {(left / 1000).toFixed(left < 10000 ? 1 : 0)}s
    </span>
  );
}
