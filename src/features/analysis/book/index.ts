/**
 * A small opening book for standard chess. Moves that reach a known
 * opening position are rated "book" instead of being judged by the
 * engine, the way chess.com does it, so nobody gets an inaccuracy for
 * playing the Ruy Lopez. The positions are built from SAN lines the first
 * time the book is asked, which takes a moment once and never again.
 */

import {
  DEFAULT_RULES, PIECES, createPosition, legalMoves, parseSquare, pseudoMoves, sameMove, squareName, standardLayout, toFen,
  type Move, type Position,
} from "@/engine";
import { child } from "../search";
import { CLOSED_LINES } from "./closed";
import { KINGS_PAWN_LINES } from "./kings-pawn";
import { SEMI_OPEN_LINES } from "./semi-open";

export const BOOK_LINES: string[] = [...KINGS_PAWN_LINES, ...SEMI_OPEN_LINES, ...CLOSED_LINES];

/** Board, side to move, castling and en passant. Move counters do not change the opening. */
export function bookKey(pos: Position): string {
  return toFen(pos).split(" ").slice(0, 4).join(" ");
}

const SAN = /^([NBRQK])?([a-h])?([1-8])?x?([a-h][1-8])(?:=?([NBRQ]))?$/;

/**
 * The legal move written as `san`, or null. This reads the SAN directly
 * instead of printing every legal move, which made building the book take
 * seconds. Pseudo legal moves are enough unless two pieces could make it
 * or we are checking the data.
 */
export function findSan(pos: Position, raw: string, strict = true): Move | null {
  const san = raw.replace(/[+#!?]/g, "");
  const candidates = pseudoMoves(pos).filter((m) => matches(pos, m, san));
  if (candidates.length === 0) return null;
  // The book data is checked strictly by a test, so loading can trust a lone match.
  if (candidates.length === 1 && !strict) return candidates[0];
  const legal = legalMoves(pos);
  const left = candidates.filter((m) => legal.some((l) => sameMove(l, m)));
  return left.length === 1 ? left[0] : null;
}

function matches(pos: Position, m: Move, san: string): boolean {
  if (san === "O-O" || san === "O-O-O") return !!m.castle && (m.castle.rookFrom > m.from) === (san === "O-O");
  const parts = SAN.exec(san);
  if (!parts || m.castle || m.drop) return false;
  const [, letter = "", file, rank, to, promo] = parts;
  const piece = pos.board[m.from];
  if (!piece || PIECES[piece.kind].letter !== letter || m.to !== parseSquare(pos, to)) return false;
  const from = squareName(pos, m.from);
  if ((file && from[0] !== file) || (rank && from[1] !== rank)) return false;
  return (m.promotion ? PIECES[m.promotion].letter : undefined) === promo;
}

/**
 * Walks the lines, sharing work between lines with the same start. It can
 * stop after any line and carry on later, so the host can build the book
 * a slice at a time without freezing the board.
 */
class Builder {
  readonly keys = new Set<string>();
  readonly errors: string[] = [];
  private seen = new Map<string, Position>();
  private start = createPosition(standardLayout(), DEFAULT_RULES);
  private next = 0;

  constructor(private lines: string[], private strict: boolean) {}

  get done(): boolean {
    return this.next >= this.lines.length;
  }

  run(count = Infinity): void {
    for (let i = 0; i < count && !this.done; i++) this.walk(this.lines[this.next++]);
  }

  private walk(line: string): void {
    let pos = this.start;
    let prefix = "";
    for (const san of line.split(" ")) {
      prefix += ` ${san}`;
      let next = this.seen.get(prefix);
      if (!next) {
        const move = findSan(pos, san, this.strict);
        if (!move) {
          this.errors.push(`${line}: ${san}`);
          return;
        }
        next = child(pos, move);
        this.seen.set(prefix, next);
        this.keys.add(bookKey(next));
      }
      pos = next;
    }
  }
}

let builder: Builder | null = null;
let loading: Promise<void> | null = null;

function book(): Builder {
  return (builder ??= new Builder(BOOK_LINES, false));
}

/**
 * Finishes building the book in small slices, yielding between them so
 * the page stays responsive. Call it before asking isBookPosition.
 */
export function loadBook(): Promise<void> {
  return (loading ??= (async () => {
    const b = book();
    while (!b.done) {
      b.run(12);
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  })());
}

/** True when this position, reached in standard chess, is a known opening position. */
export function isBookPosition(pos: Position): boolean {
  if (pos.width !== 8 || pos.height !== 8) return false;
  const b = book();
  b.run();
  return b.keys.has(bookKey(pos));
}

/** Every "line: move" that is missing or illegal. Only tests use this, to keep the data honest. */
export function bookErrors(): string[] {
  const strict = new Builder(BOOK_LINES, true);
  strict.run();
  return strict.errors;
}

/** How many distinct positions the book knows. */
export function bookSize(): number {
  const b = book();
  b.run();
  return b.keys.size;
}
