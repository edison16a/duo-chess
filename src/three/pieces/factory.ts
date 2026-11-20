/**
 * Builds 3D pieces. Classic pieces are turned on a lathe; knights and fairy
 * pieces are sculpted models (see ./models). Geometry is built once per
 * kind and shared, so creating a piece is just a cheap mesh.
 */

import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { PieceKind, Side } from "@/engine";
import { materials, pieceMaterial } from "../core/materials";
import { latheGeometry, ornaments } from "./lathe";
import { MODELS, type PieceModel, type SculptedKind } from "./models";

const TURNED = new Set<PieceKind>(["pawn", "rook", "bishop", "queen", "king"]);
const models = new Map<PieceKind, Promise<PieceModel>>();

function strip(g: THREE.BufferGeometry): THREE.BufferGeometry {
  const ng = g.index ? g.toNonIndexed() : g;
  ng.deleteAttribute("uv");
  return ng;
}

function buildModel(kind: PieceKind): PieceModel {
  if (TURNED.has(kind)) {
    return { body: mergeGeometries([latheGeometry(kind as "pawn"), ...ornaments(kind)].map(strip))! };
  }
  const made = MODELS[kind as SculptedKind]();
  return made instanceof THREE.BufferGeometry ? { body: made } : made;
}

/** Cached model for a kind. Async so callers do not care how it is built. */
function pieceModel(kind: PieceKind): Promise<PieceModel> {
  if (!models.has(kind)) models.set(kind, Promise.resolve().then(() => buildModel(kind)));
  return models.get(kind)!;
}

export async function pieceGeometry(kind: PieceKind): Promise<THREE.BufferGeometry> {
  return (await pieceModel(kind)).body;
}

function shadowed(mesh: THREE.Mesh): THREE.Mesh {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

/** Ready to place object for a piece. Models face the enemy: White toward -z, Black toward +z. */
export async function createPiece(kind: PieceKind, color: Side): Promise<THREE.Object3D> {
  const model = await pieceModel(kind);
  // The duck belongs to nobody and is always the yellow rubber duck.
  const material = kind === "duck" ? materials().neutral : pieceMaterial(color);
  const body = shadowed(new THREE.Mesh(model.body, material));
  let piece: THREE.Object3D = body;
  if (model.accents?.length) {
    piece = new THREE.Group();
    piece.add(body, ...model.accents.map((a) => shadowed(new THREE.Mesh(a.geometry, a.material()))));
  }
  if (color === "b") piece.rotation.y = Math.PI;
  piece.userData.kind = kind;
  return piece;
}

/** Warms the cache for a set of kinds so the first render does not pop in. */
export function preloadPieces(kinds: PieceKind[]): Promise<unknown> {
  return Promise.all(kinds.map(pieceModel));
}
