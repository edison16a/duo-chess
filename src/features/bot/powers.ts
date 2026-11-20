/**
 * Superpower decisions: what to keep in the draft and how to aim a power.
 * Targets are found with the power's own validity checks, one step at a
 * time, exactly like a player clicking squares.
 */

import { PIECES, neighbors, opposite, type Color, type GameState, type PieceKind, type Position } from "@/engine";
import { POWERS, RARITIES, canUsePowerNow, type PowerDef } from "@/features/powers";
import { randomItem, shuffle } from "./pick";

export interface PowerPlan {
  power: string;
  squares: number[];
}

/** Keep the rarest option and hand the most common one to the opponent. */
export function chooseDraft(options: string[], random: () => number): { keep: string; give: string } {
  // The random part is below one rarity step, so it only breaks ties.
  const ranked = options
    .map((id) => ({ id, rank: RARITIES.indexOf(POWERS[id]?.rarity ?? "rare") + random() * 0.5 }))
    .sort((a, b) => b.rank - a.rank);
  return { keep: ranked[0].id, give: ranked[ranked.length - 1].id };
}

interface AimBase {
  pos: Position;
  color: Color;
  enemy: Color;
  lost: Record<Color, PieceKind[]>;
}

function pieceWorth(pos: Position, square: number, enemy: Color): number {
  const p = pos.board[square];
  if (!p || p.color === "n" || PIECES[p.kind].royal) return 0;
  return p.color === enemy ? PIECES[p.kind].value : -PIECES[p.kind].value;
}

/**
 * How good a square looks as a target. Pieces on the square count fully
 * (own pieces too, since buffs want valuable friends) and the area around
 * it counts a little, which steers area powers into enemy crowds.
 */
function targetScore(pos: Position, square: number, enemy: Color): number {
  const p = pos.board[square];
  const own = p && p.color !== "n" && p.color !== enemy ? PIECES[p.kind].value * 0.6 : 0;
  const direct = Math.max(0, pieceWorth(pos, square, enemy)) + own;
  const area = neighbors(pos, square).reduce((sum, s) => sum + pieceWorth(pos, s, enemy), 0);
  return direct + 0.1 * area;
}

function aimTargets(def: PowerDef, base: AimBase, aim: number, random: () => number): number[] | null {
  const squares: number[] = [];
  for (const step of def.targets) {
    const ctx = { ...base, squares: squares.slice() };
    const options: number[] = [];
    for (let s = 0; s < base.pos.board.length; s++) {
      if (!squares.includes(s) && !base.pos.holes.includes(s) && step.valid(ctx, s)) options.push(s);
    }
    if (!options.length) return null;
    if (random() < aim) {
      const scored = options.map((s) => ({ s, v: targetScore(base.pos, s, base.enemy) + random() * 20 }));
      squares.push(scored.reduce((a, b) => (b.v > a.v ? b : a)).s);
    } else {
      squares.push(randomItem(options, random));
    }
  }
  return squares;
}

/**
 * A power to fire this turn with its targets, or null when none can be
 * aimed. The host still validates it; if it is refused the bot just moves.
 */
export function planPower(game: GameState, color: Color, aim: number, random: () => number): PowerPlan | null {
  if (!game.powers || !canUsePowerNow(game, color)) return null;
  const base: AimBase = { pos: game.pos, color, enemy: opposite(color), lost: game.lost };
  for (const id of shuffle([...new Set(game.powers.inventory[color])], random)) {
    const def = POWERS[id];
    if (!def || (def.available && !def.available(base))) continue;
    const squares = aimTargets(def, base, aim, random);
    if (squares) return { power: id, squares };
  }
  return null;
}
