/**
 * Runs every 3D effect on the board: one shot effects from game events and
 * long lived ones tied to piece statuses and square effects. Long lived
 * effects are keyed so they appear when a status starts and vanish when it
 * ends, following their piece around as it moves.
 */

import * as THREE from "three";
import type { Color, Position } from "@/engine";
import { squareToWorld, type BoardShape } from "../board/boardMesh";
import { GhostAura, Halo, IceEncase, IceWall, Mine, PoisonBubbles, Portal, ShieldDome, SmokeVeil, type Effect, type FxContext } from "../fx";
import type { PieceSync } from "./pieceSync";

interface Lasting {
  effect: Effect;
  pieceId: number | null;
  square: number;
}

export class EffectSync {
  readonly group = new THREE.Group();
  private oneShots: Effect[] = [];
  private lasting = new Map<string, Lasting>();

  constructor(private pieces: PieceSync) {}

  play(effect: Effect, at: THREE.Vector3): void {
    effect.object.position.copy(at);
    this.group.add(effect.object);
    this.oneShots.push(effect);
  }

  /** Brings status and terrain effects in line with the position. */
  sync(pos: Position, viewer: Color | null): void {
    const shape: BoardShape = { width: pos.width, height: pos.height, holes: pos.holes };
    const want = new Map<string, () => Lasting>();
    pos.board.forEach((p, square) => {
      if (!p?.status) return;
      const h = this.pieces.anchor(p.id)?.height ?? 1.1;
      const add = (key: string, make: () => Effect) => want.set(`${p.id}:${key}`, () => ({ effect: make(), pieceId: p.id, square }));
      if (p.status.frozen) add("ice", () => new IceEncase(h));
      if (p.status.shielded) add("shield", () => new ShieldDome("#ffd76a", h));
      if (p.status.ghost) add("ghost", () => new GhostAura(h));
      if (p.status.poisoned) add("poison", () => new PoisonBubbles(h));
      if (p.status.blessed) add("halo", () => new Halo(h));
      if (p.status.hidden && p.color === viewer) add("veil", () => new SmokeVeil());
    });
    for (const e of pos.effects) {
      if (e.kind === "mine" && e.owner !== viewer) continue;
      const make = e.kind === "wall" ? () => new IceWall() : e.kind === "mine" ? () => new Mine() : () => new Portal();
      want.set(`fx:${e.id}`, () => ({ effect: make(), pieceId: null, square: e.square }));
    }
    for (const [key, item] of this.lasting) {
      if (want.has(key)) continue;
      this.group.remove(item.effect.object);
      item.effect.dispose();
      this.lasting.delete(key);
    }
    for (const [key, make] of want) {
      if (this.lasting.has(key)) continue;
      const item = make();
      squareToWorld(shape, item.square, item.effect.object.position);
      this.group.add(item.effect.object);
      this.lasting.set(key, item);
    }
  }

  update(dt: number, ctx: FxContext): void {
    this.oneShots = this.oneShots.filter((e) => {
      if (e.update(dt, ctx)) return true;
      this.group.remove(e.object);
      e.dispose();
      return false;
    });
    for (const item of this.lasting.values()) {
      if (item.pieceId !== null) {
        const anchor = this.pieces.anchor(item.pieceId);
        if (anchor) item.effect.object.position.set(anchor.position.x, 0, anchor.position.z);
      }
      item.effect.update(dt, ctx);
    }
  }

  dispose(): void {
    [...this.oneShots, ...[...this.lasting.values()].map((l) => l.effect)].forEach((e) => e.dispose());
  }
}
