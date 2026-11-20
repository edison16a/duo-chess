/** Turns a room config into a fresh game. Runs on the host when the game starts. */

import { createGame, createPosition, DEFAULT_RULES, standardLayout, type GameState, type Layout, type Rules } from "@/engine";
import { PREMADE_MAPS, type ChessMap } from "@/features/maps";
import { MODE_BY_ID } from "./catalog";
import type { DraftStyle } from "@/features/powers/draft";
import type { AnalysisKind, ModeId, Mods } from "./types";

export interface GameConfig {
  mode: ModeId;
  mods: Mods;
  mapId: string;
  /** Full map data when the host picked one of their own maps. */
  customMap: ChessMap | null;
  hostColor: "w" | "b" | "random";
  /** How the superpower draft runs. */
  draftStyle: DraftStyle;
  /** Powers each player goes into the game with. */
  powersEach: number;
}

/** Map id meaning "the mode's own board". Every mode but Custom Map starts on it. */
export const STANDARD_MAP = "standard";

export function resolveMap(config: GameConfig): ChessMap {
  if (config.customMap && config.customMap.id === config.mapId) return config.customMap;
  return PREMADE_MAPS.find((m) => m.id === config.mapId) ?? PREMADE_MAPS[0];
}

/**
 * The map a game is played on, or null for the mode's own board. Any mode
 * can run on a map; Custom Map is the one mode that always needs one.
 */
export function activeMap(config: GameConfig): ChessMap | null {
  if (MODE_BY_ID[config.mode].usesMap) return resolveMap(config);
  const id = config.mapId ?? STANDARD_MAP;
  if (id === STANDARD_MAP) return null;
  if (config.customMap?.id === id) return config.customMap;
  return PREMADE_MAPS.find((m) => m.id === id) ?? null;
}

export function rulesFor(config: GameConfig): Rules {
  const mode = MODE_BY_ID[config.mode];
  const map = activeMap(config);
  return { ...DEFAULT_RULES, ...mode.rules, ...(map?.rules ?? {}) };
}

export function buildGame(config: GameConfig, random: () => number = Math.random): GameState {
  const mode = MODE_BY_ID[config.mode];
  let layout: Layout = mode.layout ? mode.layout(random) : standardLayout();
  const map = activeMap(config);
  if (map) {
    layout = { width: map.width, height: map.height, pieces: map.pieces, holes: map.holes };
  }
  // In duck mode the duck starts off the board and lands after White's first move.
  return createGame(createPosition(layout, rulesFor(config)));
}

/** Stockfish only understands the plain 8x8 game, so a mode played on a map falls back to our own search. */
export function analysisFor(config: GameConfig): AnalysisKind {
  return activeMap(config) ? "internal" : MODE_BY_ID[config.mode].analysis;
}

export function usesStockfish(config: GameConfig): boolean {
  return analysisFor(config) === "stockfish";
}

export function effectiveMoveTimer(config: GameConfig): number {
  return MODE_BY_ID[config.mode].moveTimer ?? config.mods.moveTimer;
}
