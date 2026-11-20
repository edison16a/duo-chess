/**
 * Small modelling kit shared by every sculpted piece. Parts are plain
 * BufferGeometries in board units (one square = 1), built with the front of
 * the figure pointing toward +x and finally turned so it faces -z.
 */

import * as THREE from "three";
import { LoftGeometry } from "three/examples/jsm/geometries/LoftGeometry.js";
import { mergeGeometries, mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { PROFILES } from "../lathe";
import { refine } from "./refine";

export type V2 = [number, number];
export type V3 = [number, number, number];

/** Top of the shared turned pedestal; figures stand on this height. */
export const PEDESTAL_TOP = 0.2;

/** Keeps only position and normal and makes the part indexed, so any mix of parts merges. */
function clean(g: THREE.BufferGeometry): THREE.BufferGeometry {
  for (const name of Object.keys(g.attributes)) {
    if (name !== "position" && name !== "normal") g.deleteAttribute(name);
  }
  g.clearGroups();
  return g.index ? g : mergeVertices(g, 1e-5);
}

export function merge(parts: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const g = mergeGeometries(parts.map(clean));
  if (!g) throw new Error("Could not merge piece parts");
  return g;
}

/**
 * Welds coincident vertices and recomputes normals. Extrusions and lofts
 * come with split seams and faceted normals; welding them makes bevels and
 * seams shade as one continuous carved surface.
 */
export function smooth(g: THREE.BufferGeometry): THREE.BufferGeometry {
  for (const name of Object.keys(g.attributes)) if (name !== "position") g.deleteAttribute(name);
  const welded = mergeVertices(g.index ? g.toNonIndexed() : g, 1e-4);
  welded.computeVertexNormals();
  return welded;
}

/** Scales, rotates (XYZ Euler, radians) and then moves a geometry in place. */
export function place(g: THREE.BufferGeometry, at: V3 = [0, 0, 0], rot: V3 = [0, 0, 0], scale: V3 | number = 1): THREE.BufferGeometry {
  const s = typeof scale === "number" ? [scale, scale, scale] : scale;
  const m = new THREE.Matrix4().compose(
    new THREE.Vector3(...at),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(...rot)),
    new THREE.Vector3(s[0], s[1], s[2]),
  );
  return g.applyMatrix4(m);
}

/** Moves every vertex through `fn`, then refreshes normals. */
export function deform(g: THREE.BufferGeometry, fn: (v: THREE.Vector3) => void): THREE.BufferGeometry {
  const pos = g.getAttribute("position");
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    fn(v);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  pos.needsUpdate = true;
  g.computeVertexNormals();
  return g;
}

export function lathe(points: V2[], segments = 40): THREE.BufferGeometry {
  return new THREE.LatheGeometry(points.map(([r, y]) => new THREE.Vector2(r, y)), segments);
}

/** The turned base every non classic piece stands on, matching the Staunton set. */
export function pedestal(): THREE.BufferGeometry {
  return lathe(PROFILES.pedestal, 40);
}

export function ellipsoid(r: V3, at: V3, rot: V3 = [0, 0, 0], detail: [number, number] = [20, 14]): THREE.BufferGeometry {
  return place(new THREE.SphereGeometry(1, detail[0], detail[1]), at, rot, r);
}

export function ball(r: number, at: V3, detail: [number, number] = [16, 12]): THREE.BufferGeometry {
  return ellipsoid([r, r, r], at, [0, 0, 0], detail);
}

export interface SlabOptions {
  /** Full thickness along z. */
  thickness: number;
  /** Depth of the rounded edge along z. Kept below half the thickness. */
  bevel: number;
  /** How far the rounding eats into the outline; defaults to `bevel`. Smaller gives an oval edge. */
  inset?: number;
  curveSegments?: number;
  bevelSegments?: number;
  /** Splits long cap triangles so a later `deform` can bend the flat sides. */
  refine?: number;
}

/**
 * Extrudes a 2D shape along z, centred on z = 0, with fully rounded edges.
 * The bevel is inset (negative offset) so the silhouette keeps the exact
 * outline of the shape instead of swelling past it.
 */
export function slab(shape: THREE.Shape, o: SlabOptions): THREE.BufferGeometry {
  const bevel = Math.min(o.bevel, o.thickness / 2 - 0.002);
  const depth = Math.max(o.thickness - 2 * bevel, 0.002);
  let g: THREE.BufferGeometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: o.inset ?? bevel,
    bevelOffset: -(o.inset ?? bevel),
    bevelSegments: o.bevelSegments ?? 6,
    curveSegments: o.curveSegments ?? 16,
  });
  g.translate(0, 0, -depth / 2);
  if (o.refine) g = refine(g, o.refine);
  return smooth(g);
}

export interface SweepOptions {
  segments?: number;
  radial?: number;
  /** Section height over width; below 1 flattens the tube toward `up`. */
  squash?: number;
  /** Fixes the section orientation: the squashed axis lies along this direction. */
  up?: V3;
  /** Instead of `up`, squash along the direction away from this point (bands hugging a surface). */
  around?: V3;
  /** Join the end back to the start, for rings and bands. */
  closed?: boolean;
  /** Catmull-Rom tension of the path through the points; higher hugs the points more loosely. */
  tension?: number;
}

/**
 * A tube along a smooth spline whose radius follows `radius(t)` for t in
 * 0..1. Letting the radius fall to zero at an end closes it in a rounded
 * tip, which is how horns, flames, legs and tails are made.
 */
export function sweep(points: V3[], radius: (t: number) => number, o: SweepOptions = {}): THREE.BufferGeometry {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)), o.closed ?? false, "catmullrom", o.tension ?? 0.5);
  const n = o.segments ?? 28;
  const radial = o.radial ?? 14;
  const frames = curve.computeFrenetFrames(n, o.closed ?? false);
  const fixedUp = o.up ? new THREE.Vector3(...o.up).normalize() : null;
  const centre = o.around ? new THREE.Vector3(...o.around) : null;
  const up = new THREE.Vector3();
  const sections: THREE.Vector3[][] = [];
  const nrm = new THREE.Vector3();
  const bin = new THREE.Vector3();
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const p = curve.getPointAt(t);
    const tan = frames.tangents[i];
    if (centre) up.subVectors(p, centre).normalize();
    else if (fixedUp) up.copy(fixedUp);
    if (centre || fixedUp) {
      // Project `up` off the tangent so the flattened axis stays put along a bending path.
      nrm.copy(up).addScaledVector(tan, -up.dot(tan)).normalize();
      bin.crossVectors(tan, nrm);
    } else {
      nrm.copy(frames.normals[i]);
      bin.copy(frames.binormals[i]);
    }
    const r = Math.max(radius(t), 0.0008);
    const ring: THREE.Vector3[] = [];
    for (let j = 0; j < radial; j++) {
      const a = (j / radial) * Math.PI * 2;
      ring.push(p.clone().addScaledVector(nrm, Math.cos(a) * r * (o.squash ?? 1)).addScaledVector(bin, Math.sin(a) * r));
    }
    sections.push(ring);
  }
  const open = !o.closed;
  const loft = new LoftGeometry(sections, { capStart: open && radius(0) > 0.003, capEnd: open && radius(1) > 0.003 });
  return smooth(loft);
}

/**
 * Profile for a swept part with round ends: 1 in the middle, falling along
 * a quarter circle over the first and last `cap` fraction of the length.
 */
export function rounded(t: number, cap = 0.12): number {
  const a = Math.min(1, t / cap);
  const b = Math.min(1, (1 - t) / cap);
  return Math.sqrt(1 - (1 - a) ** 2) * Math.sqrt(1 - (1 - b) ** 2);
}

/** Smooth ramp from 0 at `a` to 1 at `b` (either order). */
export function ramp(a: number, b: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}

/** Turns a model built nose toward +x so it faces -z, the direction White plays. */
export function faceForward(g: THREE.BufferGeometry): THREE.BufferGeometry {
  g.rotateY(Math.PI / 2);
  return g;
}

/** Pedestal plus a figure that was modelled facing +x with its feet at y = 0. */
export function onPedestal(figure: THREE.BufferGeometry[], lift = PEDESTAL_TOP): THREE.BufferGeometry {
  const body = merge(figure);
  body.translate(0, lift, 0);
  return faceForward(merge([pedestal(), body]));
}
