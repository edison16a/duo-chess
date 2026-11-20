import type { Layout, Rules } from "@/engine";

export type ModeId =
  | "classic" | "chess960" | "atomic" | "superpowers" | "double" | "triple"
  | "lightning" | "koth" | "three-check" | "antichess" | "crazyhouse"
  | "fog" | "duck" | "custom";

/** Which evaluator rates moves: real Stockfish for standard rules, our own search otherwise. */
export type AnalysisKind = "stockfish" | "internal";

export interface ModeDef {
  id: ModeId;
  name: string;
  /** One short line shown on the mode card. */
  blurb: string;
  /** A few plain sentences for the how to play sheet. */
  howTo: string[];
  rules: Partial<Rules>;
  analysis: AnalysisKind;
  powers?: boolean;
  fog?: boolean;
  /** Forced per move timer in seconds (Lightning). */
  moveTimer?: number;
  usesMap?: boolean;
  /** Builds the starting layout; standard setup when absent. */
  layout?: (random: () => number) => Layout;
}

export interface ClockSetting {
  minutes: number;
  increment: number;
}

/** Toggles that stack on top of any mode. */
export interface Mods {
  clock: ClockSetting | null;
  ratings: boolean;
  evalBar: boolean;
  /** Seconds per move before a random move is played for you. 0 is off. */
  moveTimer: number;
  blindfold: boolean;
  /** Board the game is played on. The host picks it for both players. */
  view: "2d" | "3d";
}

export const DEFAULT_MODS: Mods = {
  clock: { minutes: 5, increment: 3 },
  ratings: true,
  evalBar: false,
  moveTimer: 0,
  blindfold: false,
  view: "2d",
};

export const CLOCK_PRESETS: { label: string; value: ClockSetting | null }[] = [
  { label: "1+0", value: { minutes: 1, increment: 0 } },
  { label: "3+2", value: { minutes: 3, increment: 2 } },
  { label: "5+3", value: { minutes: 5, increment: 3 } },
  { label: "10+0", value: { minutes: 10, increment: 0 } },
  { label: "30+0", value: { minutes: 30, increment: 0 } },
  { label: "None", value: null },
];

export const MOVE_TIMER_PRESETS = [0, 1, 3, 5, 10, 30];
