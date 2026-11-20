/**
 * The carved horse head shared by the whole knight family (knight,
 * archbishop, chancellor, amazon, zebra, nightrider, centaur). It is a thick
 * rounded profile whose sides are pinched toward the muzzle and the mane
 * ridge, dressed with real 3D ears, eyes, brows, cheeks and nostrils.
 *
 * Local frame: nose toward +x, neck bottom at y = 0, centred on z = 0.
 */

import * as THREE from "three";
import { deform, ellipsoid, lathe, merge, ramp, slab, sweep, type V3 } from "./shared";

/** Half thickness of the head before shaping. */
const HALF = 0.15;

/** Poll (top of the head between the ears), handy for hats and crowns. */
export const POLL: V3 = [-0.03, 0.65, 0];

/** Height of the head profile including the ears. */
export const HEAD_HEIGHT = 0.73;

function profile(): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(-0.18, -0.02);
  // Back of the neck rises in one long convex sweep to the poll.
  s.bezierCurveTo(-0.2, 0.16, -0.23, 0.34, -0.19, 0.47);
  s.bezierCurveTo(-0.16, 0.57, -0.09, 0.645, -0.02, 0.65);
  // Forehead, then the long straight face down to the nose.
  s.bezierCurveTo(0.04, 0.655, 0.08, 0.62, 0.12, 0.57);
  s.bezierCurveTo(0.17, 0.51, 0.23, 0.46, 0.275, 0.425);
  // Rounded nose and lips, then the chin.
  s.bezierCurveTo(0.315, 0.4, 0.32, 0.34, 0.295, 0.31);
  s.bezierCurveTo(0.28, 0.29, 0.28, 0.27, 0.255, 0.262);
  // Under the jaw back to the round jowl, the throat, and the chest.
  s.bezierCurveTo(0.2, 0.245, 0.13, 0.25, 0.085, 0.26);
  s.bezierCurveTo(0.03, 0.265, 0.02, 0.22, 0.04, 0.17);
  s.bezierCurveTo(0.06, 0.12, 0.15, 0.08, 0.16, -0.02);
  s.closePath();
  return s;
}

/** Thickness multiplier across the profile: slimmer muzzle, crest and crown, fuller jowls. */
export function widthAt(x: number, y: number): number {
  const muzzle = 1 - 0.34 * ramp(0.04, 0.3, x);
  const crest = 1 - 0.4 * ramp(-0.08, -0.21, x) * ramp(0.15, 0.45, y);
  const crown = 1 - 0.15 * ramp(0.5, 0.66, y);
  const neck = 0.86 + 0.14 * ramp(0.2, 0.4, y) + 0.08 * ramp(0.1, -0.02, y);
  const jowl = 1 + 0.16 * Math.exp(-((x - 0.03) ** 2 + (y - 0.35) ** 2) / 0.006);
  return muzzle * crest * crown * neck * jowl;
}

/** Distance from the centre plane to the cheek surface at (x, y). */
export function sideAt(x: number, y: number): number {
  return HALF * widthAt(x, y);
}

export interface HorseOptions {
  /** "locks" for carved mane tufts, "brush" for a short upright zebra mane. */
  mane?: "locks" | "brush";
  /** Leave the mane off when something else sits on the crest. */
  noMane?: boolean;
}

/** Pair of parts mirrored across the centre plane. */
function both(make: (side: 1 | -1) => THREE.BufferGeometry): THREE.BufferGeometry[] {
  return [make(1), make(-1)];
}

function ear(side: 1 | -1): THREE.BufferGeometry {
  // A turned leaf shape, flattened, reads as a pricked ear rather than a spike.
  const g = lathe([[0, 0], [0.048, 0], [0.056, 0.04], [0.047, 0.085], [0.027, 0.12], [0.012, 0.132], [0, 0.136]], 14);
  g.scale(1, 1, 0.58);
  // Ears prick forward and splay out a little.
  return g.rotateZ(-0.3).rotateX(side * -0.25).translate(-0.04, 0.585, side * 0.06);
}

/** The crest line the mane follows, from behind the ears down to the collar. */
const CREST = new THREE.CubicBezierCurve(
  new THREE.Vector2(-0.075, 0.635), new THREE.Vector2(-0.17, 0.6), new THREE.Vector2(-0.235, 0.42), new THREE.Vector2(-0.2, 0.02),
);

/**
 * Carved mane: overlapping tapered locks laid along the crest, each curling
 * down and back, alternating sides so the back reads as a braid.
 */
function mane(): THREE.BufferGeometry[] {
  const out: THREE.BufferGeometry[] = [];
  const n = 10;
  for (let i = 0; i < n; i++) {
    const t0 = (i / n) * 0.9;
    const at = (t: number, lift: number): V3 => {
      const p = CREST.getPointAt(Math.min(1, t));
      const d = CREST.getTangentAt(Math.min(1, t));
      return [p.x - d.y * lift, p.y + d.x * lift, (i % 2 ? 1 : -1) * 0.014];
    };
    const r = 0.046 * (1 - 0.4 * t0);
    out.push(sweep([at(t0, -0.02), at(t0 + 0.07, 0.012), at(t0 + 0.15, 0.012), at(t0 + 0.21, -0.008)], (t) => r * Math.pow(Math.sin(Math.PI * (0.15 + 0.85 * t)), 0.6), { segments: 8, radial: 8, up: [0, 0, 1], squash: 1.35 }));
  }
  return out;
}

/** A short stiff zebra mane: a row of upright rounded bristle blocks. */
function maneBrush(): THREE.BufferGeometry[] {
  const out: THREE.BufferGeometry[] = [];
  const crest = new THREE.CubicBezierCurve(
    new THREE.Vector2(-0.06, 0.66), new THREE.Vector2(-0.16, 0.63), new THREE.Vector2(-0.23, 0.44), new THREE.Vector2(-0.205, 0.12),
  );
  for (let i = 0; i < 11; i++) {
    const t = 0.03 + (i / 10) * 0.9;
    const p = crest.getPointAt(t);
    const d = crest.getTangentAt(t);
    const angle = Math.atan2(-d.x, d.y) + Math.PI;
    out.push(ellipsoid([0.02, 0.05, 0.028], [p.x - d.y * 0.03, p.y + d.x * 0.03, 0], [0, 0, angle], [10, 8]));
  }
  return out;
}

export function horseHead(o: HorseOptions = {}): THREE.BufferGeometry {
  const head = slab(profile(), { thickness: HALF * 2, bevel: 0.115, inset: 0.065, bevelSegments: 4, curveSegments: 8, refine: 0.085 });
  deform(head, (v) => { v.z *= widthAt(v.x, v.y); });

  const parts: THREE.BufferGeometry[] = [head];
  parts.push(...both(ear));
  // Eyes sit under a soft brow ridge, bulging just proud of the cheek.
  parts.push(...both((s) => ellipsoid([0.032, 0.03, 0.022], [0.07, 0.5, s * (sideAt(0.07, 0.5) - 0.01)], [0, 0, 0], [14, 10])));
  parts.push(...both((s) => ellipsoid([0.055, 0.02, 0.022], [0.06, 0.532, s * (sideAt(0.06, 0.532) - 0.018)], [0, 0, -0.4], [12, 8])));
  // Flared nostrils at the tip of the nose, angled forward.
  parts.push(...both((s) => {
    const g = new THREE.TorusGeometry(0.015, 0.006, 6, 12);
    return g.rotateY(Math.PI / 2 - s * 0.9).translate(0.275, 0.385, s * (sideAt(0.275, 0.385) - 0.02));
  }));
  // Forelock between the ears.
  parts.push(ellipsoid([0.05, 0.025, 0.035], [0.025, 0.635, 0], [0, 0, -0.5], [12, 8]));
  if (!o.noMane) parts.push(...(o.mane === "brush" ? maneBrush() : mane()));
  return merge(parts);
}
