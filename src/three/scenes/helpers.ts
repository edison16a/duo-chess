/** Building blocks for the showcase scenes: boards, piece placement and gentle camera moves. */

import * as THREE from "three";
import type { PieceKind, Side } from "@/engine";
import { createBoard, squareToWorld, type BoardShape } from "../board/boardMesh";
import { createPiece } from "../pieces/factory";
import type { Stage } from "../core/stage";

export interface Placed {
  mesh: THREE.Object3D;
  square: number;
}

const SQUARE_NAMES = "abcdefghij";

export function sq(shape: BoardShape, name: string): number {
  return (Number(name.slice(1)) - 1) * shape.width + SQUARE_NAMES.indexOf(name[0]);
}

/** Parse a FEN like placement ("rnbqkbnr/pppppppp/8/...") into pieces on the board. */
export async function placeFen(stage: Stage, shape: BoardShape, rows: string, map: Record<string, PieceKind> = {}): Promise<Map<string, Placed>> {
  const letters: Record<string, PieceKind> = { p: "pawn", r: "rook", n: "knight", b: "bishop", q: "queen", k: "king", d: "dragon", a: "archbishop", c: "chancellor", m: "amazon", "@": "duck", ...map };
  const placed = new Map<string, Placed>();
  const ranks = rows.split("/");
  for (let i = 0; i < ranks.length; i++) {
    const y = shape.height - 1 - i;
    let x = 0;
    for (const ch of ranks[i]) {
      if (/\d/.test(ch)) { x += Number(ch); continue; }
      const kind = letters[ch.toLowerCase()];
      const color: Side = ch === "@" ? "n" : ch === ch.toUpperCase() ? "w" : "b";
      const square = y * shape.width + x;
      const mesh = await createPiece(kind, color);
      squareToWorld(shape, square, mesh.position);
      stage.scene.add(mesh);
      placed.set(`${SQUARE_NAMES[x]}${y + 1}`, { mesh, square });
      x++;
    }
  }
  return placed;
}

export function addBoard(stage: Stage, shape: BoardShape = { width: 8, height: 8 }, dress = true): THREE.Group {
  const board = createBoard(shape);
  stage.scene.add(board);
  if (dress) dressStage(stage);
  return board;
}

let backdrop: THREE.Texture | null = null;

/**
 * Puts the board in a room instead of a void: a dark table top that takes
 * shadows, a graded backdrop and a little depth fog.
 */
export function dressStage(stage: Stage): void {
  if (stage.scene.getObjectByName("table")) return;
  const table = new THREE.Mesh(new THREE.CircleGeometry(60, 64), new THREE.MeshStandardMaterial({ color: 0x1a1612, roughness: 0.85, metalness: 0.05 }));
  table.rotation.x = -Math.PI / 2;
  table.position.y = -0.36;
  table.receiveShadow = true;
  table.name = "table";
  stage.scene.add(table);
  if (!backdrop) {
    const c = document.createElement("canvas");
    c.width = 4; c.height = 256;
    const g = c.getContext("2d")!;
    const grad = g.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, "#07080b");
    grad.addColorStop(0.55, "#141820");
    grad.addColorStop(1, "#1d1a17");
    g.fillStyle = grad;
    g.fillRect(0, 0, 4, 256);
    backdrop = new THREE.CanvasTexture(c);
    backdrop.colorSpace = THREE.SRGBColorSpace;
  }
  stage.scene.background = backdrop;
  stage.scene.fog = new THREE.Fog(0x15171c, 14, 34);
}

/** Slow orbit around a target, the default camera move for previews. */
export function orbit(stage: Stage, t: number, o: { radius: number; height: number; speed: number; start?: number; target?: THREE.Vector3 }): void {
  const a = (o.start ?? 0) + t * o.speed;
  const target = o.target ?? new THREE.Vector3();
  stage.camera.position.set(target.x + Math.sin(a) * o.radius, o.height, target.z + Math.cos(a) * o.radius);
  stage.camera.lookAt(target);
}

/** Smooth 0..1 ease used for piece moves. */
export function ease(t: number): number {
  const c = Math.min(1, Math.max(0, t));
  return c < 0.5 ? 4 * c * c * c : 1 - Math.pow(-2 * c + 2, 3) / 2;
}

/** Slide a piece between squares with a small hop, like a hand moving it. */
export function movePiece(shape: BoardShape, mesh: THREE.Object3D, from: number, to: number, k: number, hop = 0.35): void {
  const a = squareToWorld(shape, from), b = squareToWorld(shape, to);
  const e = ease(k);
  mesh.position.lerpVectors(a, b, e);
  mesh.position.y = Math.sin(Math.PI * Math.min(1, Math.max(0, k))) * hop;
}
