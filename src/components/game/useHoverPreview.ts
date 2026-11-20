"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** How long you rest on a card before the 3D preview opens. */
export const HOVER_DELAY = 3000;

/**
 * Opens a preview after the pointer rests on an element for HOVER_DELAY.
 * `progress` is true while the timer runs so the card can show it charging.
 */
export function useHoverPreview() {
  const ref = useRef<HTMLButtonElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [progress, setProgress] = useState(false);
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);

  const stop = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setProgress(false);
  };

  const enter = useCallback((e: React.PointerEvent) => {
    if (e.pointerType === "touch") return;
    stop();
    setProgress(true);
    timer.current = setTimeout(() => {
      setProgress(false);
      setRect(ref.current?.getBoundingClientRect() ?? null);
      setOpen(true);
    }, HOVER_DELAY);
  }, []);

  const leave = useCallback(() => {
    stop();
    setOpen(false);
  }, []);

  useEffect(() => stop, []);

  return { ref, enter, leave, progress, open, rect, close: leave };
}
