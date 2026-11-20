/**
 * Orbit camera for the 3D board. We drive it ourselves instead of using
 * OrbitControls because the left mouse button belongs to the pieces: the
 * board decides per drag whether it moves a piece or the camera.
 */

import * as THREE from "three";
import type { Color } from "@/engine";

const MIN_PHI = 0.12;
const MAX_PHI = 1.38;

export class CameraRig {
  private theta = 0;
  private phi = 0.72;
  private radius = 12;
  private goal = { theta: 0, phi: 0.72, radius: 12 };
  private base = { phi: 0.72, radius: 12 };
  private target = new THREE.Vector3(0, -0.4, 0.35);
  private shakeLeft = 0;

  constructor(private camera: THREE.PerspectiveCamera) {}

  /** Frames a board of the given size; called on start and when the board changes. */
  fit(width: number, height: number, aspect: number): void {
    const span = Math.max(width, height / Math.min(1, aspect));
    this.base.radius = span * 1.55 + 3.2;
    this.goal.radius = this.base.radius;
    if (Math.abs(this.radius - this.base.radius) > 4) this.radius = this.base.radius;
  }

  setOrientation(color: Color, instant = false): void {
    // Keep winding the same way so a flip always turns the short way round.
    const want = color === "w" ? 0 : Math.PI;
    const turns = Math.round((this.goal.theta - want) / (Math.PI * 2));
    this.goal.theta = want + turns * Math.PI * 2;
    if (instant) this.theta = this.goal.theta;
  }

  rotate(dx: number, dy: number): void {
    this.goal.theta -= dx * 0.006;
    this.goal.phi = THREE.MathUtils.clamp(this.goal.phi - dy * 0.005, MIN_PHI, MAX_PHI);
  }

  zoom(delta: number): void {
    this.goal.radius = THREE.MathUtils.clamp(this.goal.radius * Math.exp(delta * 0.0012), this.base.radius * 0.55, this.base.radius * 1.7);
  }

  reset(color: Color): void {
    this.goal.phi = this.base.phi;
    this.goal.radius = this.base.radius;
    this.setOrientation(color);
  }

  shake(seconds: number): void {
    this.shakeLeft = Math.max(this.shakeLeft, seconds);
  }

  update(dt: number): void {
    const k = 1 - Math.exp(-dt * 8);
    this.theta += (this.goal.theta - this.theta) * k;
    this.phi += (this.goal.phi - this.phi) * k;
    this.radius += (this.goal.radius - this.radius) * k;
    const sin = Math.sin(this.phi);
    this.camera.position.set(
      this.target.x + this.radius * sin * Math.sin(this.theta),
      this.target.y + this.radius * Math.cos(this.phi),
      this.target.z + this.radius * sin * Math.cos(this.theta),
    );
    this.camera.lookAt(this.target);
    if (this.shakeLeft > 0) {
      this.shakeLeft -= dt;
      const a = this.shakeLeft * 0.25;
      this.camera.position.add(new THREE.Vector3((Math.random() - 0.5) * a, (Math.random() - 0.5) * a, (Math.random() - 0.5) * a));
    }
  }
}
