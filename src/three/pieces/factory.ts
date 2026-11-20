/**
 * Builds 3D pieces. Classic pieces are turned on a lathe; everything else
 * is the extruded 2D art standing on a turned pedestal. Geometry is cached
 * per kind, so creating a piece is just a cheap mesh clone.
 */

import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { PieceKind, Side } from "@/engine";
import { pieceMaterial } from "../core/materials";
import { createDuck } from "./duck";
import { extrudedSilhouette } from "./extrude";
import { latheGeometry, ornaments } from "./lathe";

const TURNED = new Set(["pawn", "rook", "bishop", "queen", "king"]);
const geometries = new Map<string, Promise<THREE.BufferGeometry>>();

/** Silhouette heights so fairy pieces sit in the same family as the classics. */
const HEIGHT: Partial<Record<PieceKind, number>> = {
  knight: 0.78, amazon: 0.95, chancellor: 0.92, archbishop: 0.88, dragon: 0.95, duck: 0.62, bomb: 0.7, mann: 0.75,
};

function strip(g: THREE.BufferGeometry): THREE.BufferGeometry {
  const ng = g.index ? g.toNonIndexed() : g;
  ng.deleteAttribute("uv");
  return ng;
}

async function buildGeometry(kind: PieceKind): Promise<THREE.BufferGeometry> {
  if (TURNED.has(kind)) {
    return mergeGeometries([latheGeometry(kind as "pawn"), ...ornaments(kind)].map(strip))!;
  }
  // Thick enough to read as a solid figure from any orbit angle.
  const figure = (await extrudedSilhouette(kind, HEIGHT[kind] ?? 0.85, kind === "knight" ? 15 : 12)).clone();
  figure.translate(0, 0.15, 0);
  return mergeGeometries([strip(latheGeometry("pedestal")), strip(figure)])!;
}

export function pieceGeometry(kind: PieceKind): Promise<THREE.BufferGeometry> {
  if (!geometries.has(kind)) geometries.set(kind, buildGeometry(kind));
  return geometries.get(kind)!;
}

/** Ready to place object for a piece. */
export async function createPiece(kind: PieceKind, color: Side): Promise<THREE.Object3D> {
  if (kind === "duck") return createDuck();
  const geo = await pieceGeometry(kind);
  const mesh = new THREE.Mesh(geo, pieceMaterial(color));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  if (kind === "knight") {
    // A carved knight looks toward the enemy, showing its profile to the player.
    mesh.rotation.y = color === "b" ? Math.PI / 2 : -Math.PI / 2;
  } else if (!TURNED.has(kind)) {
    faceCamera(mesh);
  }
  mesh.userData.kind = kind;
  return mesh;
}

/** Warms the cache for a set of kinds so the first render does not pop in. */
export function preloadPieces(kinds: PieceKind[]): Promise<unknown> {
  return Promise.all(kinds.filter((k) => k !== "duck").map(pieceGeometry));
}

/**
 * Fairy pieces are relief carvings of their 2D art, so they turn to face
 * whoever is looking (around the vertical axis only). Shadow passes use
 * orthographic light cameras and are left alone.
 */
function faceCamera(mesh: THREE.Mesh): void {
  const world = new THREE.Vector3();
  mesh.onBeforeRender = (_renderer, _scene, camera) => {
    if (!(camera as THREE.PerspectiveCamera).isPerspectiveCamera) return;
    mesh.getWorldPosition(world);
    const angle = Math.atan2(camera.position.x - world.x, camera.position.z - world.z);
    mesh.rotation.y = angle;
    mesh.updateMatrixWorld(true);
  };
}
