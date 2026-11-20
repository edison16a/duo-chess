/**
 * The frozen look: a cluster of clear ice crystals around the piece, an
 * icy collar with icicles hanging off it, a frosted patch on the floor and
 * a slow drift of glints. It stays until the freeze wears off.
 */

import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { Particles } from "../core/particles";
import { glowTexture, sparkTexture } from "../core/textures";
import { FxBase, v3 } from "./base";

/** Hexagonal crystal with a pointed tip, standing on its base. */
function crystal(height: number, radius: number): THREE.BufferGeometry {
  const body = new THREE.CylinderGeometry(radius, radius * 1.05, height * 0.75, 6);
  body.translate(0, height * 0.375, 0);
  const tip = new THREE.ConeGeometry(radius, height * 0.25, 6);
  tip.translate(0, height * 0.875, 0);
  return mergeGeometries([body.toNonIndexed(), tip.toNonIndexed()])!;
}

/** Ring of lumpy ice with icicles of random length hanging below it. */
function collar(radius: number, y: number): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const ring = new THREE.TorusGeometry(radius, 0.07, 8, 28);
  ring.rotateX(Math.PI / 2);
  const pos = ring.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const wobble = 1 + Math.sin(i * 1.7) * 0.18 + Math.sin(i * 0.41) * 0.12;
    pos.setXYZ(i, pos.getX(i) * wobble, pos.getY(i) * (1 + Math.sin(i * 2.3) * 0.4), pos.getZ(i) * wobble);
  }
  ring.translate(0, y, 0);
  parts.push(ring.toNonIndexed());
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2 + Math.sin(i * 3.1) * 0.15;
    const len = 0.18 + Math.abs(Math.sin(i * 2.7)) * 0.34;
    const icicle = new THREE.ConeGeometry(0.045 + Math.abs(Math.sin(i)) * 0.025, len, 7);
    icicle.rotateX(Math.PI);
    icicle.translate(Math.cos(a) * radius, y - len / 2 - 0.02, Math.sin(a) * radius);
    parts.push(icicle.toNonIndexed());
  }
  const merged = mergeGeometries(parts)!;
  merged.computeVertexNormals();
  return merged;
}

export function iceMaterial(): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color: 0xd6f1ff, roughness: 0.06, metalness: 0.05, clearcoat: 1, clearcoatRoughness: 0.05,
    transparent: true, opacity: 0.5, emissive: 0x4fb3ff, emissiveIntensity: 0.18, side: THREE.DoubleSide, depthWrite: false,
  });
}

export class IceEncase extends FxBase {
  private shell = new THREE.Group();
  private glints: Particles;

  constructor(private pieceHeight = 1.1) {
    super(-1);
    const mat = this.own(iceMaterial());
    const crystals: THREE.BufferGeometry[] = [];
    for (let i = 0; i < 11; i++) {
      const a = (i / 11) * Math.PI * 2 + 0.3;
      // Leave the side facing the viewer open so the frozen piece still reads.
      if (Math.cos(a) * 0.45 + Math.sin(a) * 0.9 > 0.45) continue;
      const h = pieceHeight * (0.45 + Math.abs(Math.sin(i * 1.9)) * 0.55);
      const g = crystal(h, 0.07 + Math.abs(Math.cos(i * 1.3)) * 0.04);
      g.rotateZ(Math.sin(i * 2.1) * 0.28);
      g.rotateX(Math.cos(i * 1.7) * 0.28);
      g.translate(Math.cos(a) * 0.36, 0, Math.sin(a) * 0.36);
      crystals.push(g);
    }
    const cluster = new THREE.Mesh(mergeGeometries(crystals)!, mat);
    cluster.geometry.computeVertexNormals();
    const neck = new THREE.Mesh(collar(0.27, pieceHeight * 0.8), mat);
    const frost = new THREE.Mesh(new THREE.CircleGeometry(0.55, 40), this.own(new THREE.MeshBasicMaterial({ map: glowTexture(), color: 0xcdeeff, transparent: true, opacity: 0.28, depthWrite: false })));
    frost.rotation.x = -Math.PI / 2;
    frost.position.y = 0.015;
    this.shell.add(cluster, neck, frost);
    this.object.add(this.shell);
    this.glints = this.particles({ capacity: 40, texture: sparkTexture(), drag: 0.5 });
    const halo = this.glow("#9adcff", pieceHeight * 1.3, 0.14);
    halo.position.y = pieceHeight * 0.5;
  }

  protected step(_dt: number, _k: number): void {
    const grow = Math.min(1, this.age * 3);
    this.shell.scale.set(1, grow, 1);
    if (Math.random() < 0.12) {
      this.glints.emit({ count: 1, position: v3(0, this.pieceHeight * 0.6, 0), spread: v3(0.35, this.pieceHeight * 0.45, 0.35), velocity: v3(0, 0.1, 0), life: [0.5, 1.1], size: [0.06, 0.13], colors: ["#ffffff", "#bfe8ff"] });
    }
  }
}
