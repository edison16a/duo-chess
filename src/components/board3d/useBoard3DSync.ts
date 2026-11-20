"use client";

/**
 * Pushes React state into the imperative BoardScene: position, highlights,
 * arrows, events and the rating badge. Each kind of update runs only when
 * its own inputs change.
 */

import { useEffect, useMemo, type RefObject } from "react";
import { opposite, type Color, type Move, type Position } from "@/engine";
import { RATINGS } from "@/features/analysis";
import { playEventSounds } from "@/features/audio/eventSounds";
import type { Annotations } from "@/components/board/useAnnotations";
import type { Interaction } from "@/components/board/useInteraction";
import { fogVisible } from "@/components/board/visibility";
import type { BoardProps } from "@/components/board/Board";
import type { BoardScene } from "@/three/board3d/BoardScene";
import type { Highlight } from "@/three/board3d/highlights";
import { RATING_HEX } from "@/three/fx";

const BRUSH: Record<string, string> = { main: "#ff9f1a", green: "#3fae5a", blue: "#3f7fe0", red: "#e0453f" };

/** Pieces the viewer must not see: fog, smoke screens and blindfold. */
function hiddenIds(pos: Position, viewer: Color | null, fog: boolean, blindfold: boolean): { ids: Set<number>; visible: Set<number> | null } {
  const visible = fog && viewer ? fogVisible(pos, viewer) : null;
  const ids = new Set<number>();
  pos.board.forEach((p, s) => {
    if (!p) return;
    const enemy = viewer && p.color === opposite(viewer);
    if ((visible && enemy && !visible.has(s)) || (enemy && p.status?.hidden) || (blindfold && p.kind !== "duck")) ids.add(p.id);
  });
  return { ids, visible };
}

export function useBoard3DSync(scene: RefObject<BoardScene | null>, ready: boolean, props: BoardProps, ui: Interaction, notes: Annotations, queued: Move | null) {
  const { pos, viewer, fog, blindfold, theme, orientation } = props;
  const hidden = useMemo(() => hiddenIds(pos, viewer, fog, blindfold), [pos, viewer, fog, blindfold]);

  useEffect(() => {
    if (!ready) return;
    scene.current!.setBoard(pos, { light: theme.light, dark: theme.dark });
    scene.current!.setPosition(pos, hidden.ids, viewer);
  }, [ready, scene, pos, theme, hidden, viewer]);

  useEffect(() => {
    if (ready) scene.current!.rig.setOrientation(orientation);
  }, [ready, scene, orientation]);

  useEffect(() => {
    if (!ready) return;
    const list: Highlight[] = [];
    const tint = (square: number, color: string, opacity = 0.45) => square >= 0 && list.push({ square, kind: "tint", color, opacity });
    if (props.lastMove) { tint(props.lastMove.from, "#ffd64f"); tint(props.lastMove.to, "#ffd64f"); }
    if (queued) { tint(queued.from, "#e0453f", 0.5); tint(queued.to, "#e0453f", 0.5); }
    if (ui.selected !== null) tint(ui.selected, "#46c37b", 0.6);
    props.checkSquares.forEach((s) => tint(s, "#ff3b3b", 0.65));
    notes.marks.forEach((m) => tint(m.square, BRUSH[m.brush], 0.55));
    for (const s of ui.targets.keys()) list.push({ square: s, kind: pos.board[s] ? "ring" : "dot", color: "#10251a", opacity: 0.5 });
    for (const s of ui.duckSquares) list.push({ square: s, kind: "dot", color: "#f5c542", opacity: 0.85 });
    if (props.targeting) {
      pos.board.forEach((_, s) => {
        if (!pos.holes.includes(s) && props.targeting!.valid(s)) list.push({ square: s, kind: "aim", color: props.targeting!.color.startsWith("var") ? "#b57bff" : props.targeting!.color, opacity: 0.9 });
      });
    }
    if (hidden.visible) pos.board.forEach((_, s) => !hidden.visible!.has(s) && list.push({ square: s, kind: "fog", color: "#3a3d44", opacity: 0.9 }));
    scene.current!.setHighlights(list);
  }, [ready, scene, pos, props.lastMove, props.checkSquares, props.targeting, queued, ui.selected, ui.targets, ui.duckSquares, notes.marks, hidden]);

  useEffect(() => {
    if (ready) scene.current!.setArrows(notes.drawing ? [...notes.arrows, notes.drawing] : notes.arrows);
  }, [ready, scene, notes.arrows, notes.drawing]);

  useEffect(() => {
    if (!ready || !props.events.length) return;
    scene.current!.lite = props.fx === "low";
    scene.current!.playEvents(props.events, !!props.finale);
    playEventSounds(props.events);
    // Only a new event sequence should replay effects.
  }, [ready, scene, props.eventSeq]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!ready) return;
    const r = props.rating;
    scene.current!.lite = props.fx === "low";
    scene.current!.setRating(r ? { ...r, glyph: RATINGS[r.id].glyph, color: RATING_HEX[r.id] } : null);
  }, [ready, scene, props.rating?.key]); // eslint-disable-line react-hooks/exhaustive-deps
}
