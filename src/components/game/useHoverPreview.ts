"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** How long you rest on a card before the 3D preview opens. */
export const HOVER_DELAY = 500;

/** Opens a preview after the pointer rests on an element for HOVER_DELAY. */
export function useHoverPreview() {
  const ref = useRef<HTMLButtonElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);

  const stop = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };

  const enter = useCallback((e: React.PointerEvent) => {
    if (e.pointerType === "touch") return;
    stop();
    timer.current = setTimeout(() => {
      setRect(ref.current?.getBoundingClientRect() ?? null);
      setOpen(true);
    }, HOVER_DELAY);
  }, []);

  const leave = useCallback(() => {
    stop();
    setOpen(false);
  }, []);

  useEffect(() => stop, []);

  return { ref, enter, leave, open, rect, close: leave };
}
