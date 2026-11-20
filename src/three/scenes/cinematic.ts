/**
 * Cinematic single subject shots: one hero piece in a themed environment,
 * a low camera looking up at it, shallow depth of field and a slow push in.
 * Used for power card art, the hover preview and environment previews.
 */

import * as THREE from "three";
import type { PieceKind, Side } from "@/engine";
import type { Stage } from "../core/stage";
import type { Environment } from "../env/types";
import { createPiece } from "../pieces/factory";

export interface Shot {
  /** Camera offset from the hero, before the slow push in. */
  from?: [number, number, number];
  lookAt?: [number, number, number];
  fov?: number;
}

export const DEFAULT_SHOT: Required<Shot> = { from: [1.35, 0.62, 2.35], lookAt: [0, 0.55, 0], fov: 34 };

/** Places the hero (and optional extras) and returns a function that moves the camera. */
export async function stageHero(stage: Stage, hero: { kind: PieceKind; color: Side }, extras: { kind: PieceKind; color: Side; at: [number, number] }[] = []): Promise<THREE.Object3D> {
  const piece = await createPiece(hero.kind, hero.color);
  stage.scene.add(piece);
  for (const e of extras) {
    const p = await createPiece(e.kind, e.color);
    p.position.set(e.at[0], 0, e.at[1]);
    stage.scene.add(p);
  }
  return piece;
}

/** Slow dolly toward the subject with a hint of drift, so stills and loops both feel alive. */
export function shootCamera(stage: Stage, t: number, shot: Shot = {}): void {
  const s = { ...DEFAULT_SHOT, ...shot };
  const push = 1 - Math.min(1, t / 12) * 0.12;
  const drift = Math.sin(t * 0.35) * 0.08;
  stage.camera.fov = s.fov;
  stage.camera.position.set(s.from[0] * push + drift, s.from[1] + Math.sin(t * 0.27) * 0.03, s.from[2] * push);
  stage.camera.lookAt(new THREE.Vector3(...s.lookAt));
  stage.camera.updateProjectionMatrix();
  stage.setFocus(stage.camera.position.distanceTo(new THREE.Vector3(...s.lookAt)));
}

export type EnvFactory = () => Promise<(stage: Stage) => Environment>;
