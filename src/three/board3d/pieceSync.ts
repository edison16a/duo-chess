/**
 * Keeps 3D piece meshes in step with the engine position. Pieces are keyed
 * by id, so a move is a short tween from one square to another, a capture
 * shrinks the victim away and a promotion swaps the mesh in place.
 */

import * as THREE from "three";
import type { Piece, PieceKind, Position, Side } from "@/engine";
import { squareToWorld, type BoardShape } from "../board/boardMesh";
import { createPiece } from "../pieces/factory";

interface Entry {
  object: THREE.Object3D;
  kind: PieceKind;
  color: Side;
  square: number;
  from: THREE.Vector3;
  to: THREE.Vector3;
  t: number;
  hop: number;
  dying: number;
  height: number;
}

const MOVE_TIME = 0.32;

export class PieceSync {
  private entries = new Map<number, Entry>();
  private pending = new Set<number>();
  private shape: BoardShape = { width: 8, height: 8 };
  private hidden = new Set<number>();
  private dragged: { id: number; point: THREE.Vector3 } | null = null;

  constructor(private root: THREE.Group) {}

  sync(pos: Position, hidden: Set<number>): void {
    this.shape = { width: pos.width, height: pos.height, holes: pos.holes };
    this.hidden = hidden;
    const seen = new Set<number>();
    pos.board.forEach((piece, square) => {
      if (!piece) return;
      seen.add(piece.id);
      const entry = this.entries.get(piece.id);
      if (entry && entry.kind === piece.kind && entry.color === piece.color) {
        if (entry.square !== square) this.moveTo(entry, square, piece.kind === "knight" ? 0.55 : 0.18);
      } else {
        if (entry) this.drop(piece.id, true);
        this.spawn(piece, square);
      }
    });
    for (const id of [...this.entries.keys()]) if (!seen.has(id)) this.drop(id, false);
    this.applyVisibility();
  }

  private moveTo(entry: Entry, square: number, hop: number): void {
    entry.from.copy(entry.object.position);
    squareToWorld(this.shape, square, entry.to);
    entry.square = square;
    entry.t = 0;
    entry.hop = hop;
  }

  private async spawn(piece: Piece, square: number): Promise<void> {
    if (this.pending.has(piece.id)) return;
    this.pending.add(piece.id);
    const object = await createPiece(piece.kind, piece.color);
    this.pending.delete(piece.id);
    const box = new THREE.Box3().setFromObject(object);
    const at = squareToWorld(this.shape, square);
    object.position.copy(at);
    object.scale.setScalar(0.01);
    this.root.add(object);
    this.entries.set(piece.id, { object, kind: piece.kind, color: piece.color, square, from: at.clone(), to: at.clone(), t: 1, hop: 0, dying: 0, height: box.max.y - box.min.y });
    this.applyVisibility();
  }

  /** Removes a piece: instantly for swaps, with a quick shrink for captures. */
  private drop(id: number, instant: boolean): void {
    const entry = this.entries.get(id);
    if (!entry) return;
    this.entries.delete(id);
    if (instant) { this.root.remove(entry.object); return; }
    entry.dying = 0.0001;
    this.dyingList.push(entry);
  }

  private dyingList: Entry[] = [];

  private applyVisibility(): void {
    for (const [id, e] of this.entries) e.object.visible = !this.hidden.has(id);
  }

  /** Lift a piece and have it follow the pointer while dragging. */
  drag(id: number | null, point: THREE.Vector3 | null): void {
    this.dragged = id !== null && point ? { id, point: point.clone() } : null;
  }

  idAt(square: number): number | null {
    for (const [id, e] of this.entries) if (e.square === square) return id;
    return null;
  }

  /** Current world position and height of a piece, for effects that follow it. */
  anchor(id: number): { position: THREE.Vector3; height: number } | null {
    const e = this.entries.get(id);
    return e ? { position: e.object.position, height: e.height } : null;
  }

  update(dt: number): void {
    for (const [id, e] of this.entries) {
      if (e.object.scale.x < 1) e.object.scale.setScalar(Math.min(1, e.object.scale.x + dt * 5));
      if (this.dragged?.id === id) {
        e.object.position.lerp(new THREE.Vector3(this.dragged.point.x, 0.35, this.dragged.point.z), 1 - Math.exp(-dt * 25));
        continue;
      }
      if (e.t < 1) {
        e.t = Math.min(1, e.t + dt / MOVE_TIME);
        const k = e.t < 0.5 ? 4 * e.t ** 3 : 1 - (-2 * e.t + 2) ** 3 / 2;
        e.object.position.lerpVectors(e.from, e.to, k);
        e.object.position.y = Math.sin(Math.PI * e.t) * e.hop;
      } else if (e.object.position.distanceToSquared(e.to) > 1e-6) {
        e.object.position.lerp(e.to, 1 - Math.exp(-dt * 20));
      }
    }
    this.dyingList = this.dyingList.filter((e) => {
      e.dying += dt;
      const s = Math.max(0, 1 - e.dying / 0.22);
      e.object.scale.setScalar(s);
      if (s <= 0) this.root.remove(e.object);
      return s > 0;
    });
  }
}
