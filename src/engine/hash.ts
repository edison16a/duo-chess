import type { Position } from "./types";

/**
 * Short fingerprint of a position for threefold repetition. FNV-1a over the
 * parts that matter (pieces, side to move, ep, pockets), base36 encoded so
 * the repetition table stays small when the game is sent over the network.
 */
export function positionKey(pos: Position): string {
  let h = 0x811c9dc5;
  const feed = (s: string) => {
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
  };
  for (let i = 0; i < pos.board.length; i++) {
    const p = pos.board[i];
    feed(p ? `${p.kind[0]}${p.kind.length}${p.color}${p.moved ? 1 : 0}` : ".");
  }
  feed(`${pos.turn}${pos.movesLeft}${pos.ep?.square ?? "-"}${pos.pockets.w.join()}|${pos.pockets.b.join()}`);
  feed(pos.effects.map((e) => `${e.kind}${e.square}`).join());
  return (h >>> 0).toString(36);
}
