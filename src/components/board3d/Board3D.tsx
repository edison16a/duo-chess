"use client";

import { useEffect, useRef, useState } from "react";
import { positionKey } from "@/engine";
import type { BoardProps } from "@/components/board/Board";
import type { Move } from "@/engine";
import { PromotionPicker } from "@/components/board/PromotionPicker";
import { useAnnotations } from "@/components/board/useAnnotations";
import { useInteraction } from "@/components/board/useInteraction";
import { Icon } from "@/components/ui/icons";
import { BoardScene } from "@/three/board3d/BoardScene";
import { useBoard3DPointer } from "./useBoard3DPointer";
import { useBoard3DSync } from "./useBoard3DSync";
import styles from "./board3d.module.css";

/** The fully 3D board. Same props and rules as the 2D board, different renderer. */
const NO_PREMOVES: Move[] = [];

export default function Board3D(props: BoardProps) {
  const { pos, legal, onMove, targeting, dropKind, orientation } = props;
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const scene = useRef<BoardScene | null>(null);
  const [ready, setReady] = useState(false);
  // Bumped when the browser takes our WebGL context away, which swaps in a fresh canvas and scene.
  const [generation, setGeneration] = useState(0);

  const premove = props.premove && !targeting && !dropKind ? props.premove : null;
  const ui = useInteraction({ pos, legal: premove ? premove.moves : legal, onMove: premove ? premove.onQueue : onMove, targeting, dropKind, autoQueen: !!premove });
  const notes = useAnnotations(positionKey(pos));
  const pointer = useBoard3DPointer({ scene, canvas, ui, notes, premove, orientation });
  useBoard3DSync(scene, ready, props, ui, notes, premove?.queue ?? NO_PREMOVES);

  useEffect(() => {
    const el = canvas.current!;
    // React may mount twice on the same canvas (Strict Mode); a released context means we need a new canvas.
    if (el.dataset.released) {
      setGeneration((g) => g + 1);
      return;
    }
    const lost = () => setTimeout(() => setGeneration((g) => g + 1), 100);
    el.addEventListener("webglcontextlost", lost);
    const instance = new BoardScene(el);
    scene.current = instance;
    // Handle for end to end tests, which cannot see where 3D squares land on screen.
    (canvas.current as HTMLCanvasElement & { __scene?: BoardScene }).__scene = instance;
    instance.rig.setOrientation(orientation, true);
    // The observer can fire once more after unmount, when the wrapper is already gone.
    const fit = () => wrap.current && instance.resize(wrap.current.clientWidth, wrap.current.clientHeight);
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(wrap.current!);
    setReady(true);
    return () => {
      // Off first: disposing releases the context on purpose, which must not count as a loss.
      el.removeEventListener("webglcontextlost", lost);
      observer.disconnect();
      instance.dispose();
      scene.current = null;
      setReady(false);
    };
    // The scene is created once per canvas; orientation changes are animated by the sync hook.
  }, [generation]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div ref={wrap} className={styles.wrap} data-testid="board3d">
      <canvas
        key={generation}
        ref={canvas}
        className={styles.canvas}
        onPointerDown={pointer.onPointerDown}
        onPointerMove={pointer.onPointerMove}
        onPointerUp={pointer.onPointerUp}
        onPointerCancel={pointer.onPointerCancel}
        onDoubleClick={pointer.onDoubleClick}
        onContextMenu={(e) => e.preventDefault()}
      />
      <button type="button" className={styles.reset} onClick={() => scene.current?.rig.reset(orientation)} aria-label="Reset camera" title="Reset camera">
        <Icon name="rematch" size={16} />
      </button>
      {ui.promotion && <PromotionPicker moves={ui.promotion.moves} color={pos.turn} onPick={ui.choosePromotion} />}
    </div>
  );
}
