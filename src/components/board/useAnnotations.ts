"use client";

/**
 * Right click annotations: square highlights and arrows. They live only in
 * this browser and are never sent to the opponent.
 */

import { useCallback, useEffect, useRef, useState } from "react";

/** Which color an annotation uses. Modifier keys pick the alternates. */
export type Brush = "main" | "green" | "blue" | "red";

export interface Arrow {
  from: number;
  to: number;
  brush: Brush;
}

export interface Mark {
  square: number;
  brush: Brush;
}

export interface Annotations {
  arrows: Arrow[];
  marks: Mark[];
  /** The arrow being drawn right now, shown live while the button is held. */
  drawing: Arrow | null;
  begin: (square: number, brush: Brush) => void;
  hover: (square: number | null) => void;
  finish: (square: number | null) => void;
  clear: () => void;
}

/** Shift, Ctrl and Alt give green, blue and red, like lichess. */
export function brushFor(e: { shiftKey: boolean; ctrlKey: boolean; altKey: boolean }): Brush {
  if (e.shiftKey) return "green";
  if (e.ctrlKey) return "blue";
  if (e.altKey) return "red";
  return "main";
}

/**
 * Adds an item, removes it when the exact same one is already there, and
 * recolors it when only the brush differs.
 */
function toggle<T extends { brush: Brush }>(list: T[], item: T, same: (a: T) => boolean): T[] {
  const existing = list.find(same);
  if (!existing) return [...list, item];
  const rest = list.filter((a) => a !== existing);
  return existing.brush === item.brush ? rest : [...rest, item];
}

/** `resetKey` changes whenever the shown position changes, which wipes the drawing. */
export function useAnnotations(resetKey: string): Annotations {
  const [arrows, setArrows] = useState<Arrow[]>([]);
  const [marks, setMarks] = useState<Mark[]>([]);
  const [drawing, setDrawingState] = useState<Arrow | null>(null);
  // Mirrors `drawing` so pointer handlers see the latest value without
  // waiting for a render, and so state updaters stay pure.
  const live = useRef<Arrow | null>(null);
  const setDrawing = useCallback((next: Arrow | null) => {
    live.current = next;
    setDrawingState(next);
  }, []);

  useEffect(() => {
    setArrows([]);
    setMarks([]);
    setDrawing(null);
  }, [resetKey, setDrawing]);

  const begin = useCallback((square: number, brush: Brush) => {
    setDrawing({ from: square, to: square, brush });
  }, [setDrawing]);

  const hover = useCallback((square: number | null) => {
    const d = live.current;
    if (d && square !== null && d.to !== square) setDrawing({ ...d, to: square });
  }, [setDrawing]);

  const finish = useCallback((square: number | null) => {
    const d = live.current;
    setDrawing(null);
    if (!d || square === null) return;
    if (square === d.from) {
      const mark = { square, brush: d.brush };
      setMarks((list) => toggle(list, mark, (m) => m.square === square));
    } else {
      const arrow = { ...d, to: square };
      setArrows((list) => toggle(list, arrow, (a) => a.from === arrow.from && a.to === arrow.to));
    }
  }, [setDrawing]);

  const clear = useCallback(() => {
    setArrows((list) => (list.length ? [] : list));
    setMarks((list) => (list.length ? [] : list));
  }, []);

  return { arrows, marks, drawing, begin, hover, finish, clear };
}
