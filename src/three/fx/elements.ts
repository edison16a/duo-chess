/** Elemental bursts: frost, fire, earth and smoke. */

import * as THREE from "three";
import type { Particles } from "../core/particles";
import { flameTexture, glowTexture, smokeTexture, sparkTexture } from "../core/textures";
import { FxBase, pulse, v3 } from "./base";
import { groundRing } from "./combat";

/** Ice shards blasting out and a swirl of snow, played when something gets frozen. */
export class FrostBurst extends FxBase {
  private shards: THREE.InstancedMesh;
  private bits: { p: THREE.Vector3; v: THREE.Vector3; r: THREE.Vector3; s: number }[] = [];
  private dummy = new THREE.Object3D();
  private ring: THREE.Mesh;

  constructor(radius = 1) {
    super(1.5);
    const mat = this.own(new THREE.MeshPhysicalMaterial({ color: 0xcdeeff, roughness: 0.05, metalness: 0.1, clearcoat: 1, emissive: 0x5ab8ff, emissiveIntensity: 0.35, transparent: true, opacity: 0.9 }));
    this.shards = new THREE.InstancedMesh(new THREE.OctahedronGeometry(0.1), mat, 22);
    for (let i = 0; i < 22; i++) {
      const v = new THREE.Vector3().randomDirection();
      v.y = Math.abs(v.y) * 0.8 + 0.2;
      this.bits.push({ p: v3(0, 0.55, 0), v: v.multiplyScalar(2.8 * radius), r: new THREE.Vector3().randomDirection(), s: 0.6 + Math.random() * 0.9 });
    }
    this.object.add(this.shards);
    const snow = this.particles({ capacity: 120, texture: sparkTexture(), drag: 1.8, gravity: 0.25 });
    snow.emit({ count: 90, position: v3(0, 0.6, 0), spread: v3(0.4, 0.5, 0.4).multiplyScalar(radius), radial: 1.4 * radius, life: [0.8, 1.5], size: [0.08, 0.2], colors: ["#ffffff", "#c9ecff", "#8fd3ff"] });
    const mist = this.particles({ capacity: 30, texture: smokeTexture(), drag: 1.5, grow: 2.2 });
    mist.emit({ count: 9, position: v3(0, 0.3, 0), spread: v3(0.3, 0.1, 0.3), radial: 0.8 * radius, life: [0.8, 1.4], size: [0.35, 0.6], colors: ["#8fc8ee"] });
    this.ring = groundRing(this, "#9adcff", (t) => this.own(t));
    const flash = this.glow("#9fd6ff", 1.6 * radius, 0.6);
    flash.position.y = 0.6;
    this.flash = flash;
  }

  private flash: THREE.Sprite;

  protected step(dt: number, k: number): void {
    this.ring.scale.setScalar(0.3 + Math.min(1, k * 2) * 2.6);
    (this.ring.material as THREE.MeshBasicMaterial).opacity = 1 - Math.min(1, k * 2);
    this.flash.material.opacity = Math.max(0, 0.9 - k * 2.5);
    (this.shards.material as THREE.MeshPhysicalMaterial).opacity = 0.9 * pulse(k, 0.02);
    this.bits.forEach((b, i) => {
      b.v.multiplyScalar(Math.exp(-2.2 * dt));
      b.v.y -= 2 * dt;
      b.p.addScaledVector(b.v, dt);
      this.dummy.position.copy(b.p);
      this.dummy.rotation.set(b.r.x * this.age * 5, b.r.y * this.age * 5, 0);
      this.dummy.scale.set(b.s * 0.6, b.s * 1.6, b.s * 0.6);
      this.dummy.updateMatrix();
      this.shards.setMatrixAt(i, this.dummy.matrix);
    });
    this.shards.instanceMatrix.needsUpdate = true;
  }
}

/** Column of flame with embers, for fire powers and burning pawns. */
export class FireBurst extends FxBase {
  private flames: Particles;
  private embers: Particles;
  private core: Particles;
  private base: THREE.Sprite;

  constructor(private radius = 0.4) {
    super(1.6);
    // Normal blending keeps flames orange even in front of a white piece.
    this.flames = this.particles({ capacity: 260, texture: flameTexture(), blending: THREE.NormalBlending, drag: 1.2, gravity: -2.4, grow: 0.4 });
    this.core = this.particles({ capacity: 80, texture: flameTexture(), drag: 1.2, gravity: -2, grow: 0.3 });
    this.embers = this.particles({ capacity: 80, texture: glowTexture(), drag: 0.5, gravity: -1.2 });
    this.base = this.glow("#ff6a1a", 1.6, 0.5);
    this.base.position.y = 0.2;
  }

  protected step(dt: number, k: number): void {
    if (k < 0.65) {
      this.flames.emit({ count: Math.ceil(260 * dt), position: v3(0, 0.15, 0), spread: v3(this.radius, 0.05, this.radius), velocityJitter: v3(0.25, 0.3, 0.25), velocity: v3(0, 0.7, 0), life: [0.4, 0.85], size: [0.4, 0.75], colors: ["#ff8a2a", "#ff5a14", "#ffa040", "#d8380f"] });
      this.core.emit({ count: Math.ceil(80 * dt), position: v3(0, 0.12, 0), spread: v3(this.radius * 0.5, 0.03, this.radius * 0.5), velocity: v3(0, 0.6, 0), life: [0.25, 0.5], size: [0.25, 0.4], colors: ["#ffcf5a", "#ffb030"] });
      this.embers.emit({ count: Math.ceil(60 * dt), position: v3(0, 0.3, 0), spread: v3(this.radius, 0.2, this.radius), velocityJitter: v3(0.6, 0.5, 0.6), velocity: v3(0, 1.2, 0), life: [0.8, 1.6], size: [0.04, 0.08], colors: ["#ffd27a", "#ff8a3d"] });
    }
    this.base.material.opacity = pulse(k, 0.1) * 0.9;
  }
}

/** Rocks erupt from the ground with a cloud of dust. */
export class EarthErupt extends FxBase {
  private rocks: THREE.InstancedMesh;
  private bits: { p: THREE.Vector3; v: THREE.Vector3; r: THREE.Vector3; s: number }[] = [];
  private dummy = new THREE.Object3D();

  constructor() {
    super(1.5);
    const mat = this.own(new THREE.MeshStandardMaterial({ color: 0x7a5b3e, roughness: 0.95, flatShading: true }));
    this.rocks = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(0.11), mat, 14);
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      this.bits.push({ p: v3(Math.cos(a) * 0.25, 0, Math.sin(a) * 0.25), v: v3(Math.cos(a) * 1.4, 3 + Math.random() * 2, Math.sin(a) * 1.4), r: new THREE.Vector3().randomDirection(), s: 0.6 + Math.random() * 0.8 });
    }
    this.object.add(this.rocks);
    const dust = this.particles({ capacity: 40, texture: smokeTexture(), blending: THREE.NormalBlending, drag: 1.6, grow: 2.6, gravity: -0.2 });
    dust.emit({ count: 30, position: v3(0, 0.1, 0), spread: v3(0.4, 0.05, 0.4), radial: 1.3, life: [0.9, 1.5], size: [0.5, 0.9], colors: ["#8a7158", "#a08368", "#6e5843"] });
  }

  protected step(dt: number, k: number): void {
    this.bits.forEach((b, i) => {
      b.v.y -= 10 * dt;
      b.p.addScaledVector(b.v, dt);
      if (b.p.y < 0.05) { b.p.y = 0.05; b.v.set(b.v.x * 0.5, Math.abs(b.v.y) * 0.25, b.v.z * 0.5); }
      this.dummy.position.copy(b.p);
      this.dummy.rotation.set(b.r.x * this.age * 6, b.r.y * this.age * 6, 0);
      this.dummy.scale.setScalar(b.s * Math.max(0, 1 - Math.max(0, k - 0.7) / 0.3));
      this.dummy.updateMatrix();
      this.rocks.setMatrixAt(i, this.dummy.matrix);
    });
    this.rocks.instanceMatrix.needsUpdate = true;
  }
}

/** Billowing smoke, for Smoke Screen and Ghost Walk. */
export class SmokeCloud extends FxBase {
  constructor(color: THREE.ColorRepresentation = "#9a9a9a", spread = 0.5) {
    super(2.2);
    const smoke = this.particles({ capacity: 70, texture: smokeTexture(), blending: THREE.NormalBlending, drag: 1.2, grow: 3, gravity: -0.35 });
    smoke.emit({ count: 55, position: v3(0, 0.4, 0), spread: v3(spread, 0.35, spread), radial: 0.9, life: [1.4, 2.2], size: [0.7, 1.2], colors: [color as string, "#7b7b7b", "#b0b0b0"] });
  }
}
