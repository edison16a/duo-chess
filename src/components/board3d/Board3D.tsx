"use client";

import { useEffect, useRef, useState } from "react";
import { positionKey } from "@/engine";
import type { BoardProps } from "@/components/board/Board";
import { PromotionPicker } from "@/components/board/PromotionPicker";
import { useAnnotations } from "@/components/board/useAnnotations";
import { useInteraction } from "@/components/board/useInteraction";
import { Icon } from "@/components/ui/icons";
import { BoardScene } from "@/three/board3d/BoardScene";
import { useBoard3DPointer } from "./useBoard3DPointer";
import { useBoard3DSync } from "./useBoard3DSync";
import styles from "./board3d.module.css";

/** The fully 3D board. Same props and rules as the 2D board, different renderer. */
export default function Board3D(props: BoardProps) {
  const { pos, legal, onMove, targeting, dropKind, orientation } = props;
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const scene = useRef<BoardScene | null>(null);
  const [ready, setReady] = useState(false);

  const premove = props.premove && !targeting && !dropKind ? props.premove : null;
  const ui = useInteraction({ pos, legal: premove ? premove.moves : legal, onMove: premove ? premove.onQueue : onMove, targeting, dropKind, autoQueen: !!premove });
  const notes = useAnnotations(positionKey(pos));
  const pointer = useBoard3DPointer({ scene, canvas, ui, notes, premove, orientation });
  useBoard3DSync(scene, ready, props, ui, notes, premove?.queued ?? null);

  useEffect(() => {
    const instance = new BoardScene(canvas.current!);
    scene.current = instance;
    // Handle for end to end tests, which cannot see where 3D squares land on screen.
    (canvas.current as HTMLCanvasElement & { __scene?: BoardScene }).__scene = instance;
    instance.rig.setOrientation(orientation, true);
    const fit = () => instance.resize(wrap.current!.clientWidth, wrap.current!.clientHeight);
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(wrap.current!);
    setReady(true);
    return () => {
      observer.disconnect();
      instance.dispose();
      scene.current = null;
      setReady(false);
    };
    // The scene is created once; orientation changes are animated by the sync hook.
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div ref={wrap} className={styles.wrap} data-testid="board3d">
      <canvas
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
