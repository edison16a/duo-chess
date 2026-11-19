/** Board coordinate helpers. Square index is y * width + x, y = 0 is White's back rank. */

import type { Color, Position } from "./types";

export type Vec = readonly [number, number];

export const FILES = "abcdefghijklmnop";

export function sq(pos: Pick<Position, "width">, x: number, y: number): number {
  return y * pos.width + x;
}

export function xy(pos: Pick<Position, "width">, square: number): [number, number] {
  return [square % pos.width, Math.floor(square / pos.width)];
}

export function onBoard(pos: Pick<Position, "width" | "height" | "holes">, x: number, y: number): boolean {
  if (x < 0 || y < 0 || x >= pos.width || y >= pos.height) return false;
  return pos.holes.length === 0 || !pos.holes.includes(y * pos.width + x);
}

export function squareName(pos: Pick<Position, "width">, square: number): string {
  const [x, y] = xy(pos, square);
  return `${FILES[x]}${y + 1}`;
}

export function parseSquare(pos: Pick<Position, "width">, name: string): number {
  const x = FILES.indexOf(name[0]);
  const y = Number(name.slice(1)) - 1;
  return sq(pos, x, y);
}

export function opposite(color: Color): Color {
  return color === "w" ? "b" : "w";
}

/** Forward direction on the y axis for a color. */
export function forward(color: Color): 1 | -1 {
  return color === "w" ? 1 : -1;
}

/**
 * Every sign and axis swap of (a, b). sym(1, 2) gives the eight knight jumps,
 * sym(1, 0) the four rook directions. Duplicates are removed.
 */
export function sym(a: number, b: number): Vec[] {
  const out: Vec[] = [];
  const seen = new Set<string>();
  for (const [p, q] of [[a, b], [b, a]]) {
    for (const sx of [1, -1]) {
      for (const sy of [1, -1]) {
        const v: Vec = [p * sx, q * sy];
        const key = `${v[0]},${v[1]}`;
        if (!seen.has(key)) {
          seen.add(key);
          out.push(v);
        }
      }
    }
  }
  return out;
}

export const ORTHO = sym(1, 0);
export const DIAG = sym(1, 1);
export const ALL8 = [...ORTHO, ...DIAG];
export const KNIGHT = sym(1, 2);

/** Squares touching `square`, used by explosions and area powers. */
export function neighbors(pos: Pick<Position, "width" | "height" | "holes">, square: number, radius = 1): number[] {
  const [x, y] = xy(pos, square);
  const out: number[] = [];
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (dx === 0 && dy === 0) continue;
      if (onBoard(pos, x + dx, y + dy)) out.push(sq(pos, x + dx, y + dy));
    }
  }
  return out;
}
