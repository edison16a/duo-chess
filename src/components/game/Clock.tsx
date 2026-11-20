"use client";

import { useEffect, useState } from "react";
import type { Color } from "@/engine";
import { sfx } from "@/features/audio/sounds";
import { formatClock, remaining } from "@/features/room/clock";
import type { ClockState } from "@/features/room/types";
import styles from "./game.module.css";

interface Props {
  clock: ClockState;
  color: Color;
  turn: Color;
  running: boolean;
  hostOffset: number;
  mine: boolean;
}

/** Counts down locally between snapshots using the host clock offset. */
export function Clock({ clock, color, turn, running, hostOffset, mine }: Props) {
  const [now, setNow] = useState(() => Date.now());
  const active = running && turn === color && clock.runningSince !== null;

  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(id);
  }, [active]);

  const ms = remaining(clock, color, active ? turn : color === "w" ? "b" : "w", now - hostOffset);
  const low = ms < 10_000;

  // A soft tick each second under ten seconds, only for your own clock.
  const second = Math.ceil(ms / 1000);
  useEffect(() => {
    if (active && mine && low && second > 0) sfx.lowTime();
  }, [second, active, mine, low]);

  return (
    <div className={`${styles.clock} ${active ? styles.clockActive : ""} ${low && active ? styles.clockLow : ""}`} data-testid={`clock-${color}`}>
      {formatClock(ms)}
    </div>
  );
}
