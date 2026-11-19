/**
 * Turn bookkeeping: counting down moves in multi move modes, ticking timed
 * effects, poison, skipped turns and bonus moves. Kept apart from make.ts so
 * the search can reuse the exact same rules as the real game.
 */

import { inCheck } from "./attacks";
import { opposite } from "./geometry";
import type { Color, GameEvent, Piece, PieceStatus, Position } from "./types";

const TIMED: (keyof PieceStatus)[] = ["frozen", "shielded", "ghost", "poisoned", "hidden"];

/** One ply passes: every timer goes down by one and expired things go away. */
export function tick(pos: Position, events: GameEvent[]): void {
  for (let i = 0; i < pos.board.length; i++) {
    const p = pos.board[i];
    if (!p?.status) continue;
    const status: PieceStatus = { ...p.status };
    let dies = false;
    for (const key of TIMED) {
      const value = status[key];
      if (typeof value !== "number") continue;
      const next = value - 1;
      if (key === "poisoned" && next <= 0) dies = true;
      if (next <= 0) delete status[key];
      else (status as Record<string, number>)[key] = next;
    }
    if (dies) {
      pos.board[i] = null;
      events.push({ type: "destroy", square: i, kind: p.kind, color: p.color });
      continue;
    }
    const updated: Piece = { ...p, status: Object.keys(status).length ? status : undefined };
    pos.board[i] = updated;
  }
  if (pos.effects.length) {
    pos.effects = pos.effects
      .map((e) => (e.ttl < 0 ? e : { ...e, ttl: e.ttl - 1 }))
      .filter((e) => e.ttl !== 0);
  }
}

function movesForTurn(pos: Position, color: Color): number {
  const bonus = pos.bonus[color];
  if (bonus.turns > 0) {
    pos.bonus[color] = { turns: bonus.turns - 1, extra: bonus.turns - 1 > 0 ? bonus.extra : 0 };
    return pos.rules.movesPerTurn + bonus.extra;
  }
  return pos.rules.movesPerTurn;
}

/** Hand the turn to the other side, honouring Deep Freeze skips. */
export function endTurn(pos: Position, events: GameEvent[]): void {
  const mover = pos.turn;
  tick(pos, events);
  if (mover === "b") pos.fullmove++;
  let next = opposite(mover);
  // A frozen side still gets to answer a check, otherwise the skip would let
  // the other player simply capture the king.
  if (pos.skip[next] > 0 && !(pos.rules.checkRules && inCheck(pos, next))) {
    pos.skip[next]--;
    events.push({ type: "skip", color: next });
    tick(pos, events);
    if (next === "b") pos.fullmove++;
    next = mover;
  }
  pos.turn = next;
  pos.movesLeft = movesForTurn(pos, next);
}

/**
 * Called after every move. In multi move modes the turn continues until the
 * moves run out, but giving check always ends it (Marseillais rule), which
 * stops a double move from capturing a king that just got checked.
 */
export function afterMove(pos: Position, gaveCheck: boolean, events: GameEvent[]): void {
  pos.movesLeft--;
  if (pos.movesLeft <= 0 || gaveCheck) endTurn(pos, events);
}
