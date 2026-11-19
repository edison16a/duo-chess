import type { Color, GameEvent, PieceKind, Position } from "@/engine";

export type Rarity = "rare" | "epic" | "legendary" | "mythical" | "chromatic";

/** Which animation family the board plays when the power fires. */
export type PowerVfx =
  | "frost" | "shield" | "storm" | "fire" | "arcane" | "void"
  | "holy" | "earth" | "smoke" | "rainbow" | "speed";

/** Mutable working state handed to a power while it resolves. */
export interface PowerCtx {
  pos: Position;
  color: Color;
  enemy: Color;
  squares: number[];
  events: GameEvent[];
  random: () => number;
  lost: Record<Color, PieceKind[]>;
}

/** One click the player has to make when aiming a power. */
export interface TargetStep {
  label: string;
  /** Whether `square` is a valid pick given the picks made so far. */
  valid: (ctx: Omit<PowerCtx, "events" | "random">, square: number) => boolean;
}

export interface PowerDef {
  id: string;
  name: string;
  rarity: Rarity;
  blurb: string;
  vfx: PowerVfx;
  /** Powers that move or destroy things replace your move for the turn. */
  costsMove: boolean;
  targets: TargetStep[];
  /** Optional extra check before aiming, for powers that need something to exist. */
  available?: (ctx: Omit<PowerCtx, "events" | "random" | "squares">) => boolean;
  /** Returns an error string to reject, or nothing on success. */
  apply: (ctx: PowerCtx) => string | void;
}
