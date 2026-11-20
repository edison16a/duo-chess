/**
 * Resolves a superpower activation against a game. Runs on the host only,
 * so randomness here is fine: everyone else just receives the result.
 */

import {
  afterMove, finalize, inCheck, legalMoves, opposite, recordLosses, royalSquares, clonePosition, turnKey,
  type Color, type GameEvent, type GameState,
} from "@/engine";
import { POWERS } from "./catalog";
import { readySlot, spendPower } from "./slots";
import type { PowerCtx } from "./types";

export function canUsePowerNow(game: GameState, color: Color): boolean {
  return !!game.powers && !game.result && game.pos.turn === color && game.powers.usedTurn !== turnKey(game.pos);
}

/** Returns the updated game, or an error message to show the player. */
export function activatePower(
  game: GameState,
  color: Color,
  powerId: string,
  squares: number[],
  random: () => number = Math.random,
): GameState | string {
  const def = POWERS[powerId];
  if (!def || !game.powers) return "Unknown power";
  if (!canUsePowerNow(game, color)) return "You can use one power per turn, on your turn";
  if (readySlot(game.powers, color, powerId) < 0) {
    return game.powers.inventory[color].includes(powerId) ? "That power is still recharging" : "You do not have that power";
  }
  if (squares.length !== def.targets.length) return "Pick all the targets first";

  const pos = clonePosition(game.pos);
  const lost = { w: game.lost.w.slice(), b: game.lost.b.slice() };
  const events: GameEvent[] = [];
  const base = { pos, color, enemy: opposite(color), lost };
  if (def.available && !def.available(base)) return "Nothing to use it on yet";
  for (let i = 0; i < def.targets.length; i++) {
    if (!def.targets[i].valid({ ...base, squares: squares.slice(0, i) }, squares[i])) return "That target is not allowed";
  }

  const ctx: PowerCtx = { ...base, squares: squares.slice(), events, random };
  const error = def.apply(ctx);
  if (error) return error;
  events.unshift({ type: "power", power: powerId, color, squares: ctx.squares });

  const checkRules = pos.rules.checkRules;
  if (checkRules && royalSquares(pos, color).length && inCheck(pos, color) && def.costsMove) {
    return "That would leave your king in check";
  }
  if (!def.costsMove && legalMoves(pos).length === 0) return "That would leave you without a move";

  const gaveCheck = checkRules && inCheck(pos, opposite(color));
  if (def.costsMove) afterMove(pos, gaveCheck, events);
  else if (gaveCheck) pos.checks[color]++;

  const withPowers: GameState = {
    ...game,
    lost: recordLosses(lost, game.pos, pos),
    powers: spendPower(game.powers, color, powerId, game.pos, turnKey(game.pos)),
  };
  return finalize(withPowers, pos, events, withPowers.lost, {
    ply: game.history.length,
    color,
    san: def.name,
    move: { from: -1, to: squares[0] ?? -1 },
    kind: "pawn",
    power: powerId,
  }, null);
}
