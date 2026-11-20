/**
 * Superpower decisions: what to keep in the draft and how to aim a power.
 * Targets are found with the power's own validity checks, one step at a
 * time, exactly like a player clicking squares.
 */

import { PIECES, neighbors, opposite, type Color, type GameState, type PieceKind, type Position } from "@/engine";
import { ALL_POWERS, POWERS, RARITIES, RARITY_COST, canUsePowerNow, deckBudget, readyPowers, type DraftState, type PowerDef } from "@/features/powers";
import { randomItem, shuffle } from "./pick";

export interface PowerPlan {
  power: string;
  squares: number[];
}

/**
 * The bot's draft answer. From offered cards it takes the rarest, which in
 * a Split draft also hands the most common one to the opponent. In Free
 * Deck it builds a whole hand.
 */
export function chooseDraft(draft: DraftState, color: Color, random: () => number): string[] {
  if (draft.style === "deck") return buildDeck(draft.size, random);
  // The random part is below one rarity step, so it only breaks ties.
  const ranked = draft.options[color]
    .map((id) => ({ id, rank: RARITIES.indexOf(POWERS[id]?.rarity ?? "rare") + random() * 0.5 }))
    .sort((a, b) => b.rank - a.rank);
  return [ranked[0].id];
}

/**
 * Spreads the budget evenly: each slot aims at what is left divided by the
 * slots left, so the bot never blows everything on one card and then has
 * to fill the rest with nothing.
 */
export function buildDeck(size: number, random: () => number): string[] {
  const deck: string[] = [];
  let left = deckBudget(size);
  for (let slot = 0; slot < size; slot++) {
    const slotsLeft = size - slot;
    const target = Math.max(1, Math.min(5, Math.floor(left / slotsLeft)));
    const pool = ALL_POWERS.filter((p) => !deck.includes(p.id) && RARITY_COST[p.rarity] <= target);
    const best = Math.max(...pool.map((p) => RARITY_COST[p.rarity]));
    const pick = randomItem(pool.filter((p) => RARITY_COST[p.rarity] === best), random);
    deck.push(pick.id);
    left -= RARITY_COST[pick.rarity];
  }
  return deck;
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
  // Only ready powers count, so in Random style the bot waits out cooldowns like anyone else.
  for (const id of shuffle([...new Set(readyPowers(game.powers, color))], random)) {
    const def = POWERS[id];
    if (!def || (def.available && !def.available(base))) continue;
    const squares = aimTargets(def, base, aim, random);
    if (squares) return { power: id, squares };
  }
  return null;
}
