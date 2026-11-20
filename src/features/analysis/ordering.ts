/**
 * Move ordering for the built in search. Alpha beta only prunes well when
 * the strongest move is tried first, so we sort by the usual cheap hints:
 * winning captures (MVV-LVA), promotions, killer moves that refuted a
 * sibling at the same ply, and a history score for quiet moves that
 * caused cutoffs anywhere in the tree.
 */

import { PIECES, isCapture, type Move, type Position } from "@/engine";

/** Captures always sort ahead of quiet moves, which must capture rules rely on. */
export const CAPTURE_BASE = 1_000_000;
const PROMOTION_BASE = 900_000;
const KILLER_BASE = 800_000;
/** History scores are capped below the killers so the bands never mix. */
const HISTORY_CAP = 700_000;

export function sameMoveLoose(a: Move, b: Move): boolean {
  return a.from === b.from && a.to === b.to && a.promotion === b.promotion && a.drop === b.drop;
}

export class Ordering {
  /** Two killer slots per ply. */
  private killers: (Move | undefined)[][] = [];
  private history = new Map<number, number>();

  constructor(private squares: number) {}

  private key(m: Move): number {
    return (m.from + 1) * (this.squares + 1) + m.to;
  }

  /** Remembers a quiet move that caused a beta cutoff. */
  reward(m: Move, ply: number, depth: number, capture: boolean): void {
    if (capture) return;
    const slots = (this.killers[ply] ??= []);
    if (!slots[0] || !sameMoveLoose(slots[0], m)) {
      slots[1] = slots[0];
      slots[0] = m;
    }
    const k = this.key(m);
    this.history.set(k, Math.min(HISTORY_CAP, (this.history.get(k) ?? 0) + depth * depth));
  }

  weight(pos: Position, m: Move, ply: number): number {
    if (isCapture(pos, m)) {
      const victim = pos.board[m.epVictim ?? m.to];
      const attacker = pos.board[m.from];
      const victimValue = victim ? PIECES[victim.kind].value || 2000 : 100;
      const attackerValue = attacker ? PIECES[attacker.kind].value : 0;
      return CAPTURE_BASE + victimValue * 10 - attackerValue / 10;
    }
    if (m.promotion) return PROMOTION_BASE + PIECES[m.promotion].value;
    const slots = this.killers[ply];
    if (slots?.[0] && sameMoveLoose(slots[0], m)) return KILLER_BASE + 2;
    if (slots?.[1] && sameMoveLoose(slots[1], m)) return KILLER_BASE + 1;
    return this.history.get(this.key(m)) ?? 0;
  }

  /** Returns a new array sorted best first. */
  sort(pos: Position, moves: Move[], ply: number): Move[] {
    const scored = moves.map((m) => ({ m, w: this.weight(pos, m, ply) }));
    scored.sort((a, b) => b.w - a.w);
    return scored.map((s) => s.m);
  }
}
