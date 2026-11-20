import type { PieceKind, Side } from "@/engine";

export function pieceSrc(kind: PieceKind, color: Side): string {
  return kind === "duck" ? "/pieces/duck.svg" : `/pieces/${color}-${kind}.svg`;
}

/** Plain image of a piece. Used on the board, in pockets, the editor and the library. */
export function PieceImage({ kind, color, size, className }: { kind: PieceKind; color: Side; size?: number; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={pieceSrc(kind, color)} alt={`${color === "w" ? "White" : color === "b" ? "Black" : ""} ${kind}`} width={size} height={size} className={className} draggable={false} />
  );
}
