/** Effects that stay on a piece while a status lasts: shield, ghost, poison, halo and smoke. */

import * as THREE from "three";
import type { Particles } from "../core/particles";
import { glowTexture, smokeTexture, sparkTexture } from "../core/textures";
import { FxBase, v3 } from "./base";
import { shieldMaterial } from "./shaders";

export class ShieldDome extends FxBase {
  private dome: THREE.Mesh;

  constructor(color: THREE.ColorRepresentation = "#ffd76a", private pieceHeight = 1.1) {
    super(-1);
    this.dome = new THREE.Mesh(new THREE.SphereGeometry(0.55, 48, 32, 0, Math.PI * 2, 0, Math.PI * 0.62), this.own(shieldMaterial(color)));
    this.dome.scale.set(1, (pieceHeight + 0.25) / 0.55 / 1.3, 1);
    this.object.add(this.dome);
  }

  protected step(): void {
    const mat = this.dome.material as THREE.ShaderMaterial;
    mat.uniforms.uTime.value = this.age;
    mat.uniforms.uAlpha.value = Math.min(1, this.age * 3) * (0.75 + 0.25 * Math.sin(this.age * 2.4));
  }
}

/** Pale wisps drifting up and around a piece that can pass through others. */
export class GhostAura extends FxBase {
  private wisps: Particles;

  constructor(private pieceHeight = 1.1) {
    super(-1);
    this.wisps = this.particles({ capacity: 60, texture: smokeTexture(), drag: 0.6, grow: 1.8, gravity: -0.3 });
    const g = this.glow("#c9d2ff", pieceHeight * 1.4, 0.35);
    g.position.y = pieceHeight * 0.5;
  }

  protected step(): void {
    if (Math.random() < 0.35) {
      const a = this.age * 2.5;
      this.wisps.emit({ count: 1, position: v3(Math.cos(a) * 0.32, 0.1 + Math.random() * this.pieceHeight * 0.6, Math.sin(a) * 0.32), velocity: v3(-Math.sin(a) * 0.3, 0.25, Math.cos(a) * 0.3), life: [0.8, 1.4], size: [0.25, 0.45], colors: ["#dfe5ff", "#b9c4ff"] });
    }
  }
}

/** Toxic bubbles rising from a poisoned piece. */
export class PoisonBubbles extends FxBase {
  private bubbles: Particles;

  constructor(private pieceHeight = 1.1) {
    super(-1);
    this.bubbles = this.particles({ capacity: 50, texture: glowTexture(), drag: 0.4, gravity: -0.6 });
    const pool = new THREE.Mesh(new THREE.CircleGeometry(0.45, 32), this.own(new THREE.MeshBasicMaterial({ map: glowTexture(), color: 0x63d471, transparent: true, opacity: 0.45, depthWrite: false, blending: THREE.AdditiveBlending })));
    pool.rotation.x = -Math.PI / 2;
    pool.position.y = 0.02;
    this.object.add(pool);
  }

  protected step(): void {
    if (Math.random() < 0.3) {
      this.bubbles.emit({ count: 1, position: v3(0, this.pieceHeight * 0.3, 0), spread: v3(0.25, this.pieceHeight * 0.3, 0.25), velocity: v3(0, 0.3, 0), life: [0.8, 1.5], size: [0.06, 0.14], colors: ["#7dff8f", "#3fbf55", "#b6ff9c"] });
    }
  }
}

/** Golden halo floating above a blessed piece. */
export class Halo extends FxBase {
  private ring: THREE.Mesh;

  constructor(private pieceHeight = 1.1) {
    super(-1);
    const mat = this.own(new THREE.MeshStandardMaterial({ color: 0xffd76a, emissive: 0xffc23d, emissiveIntensity: 1.6, metalness: 0.6, roughness: 0.25 }));
    this.ring = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.022, 12, 40), mat);
    this.ring.rotation.x = Math.PI / 2;
    this.object.add(this.ring);
    const g = this.glow("#ffd76a", 0.7, 0.6);
    g.position.y = pieceHeight + 0.18;
    this.sparkles = this.particles({ capacity: 20, texture: sparkTexture(), drag: 0.5 });
  }

  private sparkles: Particles;

  protected step(): void {
    this.ring.position.y = this.pieceHeight + 0.18 + Math.sin(this.age * 2) * 0.03;
    this.ring.rotation.z = this.age * 0.8;
    if (Math.random() < 0.1) this.sparkles.emit({ count: 1, position: v3(0, this.pieceHeight + 0.18, 0), spread: v3(0.17, 0.02, 0.17), velocity: v3(0, -0.2, 0), life: [0.5, 0.9], size: [0.05, 0.09], colors: ["#fff3c4"] });
  }
}

/** Swirling smoke around your own hidden pieces, so you remember they are veiled. */
export class SmokeVeil extends FxBase {
  private puffs: Particles;

  constructor() {
    super(-1);
    this.puffs = this.particles({ capacity: 40, texture: smokeTexture(), blending: THREE.NormalBlending, drag: 0.8, grow: 1.6, gravity: -0.15 });
  }

  protected step(): void {
    if (Math.random() < 0.3) this.puffs.emit({ count: 1, position: v3(0, 0.3, 0), spread: v3(0.35, 0.25, 0.35), velocityJitter: v3(0.15, 0.1, 0.15), life: [1, 1.8], size: [0.35, 0.55], colors: ["#8c8c8c", "#a8a8a8"] });
  }
}
