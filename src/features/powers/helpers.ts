/** Small board manipulation helpers shared by the power catalog. */

import { PIECES, neighbors, xy, type Color, type EffectKind, type Piece, type PieceKind, type PieceStatus, type Position } from "@/engine";
import type { PowerCtx } from "./types";

export function pieceAt(pos: Position, square: number): Piece | null {
  return pos.board[square] ?? null;
}

export function isRoyal(piece: Piece | null): boolean {
  return !!piece && !!PIECES[piece.kind].royal;
}

export function isEmpty(pos: Position, square: number): boolean {
  return !pos.board[square] && !pos.holes.includes(square) && !pos.effects.some((e) => e.kind === "wall" && e.square === square);
}

export function homeRank(pos: Position, color: Color): number {
  return color === "w" ? 0 : pos.height - 1;
}

export function lastRank(pos: Position, color: Color): number {
  return color === "w" ? pos.height - 1 : 0;
}

export function inOwnHalf(pos: Position, color: Color, square: number): boolean {
  const [, y] = xy(pos, square);
  return color === "w" ? y < pos.height / 2 : y >= pos.height / 2;
}

/** Pawns may never be placed on either end rank by a power. */
export function pawnSafe(pos: Position, kind: PieceKind, square: number): boolean {
  if (kind !== "pawn") return true;
  const [, y] = xy(pos, square);
  return y !== 0 && y !== pos.height - 1;
}

export function patchStatus(pos: Position, square: number, patch: Partial<PieceStatus>): void {
  const p = pos.board[square];
  if (!p) return;
  pos.board[square] = { ...p, status: { ...p.status, ...patch } };
}

export function setKind(pos: Position, square: number, kind: PieceKind, color?: Color): void {
  const p = pos.board[square];
  if (!p) return;
  pos.board[square] = { ...p, kind, color: color ?? p.color, promoted: false, moved: true };
}

export function destroy(ctx: PowerCtx, square: number): void {
  const p = ctx.pos.board[square];
  if (!p) return;
  ctx.pos.board[square] = null;
  ctx.events.push({ type: "destroy", square, kind: p.kind, color: p.color });
}

export function spawn(ctx: PowerCtx, square: number, kind: PieceKind, color: Color = ctx.color): void {
  ctx.pos.board[square] = { id: ctx.pos.nextId++, kind, color, moved: true };
}

export function relocate(ctx: PowerCtx, from: number, to: number): void {
  const p = ctx.pos.board[from];
  if (!p) return;
  ctx.pos.board[from] = null;
  ctx.pos.board[to] = { ...p, moved: true };
  ctx.events.push({ type: "warp", from, to });
}

export function addEffect(ctx: PowerCtx, kind: EffectKind, square: number, ttl: number, link?: number): void {
  ctx.pos.effects = [...ctx.pos.effects, { id: ctx.pos.nextId++, kind, square, owner: ctx.color, ttl, link }];
}

export function squaresOf(pos: Position, test: (p: Piece, square: number) => boolean): number[] {
  const out: number[] = [];
  pos.board.forEach((p, i) => { if (p && test(p, i)) out.push(i); });
  return out;
}

/** Target plus its neighbours, for area powers. */
export function area(pos: Position, center: number): number[] {
  return [center, ...neighbors(pos, center)];
}

export function vulnerable(p: Piece | null): p is Piece {
  return !!p && p.color !== "n" && !isRoyal(p) && !p.status?.shielded;
}

export function pickRandom<T>(items: T[], random: () => number): T | undefined {
  return items.length ? items[Math.floor(random() * items.length)] : undefined;
}
