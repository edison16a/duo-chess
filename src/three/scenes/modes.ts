/**
 * One short looping scene per game mode, used for the animated mode cards.
 * Each shows what makes the mode special: explosions for Atomic, powers for
 * Superpowers, the duck waddling around for Duck, and so on.
 */

import { CapturePuff, Explosion, Lightning } from "../fx/combat";
import { FireBurst, FrostBurst } from "../fx/elements";
import { ArcaneCircle, HolyBeam, RainbowBurst, ShieldPulse, SpeedLines, WarpSwirl } from "../fx/magic";
import { CheckGlow, IceEncase, RatingFx, ShieldDome } from "../fx";
import { cue, scripted } from "./scripted";
import type { SceneDef } from "./types";
import { FogBank } from "./fogBank";

const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR";
const ITALIAN = "r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R";
const low = { radius: 9.6, height: 5.2, start: 0.18, target: [0, -0.2, 0.2] as [number, number, number] };

export const MODE_SCENES: Record<string, () => SceneDef> = {
  classic: () => scripted({
    duration: 6, fen: START, camera: low,
    cues: [
      cue(0.3, (d) => d.move("e2", "e4")), cue(1.1, (d) => d.move("e7", "e5")),
      cue(1.9, (d) => d.move("g1", "f3", 0.5, 0.6)), cue(2.7, (d) => d.move("b8", "c6", 0.5, 0.6)),
      cue(3.5, (d) => d.move("f1", "c4")), cue(4.3, (d) => d.move("g8", "f6", 0.5, 0.6)),
      cue(5.0, (d) => d.fx(new RatingFx("best"), "f6")),
    ],
  }),
  atomic: () => scripted({
    duration: 6, fen: ITALIAN, camera: { radius: 7.5, height: 4.5, target: [0.6, 0, -0.8] },
    cues: [
      cue(0.5, (d) => d.move("f3", "g5", 0.5, 0.6)),
      cue(1.8, (d) => d.move("f3", "f7", 0.5, 0.6)),
      cue(2.3, (d) => { d.fx(new Explosion(1.7), "f7"); ["f3", "f7", "e8", "f6", "d8"].forEach((n) => d.kill(n)); }),
      cue(2.5, (d) => d.fx(new Explosion(0.9), "e8")),
    ],
  }),
  superpowers: () => scripted({
    duration: 6, fen: START, camera: low,
    cues: [
      cue(0.4, (d) => d.fx(new Lightning(), "d7")), cue(0.65, (d) => d.kill("d7")),
      cue(1.8, (d) => { d.fx(new FrostBurst(), "c8"); d.attach(new IceEncase(1.0), "c8", true); }),
      cue(3.2, (d) => { d.fx(new ShieldPulse(), "d1"); d.attach(new ShieldDome("#ffd76a", 1.1), "d1", true); }),
      cue(4.4, (d) => { d.fx(new ArcaneCircle(), "e2"); d.fx(new WarpSwirl(), "e5"); d.move("e2", "e5", 0.2, 0); }),
    ],
  }),
  double: () => scripted({
    duration: 6, fen: START, camera: low,
    cues: [
      cue(0.5, (d) => { d.move("e2", "e4", 0.3); d.fx(new SpeedLines(), "e4"); }),
      cue(1.0, (d) => { d.move("d2", "d4", 0.3); d.fx(new SpeedLines(), "d4"); }),
      cue(2.5, (d) => { d.move("e7", "e5", 0.3); d.fx(new SpeedLines(), "e5"); }),
      cue(3.0, (d) => { d.move("d7", "d5", 0.3); d.fx(new SpeedLines(), "d5"); }),
      cue(4.5, (d) => { d.move("e4", "d5", 0.3); d.kill("d7"); d.fx(new CapturePuff(), "d5"); }),
      cue(5.0, (d) => { d.move("g1", "f3", 0.3, 0.5); d.fx(new SpeedLines(), "f3"); }),
    ],
  }),
  triple: () => scripted({
    duration: 6, fen: START, camera: low,
    cues: [
      ...["e2:e4", "d2:d4", "g1:f3"].map((m, i) => cue(0.5 + i * 0.4, (d) => { const [a, b] = m.split(":"); d.move(a, b, 0.28, a === "g1" ? 0.5 : 0.2); d.fx(new SpeedLines("#bfe8ff"), b); })),
      ...["e7:e5", "d7:d5", "b8:c6"].map((m, i) => cue(3 + i * 0.4, (d) => { const [a, b] = m.split(":"); d.move(a, b, 0.28, a === "b8" ? 0.5 : 0.2); d.fx(new SpeedLines("#ffd0a8"), b); })),
    ],
  }),
  lightning: () => scripted({
    duration: 6, fen: START, camera: low,
    cues: ["e2:e4", "e7:e5", "g1:f3", "b8:c6", "f1:c4", "f8:c5", "d2:d3", "g8:f6"].map((m, i) => cue(0.4 + i * 0.6, (d) => {
      const [a, b] = m.split(":");
      d.move(a, b, 0.2, 0.3);
      if (i % 2 === 0) d.fx(new Lightning(i % 4 ? "#9fd3ff" : "#ffe45c", 5), b);
    })),
  }),
  chess960: () => scripted({
    duration: 6, fen: "bbnrqkrn/pppppppp/8/8/8/8/PPPPPPPP/BBNRQKRN", camera: low,
    cues: [
      ...["a1", "b1", "e1", "h1"].map((s, i) => cue(0.4 + i * 0.35, (d) => d.fx(new WarpSwirl("#5fd391"), s))),
      ...["a8", "b8", "e8", "h8"].map((s, i) => cue(1.0 + i * 0.35, (d) => d.fx(new WarpSwirl("#5fd391"), s))),
      cue(3.0, (d) => d.move("g2", "g3")), cue(3.8, (d) => d.move("b7", "b6")),
      cue(4.6, (d) => d.move("b1", "h7", 0.6)), cue(5.2, (d) => d.fx(new CapturePuff(), "h7")),
    ],
  }),
  koth: () => scripted({
    duration: 6, fen: "8/3k4/8/2p5/8/4K3/8/8", camera: { radius: 7, height: 4, target: [0, 0, 0] },
    setup: (d) => d.attach(new ArcaneCircle("#ffd76a"), "e4"),
    cues: [
      cue(0.8, (d) => d.move("e3", "e4", 0.6, 0.15)),
      cue(1.5, (d) => { d.fx(new HolyBeam("#ffd76a", 5), "e4"); d.fx(new RainbowBurst(), "e4"); }),
      cue(2.2, (d) => d.fx(new RatingFx("legendary"), "e4")),
    ],
  }),
  "three-check": () => scripted({
    duration: 6, fen: "4k3/8/8/8/8/8/5PPP/R5K1", camera: { radius: 8, height: 5, target: [0, 0, -0.5] },
    cues: [
      cue(0.5, (d) => d.move("a1", "a8", 0.5, 0)), cue(1.05, (d) => d.fx(new CheckGlow(), "e8")),
      cue(1.7, (d) => d.move("e8", "d7", 0.4, 0.1)),
      cue(2.3, (d) => d.move("a1", "a7", 0.4, 0)), cue(2.75, (d) => d.fx(new CheckGlow(), "d7")),
      cue(3.4, (d) => d.move("e8", "d6", 0.4, 0.1)),
      cue(4.0, (d) => d.move("a1", "a6", 0.4, 0)), cue(4.45, (d) => { d.fx(new CheckGlow(), "d6"); d.fx(new RatingFx("legendary"), "a6"); }),
    ],
  }),
  crazyhouse: () => scripted({
    duration: 6, fen: ITALIAN, camera: low,
    cues: [
      cue(0.6, (d) => { d.fx(new WarpSwirl("#46c37b"), "e6"); void d.spawn("knight", "w", "e6"); }),
      cue(2.0, (d) => { d.fx(new WarpSwirl("#ff6ec7"), "d4"); void d.spawn("bishop", "b", "d4"); }),
      cue(3.4, (d) => { d.fx(new WarpSwirl("#46c37b"), "g6"); void d.spawn("pawn", "w", "g6"); }),
      cue(4.6, (d) => d.fx(new HolyBeam("#46c37b", 3), "g6")),
    ],
  }),
  antichess: () => scripted({
    duration: 6, fen: "rnbqkbnr/ppp2ppp/8/3pp3/4P3/8/PPPP1PPP/RNBQKBNR", camera: low,
    cues: [
      cue(0.5, (d) => { d.move("e4", "d5"); d.kill("d5"); d.fx(new CapturePuff(), "d5"); }),
      cue(1.5, (d) => { d.move("d8", "d5"); d.kill("e4"); d.fx(new CapturePuff(), "d5"); }),
      cue(2.5, (d) => { d.move("d1", "g4"); }),
      cue(3.3, (d) => { d.move("c8", "g4"); d.kill("d1"); d.fx(new CapturePuff(), "g4"); }),
      cue(4.2, (d) => d.fx(new RatingFx("brilliant"), "g4")),
    ],
  }),
  fog: () => scripted({
    duration: 6, fen: START, camera: low,
    setup: (d) => d.attach(new FogBank(8, 4), "d6"),
    cues: [cue(0.8, (d) => d.move("e2", "e4")), cue(2.2, (d) => d.move("g1", "f3", 0.5, 0.6)), cue(3.6, (d) => d.move("f1", "c4"))],
  }),
  duck: () => scripted({
    duration: 6, fen: "rnbqkbnr/pppppppp/8/3@4/8/8/PPPPPPPP/RNBQKBNR", camera: low,
    cues: [
      cue(0.4, (d) => d.move("e2", "e4")), cue(1.0, (d) => d.move("d5", "e5", 0.4, 0.5)),
      cue(1.9, (d) => d.move("c7", "c5")), cue(2.5, (d) => d.move("d5", "c4", 0.4, 0.5)),
      cue(3.4, (d) => d.move("g1", "f3", 0.5, 0.6)), cue(4.0, (d) => d.move("d5", "d6", 0.4, 0.5)),
      cue(4.9, (d) => d.fx(new RainbowBurst(), "d6")),
    ],
  }),
  custom: () => scripted({
    duration: 6, fen: "rnadkcnr/pppppppp/8/8/8/8/PPPPPPPP/RNADKCNR", shape: { width: 8, height: 8, holes: [27, 28, 35, 36] },
    camera: low,
    cues: [
      cue(0.6, (d) => { d.move("d1", "d7", 0.7, 1.4); d.fx(new FireBurst(0.3), "d1"); }),
      cue(1.4, (d) => { d.kill("d7"); d.fx(new Explosion(0.8), "d7"); }),
      cue(3.0, (d) => d.move("c8", "e7", 0.5, 0.6)), cue(4.2, (d) => d.fx(new RatingFx("great"), "e7")),
    ],
  }),
};
