/**
 * Static evaluation for the built in engine, in centipawns from White's
 * point of view. It only needs to be good enough to tell a blunder from a
 * good move in variants Stockfish cannot play, so it stays simple:
 * material, a little centralization, pawn progress and variant goals.
 */

import { PIECES, hillSquares, royalSquares, xy, type Color, type Position } from "@/engine";

function centerBonus(pos: Position, square: number): number {
  const [x, y] = xy(pos, square);
  const cx = (pos.width - 1) / 2, cy = (pos.height - 1) / 2;
  return 12 - 4 * (Math.abs(x - cx) + Math.abs(y - cy));
}

function pocketValue(pos: Position, color: Color): number {
  return pos.pockets[color].reduce((sum, k) => sum + PIECES[k].value * 0.8, 0);
}

export function evaluate(pos: Position): number {
  let score = 0;
  for (let s = 0; s < pos.board.length; s++) {
    const p = pos.board[s];
    if (!p || p.color === "n") continue;
    const sign = p.color === "w" ? 1 : -1;
    const def = PIECES[p.kind];
    let v = def.value;
    if (def.pawn) {
      const [, y] = xy(pos, s);
      const progress = p.color === "w" ? y : pos.height - 1 - y;
      v += progress * progress * 2;
    } else if (!def.royal) {
      v += centerBonus(pos, s);
    }
    if (p.status?.frozen) v *= 0.85;
    score += sign * v;
  }
  if (pos.rules.drops) score += pocketValue(pos, "w") - pocketValue(pos, "b");
  if (pos.rules.giveaway) score = -score;
  if (pos.rules.kingOfTheHill) {
    const hill = hillSquares(pos);
    for (const color of ["w", "b"] as Color[]) {
      const king = royalSquares(pos, color)[0];
      if (king === undefined) continue;
      const [kx, ky] = xy(pos, king);
      const dist = Math.min(...hill.map((h) => { const [hx, hy] = xy(pos, h); return Math.max(Math.abs(hx - kx), Math.abs(hy - ky)); }));
      score += (color === "w" ? 1 : -1) * (4 - dist) * 60;
    }
  }
  if (pos.rules.checksToWin > 0) score += (pos.checks.w - pos.checks.b) * 220;
  return Math.round(score);
}
