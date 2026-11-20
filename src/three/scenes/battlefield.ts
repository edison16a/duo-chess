/**
 * The landing page backdrop: a wide board with two full armies and a war
 * going on. Random pieces get blown up, struck by lightning, frozen or
 * blessed, then quietly respawn, while the camera drifts low across it.
 */

import * as THREE from "three";
import type { PieceKind } from "@/engine";
import { squareToWorld, type BoardShape } from "../board/boardMesh";
import { CapturePuff, Explosion, Lightning } from "../fx/combat";
import { FireBurst, FrostBurst } from "../fx/elements";
import { ArcaneCircle, HolyBeam, RainbowBurst, VoidRift, WarpSwirl } from "../fx/magic";
import { IceEncase, type Effect } from "../fx";
import { createPiece } from "../pieces/factory";
import { fxContext } from "./director";
import { addBoard } from "./helpers";
import type { SceneDef } from "./types";

const SHAPE: BoardShape = { width: 16, height: 10 };
const BACK: PieceKind[] = ["rook", "knight", "bishop", "queen", "king", "bishop", "knight", "rook"];
const FAIRY: PieceKind[] = ["chancellor", "dragon", "archbishop", "amazon", "cannon", "wizard", "champion", "nightrider"];

interface Unit {
  obj: THREE.Object3D;
  square: number;
  alive: boolean;
  respawnAt: number;
}

type Strike = (at: THREE.Vector3) => Effect[];

/** Each strike is a different flavour of chaos; kills mark the unit for respawn. */
const STRIKES: { make: Strike; kills: boolean }[] = [
  { make: () => [new Explosion(1.5)], kills: true },
  { make: () => [new Lightning("#ffe45c", 9)], kills: true },
  { make: () => [new Lightning("#9fd3ff", 9)], kills: true },
  { make: () => [new FrostBurst(1.2)], kills: false },
  { make: () => [new HolyBeam("#ffd76a", 7)], kills: false },
  { make: () => [new VoidRift(1.2)], kills: true },
  { make: () => [new RainbowBurst()], kills: false },
  { make: () => [new FireBurst(0.45)], kills: false },
  { make: () => [new ArcaneCircle("#46c37b")], kills: false },
];

export const battlefield: SceneDef = {
  duration: 30,
  bloom: 0.6,
  poster: 5,
  async setup(stage) {
    addBoard(stage, SHAPE);
    stage.scene.fog = new THREE.Fog(0x0d0f13, 10, 30);
    const units: Unit[] = [];
    const occupied = new Set<number>();
    const place = async (kind: PieceKind, color: "w" | "b", x: number, y: number) => {
      const square = y * SHAPE.width + x;
      const obj = await createPiece(kind, color);
      squareToWorld(SHAPE, square, obj.position);
      stage.scene.add(obj);
      units.push({ obj, square, alive: true, respawnAt: 0 });
      occupied.add(square);
    };
    for (let x = 0; x < SHAPE.width; x++) {
      const kind = x < 4 || x >= 12 ? FAIRY[x % FAIRY.length] : BACK[x - 4];
      // Armies already in contact: back ranks pushed up, pawns meeting near the middle.
      await place(kind, "w", x, 1);
      await place("pawn", "w", x, x % 3 === 0 ? 4 : 3);
      await place("pawn", "b", x, x % 3 === 1 ? 5 : 6);
      await place(kind, "b", x, SHAPE.height - 2);
    }

    const effects: Effect[] = [];
    const lasting: { effect: Effect; unit: Unit; until: number }[] = [];
    const tweens: { unit: Unit; from: THREE.Vector3; to: THREE.Vector3; start: number }[] = [];
    let nextStrike = 0.6, nextMove = 0.3, last = 0;
    const play = (e: Effect, at: THREE.Vector3) => { e.object.position.copy(at); stage.scene.add(e.object); effects.push(e); };
    const randomUnit = () => units.filter((u) => u.alive)[Math.floor(Math.random() * units.length)] ?? units[0];

    return {
      update(t) {
        const dt = Math.min(0.05, Math.max(0, t - last));
        last = t;
        // Low, slow crane shot along the front line.
        const a = t * 0.045;
        stage.camera.position.set(Math.sin(a) * 12.5, 7.2 + Math.sin(t * 0.13) * 0.6, Math.cos(a) * 11.5);
        stage.camera.lookAt(Math.sin(a * 0.7) * 1.5, -0.6, 0);

        if (t >= nextMove) {
          nextMove = t + 0.18 + Math.random() * 0.25;
          const u = randomUnit();
          const x = u.square % SHAPE.width, y = Math.floor(u.square / SHAPE.width);
          // Each side pushes toward the enemy, then drifts back once it reaches the far side.
          const white = units.indexOf(u) % 4 < 2;
          const ny = y + (white ? 1 : -1) * (Math.random() < 0.8 ? 1 : -1);
          const target = ny * SHAPE.width + x + (Math.random() < 0.3 ? (Math.random() < 0.5 ? -1 : 1) : 0);
          if (ny >= 0 && ny < SHAPE.height && !occupied.has(target) && Math.abs((target % SHAPE.width) - x) <= 1) {
            occupied.delete(u.square);
            occupied.add(target);
            u.square = target;
            tweens.push({ unit: u, from: u.obj.position.clone(), to: squareToWorld(SHAPE, target), start: t });
          }
        }
        if (t >= nextStrike) {
          nextStrike = t + 0.28 + Math.random() * 0.4;
          const u = randomUnit();
          const strike = STRIKES[Math.floor(Math.random() * STRIKES.length)];
          strike.make(u.obj.position).forEach((e) => play(e, u.obj.position));
          if (strike.kills && u.alive) {
            u.alive = false;
            u.respawnAt = t + 3 + Math.random() * 3;
            setTimeout(() => { u.obj.visible = false; }, 220);
          } else if (strike.make === STRIKES[3].make) {
            const ice = new IceEncase(1.1);
            ice.object.position.copy(u.obj.position);
            stage.scene.add(ice.object);
            lasting.push({ effect: ice, unit: u, until: t + 4 });
          }
        }
        for (const u of units) {
          if (!u.alive && t >= u.respawnAt) {
            u.alive = true;
            u.obj.visible = true;
            play(new WarpSwirl("#46c37b"), u.obj.position);
          }
        }
        for (let i = tweens.length - 1; i >= 0; i--) {
          const tw = tweens[i];
          const k = Math.min(1, (t - tw.start) / 0.45);
          tw.unit.obj.position.lerpVectors(tw.from, tw.to, k * k * (3 - 2 * k));
          tw.unit.obj.position.y = Math.sin(Math.PI * k) * 0.25;
          if (k >= 1) { tweens.splice(i, 1); if (Math.random() < 0.15) play(new CapturePuff(), tw.to); }
        }
        const ctx = fxContext(stage);
        for (let i = effects.length - 1; i >= 0; i--) {
          if (!effects[i].update(dt, ctx)) { stage.scene.remove(effects[i].object); effects[i].dispose(); effects.splice(i, 1); }
        }
        for (let i = lasting.length - 1; i >= 0; i--) {
          const l = lasting[i];
          l.effect.object.position.set(l.unit.obj.position.x, 0, l.unit.obj.position.z);
          l.effect.update(dt, ctx);
          if (t > l.until) { stage.scene.remove(l.effect.object); l.effect.dispose(); lasting.splice(i, 1); }
        }
      },
    };
  },
};
