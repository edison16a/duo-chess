"use client";

/**
 * Pointer input for the 3D board. A left press on a piece you can move
 * picks it up; a left press anywhere else (or the middle button) orbits the
 * camera. The right button draws arrows and highlights, and the wheel zooms.
 */

import { useEffect, useRef, type PointerEvent as ReactPointerEvent, type RefObject } from "react";
import type { Color } from "@/engine";
import { brushFor, type Annotations } from "@/components/board/useAnnotations";
import type { Interaction } from "@/components/board/useInteraction";
import type { PremoveControl } from "@/components/board/usePremove";
import type { BoardScene } from "@/three/board3d/BoardScene";

type Mode = { kind: "piece"; square: number; id: number | null; x: number; y: number; moved: boolean } | { kind: "orbit"; x: number; y: number } | { kind: "arrow" } | null;

interface Options {
  scene: RefObject<BoardScene | null>;
  canvas: RefObject<HTMLCanvasElement | null>;
  ui: Interaction;
  notes: Annotations;
  premove: PremoveControl | null;
  orientation: Color;
}

export function useBoard3DPointer({ scene, canvas, ui, notes, premove, orientation }: Options) {
  const mode = useRef<Mode>(null);

  // Wheel zoom needs a non passive listener so the page does not scroll.
  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      scene.current?.rig.zoom(e.deltaY);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [canvas, scene]);

  const pick = (e: { clientX: number; clientY: number }) => scene.current?.pickSquare(e.clientX, e.clientY) ?? { square: null, point: null };

  const onPointerDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    canvas.current?.setPointerCapture(e.pointerId);
    const { square } = pick(e);
    if (e.button === 2) {
      if (premove?.queued) premove.onCancel();
      if (square !== null) { notes.begin(square, brushFor(e)); mode.current = { kind: "arrow" }; }
      return;
    }
    if (e.button === 1) { mode.current = { kind: "orbit", x: e.clientX, y: e.clientY }; return; }
    if (e.button !== 0) return;
    notes.clear();
    if (square !== null && ui.pressSquare(square)) {
      mode.current = { kind: "piece", square, id: scene.current?.pieces.idAt(square) ?? null, x: e.clientX, y: e.clientY, moved: false };
    } else {
      mode.current = { kind: "orbit", x: e.clientX, y: e.clientY };
    }
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const m = mode.current;
    if (!m) return;
    if (m.kind === "orbit") {
      scene.current?.rig.rotate(e.clientX - m.x, e.clientY - m.y);
      mode.current = { ...m, x: e.clientX, y: e.clientY };
    } else if (m.kind === "piece") {
      const moved = m.moved || Math.hypot(e.clientX - m.x, e.clientY - m.y) > 5;
      mode.current = { ...m, moved };
      if (moved && m.id !== null) scene.current?.pieces.drag(m.id, pick(e).point);
    } else if (m.kind === "arrow") {
      notes.hover(pick(e).square);
    }
  };

  const onPointerUp = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const m = mode.current;
    mode.current = null;
    if (!m) return;
    if (m.kind === "piece") {
      scene.current?.pieces.drag(null, null);
      ui.releaseSquare(pick(e).square, m.moved);
    } else if (m.kind === "arrow") {
      notes.finish(pick(e).square);
    }
  };

  const onDoubleClick = () => scene.current?.rig.reset(orientation);

  const onPointerCancel = () => {
    if (mode.current?.kind === "piece") scene.current?.pieces.drag(null, null);
    mode.current = null;
  };

  return { onPointerDown, onPointerMove, onPointerUp, onPointerCancel, onDoubleClick };
}
