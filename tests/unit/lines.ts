import { legalMoves, moveToSan, playMove, type GameState, type Move } from "@/engine";
import { DEFAULT_MODS, buildGame, type ModeId } from "@/features/modes";
import { createRoom } from "@/features/room/reducer";

/** A fresh game in a mode, built the same way a room builds it. */
export function newGame(mode: ModeId): GameState {
  const config = { ...createRoom("TEST", "me", "Me", 0).config, mode, mods: { ...DEFAULT_MODS, clock: null } };
  return buildGame(config, () => 0.5);
}

/** Finds the legal move with this SAN, ignoring check and mate marks. */
export function sanMove(game: GameState, san: string): Move {
  const clean = (s: string) => s.replace(/[+#]/g, "");
  const move = legalMoves(game.pos).find((m) => clean(moveToSan(game.pos, m)) === clean(san));
  if (!move) throw new Error(`no legal move ${san}`);
  return move;
}

/** Plays a list of SAN moves and returns every game state along the way, start included. */
export function playLine(game: GameState, sans: string[]): GameState[] {
  const states = [game];
  for (const san of sans) {
    const next = playMove(states[states.length - 1], sanMove(states[states.length - 1], san));
    if (!next) throw new Error(`illegal ${san}`);
    states.push(next);
  }
  return states;
}
