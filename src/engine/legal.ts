/** Legal move generation and move validation. */

import { inCheck, isAttacked, royalSquares } from "./attacks";
import { opposite, sq, xy } from "./geometry";
import { makeMove } from "./make";
import { pieceMoves, hasWall } from "./movegen";
import { PIECES } from "./pieces";
import type { Color, Move, Position } from "./types";

function castlingMoves(pos: Position, color: Color): Move[] {
  if (!pos.rules.castling) return [];
  const out: Move[] = [];
  const home = color === "w" ? 0 : pos.height - 1;
  for (const kingSq of royalSquares(pos, color)) {
    const king = pos.board[kingSq]!;
    const [kx, ky] = xy(pos, kingSq);
    if (king.moved || king.kind !== "king" || ky !== home || (king.status?.frozen ?? 0) > 0) continue;
    if (pos.rules.checkRules && inCheck(pos, color)) continue;
    for (let rx = 0; rx < pos.width; rx++) {
      const rookSq = sq(pos, rx, ky);
      const rook = pos.board[rookSq];
      if (!rook || rook.kind !== "rook" || rook.color !== color || rook.moved || rookSq === kingSq) continue;
      const kingside = rx > kx;
      const kingTo = sq(pos, kingside ? pos.width - 2 : 2, ky);
      const rookTo = sq(pos, kingside ? pos.width - 3 : 3, ky);
      const span = [kx, rx, kingside ? pos.width - 2 : 2, kingside ? pos.width - 3 : 3];
      let clear = true;
      for (let x = Math.min(...span); x <= Math.max(...span); x++) {
        const s = sq(pos, x, ky);
        if (s === kingSq || s === rookSq) continue;
        if (pos.board[s] || hasWall(pos, s)) clear = false;
      }
      if (!clear) continue;
      if (pos.rules.checkRules) {
        const step = Math.sign(xy(pos, kingTo)[0] - kx);
        let safe = true;
        for (let x = kx; step !== 0 && x !== xy(pos, kingTo)[0] + step; x += step) {
          if (isAttacked(pos, sq(pos, x, ky), opposite(color))) safe = false;
        }
        if (!safe) continue;
      }
      out.push({ from: kingSq, to: kingTo, castle: { rookFrom: rookSq, rookTo } });
    }
  }
  return out;
}

function dropMoves(pos: Position, color: Color): Move[] {
  if (!pos.rules.drops || pos.pockets[color].length === 0) return [];
  const out: Move[] = [];
  const kinds = [...new Set(pos.pockets[color])];
  for (let s = 0; s < pos.board.length; s++) {
    if (pos.board[s] || hasWall(pos, s) || pos.holes.includes(s)) continue;
    const [, y] = xy(pos, s);
    for (const kind of kinds) {
      if (kind === "pawn" && (y === 0 || y === pos.height - 1)) continue;
      out.push({ from: -1, to: s, drop: kind });
    }
  }
  return out;
}

export function pseudoMoves(pos: Position): Move[] {
  const color = pos.turn;
  const out: Move[] = [];
  for (let s = 0; s < pos.board.length; s++) {
    if (pos.board[s]?.color === color) out.push(...pieceMoves(pos, s));
  }
  out.push(...castlingMoves(pos, color), ...dropMoves(pos, color));
  return out;
}

export function isCapture(pos: Position, move: Move): boolean {
  return !move.castle && !move.drop && (move.epVictim !== undefined || !!pos.board[move.to]);
}

/** Would this move leave the mover's own royalty exposed? */
function leavesKingSafe(pos: Position, move: Move): boolean {
  const color = pos.turn;
  if (!pos.rules.checkRules) return true;
  const { pos: next } = makeMove(pos, move);
  const mineLeft = royalSquares(next, color).length;
  if (pos.royalStart[color] && mineLeft === 0) return false;
  if (pos.rules.atomic && pos.royalStart[opposite(color)] && royalSquares(next, opposite(color)).length === 0) return true;
  return !inCheck(next, color);
}

export function legalMoves(pos: Position): Move[] {
  const moves = pseudoMoves(pos).filter((m) => leavesKingSafe(pos, m));
  if (pos.rules.mustCapture) {
    const captures = moves.filter((m) => isCapture(pos, m));
    if (captures.length) return captures;
  }
  return moves;
}

export function sameMove(a: Move, b: Move): boolean {
  return a.from === b.from && a.to === b.to && (a.promotion ?? null) === (b.promotion ?? null) && (a.drop ?? null) === (b.drop ?? null) && !!a.castle === !!b.castle;
}

/** Find the legal version of a move sent by a client (fills in castle and en passant details). */
export function matchLegal(pos: Position, move: Move): Move | null {
  const moves = legalMoves(pos);
  const exact = moves.find((m) => sameMove(m, move));
  if (exact) return exact;
  // Plain from/to requests (no castle flag) still resolve to a castle move.
  return moves.find((m) => sameMove(m, { ...move, castle: m.castle })) ?? null;
}

export function hasRoyal(pos: Position, color: Color): boolean {
  return pos.board.some((p) => p && p.color === color && PIECES[p.kind].royal);
}
