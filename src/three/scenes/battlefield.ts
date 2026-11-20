/**
 * The landing page: two armies of chess pieces marching across a grass
 * plain at sunset like soldiers. Where the lines meet, blasts, lightning,
 * frost and holy light hit the front, and pieces get hurled at the camera
 * before rejoining the back of their army.
 */

import * as THREE from "three";
import type { PieceKind, Side } from "@/engine";
import { grassland } from "../env/grassland";
import { CapturePuff, Explosion, Lightning } from "../fx/combat";
import { FireBurst, FrostBurst } from "../fx/elements";
import { HolyBeam, VoidRift } from "../fx/magic";
import type { Effect } from "../fx";
import { createPiece } from "../pieces/factory";
import { fly, launch, walk, type Soldier } from "./army";
import { WarAtmosphere } from "./atmosphere";
import { fxContext } from "./director";
import type { SceneDef } from "./types";

const ROSTER: PieceKind[] = ["pawn", "pawn", "knight", "pawn", "bishop", "rook", "pawn", "queen", "pawn", "knight", "dragon", "pawn", "chancellor", "archbishop", "pawn", "wizard", "champion", "pawn", "cannon", "king"];
const LANES = 14;
const FRONT = 0.9;
const BACK = 13;

export const battlefield: SceneDef = {
  duration: 40,
  bloom: 0.45,
  poster: 4.15,
  async setup(stage) {
    // Low sun just off frame to the right, raking warm light across both armies.
    const env = grassland(stage, { blades: 70000, sun: [84, Math.PI - 0.25] });
    const air = new WarAtmosphere();
    stage.scene.add(air.object);
    const army: Soldier[] = [];
    for (const [color, side] of [["w", -1], ["b", 1]] as [Side, 1 | -1][]) {
      for (let i = 0; i < 46; i++) {
        const obj = await createPiece(ROSTER[i % ROSTER.length], color);
        obj.scale.setScalar(1.25);
        const lane = i % LANES;
        // White marches from +z toward the middle, Black from -z.
        obj.position.set((lane - (LANES - 1) / 2) * 0.95 + (Math.random() - 0.5) * 0.4, 0, -side * (FRONT + 0.1 + Math.floor(i / LANES) * 1.15 + Math.random() * 0.5));
        stage.scene.add(obj);
        army.push({ obj, side, speed: 0.55 + Math.random() * 0.35, phase: Math.random() * 6, lane, vel: null, spin: new THREE.Vector3(), downUntil: 0 });
      }
    }

    const effects: Effect[] = [];
    const play = (e: Effect, at: THREE.Vector3, scale = 1.3) => { e.object.position.set(at.x, 0, at.z); e.object.scale.setScalar(scale); stage.scene.add(e.object); effects.push(e); };
    let nextStrike = 0.5, last = 0;
    // A scripted opener so the first seconds (and the poster) always have a big moment.
    const opener = [{ at: 2.4, kind: "lightning" }, { at: 3.85, kind: "blast" }];

    return {
      update(t) {
        const dt = Math.min(0.05, Math.max(0, t - last));
        last = t;
        env.update(t, dt);
        // Camera crouched in the grass on the flank, so the armies charge in from both sides.
        const z = Math.sin(t * 0.06) * 1.6;
        stage.camera.fov = 40;
        stage.camera.position.set(11.5, 1.25 + Math.sin(t * 0.2) * 0.1, z);
        stage.camera.lookAt(0, 0.7, z * 0.4);
        stage.camera.updateProjectionMatrix();

        for (const s of army) {
          if (s.vel) {
            fly(s, dt);
            if (s.obj.position.y < -1.5 || s.obj.position.distanceTo(stage.camera.position) < 0.6) { s.vel = null; s.obj.visible = false; }
            continue;
          }
          if (!s.obj.visible) {
            if (t < s.downUntil) continue;
            // Rejoin at the back of your own army and march again.
            s.obj.visible = true;
            s.obj.rotation.set(0, 0, 0);
            s.obj.position.set((s.lane - (LANES - 1) / 2) * 0.95 + (Math.random() - 0.5) * 0.4, 0, -s.side * BACK);
            continue;
          }
          // Hold the line at the front; everyone behind keeps closing in.
          const atFront = s.side * s.obj.position.z >= -FRONT;
          walk(s, t, dt, !atFront);
        }

        for (const o of opener) {
          if (last - dt < o.at && last >= o.at) {
            const front = army.filter((s) => !s.vel && s.obj.visible && Math.abs(s.obj.position.z) < FRONT + 1.2 && Math.abs(s.obj.position.x) < 3);
            const hit = front.sort((a, b) => b.obj.position.x - a.obj.position.x)[0];
            if (!hit) continue;
            if (o.kind === "lightning") { play(new Lightning("#ffe45c", 12), hit.obj.position); launch(hit, stage.camera.position, t); }
            else {
              play(new Explosion(1.8), hit.obj.position);
              front.filter((s) => s.obj.position.distanceTo(hit.obj.position) < 1.8).slice(0, 4).forEach((s) => launch(s, stage.camera.position, t));
            }
          }
        }
        if (t >= nextStrike && t > 4.5) {
          nextStrike = t + 0.3 + Math.random() * 0.4;
          const front = army.filter((s) => !s.vel && s.obj.visible && Math.abs(s.obj.position.z) < FRONT + 1.6);
          const target = front[Math.floor(Math.random() * front.length)];
          if (target) {
            const roll = Math.random();
            if (roll < 0.4) {
              play(new Explosion(1.4), target.obj.position);
              front.filter((s) => s.obj.position.distanceTo(target.obj.position) < 1.5).slice(0, 3).forEach((s) => launch(s, stage.camera.position, t));
            } else if (roll < 0.58) {
              play(new Lightning(Math.random() < 0.5 ? "#ffe45c" : "#9fd3ff", 12), target.obj.position);
              launch(target, stage.camera.position, t);
            } else if (roll < 0.7) play(new FrostBurst(1.3), target.obj.position);
            else if (roll < 0.8) play(new HolyBeam("#ffd76a", 9), target.obj.position);
            else if (roll < 0.9) play(new FireBurst(0.5), target.obj.position);
            else play(new VoidRift(1.2), target.obj.position);
          }
        }
        if (Math.random() < dt * 2) {
          const s = army[Math.floor(Math.random() * army.length)];
          if (s.obj.visible && !s.vel) play(new CapturePuff(), s.obj.position, 0.8);
        }

        const ctx = fxContext(stage);
        air.update(dt, ctx);
        for (let i = effects.length - 1; i >= 0; i--) {
          if (!effects[i].update(dt, ctx)) { stage.scene.remove(effects[i].object); effects[i].dispose(); effects.splice(i, 1); }
        }
      },
      dispose: () => { env.dispose(); air.dispose(); },
    };
  },
};
