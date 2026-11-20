/**
 * Plays a scripted little chess scene on a loop: timed cues move, kill,
 * spawn and transform pieces and fire effects. Everything a cue changes is
 * undone on reset, so live previews can loop forever and the offline
 * renderer can step frames from zero.
 */

import * as THREE from "three";
import type { PieceKind, Side } from "@/engine";
import { squareToWorld, type BoardShape } from "../board/boardMesh";
import type { Stage } from "../core/stage";
import type { Effect, FxContext } from "../fx";
import { createPiece } from "../pieces/factory";
import { ease, placeFen, sq, type Placed } from "./helpers";

export interface Cue {
  at: number;
  run: (d: Director) => void;
}

interface Tween {
  obj: THREE.Object3D;
  from: THREE.Vector3;
  to: THREE.Vector3;
  start: number;
  dur: number;
  hop: number;
}

export class Director {
  pieces = new Map<string, Placed>();
  private homes = new Map<THREE.Object3D, THREE.Vector3>();
  private tweens: Tween[] = [];
  private effects: Effect[] = [];
  private lasting: { effect: Effect; follow: THREE.Object3D | null }[] = [];
  private temps: THREE.Object3D[] = [];
  private shrinking: { obj: THREE.Object3D; start: number }[] = [];
  private lastLocal = -1;
  private now = 0;
  shake = 0;

  constructor(readonly stage: Stage, readonly shape: BoardShape, private cues: Cue[], readonly duration: number) {}

  async place(fen: string): Promise<void> {
    this.pieces = await placeFen(this.stage, this.shape, fen);
    for (const p of this.pieces.values()) this.homes.set(p.mesh, p.mesh.position.clone());
  }

  at(name: string): THREE.Vector3 {
    return squareToWorld(this.shape, sq(this.shape, name));
  }

  piece(name: string): THREE.Object3D {
    const p = this.pieces.get(name);
    if (!p) throw new Error(`No piece on ${name}`);
    return p.mesh;
  }

  move(name: string, to: string, dur = 0.45, hop = 0.25): void {
    const obj = this.piece(name);
    this.tweens.push({ obj, from: obj.position.clone(), to: this.at(to), start: this.now, dur, hop });
  }

  fx(effect: Effect, where: string | THREE.Vector3): void {
    effect.object.position.copy(typeof where === "string" ? this.at(where) : where);
    this.stage.scene.add(effect.object);
    this.effects.push(effect);
  }

  /** Effect that stays (and follows a piece if given) until the loop resets. */
  attach(effect: Effect, where: string, follow = false): void {
    effect.object.position.copy(this.at(where));
    this.stage.scene.add(effect.object);
    this.lasting.push({ effect, follow: follow ? this.piece(where) : null });
  }

  kill(name: string): void {
    this.shrinking.push({ obj: this.piece(name), start: this.now });
  }

  async spawn(kind: PieceKind, color: Side, where: string): Promise<THREE.Object3D> {
    const obj = await createPiece(kind, color);
    obj.position.copy(this.at(where));
    obj.scale.setScalar(0.01);
    obj.userData.grow = this.now;
    this.stage.scene.add(obj);
    this.temps.push(obj);
    return obj;
  }

  /** Swap a piece for another kind in place, like a promotion. */
  morph(name: string, kind: PieceKind, color: Side): void {
    const old = this.piece(name);
    old.visible = false;
    void this.spawn(kind, color, this.squareOf(old));
  }

  private squareOf(obj: THREE.Object3D): string {
    const x = Math.round(obj.position.x + (this.shape.width - 1) / 2);
    const y = Math.round((this.shape.height - 1) / 2 - obj.position.z);
    return `${"abcdefghij"[x]}${y + 1}`;
  }

  private reset(): void {
    for (const [obj, home] of this.homes) { obj.position.copy(home); obj.visible = true; obj.scale.setScalar(1); }
    for (const e of [...this.effects, ...this.lasting.map((l) => l.effect)]) { this.stage.scene.remove(e.object); e.dispose(); }
    this.temps.forEach((t) => this.stage.scene.remove(t));
    this.effects = []; this.lasting = []; this.temps = []; this.tweens = []; this.shrinking = [];
  }

  update(t: number, dt: number, ctx: FxContext): void {
    const local = t % this.duration;
    if (local < this.lastLocal) this.reset();
    this.now = local;
    for (const cue of this.cues) if (cue.at > this.lastLocal && cue.at <= local) cue.run(this);
    this.lastLocal = local;
    this.tweens = this.tweens.filter((tw) => {
      const k = Math.min(1, (local - tw.start) / tw.dur);
      tw.obj.position.lerpVectors(tw.from, tw.to, ease(k));
      tw.obj.position.y = Math.sin(Math.PI * k) * tw.hop;
      return k < 1;
    });
    this.shrinking = this.shrinking.filter((s) => {
      const k = Math.min(1, (local - s.start) / 0.25);
      s.obj.scale.setScalar(1 - k);
      if (k >= 1) s.obj.visible = false;
      return k < 1;
    });
    for (const obj of this.temps) obj.scale.setScalar(Math.min(1, (local - obj.userData.grow) / 0.35 + 0.01));
    this.effects = this.effects.filter((e) => {
      if (e.update(dt, ctx)) return true;
      this.stage.scene.remove(e.object);
      e.dispose();
      return false;
    });
    for (const l of this.lasting) {
      if (l.follow) l.effect.object.position.set(l.follow.position.x, 0, l.follow.position.z);
      l.effect.update(dt, ctx);
    }
  }
}

/** Pixel scale for particles under a perspective camera. */
export function fxContext(stage: Stage): FxContext {
  const h = stage.renderer.domElement.height;
  return { camera: stage.camera, pixelsPerUnit: h / (2 * Math.tan((stage.camera.fov * Math.PI) / 360)) };
}
