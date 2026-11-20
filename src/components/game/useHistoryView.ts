"use client";

/**
 * Browsing earlier positions of the current game. Powers can be random, so
 * history cannot be replayed. Instead every game state that arrives leaves
 * a snapshot behind, keyed by how many history entries it had. A snapshot
 * that never arrived (say after a refresh mid game) just cannot be opened.
 */

import { useCallback, useEffect, useState } from "react";
import type { GameState, Position } from "@/engine";

export interface Snapshot {
  pos: Position;
  lastMove: GameState["lastMove"];
}

/** Where the viewer is: `at` is the history length shown, `live` the length when browsing began. */
interface Browse {
  at: number;
  live: number;
}

export interface HistoryView {
  /** The snapshot on screen when looking at the past, null when live. */
  past: (Snapshot & { at: number }) | null;
  /** History length currently shown. Equals the full length when live. */
  current: number;
  /** True when moves were played since browsing began, so the live pill can stand out. */
  behind: boolean;
  canOpen: (length: number) => boolean;
  open: (length: number) => void;
  live: () => void;
}

/** Keys that the browser should keep for itself, such as typing in a field. */
function typing(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && !!target.closest("input, textarea, select, [contenteditable='true']");
}

export function useHistoryView(game: GameState): HistoryView {
  const [snaps, setSnaps] = useState<Map<number, Snapshot>>(() => new Map());
  const [browse, setBrowse] = useState<Browse | null>(null);
  const length = game.history.length;

  // Game states are replaced, never mutated, so keeping the reference is a
  // safe copy. A shorter history than we already hold means a new game.
  useEffect(() => {
    const snap = { pos: game.pos, lastMove: game.lastMove };
    setSnaps((prev) => {
      const fresh = length === 0 || [...prev.keys()].some((k) => k > length);
      return new Map(fresh ? [] : prev).set(length, snap);
    });
  }, [game.pos, game.lastMove, length]);

  // Leave the past behind when a new game starts.
  useEffect(() => {
    setBrowse((b) => (b && b.at > length ? null : b));
  }, [length]);

  const canOpen = useCallback((n: number) => n === length || (n >= 0 && n < length && snaps.has(n)), [length, snaps]);

  const open = useCallback((n: number) => {
    if (n >= length) return setBrowse(null);
    if (!snaps.has(n)) return;
    setBrowse((b) => ({ at: n, live: b?.live ?? length }));
  }, [length, snaps]);

  /** Steps one entry at a time, skipping snapshots we never received. */
  const step = useCallback((dir: 1 | -1) => {
    for (let n = (browse?.at ?? length) + dir; n >= 0 && n <= length; n += dir) {
      if (canOpen(n)) return open(n);
    }
  }, [browse, length, canOpen, open]);

  const first = useCallback(() => {
    for (let n = 0; n < length; n++) if (snaps.has(n)) return open(n);
  }, [length, snaps, open]);

  const live = useCallback(() => setBrowse(null), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || typing(e.target)) return;
      const actions: Record<string, () => void> = {
        ArrowLeft: () => step(-1),
        ArrowRight: () => step(1),
        ArrowUp: first,
        Home: first,
        ArrowDown: live,
        End: live,
      };
      const action = actions[e.key];
      if (!action) return;
      e.preventDefault();
      action();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step, first, live]);

  const snap = browse ? snaps.get(browse.at) : undefined;
  const past = browse && snap ? { ...snap, at: browse.at } : null;
  return {
    past,
    current: past ? past.at : length,
    behind: !!browse && length > browse.live,
    canOpen,
    open,
    live,
  };
}
