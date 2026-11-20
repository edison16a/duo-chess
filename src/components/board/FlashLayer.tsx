"use client";

import { useEffect, useState } from "react";
import type { Color, GameEvent, Position } from "@/engine";
import { eventFlashes, type Flash } from "@/features/fx";
import { cellStyle } from "./layout";
import styles from "./board.module.css";

/**
 * Low detail stand in for the 3D effects: the squares a blast or power
 * touched glow for a moment and fade. Keyed by the event sequence so each
 * batch of events flashes exactly once.
 */
export function FlashLayer({ pos, orientation, events, seq }: { pos: Position; orientation: Color; events: GameEvent[]; seq: number }) {
  const [shown, setShown] = useState<{ seq: number; flashes: Flash[] } | null>(null);

  useEffect(() => {
    const flashes = eventFlashes(events);
    if (!flashes.length) return;
    setShown({ seq, flashes });
    const timer = setTimeout(() => setShown(null), 900);
    return () => clearTimeout(timer);
  }, [seq]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!shown) return null;
  return (
    <>
      {shown.flashes.map((f) => (
        <div
          key={`${shown.seq}:${f.square}`}
          className={`${styles.cell} ${styles.flash}`}
          style={{ ...cellStyle(pos, f.square, orientation), ["--flash" as string]: f.color }}
          data-flash={f.square}
        />
      ))}
    </>
  );
}
