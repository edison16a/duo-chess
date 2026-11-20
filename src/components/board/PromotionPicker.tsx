import type { Color, Move } from "@/engine";
import { PieceImage } from "./PieceImage";
import styles from "./board.module.css";

/** Small sheet over the board for choosing what a pawn becomes. */
export function PromotionPicker({ moves, color, onPick }: { moves: Move[]; color: Color; onPick: (move: Move | null) => void }) {
  return (
    <div className={styles.promoBackdrop} onPointerDown={(e) => { e.stopPropagation(); onPick(null); }}>
      <div className={styles.promo} onPointerDown={(e) => e.stopPropagation()}>
        {moves.map((m) => (
          <button key={m.promotion} type="button" onClick={() => onPick(m)} aria-label={`Promote to ${m.promotion}`}>
            <PieceImage kind={m.promotion!} color={color} />
          </button>
        ))}
      </div>
    </div>
  );
}
