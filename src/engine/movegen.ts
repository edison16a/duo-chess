/**
 * Pseudo legal move generation. "Pseudo" means we ignore whether your own
 * king is left in check; legal.ts filters that afterwards.
 */

import { KNIGHT, forward, onBoard, sq, xy, type Vec } from "./geometry";
import { PIECES, PROMOTIONS } from "./pieces";
import type { Pattern } from "./pieces";
import type { Color, Move, Piece, PieceKind, Position } from "./types";

export function hasWall(pos: Position, square: number): boolean {
  return pos.effects.length > 0 && pos.effects.some((e) => e.kind === "wall" && e.square === square);
}

/** Can `attacker` take whatever stands on `square`? Shields, ducks and friends say no. */
export function canCapture(pos: Position, attacker: Piece, square: number): boolean {
  const target = pos.board[square];
  if (!target || target.color === "n" || target.color === attacker.color) return false;
  if (target.status?.shielded) return false;
  // Atomic kings can never capture: the blast would take them out too.
  if (pos.rules.atomic && PIECES[attacker.kind].royal) return false;
  return true;
}

type Emit = (to: number, capture: boolean) => void;

function walkPattern(pos: Position, from: number, piece: Piece, pattern: Pattern, emit: Emit): void {
  const [x0, y0] = xy(pos, from);
  const mode = "mode" in pattern ? pattern.mode ?? "any" : "any";
  const canMove = mode !== "capture";
  const canTake = mode !== "move";
  const ghost = (piece.status?.ghost ?? 0) > 0;

  for (const [dx, dy] of pattern.vectors as Vec[]) {
    if (pattern.type === "leap") {
      const x = x0 + dx, y = y0 + dy;
      if (!onBoard(pos, x, y)) continue;
      const t = sq(pos, x, y);
      if (hasWall(pos, t)) continue;
      if (!pos.board[t]) { if (canMove) emit(t, false); }
      else if (canTake && canCapture(pos, piece, t)) emit(t, true);
      continue;
    }

    let x = x0 + dx, y = y0 + dy, steps = 0;
    let screen = false;
    const limit = pattern.type === "slide" ? pattern.limit ?? 99 : 99;
    const fly = pattern.type === "slide" && (pattern.fly || ghost);

    while (onBoard(pos, x, y) && steps < limit) {
      const t = sq(pos, x, y);
      if (hasWall(pos, t)) break;
      const occupant = pos.board[t];
      if (pattern.type === "slide") {
        if (!occupant) { if (canMove) emit(t, false); }
        else {
          if (canTake && canCapture(pos, piece, t)) emit(t, true);
          if (!fly) break;
        }
      } else if (pattern.type === "hop") {
        if (occupant) {
          const nx = x + dx, ny = y + dy;
          if (onBoard(pos, nx, ny)) {
            const land = sq(pos, nx, ny);
            if (!hasWall(pos, land)) {
              if (!pos.board[land]) emit(land, false);
              else if (canCapture(pos, piece, land)) emit(land, true);
            }
          }
          break;
        }
      } else if (pattern.type === "cannon") {
        if (occupant) {
          if (!screen) screen = true;
          else {
            if (canCapture(pos, piece, t)) emit(t, true);
            break;
          }
        }
      }
      x += dx; y += dy; steps++;
    }
  }
}

function patternsFor(piece: Piece): Pattern[] {
  const base = PIECES[piece.kind].patterns;
  return piece.status?.blessed ? [...base, { type: "leap", vectors: KNIGHT }] : base;
}

/** Last rank for promotion purposes. */
function promotionRank(pos: Position, color: Color): number {
  return color === "w" ? pos.height - 1 : 0;
}

function promotionKinds(pos: Position): PieceKind[] {
  return pos.rules.giveaway ? [...PROMOTIONS, "king"] : PROMOTIONS;
}

function pawnMoves(pos: Position, from: number, piece: Piece, out: Move[], capturesOnly: boolean): void {
  const color = piece.color as Color;
  const dir = forward(color);
  const [x, y] = xy(pos, from);
  const lastRank = promotionRank(pos, color);

  const push = (to: number, extra: Partial<Move> = {}) => {
    const [, ty] = xy(pos, to);
    if (ty === lastRank) {
      for (const kind of promotionKinds(pos)) out.push({ from, to, promotion: kind, ...extra });
    } else out.push({ from, to, ...extra });
  };

  if (!capturesOnly && onBoard(pos, x, y + dir)) {
    const one = sq(pos, x, y + dir);
    if (!pos.board[one] && !hasWall(pos, one)) {
      push(one);
      if (!piece.moved && onBoard(pos, x, y + 2 * dir)) {
        const two = sq(pos, x, y + 2 * dir);
        if (!pos.board[two] && !hasWall(pos, two)) push(two);
      }
    }
  }
  for (const dx of [-1, 1]) {
    if (!onBoard(pos, x + dx, y + dir)) continue;
    const t = sq(pos, x + dx, y + dir);
    if (hasWall(pos, t)) continue;
    if (pos.board[t]) {
      if (canCapture(pos, piece, t)) push(t);
    } else if (pos.ep && pos.ep.square === t) {
      const victim = pos.board[pos.ep.victim];
      if (victim && victim.kind === "pawn" && victim.color !== color && canCapture(pos, piece, pos.ep.victim)) {
        out.push({ from, to: t, epVictim: pos.ep.victim });
      }
    }
  }
}

/** All pseudo legal moves for one piece. Frozen pieces and ducks have none. */
export function pieceMoves(pos: Position, from: number, capturesOnly = false): Move[] {
  const piece = pos.board[from];
  if (!piece || piece.color === "n" || (piece.status?.frozen ?? 0) > 0) return [];
  const out: Move[] = [];
  if (PIECES[piece.kind].pawn) {
    pawnMoves(pos, from, piece, out, capturesOnly);
    return out;
  }
  for (const pattern of patternsFor(piece)) {
    walkPattern(pos, from, piece, pattern, (to, capture) => {
      if (capturesOnly && !capture) return;
      out.push({ from, to });
    });
  }
  return out;
}

/**
 * Squares a piece threatens to capture. Pawns threaten diagonals even when
 * empty, which matters for castling through attacked squares.
 */
export function attackSquares(pos: Position, from: number): number[] {
  const piece = pos.board[from];
  if (!piece || piece.color === "n" || (piece.status?.frozen ?? 0) > 0) return [];
  if (PIECES[piece.kind].pawn) {
    const [x, y] = xy(pos, from);
    const dir = forward(piece.color as Color);
    return [-1, 1].filter((dx) => onBoard(pos, x + dx, y + dir)).map((dx) => sq(pos, x + dx, y + dir));
  }
  const out: number[] = [];
  for (const pattern of patternsFor(piece)) {
    if ("mode" in pattern && pattern.mode === "move") continue;
    walkPattern(pos, from, piece, pattern, (to, capture) => { if (capture) out.push(to); });
  }
  return out;
}
