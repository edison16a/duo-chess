/**
 * Chess pieces as soldiers: each one walks with a little side to side
 * waddle and bob, marches toward the enemy, and can be blown off its feet.
 */

import * as THREE from "three";

export interface Soldier {
  obj: THREE.Object3D;
  side: 1 | -1;
  speed: number;
  phase: number;
  lane: number;
  /** Set while flying through the air after a blast. */
  vel: THREE.Vector3 | null;
  spin: THREE.Vector3;
  downUntil: number;
}

/** Walk cycle: rock side to side, lean into the step and bob up on each footfall. */
export function walk(s: Soldier, t: number, dt: number, moving: boolean): void {
  const step = (t * s.speed * 5.5) + s.phase;
  if (moving) s.obj.position.z += s.side * s.speed * dt;
  s.obj.position.y = Math.abs(Math.sin(step)) * 0.09;
  s.obj.rotation.z = Math.sin(step) * 0.11;
  s.obj.rotation.x = -s.side * 0.07;
}

/** Ballistic flight after a blast, tumbling end over end. */
export function fly(s: Soldier, dt: number): void {
  if (!s.vel) return;
  s.vel.y -= 9.5 * dt;
  s.obj.position.addScaledVector(s.vel, dt);
  s.obj.rotation.x += s.spin.x * dt;
  s.obj.rotation.y += s.spin.y * dt;
  s.obj.rotation.z += s.spin.z * dt;
}

/** Throws a soldier toward `target` (usually the camera) with some scatter. */
export function launch(s: Soldier, target: THREE.Vector3, t: number): void {
  const dir = target.clone().sub(s.obj.position);
  dir.y = 0;
  dir.normalize().multiplyScalar(5 + Math.random() * 3);
  dir.x += (Math.random() - 0.5) * 3;
  s.vel = dir.setY(5 + Math.random() * 3);
  s.spin.set((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 6, (Math.random() - 0.5) * 10);
  s.downUntil = t + 2.5 + Math.random() * 2;
}
