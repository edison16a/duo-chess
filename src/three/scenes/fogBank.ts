import * as THREE from "three";
import type { Particles } from "../core/particles";
import { smokeTexture } from "../core/textures";
import { FxBase, v3 } from "../fx/base";

/** A low, rolling bank of fog covering part of the board, for the Fog of War preview. */
export class FogBank extends FxBase {
  private fog: Particles;

  constructor(private width: number, private depth: number) {
    super(-1);
    this.fog = this.particles({ capacity: 260, texture: smokeTexture(), blending: THREE.NormalBlending, drag: 0.3, grow: 1.5 });
    for (let i = 0; i < 120; i++) this.puff();
  }

  private puff(): void {
    this.fog.emit({ count: 1, position: v3(0, 0.35, 0), spread: v3(this.width / 2, 0.3, this.depth / 2), velocityJitter: v3(0.15, 0.03, 0.08), life: [4, 7], size: [1.2, 2.2], colors: ["#3b3f47", "#4a4e57", "#2e3138"] });
  }

  protected step(dt: number): void {
    const n = Math.random() < dt * 22 ? 1 : 0;
    for (let i = 0; i < n; i++) this.puff();
  }
}
