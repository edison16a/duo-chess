import * as THREE from "three";
import type { Particles } from "../core/particles";
import { glowTexture, smokeTexture } from "../core/textures";
import { FxBase, v3 } from "../fx/base";

/**
 * War atmosphere for the landing battlefield: smoke plumes rising from
 * fires on the horizon and embers drifting through the air.
 */
export class WarAtmosphere extends FxBase {
  private smoke: Particles;
  private embers: Particles;
  private fires: Particles;
  private plumes = [v3(-14, 0, -22), v3(9, 0, -26), v3(22, 0, -14), v3(-24, 0, -8)];

  constructor() {
    super(-1);
    this.smoke = this.particles({ capacity: 420, texture: smokeTexture(), blending: THREE.NormalBlending, drag: 0.1, grow: 4, gravity: -0.2 });
    this.fires = this.particles({ capacity: 120, texture: glowTexture(), drag: 0.8, gravity: -1.2 });
    this.embers = this.particles({ capacity: 160, texture: glowTexture(), drag: 0.2, gravity: -0.15 });
    for (let i = 0; i < 160; i++) this.step(0.08);
  }

  protected step(dt: number): void {
    for (const p of this.plumes) {
      if (Math.random() < dt * 9) this.smoke.emit({ count: 1, position: p, spread: v3(0.5, 0.2, 0.5), velocity: v3(0.35, 1.7, 0), velocityJitter: v3(0.15, 0.25, 0.15), life: [7, 11], size: [1.1, 1.9], colors: ["#4a423c", "#5a514a", "#3a332e"] });
      if (Math.random() < dt * 14) this.fires.emit({ count: 1, position: p, spread: v3(0.9, 0.1, 0.9), velocity: v3(0, 1.2, 0), life: [0.5, 1], size: [1.2, 2], colors: ["#ff8a2a", "#ff5a14"] });
    }
    if (Math.random() < dt * 30) this.embers.emit({ count: 1, position: v3(0, 0.5, -2), spread: v3(12, 0.5, 8), velocity: v3(0.35, 0.5, 0.2), velocityJitter: v3(0.2, 0.2, 0.2), life: [4, 7], size: [0.04, 0.09], colors: ["#ffb347", "#ff7a2a"] });
  }
}
