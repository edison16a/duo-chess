/** Drawn layers for right click annotations and queued premoves. */

import type { Color, Move, Position } from "@/engine";
import { arrowPolygon } from "./arrows";
import { cellStyle } from "./layout";
import type { Arrow, Mark } from "./useAnnotations";
import styles from "./annotations.module.css";

type Size = Pick<Position, "width" | "height">;

/** Square highlights. These sit under the pieces, like move highlights. */
export function MarkLayer({ pos, orientation, marks }: { pos: Size; orientation: Color; marks: Mark[] }) {
  return (
    <>
      {marks.map((m) => (
        <div key={`m${m.square}`} data-mark={m.square} className={`${styles.mark} ${styles[`mark_${m.brush}`]}`} style={cellStyle(pos, m.square, orientation)} />
      ))}
    </>
  );
}

/** Tints the from and to squares of every queued premove. Squares shared by a chain are tinted once. */
export function PremoveLayer({ pos, orientation, moves }: { pos: Size; orientation: Color; moves: Move[] }) {
  if (!moves.length) return null;
  const cells = new Map<number, "from" | "to">();
  for (const m of moves) {
    if (!cells.has(m.from)) cells.set(m.from, "from");
    cells.set(m.to, "to");
  }
  return (
    <>
      {[...cells].map(([square, role]) => (
        <div key={square} data-premove={role} className={styles.premove} style={cellStyle(pos, square, orientation)} />
      ))}
    </>
  );
}

/**
 * Arrows over the pieces. One SVG unit is one square, so the shapes follow
 * any board size and orientation without measuring the DOM.
 */
export function ArrowLayer({ pos, orientation, arrows, drawing }: { pos: Size; orientation: Color; arrows: Arrow[]; drawing: Arrow | null }) {
  const preview = drawing && drawing.from !== drawing.to ? drawing : null;
  const shown = preview ? [...arrows.filter((a) => a.from !== preview.from || a.to !== preview.to), preview] : arrows;
  if (!shown.length) return null;
  return (
    <svg className={styles.arrows} viewBox={`0 0 ${pos.width} ${pos.height}`} aria-hidden="true">
      {shown.map((a) => (
        <polygon
          key={`${a.from}-${a.to}`}
          data-arrow={`${a.from}-${a.to}`}
          className={styles[`arrow_${a.brush}`]}
          points={arrowPolygon(pos, a.from, a.to, orientation)}
        />
      ))}
    </svg>
  );
}
