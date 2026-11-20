"use client";

import { useState } from "react";
import { FILES } from "@/engine";
import type { ChessMap } from "@/features/maps";
import { pieceSrc } from "@/components/board/PieceImage";
import styles from "./editor.module.css";

/** Click or drag to paint, right click to erase. White is always at the bottom here. */
export function EditorBoard({ map, onPaint }: { map: ChessMap; onPaint: (square: number, erase: boolean) => void }) {
  const [painting, setPainting] = useState<null | boolean>(null);
  const holes = new Set(map.holes ?? []);
  const bySquare = new Map(map.pieces.map((p) => [p.square, p]));
  const rows = Array.from({ length: map.height }, (_, i) => map.height - 1 - i);

  return (
    <div
      className={styles.board}
      style={{ gridTemplateColumns: `repeat(${map.width}, 1fr)`, aspectRatio: `${map.width} / ${map.height}` }}
      onPointerUp={() => setPainting(null)}
      onPointerLeave={() => setPainting(null)}
      onContextMenu={(e) => e.preventDefault()}
      data-testid="editor-board"
    >
      {rows.flatMap((y) =>
        Array.from({ length: map.width }, (_, x) => {
          const s = y * map.width + x;
          const p = bySquare.get(s);
          const light = (x + y) % 2 === 1;
          return (
            <button
              key={s}
              type="button"
              className={`${styles.cell} ${holes.has(s) ? styles.hole : light ? styles.light : styles.dark}`}
              onPointerDown={(e) => { const erase = e.button === 2; setPainting(erase); onPaint(s, erase); }}
              onPointerEnter={() => painting !== null && onPaint(s, painting)}
              aria-label={`${FILES[x]}${y + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {p && <img src={pieceSrc(p.kind, p.color)} alt="" draggable={false} />}
            </button>
          );
        }),
      )}
    </div>
  );
}
