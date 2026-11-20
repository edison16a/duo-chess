import type { RatingMark } from "@/features/fx";
import { RatingGlyph } from "@/components/ui/RatingGlyph";
import { RATINGS } from "@/features/analysis";
import { opposite, type Color, type Position, type RatingId } from "@/engine";
import { cellStyle } from "./layout";
import { pieceSrc } from "./PieceImage";
import styles from "./board.module.css";
import fx from "./pieceFx.module.css";

interface Props {
  pos: Position;
  orientation: Color;
  viewer: Color | null;
  visible: Set<number> | null;
  blindfold: boolean;
  drag: { square: number; dx: number; dy: number } | null;
  rating: RatingMark | null;
}

/**
 * Pieces are keyed by id and positioned with transforms, so a move is just
 * a CSS transition from the old square to the new one.
 */
export function PieceLayer({ pos, orientation, viewer, visible, blindfold, drag, rating }: Props) {
  return (
    <>
      {pos.board.map((piece, s) => {
        if (!piece) return null;
        const enemy = viewer && piece.color === opposite(viewer);
        if (visible && enemy && !visible.has(s)) return null;
        if (enemy && piece.status?.hidden) return null;
        if (blindfold && piece.kind !== "duck") return null;
        const base = cellStyle(pos, s, orientation);
        const dragging = drag?.square === s;
        const style = dragging
          ? { ...base, transform: `${base.transform} translate(${drag.dx}px, ${drag.dy}px)`, transition: "none", zIndex: 30 }
          : base;
        const rated = rating && rating.square === s ? rating : null;
        const status = piece.status ?? {};
        const classes = [
          styles.piece,
          dragging && styles.dragging,
          status.frozen && fx.frozen,
          status.shielded && fx.shielded,
          status.ghost && fx.ghost,
          status.poisoned && fx.poisoned,
          status.blessed && fx.blessed,
          status.hidden && fx.smoked,
          rated && !rated.quiet && fx.rated,
          rated && !rated.quiet && RATINGS[rated.id].dramatic && fx[`rate_${rated.id}`],
        ].filter(Boolean).join(" ");
        return (
          <div key={piece.id} className={classes} style={{ ...style, ["--rate" as string]: rated ? RATINGS[rated.id].color : undefined }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={pieceSrc(piece.kind, piece.color)} alt={piece.kind} draggable={false} />
            {rated && (
              <span key={rated.key} className={fx.badge} style={{ background: RATINGS[rated.id].color }} title={RATINGS[rated.id].label}>
                <RatingGlyph id={rated.id} />
              </span>
            )}
          </div>
        );
      })}
    </>
  );
}
