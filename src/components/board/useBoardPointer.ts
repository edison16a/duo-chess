"use client";

/**
 * Pointer handling for the board. The left button selects, drags and drops
 * pieces. The right button draws annotations and cancels premoves.
 */

import { useState, type PointerEvent as ReactPointerEvent, type RefObject } from "react";
import type { Color, Position } from "@/engine";
import { squareAt } from "./layout";
import { brushFor, type Annotations } from "./useAnnotations";
import type { Interaction } from "./useInteraction";
import type { PremoveControl } from "./usePremove";

export interface Drag {
  square: number;
  startX: number;
  startY: number;
  dx: number;
  dy: number;
  moved: boolean;
}

interface Options {
  ref: RefObject<HTMLDivElement | null>;
  pos: Position;
  orientation: Color;
  ui: Interaction;
  notes: Annotations;
  premove: PremoveControl | null;
}

type Handler = (e: ReactPointerEvent<HTMLDivElement>) => void;

export function useBoardPointer({ ref, pos, orientation, ui, notes, premove }: Options) {
  const [drag, setDrag] = useState<Drag | null>(null);

  const squareFromPointer = (e: { clientX: number; clientY: number }): number | null => {
    const rect = ref.current!.getBoundingClientRect();
    const col = Math.floor(((e.clientX - rect.left) / rect.width) * pos.width);
    const row = Math.floor(((e.clientY - rect.top) / rect.height) * pos.height);
    return squareAt(pos, col, row, orientation);
  };

  const onRightDown: Handler = (e) => {
    // A right click while dragging drops the piece back, like chess.com.
    setDrag(null);
    if (premove?.queue.length) premove.onCancel();
    const square = squareFromPointer(e);
    if (square === null) return;
    ref.current?.setPointerCapture(e.pointerId);
    notes.begin(square, brushFor(e));
  };

  const onPointerDown: Handler = (e) => {
    if (e.button === 2) return onRightDown(e);
    if (e.button !== 0) return;
    notes.clear();
    const square = squareFromPointer(e);
    if (square === null) return;
    // Clicking an empty square that is not a premove target cancels the queued premoves.
    if (premove?.queue.length && !pos.board[square] && !ui.targets.has(square)) premove.onCancel();
    if (ui.pressSquare(square)) {
      ref.current?.setPointerCapture(e.pointerId);
      setDrag({ square, startX: e.clientX, startY: e.clientY, dx: 0, dy: 0, moved: false });
    }
  };

  const onPointerMove: Handler = (e) => {
    if (notes.drawing) notes.hover(squareFromPointer(e));
    if (!drag) return;
    const dx = e.clientX - drag.startX, dy = e.clientY - drag.startY;
    setDrag({ ...drag, dx, dy, moved: drag.moved || Math.hypot(dx, dy) > 5 });
  };

  const onPointerUp: Handler = (e) => {
    if (e.button === 2) return notes.finish(squareFromPointer(e));
    if (!drag) return;
    ui.releaseSquare(squareFromPointer(e), drag.moved);
    setDrag(null);
  };

  const onPointerCancel = () => {
    setDrag(null);
    notes.finish(null);
  };

  return { drag, onPointerDown, onPointerMove, onPointerUp, onPointerCancel };
}
