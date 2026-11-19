/**
 * The full game record: a Position plus history, repetition table, result
 * and the animation events from the latest action. This is what the room
 * host keeps and broadcasts.
 */

import { inCheck, royalSquares } from "./attacks";
import { opposite } from "./geometry";
import { positionKey } from "./hash";
import { legalMoves, matchLegal } from "./legal";
import { makeMove } from "./make";
import { moveToSan } from "./notation";
import { evaluateOutcome } from "./outcome";
import { afterMove, endTurn } from "./turn";
import type { Color, GameEvent, GameResult, Move, PieceKind, Position } from "./types";

export type RatingId =
  | "legendary" | "brilliant" | "great" | "best" | "excellent" | "good"
  | "inaccuracy" | "mistake" | "blunder";

export interface HistoryEntry {
  ply: number;
  color: Color;
  san: string;
  move: Move;
  kind: PieceKind;
  /** Set when the entry is a superpower activation instead of a move. */
  power?: string;
  rating?: RatingId;
  /** Evaluation after the move in centipawns from White's view. */
  evalCp?: number;
}

export interface GameState {
  pos: Position;
  history: HistoryEntry[];
  repetition: Record<string, number>;
  result: GameResult | null;
  events: GameEvent[];
  /** Bumps on every change so clients know to replay events once. */
  eventSeq: number;
  lastMove: { from: number; to: number } | null;
  /** Pieces each color has lost, used by revive powers and the material bar. */
  lost: Record<Color, PieceKind[]>;
  /** Superpower inventories. Only present in the superpower mode. */
  powers?: PowerState;
}

export interface PowerState {
  inventory: Record<Color, string[]>;
  /** Turn key of the last activation, so only one power fires per turn. */
  usedTurn: string | null;
}

export function turnKey(pos: Position): string {
  return `${pos.fullmove}${pos.turn}`;
}

export function createGame(pos: Position): GameState {
  return {
    pos,
    history: [],
    repetition: { [positionKey(pos)]: 1 },
    result: null,
    events: [],
    eventSeq: 0,
    lastMove: null,
    lost: { w: [], b: [] },
  };
}

/**
 * Plays a move if legal and returns the new game, or null when the move is
 * rejected. All rule variants flow through here.
 */
export function playMove(game: GameState, requested: Move): GameState | null {
  if (game.result) return null;
  const pos = game.pos;
  const legal = matchLegal(pos, requested);
  if (!legal) return null;
  const move: Move = { ...legal };
  if (pos.rules.duck) {
    if (requested.duckTo === undefined) return null;
    move.duckTo = requested.duckTo;
  }

  const mover = pos.turn;
  const piece = move.drop ? null : pos.board[move.from];
  const san = moveToSan(pos, move);
  const { pos: next, events } = makeMove(pos, move);
  if (move.duckTo !== undefined && !validDuck(pos, next, move)) return null;

  const gaveCheck = next.rules.checkRules && inCheck(next, opposite(mover));
  if (gaveCheck) {
    next.checks[mover]++;
    const king = royalSquares(next, opposite(mover))[0];
    if (king !== undefined) events.push({ type: "check", square: king });
  }
  afterMove(next, gaveCheck, events);
  // A multi move turn ends early if the mover has nothing left to play.
  if (next.turn === mover && legalMoves(next).length === 0) endTurn(next, events);
  const lost = recordLosses(game.lost, pos, next);

  return finalize(game, next, events, lost, {
    ply: game.history.length,
    color: mover,
    san,
    move,
    kind: move.drop ?? piece!.kind,
  }, move);
}

/**
 * Works out which pieces disappeared by comparing piece ids before and
 * after. This catches captures, explosions, mines and poison alike.
 */
export function recordLosses(prev: Record<Color, PieceKind[]>, before: Position, after: Position): Record<Color, PieceKind[]> {
  const alive = new Set(after.board.filter(Boolean).map((p) => p!.id));
  const lost = { w: prev.w.slice(), b: prev.b.slice() };
  for (const p of before.board) {
    if (p && p.color !== "n" && !alive.has(p.id)) lost[p.color].push(p.promoted ? "pawn" : p.kind);
  }
  return lost;
}

/** The duck must land on an empty square different from where it was. */
function validDuck(before: Position, after: Position, move: Move): boolean {
  const old = before.board.findIndex((p) => p?.kind === "duck");
  if (move.duckTo === old) return false;
  return after.board[move.duckTo!]?.kind === "duck" && !before.holes.includes(move.duckTo!);
}

/**
 * Shared tail for moves and powers: repetition, result detection, check
 * suffixes and bumping the event sequence.
 */
export function finalize(
  game: GameState,
  next: Position,
  events: GameEvent[],
  lost: Record<Color, PieceKind[]>,
  entry: HistoryEntry,
  move: Move | null,
): GameState {
  const key = positionKey(next);
  const repetition = { ...game.repetition, [key]: (game.repetition[key] ?? 0) + 1 };
  const result = evaluateOutcome(next, entry.color, repetition[key]);
  if (!entry.power) {
    if (result?.reason === "checkmate") entry.san += "#";
    else if (next.rules.checkRules && inCheck(next, opposite(entry.color))) entry.san += "+";
  }
  return {
    ...game,
    pos: next,
    history: [...game.history, entry],
    repetition,
    result,
    events,
    eventSeq: game.eventSeq + 1,
    lastMove: move ? { from: move.from, to: move.to } : game.lastMove,
    lost,
  };
}

/** Ends the game for a non board reason such as resignation or a flag. */
export function endGame(game: GameState, result: GameResult): GameState {
  return { ...game, result, events: [], eventSeq: game.eventSeq + 1 };
}
