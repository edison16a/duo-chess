import type { PieceDef } from "@/engine";
import { PieceImage } from "@/components/board/PieceImage";
import { DIAGRAM_SIZE, movementDiagram } from "./diagram";
import styles from "./library.module.css";

export function PieceCard({ def }: { def: PieceDef }) {
  const marks = def.neutral ? new Map() : movementDiagram(def.kind);
  const n = DIAGRAM_SIZE;
  const center = Math.floor((n * n) / 2);
  return (
    <article className={styles.pieceCard}>
      <div className={styles.pieceHead}>
        <div className={styles.pieceImgs}>
          <PieceImage kind={def.kind} color={def.neutral ? "n" : "w"} />
          {!def.neutral && <PieceImage kind={def.kind} color="b" />}
        </div>
        <div>
          <h3>{def.name}</h3>
          {def.letter && def.letter !== "@" && <span className={styles.letter}>{def.letter}</span>}
        </div>
      </div>
      {!def.neutral && (
        <div className={styles.diagram} style={{ gridTemplateColumns: `repeat(${n}, 1fr)` }}>
          {Array.from({ length: n * n }, (_, i) => {
            const row = Math.floor(i / n), col = i % n;
            const s = (n - 1 - row) * n + col;
            const mark = marks.get(s);
            return (
              <span key={i} className={`${(row + col) % 2 ? styles.dDark : styles.dLight} ${mark ? styles[`m_${mark}`] : ""}`}>
                {s === center && <PieceImage kind={def.kind} color="w" />}
              </span>
            );
          })}
        </div>
      )}
      <p>{def.blurb}</p>
    </article>
  );
}
