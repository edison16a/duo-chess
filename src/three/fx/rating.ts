/**
 * The move rating moment. Every rated move gets a coloured aura and rising
 * glints; brilliant and great moves add a light column; legendary moves get
 * golden rays and a spiral of sparks; mistakes and blunders smoulder red.
 */

import * as THREE from "three";
import type { RatingId } from "@/engine";
import type { Particles } from "../core/particles";
import { glowTexture, sparkTexture, smokeTexture } from "../core/textures";
import { FxBase, pulse, v3 } from "./base";
import { groundRing } from "./combat";
import { beamMaterial } from "./shaders";

/** Hex versions of the rating colours, for canvases and shaders that cannot read CSS variables. */
export const RATING_HEX: Record<RatingId, string> = {
  legendary: "#ffc94a", brilliant: "#1fc7c1", great: "#5b8cf0", best: "#7cc05a", excellent: "#8cc46b",
  good: "#9bb08d", inaccuracy: "#f0c045", mistake: "#f08c35", blunder: "#e5484d",
};

export class RatingFx extends FxBase {
  private ring: THREE.Mesh;
  private aura: THREE.Sprite;
  private beam: THREE.Mesh | null = null;
  private rays: THREE.Group | null = null;
  private motes: Particles;
  private color: string;

  constructor(private id: RatingId, private pieceHeight = 1.1) {
    super(id === "legendary" ? 2.6 : 1.9);
    this.color = RATING_HEX[id];
    this.ring = groundRing(this, this.color, (t) => this.own(t));
    this.aura = this.glow(this.color, pieceHeight * 1.8, 0.8);
    this.aura.position.y = pieceHeight * 0.55;
    this.motes = this.particles({ capacity: 160, texture: sparkTexture(), drag: 0.6, gravity: id === "blunder" || id === "mistake" ? 1.2 : -0.8 });
    const bad = id === "blunder" || id === "mistake";
    if (id === "brilliant" || id === "great" || id === "legendary") {
      const geo = new THREE.CylinderGeometry(0.3, 0.3, 4, 24, 1, true);
      geo.translate(0, 2, 0);
      this.beam = new THREE.Mesh(geo, this.own(beamMaterial(this.color)));
      this.object.add(this.beam);
    }
    if (id === "legendary") {
      // God rays: thin tapered blades fanning out behind the piece.
      const rays = new THREE.Group();
      const mat = this.own(new THREE.MeshBasicMaterial({ map: glowTexture(), color: this.color, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
      for (let i = 0; i < 12; i++) {
        const blade = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 2.4), mat);
        blade.geometry.translate(0, 1.2, 0);
        blade.rotation.z = (i / 12) * Math.PI * 2;
        rays.add(blade);
      }
      rays.position.y = pieceHeight * 0.55;
      this.rays = rays;
      this.object.add(rays);
    }
    if (bad) {
      const smoke = this.particles({ capacity: 30, texture: smokeTexture(), blending: THREE.NormalBlending, drag: 1, grow: 2.4, gravity: -0.4 });
      smoke.emit({ count: id === "blunder" ? 10 : 6, position: v3(0, pieceHeight * 0.75, 0), spread: v3(0.3, 0.3, 0.3), radial: 0.5, life: [0.9, 1.4], size: [0.3, 0.55], colors: ["#7a3532", "#8f4a3a"] });
    }
    const count = id === "legendary" ? 110 : id === "brilliant" ? 80 : bad ? 40 : 30;
    this.motes.emit({ count, position: v3(0, pieceHeight * (bad ? 0.9 : 0.3), 0), spread: v3(0.3, pieceHeight * 0.3, 0.3), radial: bad ? 0.6 : 1.1, velocity: v3(0, bad ? 0 : 1.2, 0), life: [0.7, 1.5], size: [0.08, 0.18], colors: [this.color, "#ffffff"] });
  }

  protected step(_dt: number, k: number): void {
    const a = pulse(k, 0.08);
    this.ring.scale.setScalar(0.4 + Math.min(1, k * 2.5) * 2);
    (this.ring.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 1 - k * 2.5);
    this.aura.material.opacity = a * 0.9;
    this.aura.scale.setScalar(this.pieceHeight * (1.6 + Math.sin(this.age * 9) * 0.15));
    if (this.beam) {
      const mat = this.beam.material as THREE.ShaderMaterial;
      mat.uniforms.uTime.value = this.age;
      mat.uniforms.uAlpha.value = a;
    }
    if (this.rays) {
      this.rays.rotation.z += 0.012;
      this.rays.scale.setScalar(0.3 + Math.min(1, k * 3) * 0.9);
      ((this.rays.children[0] as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = a * 0.55;
    }
    if (this.id === "legendary" && k < 0.6) {
      const ang = this.age * 10;
      this.motes.emit({ count: 2, position: v3(Math.cos(ang) * 0.45, 0.05, Math.sin(ang) * 0.45), velocity: v3(0, 2.2, 0), life: [0.6, 1.0], size: [0.1, 0.2], colors: ["#ffe08a", "#ffffff"] });
    }
  }
}

/** Red pulse on the floor under a king in check. */
export class CheckGlow extends FxBase {
  private ring: THREE.Mesh;
  private aura: THREE.Sprite;

  constructor() {
    super(1.2);
    this.ring = groundRing(this, "#ff3b3b", (t) => this.own(t));
    this.aura = this.glow("#ff3b3b", 1.8, 0.8);
    this.aura.position.y = 0.4;
  }

  protected step(_dt: number, k: number): void {
    const wave = (k * 2) % 1;
    this.ring.scale.setScalar(0.5 + wave * 1.6);
    (this.ring.material as THREE.MeshBasicMaterial).opacity = 1 - wave;
    this.aura.material.opacity = pulse(k, 0.1) * 0.8;
  }
}
