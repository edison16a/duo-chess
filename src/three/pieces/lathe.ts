/**
 * Turned (lathe) profiles for the classic Staunton shapes. Units are board
 * squares: a piece base is a bit under one square wide, a king about 1.35
 * tall. Points are (radius, height) pairs from the bottom up.
 */

import * as THREE from "three";

const BASE: [number, number][] = [[0, 0], [0.36, 0], [0.37, 0.035], [0.35, 0.075], [0.3, 0.09], [0.31, 0.12], [0.27, 0.15]];

export const PROFILES: Record<string, [number, number][]> = {
  pawn: [...BASE, [0.2, 0.2], [0.13, 0.33], [0.105, 0.45], [0.17, 0.47], [0.17, 0.5], [0.09, 0.53], [0, 0.53]],
  rook: [...BASE, [0.25, 0.18], [0.21, 0.3], [0.2, 0.6], [0.25, 0.66], [0.26, 0.79], [0.205, 0.79], [0.205, 0.74], [0, 0.74]],
  bishop: [...BASE, [0.22, 0.18], [0.15, 0.3], [0.12, 0.55], [0.18, 0.6], [0.18, 0.63], [0.11, 0.66], [0.15, 0.75], [0.16, 0.83], [0.13, 0.91], [0.07, 0.98], [0, 1.0]],
  queen: [...BASE, [0.25, 0.18], [0.16, 0.35], [0.12, 0.7], [0.2, 0.76], [0.2, 0.79], [0.13, 0.82], [0.15, 0.9], [0.21, 1.04], [0.18, 1.06], [0.1, 1.035], [0, 1.06]],
  king: [...BASE, [0.26, 0.18], [0.17, 0.35], [0.13, 0.76], [0.21, 0.81], [0.21, 0.84], [0.14, 0.86], [0.17, 0.96], [0.2, 1.08], [0.15, 1.11], [0, 1.12]],
  /** Shared pedestal under every extruded piece. */
  pedestal: [...BASE, [0.24, 0.17], [0.22, 0.2], [0, 0.2]],
};

export function latheGeometry(kind: keyof typeof PROFILES): THREE.BufferGeometry {
  const pts = PROFILES[kind].map(([r, y]) => new THREE.Vector2(r, y));
  return new THREE.LatheGeometry(pts, 56);
}

/** Small extra parts that a lathe cannot make: crowns, crosses, merlons, the pawn head. */
export function ornaments(kind: string): THREE.BufferGeometry[] {
  const out: THREE.BufferGeometry[] = [];
  const at = (g: THREE.BufferGeometry, x: number, y: number, z: number) => g.translate(x, y, z);
  if (kind === "pawn") out.push(at(new THREE.SphereGeometry(0.135, 40, 24), 0, 0.64, 0));
  if (kind === "rook") {
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const g = new THREE.BoxGeometry(0.1, 0.09, 0.07);
      g.rotateY(-a);
      out.push(at(g, Math.cos(a) * 0.228, 0.83, Math.sin(a) * 0.228));
    }
  }
  if (kind === "bishop") out.push(at(new THREE.SphereGeometry(0.045, 20, 12), 0, 1.04, 0));
  if (kind === "queen") {
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2;
      out.push(at(new THREE.SphereGeometry(0.035, 16, 10), Math.cos(a) * 0.195, 1.075, Math.sin(a) * 0.195));
    }
    out.push(at(new THREE.SphereGeometry(0.06, 24, 14), 0, 1.11, 0));
  }
  if (kind === "king") {
    out.push(at(new THREE.BoxGeometry(0.055, 0.22, 0.055), 0, 1.22, 0));
    out.push(at(new THREE.BoxGeometry(0.17, 0.055, 0.055), 0, 1.24, 0));
  }
  return out;
}
