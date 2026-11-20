/**
 * Effect detail and rating display settings, plus the plain square flashes
 * that stand in for full effects on low detail. Kept free of three.js so
 * the flat board can use it without loading the 3D code.
 */

import type { GameEvent, RatingId } from "@/engine";
import type { Mods } from "@/features/modes";

export type FxLevel = "full" | "low";
/** Minimal shows the badge on the board but skips the glow, shake, burst and sound. */
export type RatingsShow = "off" | "list" | "minimal" | "board";

/** A rating shown on the board. Quiet marks get the badge and nothing else. */
export interface RatingMark {
  square: number;
  id: RatingId;
  key: string;
  quiet?: boolean;
}

export function fxLevel(mods: Mods): FxLevel {
  return mods.fx === "low" ? "low" : "full";
}

/** Rooms from before the setting stored a plain on or off, which meant the full board display. */
export function ratingsShow(mods: Mods): RatingsShow {
  const value = mods.ratings as RatingsShow | boolean;
  if (value === true) return "board";
  if (value === false) return "off";
  return value;
}

export interface Flash {
  square: number;
  color: string;
}

export const FLASH_RED = "#e5484d";
const FLASH_POWER = "#7c8cff";

/**
 * Low detail effects: blasts turn their squares red, powers tint the
 * squares they touched. Pieces simply vanish because the board redraws.
 */
export function eventFlashes(events: GameEvent[]): Flash[] {
  const out: Flash[] = [];
  for (const e of events) {
    if (e.type === "explosion") e.squares.forEach((square) => out.push({ square, color: FLASH_RED }));
    else if (e.type === "mine" || e.type === "destroy") out.push({ square: e.square, color: FLASH_RED });
    else if (e.type === "power") e.squares.forEach((square) => out.push({ square, color: FLASH_POWER }));
  }
  const seen = new Set<number>();
  return out.filter((f) => !seen.has(f.square) && seen.add(f.square));
}
