import type { Position } from "./types";

/**
 * Copy a position deeply enough that the move code can mutate the copy.
 * Pieces are treated as immutable and replaced rather than edited, so the
 * board array itself only needs a shallow copy.
 */
export function clonePosition(pos: Position): Position {
  return {
    ...pos,
    board: pos.board.slice(),
    effects: pos.effects.slice(),
    pockets: { w: pos.pockets.w.slice(), b: pos.pockets.b.slice() },
    checks: { ...pos.checks },
    skip: { ...pos.skip },
    bonus: { w: { ...pos.bonus.w }, b: { ...pos.bonus.b } },
  };
}
