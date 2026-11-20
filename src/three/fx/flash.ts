/**
 * Low detail effect for the 3D board: a flat coloured square on the board
 * surface that fades out. It is what a blast or a power looks like when the
 * host turned effects down.
 */

import * as THREE from "three";
import { FxBase } from "./base";

export class SquareFlash extends FxBase {
  private mat: THREE.MeshBasicMaterial;

  constructor(color: THREE.ColorRepresentation) {
    super(0.85);
    this.mat = this.own(new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.75, depthWrite: false }));
    const geo = this.own(new THREE.PlaneGeometry(0.98, 0.98));
    const plane = new THREE.Mesh(geo, this.mat);
    plane.rotation.x = -Math.PI / 2;
    // Just above the board top so it never fights the squares for depth.
    plane.position.y = 0.012;
    this.object.add(plane);
  }

  protected step(_dt: number, k: number): void {
    this.mat.opacity = k < 0.35 ? 0.75 - k * 0.43 : 0.6 * (1 - (k - 0.35) / 0.65);
  }
}
