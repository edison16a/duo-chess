/**
 * Static evaluation for the built in engine, in centipawns from White's
 * point of view. It only needs to tell a blunder from a good move in
 * variants Stockfish cannot play, so it stays cheap: material, central
 * pieces and pawns, a little king shelter, the bishop pair, doubled pawns,
 * a tempo bonus and the variant goals. Every term works on any board size
 * because custom maps are not 8 by 8.
 */

import { PIECES, hillSquares, royalSquares, xy, type Color, type Position } from "@/engine";

/** Small bonus for the side to move, per move left this turn. It evens out odd and even depths. */
const TEMPO = 10;
/** Material a side needs on the board before its opponent's king should hide. */
const ATTACKING_MATERIAL = 1300;

function centerBonus(pos: Position, square: number): number {
  const [x, y] = xy(pos, square);
  const cx = (pos.width - 1) / 2, cy = (pos.height - 1) / 2;
  return 12 - 4 * (Math.abs(x - cx) + Math.abs(y - cy));
}

/** 1 on the middle files, 0 on the edge files. */
function fileCentrality(pos: Position, x: number): number {
  const cx = (pos.width - 1) / 2;
  return cx > 0 ? 1 - Math.abs(x - cx) / cx : 0;
}

function pocketValue(pos: Position, color: Color): number {
  return pos.pockets[color].reduce((sum, k) => sum + PIECES[k].value * 0.8, 0);
}

/** Pawns score for moving up, more for central pawns early on so d4 beats a4. */
function pawnValue(pos: Position, color: Color, x: number, y: number): number {
  const progress = color === "w" ? y : pos.height - 1 - y;
  return progress * progress * 2 + fileCentrality(pos, x) * 8 * Math.max(0, Math.min(progress, 3) - 1);
}

/** Kings stay home, ideally on a wing, while the enemy still has an attack. */
function kingShelter(pos: Position, color: Color, x: number, y: number): number {
  const rank = color === "w" ? y : pos.height - 1 - y;
  const wing = x <= 2 || x >= pos.width - 3 ? 15 : 0;
  return rank === 0 ? wing : -15 * Math.min(rank, 4);
}

export function evaluate(pos: Position): number {
  let score = 0;
  const material = { w: 0, b: 0 };
  const bishops = { w: 0, b: 0 };
  const pawnFiles = { w: new Array<number>(pos.width).fill(0), b: new Array<number>(pos.width).fill(0) };
  const kings: { color: Color; x: number; y: number }[] = [];
  for (let s = 0; s < pos.board.length; s++) {
    const p = pos.board[s];
    if (!p || p.color === "n") continue;
    const color = p.color;
    const def = PIECES[p.kind];
    const [x, y] = xy(pos, s);
    let v = def.value;
    if (def.pawn) {
      v += pawnValue(pos, color, x, y);
      pawnFiles[color][x]++;
    } else if (def.royal) {
      kings.push({ color, x, y });
    } else {
      v += centerBonus(pos, s);
      material[color] += def.value;
      if (p.kind === "bishop") bishops[color]++;
    }
    if (p.status?.frozen) v *= 0.85;
    score += (color === "w" ? 1 : -1) * v;
  }
  for (const color of ["w", "b"] as Color[]) {
    const sign = color === "w" ? 1 : -1;
    if (bishops[color] >= 2) score += sign * 30;
    for (const count of pawnFiles[color]) if (count > 1) score -= sign * 12 * (count - 1);
  }
  if (!pos.rules.kingOfTheHill && !pos.rules.giveaway) {
    for (const k of kings) {
      const enemy = k.color === "w" ? "b" : "w";
      if (material[enemy] >= ATTACKING_MATERIAL) score += (k.color === "w" ? 1 : -1) * kingShelter(pos, k.color, k.x, k.y);
    }
  }
  if (pos.rules.drops) score += pocketValue(pos, "w") - pocketValue(pos, "b");
  if (pos.rules.giveaway) score = -score;
  score += variantGoals(pos);
  score += (pos.turn === "w" ? 1 : -1) * TEMPO * Math.max(1, pos.movesLeft);
  return Math.round(score);
}

/** Progress toward the hill and toward the third check. */
function variantGoals(pos: Position): number {
  let score = 0;
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
  return score;
}
