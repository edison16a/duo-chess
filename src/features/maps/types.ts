import type { LayoutPiece, Rules } from "@/engine";

/** A board people can pick in the Custom Map mode. Same shape for premade and user made maps. */
export interface ChessMap {
  id: string;
  name: string;
  blurb?: string;
  width: number;
  height: number;
  pieces: LayoutPiece[];
  holes?: number[];
  /** Rule tweaks the map needs, e.g. Horde has no castling for the pawn side. */
  rules?: Partial<Rules>;
  /** True for maps made in the editor. */
  custom?: boolean;
}
