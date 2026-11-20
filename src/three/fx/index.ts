/**
 * Maps game events and power ids to 3D effects. Callers place the returned
 * effects at the right square; this file only decides what plays.
 */

import type { GameEvent, RatingId } from "@/engine";
import { POWERS } from "@/features/powers";
import type { Effect } from "./base";
import { CapturePuff, Explosion, Lightning, Shatter } from "./combat";
import { EarthErupt, FireBurst, FrostBurst, SmokeCloud } from "./elements";
import { ArcaneCircle, HolyBeam, RainbowBurst, ShieldPulse, SpeedLines, VoidRift, WarpSwirl } from "./magic";
import { CheckGlow, RatingFx } from "./rating";

export type { Effect, FxContext } from "./base";
export { IceEncase } from "./ice";
export { GhostAura, Halo, PoisonBubbles, ShieldDome, SmokeVeil } from "./status";
export { IceWall, Mine, Portal } from "./terrain";
export { RatingFx, CheckGlow };

/** An effect plus the square it belongs to (-1 means the board centre). */
export interface Placed {
  square: number;
  effect: Effect;
}

/** Hand picked combos for powers whose generic element look is not enough. */
const SPECIAL: Record<string, () => Effect[]> = {
  "deep-freeze": () => [new FrostBurst(1.8), new SpeedLines("#bfe8ff")],
  blizzard: () => [new FrostBurst(1.6)],
  meteor: () => [new Explosion(1.2), new FireBurst(0.35)],
  "chain-lightning": () => [new Lightning("#9fd3ff")],
  lightning: () => [new Lightning()],
  inferno: () => [new FireBurst(0.45)],
  armageddon: () => [new Explosion(0.9), new FireBurst(0.3)],
  supernova: () => [new Explosion(1.6), new RainbowBurst()],
  "black-hole": () => [new VoidRift(1.4)],
  "summon-dragon": () => [new FireBurst(0.4), new HolyBeam("#ff9a4d")],
  genesis: () => [new HolyBeam("#ff6ec7"), new RainbowBurst()],
  shockwave: () => [new ShieldPulse("#8fd3ff", 0.8), new SpeedLines("#bfe8ff")],
  landmine: () => [new EarthErupt()],
  barricade: () => [new EarthErupt()],
  "ice-wall": () => [new FrostBurst(0.8)],
  poison: () => [new VoidRift(0.6)],
};

export function powerEffects(power: string): Effect[] {
  const special = SPECIAL[power];
  if (special) return special();
  switch (POWERS[power]?.vfx) {
    case "frost": return [new FrostBurst()];
    case "fire": return [new FireBurst()];
    case "storm": return [new Lightning()];
    case "earth": return [new EarthErupt()];
    case "smoke": return [new SmokeCloud()];
    case "arcane": return [new ArcaneCircle()];
    case "void": return [new VoidRift()];
    case "holy": return [new HolyBeam()];
    case "shield": return [new ShieldPulse()];
    case "speed": return [new SpeedLines()];
    case "rainbow": return [new RainbowBurst()];
    default: return [new ArcaneCircle()];
  }
}

/** Effects for the events of one action, in the order they should start. */
export function eventEffects(events: GameEvent[]): Placed[] {
  const out: Placed[] = [];
  for (const e of events) {
    switch (e.type) {
      case "explosion": out.push({ square: e.square, effect: new Explosion(1.5) }); break;
      case "capture": if (!events.some((x) => x.type === "explosion")) out.push({ square: e.square, effect: new CapturePuff() }); break;
      case "destroy": out.push({ square: e.square, effect: new Shatter() }); break;
      case "warp": out.push({ square: e.to, effect: new WarpSwirl() }, { square: e.from, effect: new WarpSwirl() }); break;
      case "mine": out.push({ square: e.square, effect: new Explosion(0.8, "red") }); break;
      case "check": out.push({ square: e.square, effect: new CheckGlow() }); break;
      case "promote": out.push({ square: e.square, effect: new HolyBeam("#ffd76a", 3) }); break;
      case "power":
        for (const square of e.squares.length ? e.squares : [-1]) {
          for (const effect of powerEffects(e.power)) out.push({ square, effect });
        }
        break;
      default: break;
    }
  }
  return out;
}

export function ratingEffect(id: RatingId, pieceHeight = 1.1): Effect {
  return new RatingFx(id, pieceHeight);
}
