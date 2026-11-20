import type { Color, PieceKind } from "@/engine";
import { PieceImage } from "@/components/board/PieceImage";
import styles from "./game.module.css";

interface Props {
  pocket: PieceKind[];
  color: Color;
  selected: PieceKind | null;
  enabled: boolean;
  onSelect: (kind: PieceKind | null) => void;
}

/** Crazyhouse pocket. Click a piece, then click an empty square to drop it. */
export function PocketBar({ pocket, color, selected, enabled, onSelect }: Props) {
  const counts = pocket.reduce<Partial<Record<PieceKind, number>>>((acc, k) => ({ ...acc, [k]: (acc[k] ?? 0) + 1 }), {});
  const kinds = Object.keys(counts) as PieceKind[];
  if (!kinds.length) return <div className={styles.pocket}><span className={styles.pocketEmpty}>Pocket empty</span></div>;
  return (
    <div className={styles.pocket}>
      {kinds.map((k) => (
        <button
          key={k}
          type="button"
          disabled={!enabled}
          className={`${styles.pocketPiece} ${selected === k ? styles.pocketSelected : ""}`}
          onClick={() => onSelect(selected === k ? null : k)}
        >
          <PieceImage kind={k} color={color} />
          {counts[k]! > 1 && <span>{counts[k]}</span>}
        </button>
      ))}
    </div>
  );
}
