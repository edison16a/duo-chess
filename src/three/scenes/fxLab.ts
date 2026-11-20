/** A single piece on a small board with one effect looping, for tuning effects. */

import * as THREE from "three";
import type { Effect } from "../fx";
import { CapturePuff, Explosion, Lightning, Shatter } from "../fx/combat";
import { EarthErupt, FireBurst, FrostBurst, SmokeCloud } from "../fx/elements";
import { ArcaneCircle, HolyBeam, RainbowBurst, ShieldPulse, SpeedLines, VoidRift, WarpSwirl } from "../fx/magic";
import { GhostAura, Halo, IceEncase, IceWall, Mine, Portal, PoisonBubbles, RatingFx, ShieldDome } from "../fx";
import { createPiece } from "../pieces/factory";
import { addBoard, orbit } from "./helpers";
import type { SceneDef } from "./types";

export const FX_LAB: Record<string, () => Effect> = {
  explosion: () => new Explosion(1.5),
  lightning: () => new Lightning(),
  frost: () => new FrostBurst(),
  ice: () => new IceEncase(1.12),
  fire: () => new FireBurst(),
  earth: () => new EarthErupt(),
  smoke: () => new SmokeCloud(),
  arcane: () => new ArcaneCircle(),
  void: () => new VoidRift(),
  holy: () => new HolyBeam(),
  rainbow: () => new RainbowBurst(),
  speed: () => new SpeedLines(),
  shield: () => new ShieldPulse(),
  dome: () => new ShieldDome(),
  warp: () => new WarpSwirl(),
  capture: () => new CapturePuff(),
  shatter: () => new Shatter(),
  ghost: () => new GhostAura(),
  poison: () => new PoisonBubbles(),
  halo: () => new Halo(1.12),
  wall: () => new IceWall(),
  mine: () => new Mine(),
  portal: () => new Portal(),
  legendary: () => new RatingFx("legendary"),
  brilliant: () => new RatingFx("brilliant"),
  blunder: () => new RatingFx("blunder"),
};

export function fxLab(name: string): SceneDef {
  return {
    duration: 3,
    bloom: 0.55,
    async setup(stage) {
      addBoard(stage, { width: 3, height: 3 });
      const piece = await createPiece(name === "wall" || name === "mine" || name === "portal" ? "pawn" : "queen", "w");
      if (!["wall", "mine", "portal"].includes(name)) stage.scene.add(piece);
      let effect = FX_LAB[name]();
      stage.scene.add(effect.object);
      const ctx = { camera: stage.camera, pixelsPerUnit: 400 };
      let last = 0;
      return {
        update(t) {
          const dt = Math.min(0.05, t - last);
          last = t;
          orbit(stage, t, { radius: 4.2, height: 2.6, speed: 0.12, start: 0.5, target: new THREE.Vector3(0, 0.7, 0) });
          ctx.pixelsPerUnit = stage.renderer.domElement.height / (2 * Math.tan((stage.camera.fov * Math.PI) / 360));
          if (!effect.update(dt, ctx)) {
            stage.scene.remove(effect.object);
            effect.dispose();
            effect = FX_LAB[name]();
            stage.scene.add(effect.object);
          }
        },
      };
    },
  };
}
