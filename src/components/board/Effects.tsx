"use client";

/**
 * Sound and screen shake for each new action. The visuals themselves are
 * 3D now and live in FxCanvas (2D board) or BoardScene (3D board).
 */

import { useEffect, useRef } from "react";
import type { GameEvent } from "@/engine";
import { playEventSounds } from "@/features/audio/eventSounds";

export function Effects({ events, seq, onShake }: { events: GameEvent[]; seq: number; onShake: () => void }) {
  const seen = useRef(seq);
  useEffect(() => {
    if (seq === seen.current) return;
    seen.current = seq;
    playEventSounds(events);
    if (events.some((e) => e.type === "explosion" || e.type === "mine")) onShake();
  }, [seq, events, onShake]);
  return null;
}
