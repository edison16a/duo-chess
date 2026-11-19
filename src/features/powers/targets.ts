/** Reusable target rules so each power definition stays a few lines long. */

import { PIECES, neighbors, xy, type PieceKind } from "@/engine";
import { homeRank, inOwnHalf, isEmpty, isRoyal, pawnSafe, pieceAt } from "./helpers";
import type { TargetStep } from "./types";

interface PieceFilter {
  kinds?: PieceKind[];
  exclude?: PieceKind[];
  maxValue?: number;
}

function matches(kind: PieceKind, f: PieceFilter): boolean {
  if (f.kinds && !f.kinds.includes(kind)) return false;
  if (f.exclude?.includes(kind)) return false;
  if (f.maxValue !== undefined && PIECES[kind].value > f.maxValue) return false;
  return true;
}

export function ownPiece(label: string, f: PieceFilter = {}): TargetStep {
  return {
    label,
    valid: (ctx, s) => {
      const p = pieceAt(ctx.pos, s);
      return !!p && p.color === ctx.color && !isRoyal(p) && matches(p.kind, f);
    },
  };
}

export function enemyPiece(label: string, f: PieceFilter = {}): TargetStep {
  return {
    label,
    valid: (ctx, s) => {
      const p = pieceAt(ctx.pos, s);
      return !!p && p.color === ctx.enemy && !isRoyal(p) && !p.status?.shielded && matches(p.kind, f);
    },
  };
}

export function emptySquare(label: string, opts: { ownHalf?: boolean; homeRank?: boolean; nearPrevious?: "orthogonal" | "any"; pawnFrom?: number } = {}): TargetStep {
  return {
    label,
    valid: (ctx, s) => {
      if (!isEmpty(ctx.pos, s)) return false;
      if (opts.ownHalf && !inOwnHalf(ctx.pos, ctx.color, s)) return false;
      if (opts.homeRank && xy(ctx.pos, s)[1] !== homeRank(ctx.pos, ctx.color)) return false;
      const prev = ctx.squares[ctx.squares.length - 1];
      if (opts.nearPrevious && prev !== undefined) {
        const near = neighbors(ctx.pos, prev);
        if (!near.includes(s)) return false;
        if (opts.nearPrevious === "orthogonal") {
          const [px, py] = xy(ctx.pos, prev);
          const [x, y] = xy(ctx.pos, s);
          if (px !== x && py !== y) return false;
        }
      }
      if (prev !== undefined) {
        const moving = pieceAt(ctx.pos, prev);
        if (moving && !pawnSafe(ctx.pos, moving.kind, s)) return false;
      }
      return true;
    },
  };
}

export function anySquare(label: string): TargetStep {
  return { label, valid: (ctx, s) => !ctx.pos.holes.includes(s) };
}
