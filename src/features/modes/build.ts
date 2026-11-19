/** Turns a room config into a fresh game. Runs on the host when the game starts. */

import { createGame, createPosition, DEFAULT_RULES, standardLayout, type GameState, type Layout, type Rules } from "@/engine";
import { PREMADE_MAPS, type ChessMap } from "@/features/maps";
import { MODE_BY_ID } from "./catalog";
import type { ModeId, Mods } from "./types";

export interface GameConfig {
  mode: ModeId;
  mods: Mods;
  mapId: string;
  /** Full map data when the host picked one of their own maps. */
  customMap: ChessMap | null;
  hostColor: "w" | "b" | "random";
  /** Picks each player makes in the superpower draft. */
  draftRounds: number;
}

export function resolveMap(config: GameConfig): ChessMap {
  if (config.customMap && config.customMap.id === config.mapId) return config.customMap;
  return PREMADE_MAPS.find((m) => m.id === config.mapId) ?? PREMADE_MAPS[0];
}

export function rulesFor(config: GameConfig): Rules {
  const mode = MODE_BY_ID[config.mode];
  const map = mode.usesMap ? resolveMap(config) : null;
  return { ...DEFAULT_RULES, ...mode.rules, ...(map?.rules ?? {}) };
}

export function buildGame(config: GameConfig, random: () => number = Math.random): GameState {
  const mode = MODE_BY_ID[config.mode];
  let layout: Layout = mode.layout ? mode.layout(random) : standardLayout();
  if (mode.usesMap) {
    const map = resolveMap(config);
    layout = { width: map.width, height: map.height, pieces: map.pieces, holes: map.holes };
  }
  // In duck mode the duck starts off the board and lands after White's first move.
  return createGame(createPosition(layout, rulesFor(config)));
}

/** Stockfish only understands the plain 8x8 game. */
export function usesStockfish(config: GameConfig): boolean {
  return MODE_BY_ID[config.mode].analysis === "stockfish";
}

export function effectiveMoveTimer(config: GameConfig): number {
  return MODE_BY_ID[config.mode].moveTimer ?? config.mods.moveTimer;
}
