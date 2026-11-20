/**
 * Champion: a Corinthian (crested Greek) helmet on a stand. The T shaped
 * face opening is carved by pushing the shell inward, the cheek guards
 * jut forward, the neck guard flares, and a combed crest runs over the top.
 */

import * as THREE from "three";
import { deform, lathe, onPedestal, ramp, slab, sweep, type V3 } from "./shared";

const CENTRE = new THREE.Vector3(0, 0.37, 0);
const R: V3 = [0.16, 0.19, 0.15];

/** 1 inside the T opening (eye slot plus the gap down the middle), 0 elsewhere, with soft edges. */
function opening(d: THREE.Vector3): number {
  if (d.x <= 0) return 0;
  const az = Math.abs(Math.atan2(d.z, d.x));
  const eyes = ramp(0.85, 0.7, az) * ramp(-0.045, -0.025, d.y) * ramp(0.035, 0.015, d.y) * ramp(0.05, 0.12, az);
  const mouth = ramp(0.2, 0.13, az) * ramp(-0.015, -0.035, d.y);
  return Math.min(1, Math.max(eyes, mouth));
}

function helmet(): THREE.BufferGeometry {
  const g = new THREE.SphereGeometry(1, 44, 32).scale(...R).translate(CENTRE.x, CENTRE.y, CENTRE.z);
  return deform(g, (v) => {
    const d = v.clone().sub(CENTRE);
    const low = ramp(-0.02, -0.18, d.y);
    // Cheek guards jut forward and in; the neck guard flares out behind.
    if (d.x > 0) d.x *= 1 + 0.22 * low;
    else d.x *= 1 + 0.3 * low;
    d.z *= 1 + 0.12 * low;
    // Flatten the very bottom so the helmet sits on its stand.
    if (d.y < -0.17) d.y = -0.17 - (d.y + 0.17) * 0.15;
    d.multiplyScalar(1 - 0.26 * opening(d));
    v.copy(CENTRE).add(d);
  });
}

/** A point on the helmet's centre line at angle `a` from the top (positive toward the face), pushed out by `lift`. */
function onTop(a: number, lift: number): THREE.Vector2 {
  return new THREE.Vector2(Math.sin(a) * (R[0] + lift), CENTRE.y + Math.cos(a) * (R[1] + lift));
}

/** Crest outline: a band over the top whose outer edge is combed into soft tufts. */
function crestShape(): THREE.Shape {
  const outer: THREE.Vector2[] = [];
  const inner: THREE.Vector2[] = [];
  const n = 40;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const a = 0.75 - t * 2.75;
    const height = (0.035 + 0.11 * Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.15)), 0.7)) * (0.9 + 0.1 * Math.abs(Math.cos(t * Math.PI * 10)));
    outer.push(onTop(a, height));
    inner.push(onTop(a, -0.03));
  }
  return new THREE.Shape([...outer, ...inner.reverse()]);
}

export function champion(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  parts.push(lathe([[0.2, 0], [0.16, 0.03], [0.1, 0.08], [0.085, 0.14], [0.12, 0.17], [0.11, 0.2], [0, 0.2]], 36));
  parts.push(helmet());
  // Brow ridge over the eye slot.
  parts.push(sweep(Array.from({ length: 9 }, (_, i): V3 => {
    const a = (i / 8 - 0.5) * 1.9;
    return [Math.cos(a) * R[0] * 1.01, CENTRE.y + 0.04, Math.sin(a) * R[2] * 1.01];
  }), (t) => 0.013 * Math.pow(Math.sin(Math.PI * t), 0.4) + 0.002, { segments: 20, radial: 8 }));
  // Combed crest, thinning toward its outer edge like a brush of horsehair.
  const crest = slab(crestShape(), { thickness: 0.07, bevel: 0.026, inset: 0.012, curveSegments: 4, bevelSegments: 3, refine: 0.04 });
  parts.push(deform(crest, (v) => {
    const out = Math.hypot(v.x / R[0], (v.y - CENTRE.y) / R[1]);
    v.z *= 1 - 0.55 * ramp(1.05, 1.7, out);
  }));
  return onPedestal(parts);
}
