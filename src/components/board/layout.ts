import type { Color, Position } from "@/engine";

/** Where a square is drawn: column and row from the top left of the screen. */
export function cellOf(pos: Pick<Position, "width" | "height">, square: number, orientation: Color): { col: number; row: number } {
  const x = square % pos.width;
  const y = Math.floor(square / pos.width);
  return orientation === "w" ? { col: x, row: pos.height - 1 - y } : { col: pos.width - 1 - x, row: y };
}

export function squareAt(pos: Pick<Position, "width" | "height">, col: number, row: number, orientation: Color): number | null {
  if (col < 0 || row < 0 || col >= pos.width || row >= pos.height) return null;
  const x = orientation === "w" ? col : pos.width - 1 - col;
  const y = orientation === "w" ? pos.height - 1 - row : row;
  return y * pos.width + x;
}

/** Absolute placement style for anything that sits on one square. */
export function cellStyle(pos: Pick<Position, "width" | "height">, square: number, orientation: Color): React.CSSProperties {
  const { col, row } = cellOf(pos, square, orientation);
  return {
    width: `${100 / pos.width}%`,
    height: `${100 / pos.height}%`,
    transform: `translate(${col * 100}%, ${row * 100}%)`,
  };
}

export function isLightSquare(pos: Pick<Position, "width">, square: number): boolean {
  const x = square % pos.width;
  const y = Math.floor(square / pos.width);
  return (x + y) % 2 === 1;
}
