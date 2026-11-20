/**
 * Turns one Elo number into concrete engine settings. Everything here is
 * pure so the mapping can be unit tested and tuned without a browser.
 */

export const BOT_ID = "bot";
export const MIN_ELO = 400;
export const MAX_ELO = 3000;
export const DEFAULT_ELO = 1200;
export const ELO_STEP = 50;

/** The lowest UCI_Elo Stockfish accepts. Weaker bots need our own handicap. */
export const STOCKFISH_MIN_ELO = 1320;

export const ELO_PRESETS = [
  { label: "Beginner", elo: 600 },
  { label: "Casual", elo: 1000 },
  { label: "Club", elo: 1500 },
  { label: "Expert", elo: 2000 },
  { label: "Master", elo: 2500 },
] as const;

export function clampElo(elo: number): number {
  if (!Number.isFinite(elo)) return DEFAULT_ELO;
  const stepped = Math.round(elo / ELO_STEP) * ELO_STEP;
  return Math.min(MAX_ELO, Math.max(MIN_ELO, stepped));
}

export function botName(elo: number): string {
  return `Bot ${clampElo(elo)}`;
}

/** 0 at the weakest setting, 1 at the strongest. Most curves below hang off this. */
export function strength(elo: number): number {
  return (clampElo(elo) - MIN_ELO) / (MAX_ELO - MIN_ELO);
}

/** The preset a rating is closest to, used as a friendly label next to the number. */
export function levelLabel(elo: number): string {
  const e = clampElo(elo);
  let best: (typeof ELO_PRESETS)[number] = ELO_PRESETS[0];
  for (const preset of ELO_PRESETS) {
    if (Math.abs(preset.elo - e) < Math.abs(best.elo - e)) best = preset;
  }
  return best.label;
}

export interface StockfishStrength {
  /** UCI_Elo cap, or null when the rating is below what Stockfish supports. */
  elo: number | null;
  skill: number;
  /** Chance of skipping the engine and playing any legal move. */
  randomChance: number;
  movetime: number;
}

/**
 * Stockfish can only weaken itself down to about 1320. Below that we play
 * at Skill Level 0 and mix in random moves, more of them the lower we go.
 */
export function stockfishStrength(elo: number): StockfishStrength {
  const e = clampElo(elo);
  const movetime = Math.round(300 + 500 * strength(e));
  if (e >= STOCKFISH_MIN_ELO) return { elo: e, skill: 20, randomChance: 0, movetime };
  const gap = (STOCKFISH_MIN_ELO - e) / (STOCKFISH_MIN_ELO - MIN_ELO);
  return { elo: null, skill: 0, randomChance: 0.6 * gap, movetime };
}

export interface SearchStrength {
  depth: number;
  /**
   * Softmax temperature in centipawns. A move this far below the best one
   * is picked about a third as often, so high values mean more blunders.
   */
  temperature: number;
}

/** Settings for the built in search that plays every variant. */
export function searchStrength(elo: number): SearchStrength {
  const e = clampElo(elo);
  const depth = e < 1000 ? 1 : e < 1900 ? 2 : 3;
  const temperature = 10 + 290 * Math.pow(1 - strength(e), 1.5);
  return { depth, temperature };
}

/** Chance per turn that the bot fires a superpower before moving. */
export function powerChance(elo: number): number {
  return 0.15 + 0.3 * strength(elo);
}

/** How often the bot aims at the best looking target instead of any valid one. */
export function aimSkill(elo: number): number {
  return 0.3 + 0.7 * strength(elo);
}
