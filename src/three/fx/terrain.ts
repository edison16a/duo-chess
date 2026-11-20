/** Things that sit on squares rather than pieces: ice walls, mines and portals. */

import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import type { Particles } from "../core/particles";
import { sparkTexture } from "../core/textures";
import { FxBase, v3 } from "./base";
import { iceMaterial } from "./ice";
import { vortexMaterial } from "./shaders";

/** A rounded block of ice that rises out of the board. */
export class IceWall extends FxBase {
  private block: THREE.Mesh;

  constructor() {
    super(-1);
    this.block = new THREE.Mesh(new RoundedBoxGeometry(0.9, 0.62, 0.9, 4, 0.08), this.own(iceMaterial()));
    (this.block.material as THREE.MeshPhysicalMaterial).opacity = 0.7;
    this.block.position.y = 0.31;
    this.object.add(this.block);
    const inner = new THREE.Mesh(new RoundedBoxGeometry(0.6, 0.4, 0.6, 2, 0.06), this.own(new THREE.MeshBasicMaterial({ color: 0x8fd3ff, transparent: true, opacity: 0.25, blending: THREE.AdditiveBlending, depthWrite: false })));
    inner.position.y = 0.3;
    this.object.add(inner);
  }

  protected step(): void {
    const k = Math.min(1, this.age * 2.5);
    const e = 1 - Math.pow(1 - k, 3);
    this.object.scale.set(1, Math.max(0.01, e), 1);
  }
}

/** A buried mine with a blinking light. Only its owner ever sees it. */
export class Mine extends FxBase {
  private light: THREE.Sprite;

  constructor() {
    super(-1);
    const metal = this.own(new THREE.MeshStandardMaterial({ color: 0x3a3d42, metalness: 0.8, roughness: 0.35 }));
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.08, 24), metal);
    body.position.y = 0.04;
    this.object.add(body);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.09, 8), metal);
      spike.position.set(Math.cos(a) * 0.17, 0.11, Math.sin(a) * 0.17);
      this.object.add(spike);
    }
    const led = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 8), this.own(new THREE.MeshBasicMaterial({ color: 0xff3b3b })));
    led.position.y = 0.1;
    this.object.add(led);
    this.light = this.glow("#ff3b3b", 0.6, 0.9);
    this.light.position.y = 0.12;
  }

  protected step(): void {
    this.light.material.opacity = 0.35 + 0.65 * Math.max(0, Math.sin(this.age * 4));
  }
}

/** Swirling portal disc with a glowing rim and motes floating up. */
export class Portal extends FxBase {
  private disc: THREE.Mesh;
  private rim: THREE.Mesh;
  private motes: Particles;

  constructor(color: THREE.ColorRepresentation = "#b57bff") {
    super(-1);
    this.disc = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 0.95), this.own(vortexMaterial(color)));
    this.disc.rotation.x = -Math.PI / 2;
    this.disc.position.y = 0.03;
    this.rim = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.025, 10, 48), this.own(new THREE.MeshBasicMaterial({ color, transparent: true, blending: THREE.AdditiveBlending })));
    this.rim.rotation.x = Math.PI / 2;
    this.rim.position.y = 0.05;
    this.object.add(this.disc, this.rim);
    this.motes = this.particles({ capacity: 40, texture: sparkTexture(), drag: 0.3, gravity: -0.5 });
    const g = this.glow(color, 1.2, 0.5);
    g.position.y = 0.15;
    this.color = color;
  }

  private color: THREE.ColorRepresentation;

  protected step(): void {
    const mat = this.disc.material as THREE.ShaderMaterial;
    mat.uniforms.uTime.value = this.age;
    mat.uniforms.uAlpha.value = Math.min(1, this.age * 2);
    this.rim.rotation.z = this.age;
    if (Math.random() < 0.3) this.motes.emit({ count: 1, position: v3(0, 0.05, 0), spread: v3(0.35, 0, 0.35), velocity: v3(0, 0.5, 0), life: [0.6, 1.2], size: [0.06, 0.12], colors: [this.color as string, "#ffffff"] });
  }
}
