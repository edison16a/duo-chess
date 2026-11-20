import * as THREE from "three";
import { crackTexture } from "../core/textures";
import { FxBase } from "./base";

/**
 * Cracks spreading across the board around a blast, with embers glowing in
 * the fissures for a moment. Stays until removed.
 */
export class Cracks extends FxBase {
  private decal: THREE.Mesh;
  private heat: THREE.Mesh;

  constructor(size = 3) {
    super(-1);
    this.decal = new THREE.Mesh(new THREE.PlaneGeometry(size, size), this.own(new THREE.MeshBasicMaterial({ map: crackTexture(), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4 })));
    this.decal.rotation.x = -Math.PI / 2;
    this.decal.position.y = 0.006;
    // Molten light in the seams, using the same crack pattern so it sits exactly in the fissures.
    this.heat = new THREE.Mesh(new THREE.PlaneGeometry(size, size), this.own(new THREE.MeshBasicMaterial({ map: crackTexture(true), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })));
    this.heat.rotation.x = -Math.PI / 2;
    this.heat.position.y = 0.01;
    this.object.add(this.decal, this.heat);
  }

  protected step(): void {
    const grow = Math.min(1, this.age * 6);
    this.decal.scale.setScalar(0.2 + grow * 0.8);
    this.heat.scale.copy(this.decal.scale);
    (this.heat.material as THREE.MeshBasicMaterial).opacity = 0.55 + Math.sin(this.age * 3) * 0.2;
  }
}
