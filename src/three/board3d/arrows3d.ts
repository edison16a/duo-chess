/**
 * Annotation arrows drawn flat on the 3D board. We reuse the 2D arrow
 * outline (measured in squares) and lay it on the board plane, so both
 * views draw exactly the same chess.com style shapes.
 */

import * as THREE from "three";
import { arrowPolygon } from "@/components/board/arrows";
import type { Arrow, Brush } from "@/components/board/useAnnotations";
import type { BoardShape } from "../board/boardMesh";

const COLORS: Record<Brush, string> = { main: "#ff9f1a", green: "#3fae5a", blue: "#3f7fe0", red: "#e0453f" };

export class ArrowLayer {
  readonly group = new THREE.Group();
  private materials = new Map<Brush, THREE.MeshBasicMaterial>();

  private material(brush: Brush): THREE.MeshBasicMaterial {
    let m = this.materials.get(brush);
    if (!m) {
      // Drawn on the board plane but always on top, so pieces never hide an arrow.
      m = new THREE.MeshBasicMaterial({ color: COLORS[brush], transparent: true, opacity: 0.82, depthWrite: false, depthTest: false, side: THREE.DoubleSide });
      this.materials.set(brush, m);
    }
    return m;
  }

  set(shape: BoardShape, arrows: Arrow[]): void {
    this.group.children.forEach((c) => (c as THREE.Mesh).geometry.dispose());
    this.group.clear();
    for (const a of arrows) {
      if (a.from === a.to) continue;
      const pts = arrowPolygon(shape, a.from, a.to, "w").split(" ").map((p) => p.split(",").map(Number));
      const outline = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x - shape.width / 2, -(y - shape.height / 2))));
      const mesh = new THREE.Mesh(new THREE.ShapeGeometry(outline), this.material(a.brush));
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.y = 0.02;
      mesh.renderOrder = 20;
      this.group.add(mesh);
    }
  }

  dispose(): void {
    this.group.children.forEach((c) => (c as THREE.Mesh).geometry.dispose());
    this.materials.forEach((m) => m.dispose());
  }
}
