/**
 * Flat overlays lying on the board: last move, selection, check, move
 * hints, aiming targets, annotations and fog. Rebuilt whenever the inputs
 * change; there are rarely more than a few dozen of them.
 */

import * as THREE from "three";
import { squareToWorld, type BoardShape } from "../board/boardMesh";
import { glowTexture, smokeTexture } from "../core/textures";

export type HighlightKind = "tint" | "dot" | "ring" | "aim" | "fog";

export interface Highlight {
  square: number;
  kind: HighlightKind;
  color: string;
  opacity?: number;
}

export class HighlightLayer {
  readonly group = new THREE.Group();
  private materials = new Map<string, THREE.MeshBasicMaterial>();
  private geos = {
    tint: new THREE.PlaneGeometry(1, 1),
    dot: new THREE.CircleGeometry(0.15, 32),
    ring: new THREE.RingGeometry(0.36, 0.46, 48),
    aim: new THREE.PlaneGeometry(0.96, 0.96),
    fog: new THREE.PlaneGeometry(1.02, 1.02),
  };
  private aims: THREE.Mesh[] = [];
  private clock = 0;

  private material(kind: HighlightKind, color: string, opacity: number): THREE.MeshBasicMaterial {
    const key = `${kind}:${color}:${opacity}`;
    let m = this.materials.get(key);
    if (!m) {
      m = new THREE.MeshBasicMaterial({
        color, transparent: true, opacity, depthWrite: false,
        map: kind === "fog" ? smokeTexture() : kind === "aim" ? glowTexture() : null,
        blending: kind === "aim" ? THREE.AdditiveBlending : THREE.NormalBlending,
        polygonOffset: true, polygonOffsetFactor: -2,
      });
      this.materials.set(key, m);
    }
    return m;
  }

  set(shape: BoardShape, list: Highlight[]): void {
    this.group.clear();
    this.aims = [];
    for (const h of list) {
      const mesh = new THREE.Mesh(this.geos[h.kind], this.material(h.kind, h.color, h.opacity ?? 0.5));
      mesh.rotation.x = -Math.PI / 2;
      squareToWorld(shape, h.square, mesh.position);
      mesh.position.y = h.kind === "fog" ? 0.04 : h.kind === "tint" ? 0.004 : 0.008;
      if (h.kind === "fog") {
        // Fog is a stack of soft puffs so it reads as cloud, not a dark tile.
        mesh.scale.setScalar(1.6);
        mesh.rotation.z = (h.square * 1.7) % Math.PI;
        const under = new THREE.Mesh(this.geos.tint, this.material("tint", "#24262b", 0.92));
        under.rotation.x = -Math.PI / 2;
        under.position.set(mesh.position.x, 0.02, mesh.position.z);
        this.group.add(under);
      }
      if (h.kind === "aim") this.aims.push(mesh);
      this.group.add(mesh);
    }
  }

  update(dt: number): void {
    this.clock += dt;
    const s = 0.92 + Math.sin(this.clock * 5) * 0.06;
    for (const m of this.aims) m.scale.setScalar(s);
  }

  dispose(): void {
    Object.values(this.geos).forEach((g) => g.dispose());
    this.materials.forEach((m) => m.dispose());
  }
}
