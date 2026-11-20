/** Physical effects: explosions, lightning, captures and shattering pieces. */

import * as THREE from "three";
import type { Particles } from "../core/particles";
import { glowTexture, ringTexture, smokeTexture } from "../core/textures";
import { FxBase, pulse, v3 } from "./base";

/** Flat ring lying on the ground that grows and fades, used for shockwaves. */
export function groundRing(fx: FxBase & { object: THREE.Group }, color: THREE.ColorRepresentation, own: <T extends { dispose: () => void }>(t: T) => T): THREE.Mesh {
  const mat = own(new THREE.MeshBasicMaterial({ map: ringTexture(), color, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
  const ring = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.02;
  fx.object.add(ring);
  return ring;
}

/** Fireball, smoke column, sparks, flying debris and a shockwave. Atomic captures use a big one. */
export class Explosion extends FxBase {
  private flash: THREE.Sprite;
  private ring: THREE.Mesh;
  private debris: THREE.InstancedMesh;
  private bits: { p: THREE.Vector3; v: THREE.Vector3; r: THREE.Vector3 }[] = [];
  private dummy = new THREE.Object3D();
  private smoke: Particles;
  private smoked = false;

  constructor(private scale = 1, tint: "fire" | "red" = "fire") {
    super(1.8);
    const hot = tint === "red" ? ["#ffd6d6", "#ff8a8a"] : ["#fff1c2", "#ffd27a"];
    const billow = tint === "red" ? ["#ff6060", "#e53d3d", "#ff8a7a"] : ["#ffb347", "#ff8c2a", "#ff6a1a", "#ffd06a"];
    // A small additive core keeps the heart bright; the billowing fireball uses
    // normal blending so it reads as orange flame instead of a white blowout.
    const core = this.particles({ capacity: 40, texture: glowTexture(), drag: 3, grow: 1.8 });
    core.emit({ count: 16, position: v3(0, 0.45 * scale, 0), spread: v3(0.1, 0.1, 0.1).multiplyScalar(scale), radial: 1.2 * scale, life: [0.25, 0.5], size: [0.4 * scale, 0.7 * scale], colors: hot });
    const fireball = this.particles({ capacity: 90, texture: smokeTexture(), blending: THREE.NormalBlending, drag: 2.8, grow: 2.4, gravity: -1 });
    fireball.emit({ count: 55, position: v3(0, 0.45 * scale, 0), spread: v3(0.15, 0.15, 0.15).multiplyScalar(scale), radial: 2.1 * scale, life: [0.45, 0.95], size: [0.45 * scale, 0.85 * scale], colors: billow });
    this.smoke = this.particles({ capacity: 60, texture: smokeTexture(), blending: THREE.NormalBlending, drag: 1.4, grow: 3, gravity: -0.7 });
    const sparks = this.particles({ capacity: 90, texture: glowTexture(), gravity: 7, drag: 0.5 });
    sparks.emit({ count: 80, position: v3(0, 0.4 * scale, 0), spread: v3(0.1, 0.1, 0.1), radial: 5.5 * scale, velocity: v3(0, 2.5, 0), life: [0.4, 1.0], size: [0.05, 0.11], colors: ["#fff6d8", "#ffd27a"] });
    this.flash = this.glow(tint === "red" ? "#ff8080" : "#ffcf7a", 2.2 * scale, 0.8);
    this.flash.position.y = 0.5 * scale;
    this.ring = groundRing(this, tint === "red" ? "#ff5b5b" : "#ff9a4d", (t) => this.own(t));
    const debrisMat = this.own(new THREE.MeshStandardMaterial({ color: 0x2b2420, roughness: 0.9 }));
    this.debris = new THREE.InstancedMesh(new THREE.BoxGeometry(0.07, 0.07, 0.07), debrisMat, 16);
    for (let i = 0; i < 16; i++) {
      const v = new THREE.Vector3().randomDirection();
      v.y = Math.abs(v.y) + 0.4;
      this.bits.push({ p: v3(0, 0.4 * scale, 0), v: v.multiplyScalar(3.5 * scale * (0.6 + Math.random() * 0.6)), r: new THREE.Vector3().randomDirection() });
    }
    this.object.add(this.debris);
  }

  protected step(dt: number, k: number): void {
    // Smoke rolls in once the fireball has peaked, so it never smothers the flash.
    if (!this.smoked && k > 0.18) {
      this.smoked = true;
      this.smoke.emit({ count: 26, position: v3(0, 0.75 * this.scale, 0), spread: v3(0.3, 0.25, 0.3).multiplyScalar(this.scale), radial: 0.7 * this.scale, life: [1.0, 1.8], size: [0.55 * this.scale, 0.95 * this.scale], colors: ["#5a524c", "#6b625b", "#4a4440"] });
    }
    this.flash.material.opacity = Math.max(0, 0.8 - k * 4);
    this.flash.scale.setScalar(this.scale * (1.6 + k * 3));
    const ringK = Math.min(1, k * 2.2);
    this.ring.scale.setScalar(0.3 + ringK * 4.2 * this.scale);
    (this.ring.material as THREE.MeshBasicMaterial).opacity = (1 - ringK) * 0.9;
    this.bits.forEach((b, i) => {
      b.v.y -= 9 * dt;
      b.p.addScaledVector(b.v, dt);
      if (b.p.y < 0.03) { b.p.y = 0.03; b.v.multiplyScalar(0.4); b.v.y = Math.abs(b.v.y) * 0.3; }
      this.dummy.position.copy(b.p);
      this.dummy.rotation.set(b.r.x * this.age * 8, b.r.y * this.age * 8, 0);
      this.dummy.scale.setScalar(Math.max(0, 1 - k * 0.9));
      this.dummy.updateMatrix();
      this.debris.setMatrixAt(i, this.dummy.matrix);
    });
    this.debris.instanceMatrix.needsUpdate = true;
  }
}

/** Jagged polyline from the sky to the target, rebuilt a few times so it flickers. */
function boltPath(from: THREE.Vector3, to: THREE.Vector3, jag: number): THREE.CurvePath<THREE.Vector3> {
  let pts = [from.clone(), to.clone()];
  let d = jag;
  for (let pass = 0; pass < 5; pass++) {
    const next: THREE.Vector3[] = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const mid = pts[i].clone().lerp(pts[i + 1], 0.5);
      mid.x += (Math.random() - 0.5) * d;
      mid.z += (Math.random() - 0.5) * d;
      next.push(pts[i], mid);
    }
    next.push(pts[pts.length - 1]);
    pts = next;
    d *= 0.55;
  }
  const path = new THREE.CurvePath<THREE.Vector3>();
  for (let i = 0; i < pts.length - 1; i++) path.add(new THREE.LineCurve3(pts[i], pts[i + 1]));
  return path;
}

export class Lightning extends FxBase {
  private bolts = new THREE.Group();
  private coreMat = this.own(new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  private glowMat: THREE.MeshBasicMaterial;
  private flash: THREE.Sprite;
  private nextBolt = 0;

  constructor(private color: THREE.ColorRepresentation = "#ffe45c", private height = 6) {
    super(1.1);
    this.glowMat = this.own(new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending, depthWrite: false }));
    this.object.add(this.bolts);
    this.flash = this.glow(color, 3);
    this.flash.position.y = 0.6;
    const sparks = this.particles({ capacity: 70, texture: glowTexture(), gravity: 6, drag: 0.6 });
    sparks.emit({ count: 60, position: v3(0, 0.25, 0), radial: 4, velocity: v3(0, 2, 0), life: [0.3, 0.8], size: [0.05, 0.1], colors: ["#ffffff", color as string] });
    const ring = groundRing(this, color, (t) => this.own(t));
    ring.scale.setScalar(2);
  }

  private rebuild(): void {
    this.bolts.children.forEach((c) => (c as THREE.Mesh).geometry.dispose());
    this.bolts.clear();
    const add = (path: THREE.CurvePath<THREE.Vector3>, r: number) => {
      this.bolts.add(new THREE.Mesh(new THREE.TubeGeometry(path, 48, r * 0.35, 5, false), this.coreMat));
      this.bolts.add(new THREE.Mesh(new THREE.TubeGeometry(path, 48, r, 6, false), this.glowMat));
    };
    add(boltPath(v3((Math.random() - 0.5) * 1.5, this.height, (Math.random() - 0.5) * 1.5), v3(0, 0.55, 0), 1.6), 0.07);
    for (let i = 0; i < 2; i++) {
      const start = v3((Math.random() - 0.5) * 0.8, this.height * (0.4 + Math.random() * 0.3), (Math.random() - 0.5) * 0.8);
      add(boltPath(start, start.clone().add(v3((Math.random() - 0.5) * 2, -1.4, (Math.random() - 0.5) * 2)), 0.6), 0.035);
    }
  }

  protected step(_dt: number, k: number): void {
    if (k < 0.4 && this.age >= this.nextBolt) {
      this.rebuild();
      this.nextBolt = this.age + 0.07;
    }
    const on = k < 0.45 && Math.sin(this.age * 90) > -0.3;
    this.bolts.visible = on;
    this.flash.material.opacity = k < 0.45 ? (on ? 1 : 0.3) : Math.max(0, 1 - (k - 0.45) * 3);
  }

  dispose(): void {
    this.bolts.children.forEach((c) => (c as THREE.Mesh).geometry.dispose());
    super.dispose();
  }
}

/** Small puff and spark spray for an ordinary capture. */
export class CapturePuff extends FxBase {
  constructor() {
    super(0.9);
    const dust = this.particles({ capacity: 24, texture: smokeTexture(), blending: THREE.NormalBlending, drag: 3, grow: 2.2, gravity: -0.3 });
    dust.emit({ count: 16, position: v3(0, 0.15, 0), spread: v3(0.25, 0.05, 0.25), radial: 1.2, life: [0.5, 0.9], size: [0.35, 0.6], colors: ["#d8cfc4", "#bfb3a6"] });
    const sparks = this.particles({ capacity: 24, texture: glowTexture(), gravity: 5, drag: 1 });
    sparks.emit({ count: 20, position: v3(0, 0.4, 0), radial: 3, velocity: v3(0, 1.5, 0), life: [0.25, 0.55], size: [0.04, 0.08], colors: ["#fff5dc"] });
  }
}

/** A piece breaking into shards, for poison, lightning and other removals. */
export class Shatter extends FxBase {
  private shards: THREE.InstancedMesh;
  private bits: { p: THREE.Vector3; v: THREE.Vector3; r: THREE.Vector3 }[] = [];
  private dummy = new THREE.Object3D();

  constructor(color: THREE.ColorRepresentation = "#d9d2c6") {
    super(1.3);
    const mat = this.own(new THREE.MeshStandardMaterial({ color, roughness: 0.4, transparent: true }));
    this.shards = new THREE.InstancedMesh(new THREE.TetrahedronGeometry(0.09), mat, 18);
    for (let i = 0; i < 18; i++) {
      const v = new THREE.Vector3().randomDirection();
      v.y = Math.abs(v.y) + 0.6;
      this.bits.push({ p: v3((Math.random() - 0.5) * 0.4, 0.2 + Math.random() * 0.8, (Math.random() - 0.5) * 0.4), v: v.multiplyScalar(2.2), r: new THREE.Vector3().randomDirection() });
    }
    this.object.add(this.shards);
    const dust = this.particles({ capacity: 20, texture: smokeTexture(), blending: THREE.NormalBlending, drag: 2, grow: 2.5, gravity: -0.3 });
    dust.emit({ count: 14, position: v3(0, 0.45, 0), spread: v3(0.2, 0.3, 0.2), radial: 0.8, life: [0.7, 1.2], size: [0.4, 0.7], colors: ["#9a948c", "#7c766f"] });
  }

  protected step(dt: number, k: number): void {
    (this.shards.material as THREE.MeshStandardMaterial).opacity = pulse(k, 0.01);
    this.bits.forEach((b, i) => {
      b.v.y -= 7 * dt;
      b.p.addScaledVector(b.v, dt);
      if (b.p.y < 0.03) { b.p.y = 0.03; b.v.multiplyScalar(0.3); }
      this.dummy.position.copy(b.p);
      this.dummy.rotation.set(b.r.x * this.age * 9, b.r.y * this.age * 9, b.r.z * this.age * 9);
      this.dummy.updateMatrix();
      this.shards.setMatrixAt(i, this.dummy.matrix);
    });
    this.shards.instanceMatrix.needsUpdate = true;
  }
}
