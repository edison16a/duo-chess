/**
 * The landing page: a war on a grass plain at golden hour. Two armies hold a
 * ruined stone chessboard; blasts, lightning, frost and holy light rain
 * down, and explosions hurl pieces spinning toward the camera.
 */

import * as THREE from "three";
import type { PieceKind, Side } from "@/engine";
import { grassland } from "../env/grassland";
import { CapturePuff, Explosion, Lightning } from "../fx/combat";
import { FireBurst, FrostBurst } from "../fx/elements";
import { HolyBeam, VoidRift, WarpSwirl } from "../fx/magic";
import type { Effect } from "../fx";
import { createPiece } from "../pieces/factory";
import { fxContext } from "./director";
import { WarAtmosphere } from "./atmosphere";
import { createPlaza } from "./plaza";
import type { SceneDef } from "./types";

const W = 12, H = 8, TILE = 1.05;
const ROSTER: PieceKind[] = ["rook", "knight", "bishop", "queen", "king", "dragon", "chancellor", "archbishop", "amazon", "cannon", "wizard", "champion"];

interface Unit {
  obj: THREE.Object3D;
  home: THREE.Vector3;
  vel: THREE.Vector3 | null;
  spin: THREE.Vector3;
  downUntil: number;
}

export const battlefield: SceneDef = {
  duration: 40,
  bloom: 0.4,
  poster: 4.6,
  async setup(stage) {
    const env = grassland(stage, { clear: [-W * TILE / 2 - 0.3, W * TILE / 2 + 0.3, -H * TILE / 2 - 0.3, H * TILE / 2 + 0.3] });
    stage.scene.add(createPlaza(W, H, TILE));
    const units: Unit[] = [];
    // Ragged lines read as an army mid battle rather than a fresh setup.
    const add = async (kind: PieceKind, color: Side, x: number, z: number) => {
      const obj = await createPiece(kind, color);
      obj.position.set(x + (Math.random() - 0.5) * 0.3, 0, z + (Math.random() - 0.5) * 0.3);
      obj.scale.setScalar(1.15);
      stage.scene.add(obj);
      units.push({ obj, home: obj.position.clone(), vel: null, spin: new THREE.Vector3(), downUntil: 0 });
    };
    for (let i = 0; i < W; i++) {
      const x = (i - (W - 1) / 2) * TILE;
      await add(ROSTER[i % ROSTER.length], "b", x, -2.6 * TILE);
      await add("pawn", "b", x, -(i % 3 === 0 ? 0.6 : 1.6) * TILE);
      await add("pawn", "w", x, (i % 3 === 1 ? 0.6 : 1.6) * TILE);
      await add(ROSTER[(i + 5) % ROSTER.length], "w", x, 2.6 * TILE);
    }

    for (const [kind, color, x, z, a] of [["rook", "b", -3.2, 0.2, 0.4], ["knight", "w", 2.4, -0.4, 2.1], ["bishop", "b", 4.6, 1.1, 4.0], ["pawn", "w", -1.4, -0.9, 1.0]] as const) {
      const fallen = await createPiece(kind, color);
      fallen.rotation.set(0, a, Math.PI / 2);
      fallen.position.set(x, 0.3, z);
      stage.scene.add(fallen);
    }
    const air = new WarAtmosphere();
    stage.scene.add(air.object);

    const effects: Effect[] = [];
    const play = (e: Effect, at: THREE.Vector3, scale = 1.25) => { e.object.position.copy(at); e.object.position.y = 0; e.object.scale.setScalar(scale); stage.scene.add(e.object); effects.push(e); };
    let nextStrike = 0.4, last = 0;
    const standing = () => units.filter((u) => !u.vel && u.obj.visible);

    /** Throws a piece toward the camera with a spin, as if blown off the board. */
    const hurl = (u: Unit, t: number) => {
      const toCam = stage.camera.position.clone().sub(u.obj.position);
      toCam.y = 0;
      toCam.normalize().multiplyScalar(5 + Math.random() * 3);
      toCam.x += (Math.random() - 0.5) * 3;
      u.vel = toCam.setY(5.5 + Math.random() * 2.5);
      u.spin.set((Math.random() - 0.5) * 9, (Math.random() - 0.5) * 6, (Math.random() - 0.5) * 9);
      u.downUntil = t + 4 + Math.random() * 2;
    };

    return {
      update(t) {
        const dt = Math.min(0.05, Math.max(0, t - last));
        last = t;
        env.update(t, dt);
        // Low tracking shot across the front line, just above the grass.
        const x = Math.sin(t * 0.07) * 4;
        stage.camera.fov = 42;
        stage.camera.position.set(x, 2.1 + Math.sin(t * 0.21) * 0.15, 9.6);
        stage.camera.lookAt(x * 0.4, 0.2, -1.2);
        stage.camera.updateProjectionMatrix();

        if (t >= nextStrike) {
          nextStrike = t + 0.35 + Math.random() * 0.45;
          // Most strikes land in the front half so the action stays in frame.
          const all = standing();
          const front = all.filter((o) => o.obj.position.z > -1.5);
          const pool = Math.random() < 0.75 && front.length ? front : all;
          const u = pool[Math.floor(Math.random() * pool.length)];
          if (u) {
            const roll = Math.random();
            if (roll < 0.38) {
              play(new Explosion(1.4), u.obj.position);
              const near = pool.filter((o) => o.obj.position.distanceTo(u.obj.position) < 1.6).slice(0, 3);
              near.forEach((o) => hurl(o, t));
            } else if (roll < 0.55) {
              play(new Lightning(Math.random() < 0.5 ? "#ffe45c" : "#9fd3ff", 12), u.obj.position);
              hurl(u, t);
            } else if (roll < 0.68) play(new FrostBurst(1.3), u.obj.position);
            else if (roll < 0.8) play(new HolyBeam("#ffd76a", 9), u.obj.position);
            else if (roll < 0.9) play(new FireBurst(0.5), u.obj.position);
            else play(new VoidRift(1.2), u.obj.position);
          }
        }

        for (const u of units) {
          if (u.vel) {
            u.vel.y -= 9.5 * dt;
            u.obj.position.addScaledVector(u.vel, dt);
            u.obj.rotation.x += u.spin.x * dt;
            u.obj.rotation.y += u.spin.y * dt;
            u.obj.rotation.z += u.spin.z * dt;
            // Gone once it flies past the lens or drops into the grass.
            if (u.obj.position.z > stage.camera.position.z - 0.3 || u.obj.position.y < -1.5) { u.vel = null; u.obj.visible = false; }
          } else if (!u.obj.visible && t > u.downUntil) {
            u.obj.visible = true;
            u.obj.position.copy(u.home);
            u.obj.rotation.set(0, 0, 0);
            play(new WarpSwirl("#46c37b"), u.home, 1);
          }
        }
        const ctx = fxContext(stage);
        air.update(dt, ctx);
        for (let i = effects.length - 1; i >= 0; i--) {
          if (!effects[i].update(dt, ctx)) { stage.scene.remove(effects[i].object); effects[i].dispose(); effects.splice(i, 1); }
        }
        if (Math.random() < dt * 0.6) play(new CapturePuff(), new THREE.Vector3((Math.random() - 0.5) * 10, 0, (Math.random() - 0.5) * 6), 1);
      },
      dispose: () => { env.dispose(); air.dispose(); },
    };
  },
};
