/** Standard algebraic notation, extended for drops, fairy pieces and the duck. */

import { squareName, xy, FILES } from "./geometry";
import { isCapture, legalMoves } from "./legal";
import { PIECES } from "./pieces";
import type { Move, Position } from "./types";

/** SAN without the check suffix; game.ts adds + or # once it knows. */
export function moveToSan(pos: Position, move: Move): string {
  let san: string;
  if (move.drop) {
    san = `${PIECES[move.drop].letter}@${squareName(pos, move.to)}`;
  } else if (move.castle) {
    san = move.castle.rookFrom > move.from ? "O-O" : "O-O-O";
  } else {
    const piece = pos.board[move.from]!;
    const def = PIECES[piece.kind];
    const capture = isCapture(pos, move);
    const to = squareName(pos, move.to);
    if (def.pawn) {
      san = capture ? `${FILES[xy(pos, move.from)[0]]}x${to}` : to;
    } else {
      san = def.letter + disambiguate(pos, move) + (capture ? "x" : "") + to;
    }
    if (move.promotion) san += `=${PIECES[move.promotion].letter}`;
  }
  if (move.duckTo !== undefined) san += ` @${squareName(pos, move.duckTo)}`;
  return san;
}

function disambiguate(pos: Position, move: Move): string {
  const piece = pos.board[move.from]!;
  const rivals = legalMoves(pos).filter(
    (m) => m.to === move.to && m.from !== move.from && !m.drop && pos.board[m.from]?.kind === piece.kind,
  );
  if (rivals.length === 0) return "";
  const [fx, fy] = xy(pos, move.from);
  const sameFile = rivals.some((m) => xy(pos, m.from)[0] === fx);
  const sameRank = rivals.some((m) => xy(pos, m.from)[1] === fy);
  if (!sameFile) return FILES[fx];
  if (!sameRank) return String(fy + 1);
  return squareName(pos, move.from);
}

/** UCI style coordinates, used to talk to Stockfish. */
export function moveToUci(pos: Position, move: Move): string {
  const promo = move.promotion ? PIECES[move.promotion].letter.toLowerCase() : "";
  const to = move.castle && pos.rules.chess960 ? move.castle.rookFrom : move.to;
  return squareName(pos, move.from) + squareName(pos, to) + promo;
}
