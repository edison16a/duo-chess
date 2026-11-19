/**
 * FEN import and export. Export feeds Stockfish, import is mostly for tests
 * (perft positions), so both only cover the standard 8x8 piece set.
 */

import { FILES, parseSquare, sq, squareName, xy } from "./geometry";
import { PIECES, letterToKind } from "./pieces";
import { createPosition, DEFAULT_RULES, type LayoutPiece } from "./setup";
import type { Color, Position, Rules } from "./types";

function castlingField(pos: Position): string {
  let out = "";
  for (const color of ["w", "b"] as Color[]) {
    const home = color === "w" ? 0 : pos.height - 1;
    const king = pos.board.findIndex((p, i) => p?.kind === "king" && p.color === color && !p.moved && xy(pos, i)[1] === home);
    if (king < 0) continue;
    const [kx] = xy(pos, king);
    const rights: string[] = [];
    for (let x = pos.width - 1; x >= 0; x--) {
      const rook = pos.board[sq(pos, x, home)];
      if (!rook || rook.kind !== "rook" || rook.color !== color || rook.moved) continue;
      if (pos.rules.chess960) rights.push(FILES[x]);
      else if (x === pos.width - 1 && x > kx) rights.push("k");
      else if (x === 0 && x < kx) rights.push("q");
    }
    out += color === "w" ? rights.join("").toUpperCase() : rights.join("");
  }
  return out || "-";
}

export function toFen(pos: Position): string {
  const rows: string[] = [];
  for (let y = pos.height - 1; y >= 0; y--) {
    let row = "";
    let empty = 0;
    for (let x = 0; x < pos.width; x++) {
      const p = pos.board[sq(pos, x, y)];
      if (!p || p.color === "n") { empty++; continue; }
      if (empty) { row += empty; empty = 0; }
      const letter = PIECES[p.kind].pawn ? "P" : PIECES[p.kind].letter;
      row += p.color === "w" ? letter : letter.toLowerCase();
    }
    if (empty) row += empty;
    rows.push(row);
  }
  const ep = pos.ep ? squareName(pos, pos.ep.square) : "-";
  return `${rows.join("/")} ${pos.turn} ${castlingField(pos)} ${ep} ${pos.halfmove} ${pos.fullmove}`;
}

export function fromFen(fen: string, rules: Rules = DEFAULT_RULES): Position {
  const [placement, turn, castling = "-", ep = "-", half = "0", full = "1"] = fen.trim().split(/\s+/);
  const pieces: LayoutPiece[] = [];
  placement.split("/").forEach((row, i) => {
    const y = 7 - i;
    let x = 0;
    for (const ch of row) {
      if (/\d/.test(ch)) { x += Number(ch); continue; }
      const kind = ch.toUpperCase() === "P" ? "pawn" : letterToKind(ch)!;
      pieces.push({ square: sq({ width: 8 }, x, y), kind, color: ch === ch.toUpperCase() ? "w" : "b" });
      x++;
    }
  });
  const pos = createPosition({ width: 8, height: 8, pieces }, rules);
  pos.turn = turn as Color;
  pos.halfmove = Number(half);
  pos.fullmove = Number(full);
  pos.board = pos.board.map((p, i) => {
    if (!p) return p;
    const [x, y] = xy(pos, i);
    let moved = true;
    if (p.kind === "pawn") moved = p.color === "w" ? y !== 1 : y !== 6;
    if (p.kind === "king") moved = !(p.color === "w" ? /[KQ]/ : /[kq]/).test(castling);
    if (p.kind === "rook") {
      const home = p.color === "w" ? 0 : 7;
      const side = x === 7 ? "k" : x === 0 ? "q" : "";
      const flag = p.color === "w" ? side.toUpperCase() : side;
      moved = !(y === home && flag && castling.includes(flag));
    }
    return { ...p, moved };
  });
  if (ep !== "-") {
    const square = parseSquare(pos, ep);
    const victim = square + (pos.turn === "w" ? -8 : 8);
    pos.ep = { square, victim };
  }
  return pos;
}
