/** What each power's hero shot shows: the world, the hero piece and the effects. */

import type { PieceKind, Side } from "@/engine";
import type { EnvironmentId } from "../env/types";
import { GhostAura, Halo, IceEncase, IceWall, Mine, PoisonBubbles, Portal, ShieldDome, SmokeVeil, type Effect } from "../fx";
import { Explosion, Lightning } from "../fx/combat";
import { EarthErupt, FireBurst, FrostBurst, SmokeCloud } from "../fx/elements";
import { ArcaneCircle, HolyBeam, RainbowBurst, ShieldPulse, SpeedLines, VoidRift, WarpSwirl } from "../fx/magic";
import type { Shot } from "./cinematic";

export interface ShotSpec {
  env: EnvironmentId;
  hero: [PieceKind, Side];
  extras?: [PieceKind, Side, number, number][];
  burst: () => Effect[];
  burstAt?: [number, number];
  lasting?: () => [Effect, [number, number]?][];
  poster?: number;
  shot?: Shot;
}

const S = (env: EnvironmentId, hero: [PieceKind, Side], burst: () => Effect[], more: Partial<ShotSpec> = {}): ShotSpec => ({ env, hero, burst, ...more });
const behind = (kind: PieceKind, color: Side): [PieceKind, Side, number, number][] => [[kind, color, -0.9, -1.3], [kind, color, 1.0, -1.6]];

export const SHOTS: Record<string, ShotSpec> = {
  frostbite: S("ice-cave", ["knight", "b"], () => [new FrostBurst()], { lasting: () => [[new IceEncase(1.0)]], poster: 1.9 }),
  aegis: S("sanctum", ["bishop", "w"], () => [new ShieldPulse()], { lasting: () => [[new ShieldDome("#ffd76a", 1.05)]], poster: 1.7 }),
  "pawn-storm": S("canyon", ["pawn", "w"], () => [new EarthErupt(), new SpeedLines("#ffd9a8")], { extras: [["pawn", "w", -0.9, -0.4], ["pawn", "w", 0.9, -0.5]], poster: 0.8 }),
  reinforce: S("temple", ["pawn", "w"], () => [new HolyBeam()], { poster: 1.5 }),
  sidestep: S("tunnel", ["rook", "w"], () => [new SpeedLines()], { poster: 0.7 }),
  swap: S("arcane", ["knight", "w"], () => [new WarpSwirl(), new ArcaneCircle()], { extras: [["bishop", "w", 1.0, -0.6]], poster: 0.9 }),
  barricade: S("canyon", ["pawn", "b"], () => [new EarthErupt()], { burstAt: [-0.6, 0.4], lasting: () => [[new IceWall(), [-0.6, 0.4]]], poster: 1.4 }),
  landmine: S("canyon", ["pawn", "b"], () => [new EarthErupt()], { burstAt: [0.5, 0.6], lasting: () => [[new Mine(), [0.5, 0.6]]], poster: 1.4 }),
  squire: S("temple", ["knight", "w"], () => [new HolyBeam()], { poster: 1.5 }),
  recall: S("arcane", ["rook", "w"], () => [new WarpSwirl(), new ArcaneCircle("#7fc8ff")], { poster: 0.9 }),
  "smoke-screen": S("marsh", ["queen", "w"], () => [new SmokeCloud("#8c8c8c", 0.7)], { lasting: () => [[new SmokeVeil()]], poster: 2.8 }),
  pushback: S("storm", ["bishop", "b"], () => [new ShieldPulse("#8fd3ff", 0.8), new SpeedLines("#bfe8ff")], { poster: 0.6 }),
  fortify: S("sanctum", ["pawn", "w"], () => [new ShieldPulse()], { extras: behind("pawn", "w"), lasting: () => [[new ShieldDome("#ffd76a", 0.75)]], poster: 1.5 }),
  leapfrog: S("tunnel", ["knight", "w"], () => [new SpeedLines(), new WarpSwirl("#7fc8ff")], { poster: 0.7 }),
  sprint: S("tunnel", ["pawn", "w"], () => [new SpeedLines(), new SpeedLines("#bfe8ff")], { poster: 0.6 }),
  "ice-wall": S("ice-cave", ["rook", "w"], () => [new FrostBurst(0.8)], { burstAt: [-0.7, 0.5], lasting: () => [[new IceWall(), [-0.7, 0.5]]], poster: 1.5 }),
  teleport: S("arcane", ["queen", "w"], () => [new WarpSwirl(), new ArcaneCircle()], { poster: 0.9 }),
  lightning: S("storm", ["pawn", "b"], () => [new Lightning()], { poster: 0.38 }),
  "knights-blessing": S("temple", ["bishop", "w"], () => [new HolyBeam()], { lasting: () => [[new Halo(1.1)]], poster: 1.6 }),
  "ghost-walk": S("marsh", ["rook", "w"], () => [new SmokeCloud("#c9d2ff", 0.4)], { lasting: () => [[new GhostAura(0.9)]], poster: 2.8 }),
  shrink: S("arcane", ["knight", "b"], () => [new ArcaneCircle(), new VoidRift(0.6)], { poster: 1.5 }),
  ascend: S("temple", ["rook", "w"], () => [new HolyBeam()], { poster: 1.5 }),
  "double-down": S("tunnel", ["knight", "w"], () => [new SpeedLines(), new SpeedLines("#7fc8ff")], { poster: 0.6 }),
  portal: S("void", ["pawn", "w"], () => [new WarpSwirl()], { burstAt: [0.6, 0.5], lasting: () => [[new Portal(), [0.6, 0.5]]], poster: 1.5 }),
  shockwave: S("storm", ["queen", "w"], () => [new ShieldPulse("#8fd3ff", 0.9), new SpeedLines("#bfe8ff")], { poster: 0.55 }),
  revive: S("temple", ["rook", "w"], () => [new HolyBeam(), new WarpSwirl("#ffd76a")], { poster: 1.5 }),
  poison: S("marsh", ["knight", "b"], () => [new VoidRift(0.6)], { lasting: () => [[new PoisonBubbles(1.0)]], poster: 1.5 }),
  "deep-freeze": S("ice-cave", ["king", "b"], () => [new FrostBurst(1.8)], { lasting: () => [[new IceEncase(1.35)]], poster: 1.9 }),
  meteor: S("volcano", ["rook", "b"], () => [new Explosion(0.75), new FireBurst(0.35)], { poster: 0.42 }),
  coronation: S("temple", ["queen", "w"], () => [new HolyBeam(), new RainbowBurst()], { poster: 1.55 }),
  clone: S("arcane", ["knight", "w"], () => [new WarpSwirl()], { extras: [["knight", "w", 0.95, -0.5]], burstAt: [0.95, -0.5], poster: 1.0 }),
  "chain-lightning": S("storm", ["pawn", "b"], () => [new Lightning("#9fd3ff")], { extras: behind("pawn", "b"), poster: 0.45 }),
  bulwark: S("sanctum", ["king", "w"], () => [new ShieldPulse("#ffd76a", 0.8)], { extras: behind("pawn", "w"), lasting: () => [[new ShieldDome("#ffd76a", 1.35)]], poster: 1.5 }),
  "summon-knight": S("temple", ["knight", "w"], () => [new HolyBeam()], { poster: 1.5 }),
  blizzard: S("ice-cave", ["bishop", "b"], () => [new FrostBurst(1.6)], { extras: behind("pawn", "b"), lasting: () => [[new IceEncase(1.05)]], poster: 1.8 }),
  exile: S("void", ["bishop", "b"], () => [new WarpSwirl(), new ArcaneCircle("#a35bf0")], { poster: 1.2 }),
  inferno: S("volcano", ["pawn", "b"], () => [new FireBurst(0.5)], { extras: behind("pawn", "b"), poster: 0.9 }),
  curse: S("void", ["pawn", "b"], () => [new ArcaneCircle("#a35bf0"), new WarpSwirl("#7a4bc4")], { lasting: () => [[new PoisonBubbles(0.7)]], poster: 1.3 }),
  "summon-dragon": S("volcano", ["dragon", "w"], () => [new FireBurst(0.45), new HolyBeam("#ff9a4d")], { poster: 1.6 }),
  overclock: S("tunnel", ["queen", "w"], () => [new SpeedLines(), new ArcaneCircle("#7fe0ff")], { poster: 0.7 }),
  armageddon: S("volcano", ["pawn", "b"], () => [new Explosion(0.8)], { extras: behind("pawn", "w"), poster: 0.45 }),
  "black-hole": S("void", ["queen", "b"], () => [new VoidRift(1.4)], { poster: 1.72 }),
  possession: S("arcane", ["knight", "w"], () => [new VoidRift(0.6), new ArcaneCircle("#a35bf0")], { poster: 1.0 }),
  resurrection: S("temple", ["queen", "w"], () => [new HolyBeam(), new RainbowBurst()], { poster: 1.6 }),
  "mirror-image": S("prism", ["bishop", "w"], () => [new ArcaneCircle("#ff6ec7"), new WarpSwirl("#7fe0ff")], { poster: 1.0 }),
  "prismatic-burst": S("prism", ["rook", "w"], () => [new RainbowBurst()], { poster: 1.55 }),
  supernova: S("void", ["knight", "w"], () => [new Explosion(0.75), new RainbowBurst()], { poster: 0.42 }),
  infinity: S("prism", ["king", "w"], () => [new RainbowBurst(), new SpeedLines("#ff6ec7")], { poster: 1.55 }),
  "rainbow-bridge": S("prism", ["queen", "w"], () => [new RainbowBurst()], { lasting: () => [[new ShieldDome("#ff6ec7", 1.25)]], poster: 1.8 }),
  genesis: S("prism", ["amazon", "w"], () => [new HolyBeam("#ff6ec7"), new RainbowBurst()], { poster: 1.75 }),
};
