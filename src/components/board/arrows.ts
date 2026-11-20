/**
 * Arrow outlines for the annotation layer. Everything is measured in
 * squares, so the SVG viewBox is simply the board's width and height and
 * the same shape scales with any board size.
 */

import type { Color, Position } from "@/engine";
import { cellOf } from "./layout";

interface Point {
  x: number;
  y: number;
}

/** Shape tuning, in fractions of a square. Close to what chess.com draws. */
const SHAFT = 0.21;
const HEAD_WIDTH = 0.56;
const HEAD_LENGTH = 0.44;
/** The tail starts a little off center so the piece underneath stays readable. */
const TAIL_GAP = 0.3;
/** The tip stops a little short of the target center. */
const TIP_GAP = 0.08;

const sub = (a: Point, b: Point): Point => ({ x: a.x - b.x, y: a.y - b.y });
const add = (a: Point, b: Point, k = 1): Point => ({ x: a.x + b.x * k, y: a.y + b.y * k });
const unit = (v: Point): Point => {
  const len = Math.hypot(v.x, v.y) || 1;
  return { x: v.x / len, y: v.y / len };
};
const normal = (u: Point): Point => ({ x: -u.y, y: u.x });

function center(pos: Pick<Position, "width" | "height">, square: number, orientation: Color): Point {
  const { col, row } = cellOf(pos, square, orientation);
  return { x: col + 0.5, y: row + 0.5 };
}

/**
 * The path an arrow follows on screen. Knight jumps bend once like on
 * chess.com: first along the long leg, then along the short one.
 */
function arrowPath(pos: Pick<Position, "width" | "height">, from: number, to: number, orientation: Color): Point[] {
  const a = center(pos, from, orientation);
  const b = center(pos, to, orientation);
  const dx = Math.abs(b.x - a.x);
  const dy = Math.abs(b.y - a.y);
  const knight = (dx === 1 && dy === 2) || (dx === 2 && dy === 1);
  if (!knight) return [a, b];
  const corner = dx > dy ? { x: b.x, y: a.y } : { x: a.x, y: b.y };
  return [a, corner, b];
}

/**
 * Offsets a polyline sideways by `d`. Inner corners use a miter join so a
 * bent arrow stays one clean shape with no overlap to darken.
 */
function offsetLine(points: Point[], d: number): Point[] {
  return points.map((p, i) => {
    const before = i > 0 ? normal(unit(sub(p, points[i - 1]))) : null;
    const after = i < points.length - 1 ? normal(unit(sub(points[i + 1], p))) : null;
    if (!before) return add(p, after!, d);
    if (!after) return add(p, before, d);
    const scale = d / (1 + before.x * after.x + before.y * after.y);
    return add(p, add(before, after), scale);
  });
}

/** SVG polygon points for an arrow from one square to another. */
export function arrowPolygon(pos: Pick<Position, "width" | "height">, from: number, to: number, orientation: Color): string {
  const path = arrowPath(pos, from, to, orientation);
  const first = unit(sub(path[1], path[0]));
  const last = unit(sub(path[path.length - 1], path[path.length - 2]));
  const start = add(path[0], first, TAIL_GAP);
  const tip = add(path[path.length - 1], last, -TIP_GAP);
  const base = add(tip, last, -HEAD_LENGTH);
  const spine = [start, ...path.slice(1, -1), base];
  const left = offsetLine(spine, SHAFT / 2);
  const right = offsetLine(spine, -SHAFT / 2).reverse();
  const wing = normal(last);
  const outline = [...left, add(base, wing, HEAD_WIDTH / 2), tip, add(base, wing, -HEAD_WIDTH / 2), ...right];
  return outline.map((p) => `${p.x.toFixed(3)},${p.y.toFixed(3)}`).join(" ");
}
