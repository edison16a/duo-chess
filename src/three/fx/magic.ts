/** Spell like effects: arcane circles, void, holy light, rainbow, speed, shields and warps. */

import * as THREE from "three";
import type { Particles } from "../core/particles";
import { glowTexture, runeTexture, sparkTexture } from "../core/textures";
import { FxBase, pulse, v3 } from "./base";
import { beamMaterial, shieldMaterial, vortexMaterial } from "./shaders";

function flatPlane(fx: FxBase, mat: THREE.Material, size: number, y = 0.03): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size, size), mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = y;
  fx.object.add(mesh);
  return mesh;
}

/** Spinning rune circles with sparkles spiralling up. */
export class ArcaneCircle extends FxBase {
  private outer: THREE.Mesh;
  private inner: THREE.Mesh;
  private motes: Particles;

  constructor(private color: THREE.ColorRepresentation = "#b57bff") {
    super(1.7);
    const mat = () => this.own(new THREE.MeshBasicMaterial({ map: runeTexture(), color, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    this.outer = flatPlane(this, mat(), 1.9);
    this.inner = flatPlane(this, mat(), 1.1, 0.5);
    this.motes = this.particles({ capacity: 120, texture: sparkTexture(), drag: 0.4 });
    const g = this.glow(color, 2.4, 0.6);
    g.position.y = 0.5;
  }

  protected step(dt: number, k: number): void {
    const a = pulse(k, 0.15);
    this.outer.rotation.z += dt * 1.4;
    this.inner.rotation.z -= dt * 2.2;
    this.outer.scale.setScalar(0.4 + Math.min(1, k * 4) * 0.6);
    this.inner.position.y = 0.2 + k * 0.9;
    (this.outer.material as THREE.MeshBasicMaterial).opacity = a;
    (this.inner.material as THREE.MeshBasicMaterial).opacity = a * 0.8;
    if (k < 0.7) {
      for (let i = 0; i < 3; i++) {
        const ang = this.age * 7 + (i * Math.PI * 2) / 3;
        this.motes.emit({ count: 1, position: v3(Math.cos(ang) * 0.6, 0.05, Math.sin(ang) * 0.6), velocity: v3(-Math.sin(ang) * 0.6, 1.4, Math.cos(ang) * 0.6), life: [0.6, 1.0], size: [0.1, 0.18], colors: [this.color as string, "#ffffff"] });
      }
    }
  }
}

/** A black hole: inky core, swirling disc and debris sucked inward. */
export class VoidRift extends FxBase {
  private disc: THREE.Mesh;
  private core: THREE.Mesh;

  constructor(private radius = 1) {
    super(1.8);
    const discMat = this.own(vortexMaterial("#8f5bff", false));
    this.disc = flatPlane(this, discMat, 2.4 * radius, 0.5);
    this.disc.rotation.x = -Math.PI / 2.6;
    this.core = new THREE.Mesh(new THREE.SphereGeometry(0.28 * radius, 32, 20), this.own(new THREE.MeshBasicMaterial({ color: 0x000000 })));
    this.core.position.y = 0.5;
    this.object.add(this.core);
    const suck = this.particles({ capacity: 140, texture: glowTexture(), drag: 0.2 });
    suck.emit({ count: 110, position: v3(0, 0.5, 0), spread: v3(1.4, 0.8, 1.4).multiplyScalar(radius), radial: -1.8 * radius, life: [0.5, 1.0], size: [0.06, 0.14], colors: ["#c9a6ff", "#7a4bc4", "#ffffff"] });
    const halo = this.glow("#6d3cff", 2.4 * radius, 0.7);
    halo.position.y = 0.5;
  }

  protected step(_dt: number, k: number): void {
    const a = pulse(k, 0.2);
    (this.disc.material as THREE.ShaderMaterial).uniforms.uTime.value = this.age;
    (this.disc.material as THREE.ShaderMaterial).uniforms.uAlpha.value = a;
    const s = k < 0.75 ? Math.min(1, k * 5) : Math.max(0, 1 - (k - 0.75) / 0.25);
    this.core.scale.setScalar(s);
    this.disc.scale.setScalar(0.3 + s * 0.7);
  }
}

/** A pillar of light from above with drifting motes. */
export class HolyBeam extends FxBase {
  private beam: THREE.Mesh;
  private motes: Particles;

  constructor(private color: THREE.ColorRepresentation = "#ffd76a", height = 4.5) {
    super(1.7);
    const geo = new THREE.CylinderGeometry(0.42, 0.42, height, 32, 1, true);
    geo.translate(0, height / 2, 0);
    this.beam = new THREE.Mesh(geo, this.own(beamMaterial(color)));
    this.object.add(this.beam);
    this.motes = this.particles({ capacity: 90, texture: sparkTexture(), drag: 0.3 });
    const g = this.glow(color, 2, 0.6);
    g.position.y = 0.4;
  }

  protected step(_dt: number, k: number): void {
    const mat = this.beam.material as THREE.ShaderMaterial;
    mat.uniforms.uTime.value = this.age;
    mat.uniforms.uAlpha.value = pulse(k, 0.15);
    this.beam.scale.set(0.4 + Math.min(1, k * 5) * 0.6, 1, 0.4 + Math.min(1, k * 5) * 0.6);
    if (k < 0.7) this.motes.emit({ count: 2, position: v3(0, 2.4, 0), spread: v3(0.35, 1.6, 0.35), velocity: v3(0, -0.8, 0), life: [0.6, 1.2], size: [0.08, 0.16], colors: [this.color as string, "#ffffff"] });
  }
}

/** Expanding rings that run through the rainbow, for chromatic powers. */
export class RainbowBurst extends FxBase {
  private rings: THREE.Mesh[] = [];

  constructor() {
    super(1.9);
    const hues = [0, 0.08, 0.16, 0.33, 0.55, 0.7, 0.83];
    hues.forEach((h, i) => {
      const mat = this.own(new THREE.MeshBasicMaterial({ color: new THREE.Color().setHSL(h, 0.95, 0.6), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.025, 8, 64), mat);
      ring.rotation.x = Math.PI / 2;
      ring.userData.delay = i * 0.06;
      this.object.add(ring);
      this.rings.push(ring);
    });
    const sparks = this.particles({ capacity: 120, texture: sparkTexture(), drag: 1.2, gravity: -0.4 });
    sparks.emit({ count: 100, position: v3(0, 0.5, 0), spread: v3(0.2, 0.3, 0.2), radial: 2.6, life: [0.8, 1.6], size: [0.1, 0.2], colors: hues.map((h) => `hsl(${h * 360}, 95%, 65%)`) });
    const g = this.glow("#ffffff", 1.6, 0.4);
    g.position.y = 0.5;
  }

  protected step(_dt: number, k: number): void {
    for (const ring of this.rings) {
      const local = Math.max(0, Math.min(1, (k - ring.userData.delay) / 0.6));
      ring.scale.setScalar(0.2 + local * 2.4);
      ring.position.y = 0.1 + local * 1.1;
      (ring.material as THREE.MeshBasicMaterial).opacity = local > 0 ? 1 - local : 0;
    }
  }
}

/** Wind streaks rushing past, for speed and extra move powers. */
export class SpeedLines extends FxBase {
  private lines: THREE.Mesh[] = [];

  constructor(color: THREE.ColorRepresentation = "#ffffff") {
    super(1.0);
    const mat = this.own(new THREE.MeshBasicMaterial({ color, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    for (let i = 0; i < 14; i++) {
      const line = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.025), mat);
      line.position.set(-1.5, 0.1 + Math.random() * 1.1, (Math.random() - 0.5) * 0.8);
      line.userData.speed = 4 + Math.random() * 4;
      line.userData.delay = Math.random() * 0.4;
      this.object.add(line);
      this.lines.push(line);
    }
    const g = this.glow(color, 1.6, 0.5);
    g.position.y = 0.5;
  }

  protected step(_dt: number, k: number): void {
    for (const l of this.lines) {
      const t = Math.max(0, this.age - l.userData.delay);
      l.position.x = -1.5 + t * l.userData.speed;
      l.visible = l.position.x < 1.8 && t > 0;
    }
    (this.lines[0].material as THREE.MeshBasicMaterial).opacity = pulse(k, 0.1);
  }
}

/** Shield bubble that snaps up around a piece, then fades out. */
export class ShieldPulse extends FxBase {
  private dome: THREE.Mesh;

  constructor(color: THREE.ColorRepresentation = "#ffd76a", radius = 0.6) {
    super(1.4);
    this.dome = new THREE.Mesh(new THREE.SphereGeometry(radius, 48, 32), this.own(shieldMaterial(color)));
    this.dome.position.y = radius * 0.8;
    this.object.add(this.dome);
    const sparks = this.particles({ capacity: 50, texture: sparkTexture(), drag: 1 });
    sparks.emit({ count: 40, position: v3(0, 0.5, 0), spread: v3(0.5, 0.5, 0.5), radial: 0.6, life: [0.5, 1.1], size: [0.08, 0.15], colors: [color as string, "#ffffff"] });
  }

  protected step(_dt: number, k: number): void {
    const mat = this.dome.material as THREE.ShaderMaterial;
    mat.uniforms.uTime.value = this.age;
    mat.uniforms.uAlpha.value = pulse(k, 0.15);
    this.dome.scale.setScalar(k < 0.15 ? 0.3 + (k / 0.15) * 0.75 : 1.05 - (k - 0.15) * 0.05);
  }
}

/** Swirl at a square, for teleports, swaps and portal jumps. */
export class WarpSwirl extends FxBase {
  private disc: THREE.Mesh;

  constructor(color: THREE.ColorRepresentation = "#b57bff") {
    super(1.1);
    this.disc = flatPlane(this, this.own(vortexMaterial(color)), 1.5, 0.04);
    const motes = this.particles({ capacity: 60, texture: sparkTexture(), drag: 0.8, gravity: -1.5 });
    motes.emit({ count: 45, position: v3(0, 0.1, 0), spread: v3(0.4, 0.05, 0.4), velocity: v3(0, 1.2, 0), velocityJitter: v3(0.3, 0.4, 0.3), life: [0.5, 1.0], size: [0.08, 0.16], colors: [color as string, "#ffffff"] });
  }

  protected step(_dt: number, k: number): void {
    const mat = this.disc.material as THREE.ShaderMaterial;
    mat.uniforms.uTime.value = this.age * 1.5;
    mat.uniforms.uAlpha.value = pulse(k, 0.15);
  }
}
