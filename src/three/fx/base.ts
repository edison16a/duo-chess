/**
 * Shared plumbing for 3D effects. An effect lives in a local frame where
 * one board square is one unit, +Y is up and the origin is the base of the
 * piece it plays on. The same effect runs on the 3D board, as an overlay on
 * the 2D board and in the rendered previews.
 */

import * as THREE from "three";
import { Particles, type ParticleConfig } from "../core/particles";
import { glowTexture } from "../core/textures";

export interface FxContext {
  camera: THREE.Camera;
  /** Roughly how many screen pixels one world unit covers at distance 1. */
  pixelsPerUnit: number;
}

export interface Effect {
  object: THREE.Object3D;
  /** Advances the effect. Returns false once it has fully finished. */
  update: (dt: number, ctx: FxContext) => boolean;
  dispose: () => void;
}

/** Base class that owns particle systems and disposes everything it made. */
export class FxBase implements Effect {
  readonly object = new THREE.Group();
  protected age = 0;
  private systems: Particles[] = [];
  private disposables: { dispose: () => void }[] = [];

  constructor(protected duration: number) {}

  protected particles(cfg: ParticleConfig): Particles {
    const p = new Particles(cfg);
    this.systems.push(p);
    this.object.add(p.points);
    return p;
  }

  protected own<T extends { dispose: () => void }>(thing: T): T {
    this.disposables.push(thing);
    return thing;
  }

  /** Additive glow sprite, the cheap stand in for a light source. */
  protected glow(color: THREE.ColorRepresentation, size: number, opacity = 1): THREE.Sprite {
    // Glows stack additively with bloom on top, so they start at 55% to avoid white blowouts.
    const mat = this.own(new THREE.SpriteMaterial({ map: glowTexture(), color, transparent: true, opacity: opacity * 0.55, blending: THREE.AdditiveBlending, depthWrite: false }));
    const sprite = new THREE.Sprite(mat);
    sprite.scale.setScalar(size);
    this.object.add(sprite);
    return sprite;
  }

  /** Subclasses animate here. `k` is 0..1 progress through the duration. */
  protected step(_dt: number, _k: number): void {}

  update(dt: number, ctx: FxContext): boolean {
    this.age += dt;
    const k = Math.min(1, this.age / this.duration);
    this.step(dt, k);
    let alive = 0;
    for (const s of this.systems) {
      s.setCamera(ctx.camera, ctx.pixelsPerUnit);
      alive += s.update(dt);
    }
    return this.duration < 0 || k < 1 || alive > 0;
  }

  dispose(): void {
    this.systems.forEach((s) => s.dispose());
    this.disposables.forEach((d) => d.dispose());
    this.object.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.isMesh) mesh.geometry.dispose();
    });
  }
}

export const v3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

/** Fade curve: quick in, slow out. */
export function pulse(k: number, attack = 0.12): number {
  return k < attack ? k / attack : Math.max(0, 1 - (k - attack) / (1 - attack));
}
