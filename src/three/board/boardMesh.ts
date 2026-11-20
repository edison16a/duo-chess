/**
 * The 3D board: lacquered squares on a wooden frame. Works for any width,
 * height and holes. World units are squares; the board is centred on the
 * origin with White's first rank toward +z.
 */

import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { woodTexture } from "../core/textures";

export interface BoardShape {
  width: number;
  height: number;
  holes?: number[];
}

export const SQUARE_TOP = 0.0;

/** World position of a square's centre on the board surface. */
export function squareToWorld(shape: BoardShape, square: number, out = new THREE.Vector3()): THREE.Vector3 {
  const x = square % shape.width;
  const y = Math.floor(square / shape.width);
  return out.set(x - (shape.width - 1) / 2, SQUARE_TOP, (shape.height - 1) / 2 - y);
}

/** Inverse of squareToWorld; null when the point is off the board. */
export function worldToSquare(shape: BoardShape, point: THREE.Vector3): number | null {
  const x = Math.round(point.x + (shape.width - 1) / 2);
  const y = Math.round((shape.height - 1) / 2 - point.z);
  if (x < 0 || y < 0 || x >= shape.width || y >= shape.height) return null;
  const s = y * shape.width + x;
  return shape.holes?.includes(s) ? null : s;
}

export function createBoard(shape: BoardShape, colors = { light: "#eed8b5", dark: "#b4865f" }): THREE.Group {
  const group = new THREE.Group();
  const light: THREE.BufferGeometry[] = [];
  const dark: THREE.BufferGeometry[] = [];
  const holes = new Set(shape.holes ?? []);
  for (let s = 0; s < shape.width * shape.height; s++) {
    if (holes.has(s)) continue;
    const p = squareToWorld(shape, s);
    const g = new THREE.BoxGeometry(1, 0.12, 1);
    g.translate(p.x, SQUARE_TOP - 0.06, p.z);
    const x = s % shape.width, y = Math.floor(s / shape.width);
    ((x + y) % 2 === 1 ? light : dark).push(g);
  }
  const tile = (geos: THREE.BufferGeometry[], color: string) => {
    if (!geos.length) return;
    const mesh = new THREE.Mesh(mergeGeometries(geos)!, new THREE.MeshPhysicalMaterial({ color, roughness: 0.55, clearcoat: 0.35, clearcoatRoughness: 0.35 }));
    mesh.receiveShadow = true;
    mesh.name = "squares";
    group.add(mesh);
  };
  tile(light, colors.light);
  tile(dark, colors.dark);

  const wood = woodTexture().clone();
  wood.needsUpdate = true;
  wood.repeat.set(2, 2);
  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(shape.width + 0.9, 0.3, shape.height + 0.9),
    new THREE.MeshPhysicalMaterial({ map: wood, color: 0x9a6a46, roughness: 0.5, clearcoat: 0.7, clearcoatRoughness: 0.2 }),
  );
  frame.position.y = SQUARE_TOP - 0.2;
  frame.receiveShadow = true;
  frame.castShadow = true;
  group.add(frame);
  return group;
}

/** An invisible plane the size of the board, used for mouse picking. */
export function createPickPlane(shape: BoardShape): THREE.Mesh {
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(shape.width, shape.height), new THREE.MeshBasicMaterial({ visible: false }));
  plane.rotation.x = -Math.PI / 2;
  plane.position.y = SQUARE_TOP + 0.001;
  plane.name = "pick";
  return plane;
}
