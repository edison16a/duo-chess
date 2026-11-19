/**
 * Executes a single move on a copy of the position: captures, castling,
 * promotion, en passant, explosions, mines, portals and the duck. It does
 * not switch turns; turn.ts owns that so multi move modes stay simple.
 */

import { clonePosition } from "./clone";
import { neighbors, xy } from "./geometry";
import { PIECES } from "./pieces";
import type { Color, GameEvent, Move, Piece, Position } from "./types";

export interface MoveOutcome {
  pos: Position;
  events: GameEvent[];
  captured: Piece | null;
}

/** Remove everything around `center` that an explosion can kill. Pawns, ducks and shields survive. */
function explode(pos: Position, center: number, events: GameEvent[]): void {
  const hit: number[] = [center];
  pos.board[center] = null;
  for (const n of neighbors(pos, center)) {
    const p = pos.board[n];
    if (!p || p.color === "n" || p.status?.shielded) continue;
    if (p.kind === "pawn" && pos.rules.atomic) continue;
    pos.board[n] = null;
    hit.push(n);
  }
  events.push({ type: "explosion", square: center, squares: hit });
}

function pocketKind(piece: Piece) {
  return piece.promoted ? "pawn" : piece.kind;
}

export function makeMove(source: Position, move: Move): MoveOutcome {
  const pos = clonePosition(source);
  const events: GameEvent[] = [];
  const mover = pos.turn;
  let captured: Piece | null = null;
  pos.ep = null;

  if (move.drop) {
    const idx = pos.pockets[mover].indexOf(move.drop);
    if (idx >= 0) pos.pockets[mover].splice(idx, 1);
    const piece: Piece = { id: pos.nextId++, kind: move.drop, color: mover, moved: true };
    pos.board[move.to] = piece;
    pos.halfmove++;
    events.push({ type: "move", from: -1, to: move.to, pieceId: piece.id });
    placeDuck(pos, move);
    return { pos, events, captured };
  }

  const piece = pos.board[move.from]!;
  pos.board[move.from] = null;

  if (move.castle) {
    const rook = pos.board[move.castle.rookFrom]!;
    pos.board[move.castle.rookFrom] = null;
    pos.board[move.castle.rookTo] = { ...rook, moved: true };
    events.push({ type: "castle" });
  }

  const victimSquare = move.epVictim ?? move.to;
  const victim = move.castle ? null : pos.board[victimSquare];
  if (victim) {
    captured = victim;
    pos.board[victimSquare] = null;
    events.push({ type: "capture", square: victimSquare, kind: victim.kind, color: victim.color });
  }

  let moved: Piece = { ...piece, moved: true };
  if (move.promotion) {
    moved = { ...moved, kind: move.promotion, promoted: true };
    events.push({ type: "promote", square: move.to, kind: move.promotion });
  }
  pos.board[move.to] = moved;
  events.push({ type: "move", from: move.from, to: move.to, pieceId: piece.id });

  if (captured) {
    const blows = pos.rules.atomic || PIECES[captured.kind].explodesOnCapture;
    if (blows) explode(pos, move.to, events);
    else if (pos.rules.drops) pos.pockets[mover].push(pocketKind(captured));
  }

  if (pos.board[move.to]?.id === piece.id) triggerSquare(pos, move.to, mover, events);

  if (piece.kind === "pawn" && Math.abs(move.to - move.from) === 2 * pos.width && !move.promotion) {
    pos.ep = { square: (move.from + move.to) / 2, victim: move.to };
  }
  pos.halfmove = piece.kind === "pawn" || captured ? 0 : pos.halfmove + 1;
  placeDuck(pos, move);
  return { pos, events, captured };
}

/** Enemy mines blow up non royal pieces; portals warp whoever lands on them. */
function triggerSquare(pos: Position, square: number, mover: Color, events: GameEvent[]): void {
  const mine = pos.effects.find((e) => e.kind === "mine" && e.square === square && e.owner !== mover);
  if (mine) {
    pos.effects = pos.effects.filter((e) => e !== mine);
    const piece = pos.board[square]!;
    events.push({ type: "mine", square });
    if (!PIECES[piece.kind].royal && !piece.status?.shielded) {
      pos.board[square] = null;
      events.push({ type: "destroy", square, kind: piece.kind, color: piece.color });
      return;
    }
  }
  const portal = pos.effects.find((e) => e.kind === "portal" && e.square === square);
  if (portal && portal.link !== undefined && !pos.board[portal.link]) {
    const piece = pos.board[square]!;
    // Pawns warping onto a promotion rank would skip the promotion, so they stay put.
    const [, ty] = xy(pos, portal.link);
    if (piece.kind === "pawn" && (ty === 0 || ty === pos.height - 1)) return;
    pos.board[portal.link] = piece;
    pos.board[square] = null;
    events.push({ type: "warp", from: square, to: portal.link });
  }
}

function placeDuck(pos: Position, move: Move): void {
  if (move.duckTo === undefined) return;
  const current = pos.board.findIndex((p) => p?.kind === "duck");
  const duck: Piece = current >= 0 ? pos.board[current]! : { id: pos.nextId++, kind: "duck", color: "n", moved: true };
  if (current >= 0) pos.board[current] = null;
  pos.board[move.duckTo] = duck;
}
