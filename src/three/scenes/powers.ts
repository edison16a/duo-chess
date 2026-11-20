/**
 * A short looping scene for every power, used as card art and in the hover
 * preview. Powers are grouped by what they do (freeze, destroy, move,
 * transform, summon, shield, terrain, tempo) and each group has a small
 * choreography on a close up corner of the board.
 */

import { ALL_POWERS, POWERS } from "@/features/powers";
import type { PieceKind } from "@/engine";
import { GhostAura, Halo, IceEncase, IceWall, Mine, PoisonBubbles, Portal, powerEffects, ShieldDome, SmokeVeil } from "../fx";
import { Shatter } from "../fx/combat";
import { WarpSwirl } from "../fx/magic";
import type { Director } from "./director";
import { cue, scripted } from "./scripted";
import type { SceneDef } from "./types";

/** White to play on the near side, the target on d5 (enemy) or d4 (own). */
const FEN = "8/2p1kp2/2n5/3b4/3N4/2P1Q3/3K4/8";

/** Where the power lands, and what happens to the board a beat later. */
interface Plan {
  at: string;
  then?: (d: Director) => void;
  /** When the still poster looks best: after ice forms, at the moment of impact, and so on. */
  poster?: number;
}

type Lasting = Parameters<Director["attach"]>[0];
const lasting = (make: () => Lasting, at: string): Plan => ({ at, poster: 1.7, then: (d) => d.attach(make(), at, true) });
const destroy = (at: string): Plan => ({ at, poster: 0.62, then: (d) => { d.kill(at); d.fx(new Shatter(at === "c3" ? "#e9dfcd" : "#3a3634"), at); } });
const relocate = (from: string, to: string): Plan => ({ at: from, poster: 1.0, then: (d) => { d.fx(new WarpSwirl(), to); d.move(from, to, 0.35, 0.6); } });
const morph = (at: string, kind: PieceKind, color: "w" | "b"): Plan => ({ at, poster: 1.4, then: (d) => d.morph(at, kind, color) });
const summon = (at: string, kind: PieceKind): Plan => ({ at, poster: 1.4, then: (d) => void d.spawn(kind, "w", at) });
const terrain = (make: () => Lasting, at: string): Plan => ({ at, poster: 1.6, then: (d) => d.attach(make(), at) });
const burst = (at: string): Plan => ({ at, poster: 0.75 });

const PLANS: Record<string, Plan> = {
  frostbite: lasting(() => new IceEncase(1.0), "d5"), "deep-freeze": lasting(() => new IceEncase(1.2), "e7"), blizzard: lasting(() => new IceEncase(1.0), "c6"),
  aegis: lasting(() => new ShieldDome("#ffd76a", 1.05), "d4"), fortify: lasting(() => new ShieldDome("#ffd76a", 0.7), "c3"), bulwark: lasting(() => new ShieldDome("#ffd76a", 1.2), "e3"),
  "rainbow-bridge": lasting(() => new ShieldDome("#ff6ec7", 1.2), "e3"), "ghost-walk": lasting(() => new GhostAura(1.1), "d4"),
  poison: lasting(() => new PoisonBubbles(1.0), "d5"), "knights-blessing": lasting(() => new Halo(1.2), "e3"), "smoke-screen": lasting(() => new SmokeVeil(), "d4"),
  lightning: destroy("c7"), "chain-lightning": destroy("f7"), meteor: destroy("c6"), inferno: destroy("c7"), armageddon: destroy("c3"),
  "black-hole": destroy("d5"), supernova: destroy("d5"), curse: morph("d5", "pawn", "b"), shrink: morph("c6", "pawn", "b"),
  possession: morph("c6", "knight", "w"), squire: morph("c3", "knight", "w"), ascend: morph("c3", "rook", "w"), coronation: morph("c3", "queen", "w"),
  "mirror-image": morph("c3", "bishop", "w"), "prismatic-burst": morph("c3", "rook", "w"),
  sidestep: relocate("d4", "e4"), swap: relocate("d4", "e3"), recall: relocate("d4", "d1"), leapfrog: relocate("d4", "d6"), sprint: relocate("c3", "c5"),
  teleport: relocate("d4", "g6"), pushback: relocate("d5", "d6"), shockwave: relocate("d5", "d6"), exile: relocate("d5", "d8"), "pawn-storm": relocate("c3", "c4"),
  reinforce: summon("b4", "pawn"), "summon-knight": summon("f4", "knight"), "summon-dragon": summon("f4", "dragon"), genesis: summon("f4", "amazon"),
  clone: summon("e4", "knight"), revive: summon("f1", "rook"), resurrection: summon("f1", "queen"),
  barricade: terrain(() => new IceWall(), "d6"), "ice-wall": terrain(() => new IceWall(), "e6"), landmine: terrain(() => new Mine(), "e5"), portal: terrain(() => new Portal(), "f5"),
  "double-down": burst("d4"), overclock: burst("d4"), infinity: burst("e3"),
};

function focus(square: string): [number, number, number] {
  const x = "abcdefgh".indexOf(square[0]) - 3.5;
  const z = 3.5 - (Number(square[1]) - 1);
  return [x * 0.85, 0.45, z * 0.85];
}

export function powerScene(id: string): SceneDef {
  const plan = PLANS[id] ?? burst("d4");
  return scripted({
    duration: 3.2,
    fen: FEN,
    bloom: 0.55,
    poster: plan.poster ?? 0.85,
    // Aim the camera at the square the power lands on, so every card frames its own action.
    camera: { radius: 4.1, height: 3.1, speed: 0.07, start: -0.55, target: focus(plan.at) },
    cues: [
      cue(0.35, (d) => powerEffects(id).forEach((fx) => d.fx(fx, plan.at))),
      cue(0.75, (d) => plan.then?.(d)),
    ],
  });
}

/** Every power has a scene; this guards the plan table against typos. */
export const POWER_SCENE_IDS = ALL_POWERS.map((p) => p.id).filter((id) => POWERS[id]);
