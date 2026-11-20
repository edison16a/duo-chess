/**
 * The 3D chess board as one imperative object. React feeds it positions,
 * highlights and events; it owns the WebGL stage, the camera rig, the
 * pieces and every effect, and renders on its own animation loop.
 */

import * as THREE from "three";
import type { Color, GameEvent, Position, RatingId } from "@/engine";
import { createBoard, createPickPlane, squareToWorld, type BoardShape } from "../board/boardMesh";
import { badgeTexture } from "../core/textures";
import { createStage, type Stage } from "../core/stage";
import { eventEffects, ratingEffect, type FxContext } from "../fx";
import { ArrowLayer } from "./arrows3d";
import { CameraRig } from "./cameraRig";
import { EffectSync } from "./effectSync";
import { HighlightLayer, type Highlight } from "./highlights";
import { PieceSync } from "./pieceSync";
import type { Arrow } from "@/components/board/useAnnotations";

export interface RatingBadge {
  square: number;
  id: RatingId;
  glyph: string;
  color: string;
  key: string;
}

export class BoardScene {
  readonly stage: Stage;
  readonly rig: CameraRig;
  private shape: BoardShape = { width: 0, height: 0 };
  private board: THREE.Group | null = null;
  private pick: THREE.Mesh | null = null;
  private pieceRoot = new THREE.Group();
  readonly pieces = new PieceSync(this.pieceRoot);
  private highlights = new HighlightLayer();
  private arrows = new ArrowLayer();
  private effects = new EffectSync(this.pieces);
  private badge: THREE.Sprite | null = null;
  private badgeKey = "";
  private colors = { light: "", dark: "" };
  private frame = 0;
  private last = performance.now();
  private raycaster = new THREE.Raycaster();
  private disposed = false;

  constructor(canvas: HTMLCanvasElement) {
    this.stage = createStage({ canvas, bloom: 0.45, background: 0x0f1012 });
    this.stage.scene.fog = new THREE.Fog(0x0f1012, 22, 48);
    this.rig = new CameraRig(this.stage.camera);
    this.stage.scene.add(this.pieceRoot, this.highlights.group, this.arrows.group, this.effects.group);
    const loop = () => {
      if (this.disposed) return;
      const now = performance.now();
      this.tick(Math.min(0.05, (now - this.last) / 1000));
      this.last = now;
      this.frame = requestAnimationFrame(loop);
    };
    loop();
  }

  resize(width: number, height: number): void {
    this.stage.resize(width, height);
    if (this.shape.width) this.rig.fit(this.shape.width, this.shape.height, width / Math.max(1, height));
  }

  /** Rebuilds the board mesh only when its shape or colours change. */
  setBoard(pos: Position, colors: { light: string; dark: string }): void {
    const same = pos.width === this.shape.width && pos.height === this.shape.height && pos.holes.join() === (this.shape.holes ?? []).join();
    if (same && colors.light === this.colors.light && colors.dark === this.colors.dark) return;
    if (this.board) this.stage.scene.remove(this.board);
    if (this.pick) this.stage.scene.remove(this.pick);
    this.shape = { width: pos.width, height: pos.height, holes: pos.holes.slice() };
    this.colors = colors;
    this.board = createBoard(this.shape, colors);
    this.pick = createPickPlane(this.shape);
    this.stage.scene.add(this.board, this.pick);
    const c = this.stage.renderer.domElement;
    this.rig.fit(pos.width, pos.height, c.clientWidth / Math.max(1, c.clientHeight));
  }

  setPosition(pos: Position, hidden: Set<number>, viewer: Color | null): void {
    this.pieces.sync(pos, hidden);
    // Statuses need the piece heights, which exist once meshes load.
    setTimeout(() => !this.disposed && this.effects.sync(pos, viewer), 0);
  }

  setHighlights(list: Highlight[]): void {
    this.highlights.set(this.shape, list);
  }

  setArrows(list: Arrow[]): void {
    this.arrows.set(this.shape, list);
  }

  playEvents(events: GameEvent[]): void {
    for (const placed of eventEffects(events)) {
      const at = placed.square >= 0 ? squareToWorld(this.shape, placed.square) : new THREE.Vector3();
      this.effects.play(placed.effect, at);
    }
    if (events.some((e) => e.type === "explosion" || e.type === "mine")) this.rig.shake(0.45);
  }

  /** Plays the rating burst once and keeps a floating badge above the rated piece. */
  setRating(rating: RatingBadge | null): void {
    if (this.badge) { this.stage.scene.remove(this.badge); this.badge.material.dispose(); this.badge = null; }
    if (!rating) { this.badgeKey = ""; return; }
    const at = squareToWorld(this.shape, rating.square);
    const id = this.pieces.idAt(rating.square);
    const height = (id !== null && this.pieces.anchor(id)?.height) || 1.1;
    if (this.badgeKey !== rating.key) this.effects.play(ratingEffect(rating.id, height), at);
    this.badgeKey = rating.key;
    this.badge = new THREE.Sprite(new THREE.SpriteMaterial({ map: badgeTexture(rating.glyph, rating.color), depthTest: false, transparent: true }));
    this.badge.scale.setScalar(0.5);
    this.badge.position.set(at.x + 0.32, height + 0.3, at.z);
    this.badge.renderOrder = 30;
    this.stage.scene.add(this.badge);
  }

  /** Screen position of a square's centre, used by tests to click in 3D. */
  screenOf(square: number): { x: number; y: number } {
    const p = squareToWorld(this.shape, square).project(this.stage.camera);
    const rect = this.stage.renderer.domElement.getBoundingClientRect();
    return { x: rect.left + ((p.x + 1) / 2) * rect.width, y: rect.top + ((1 - p.y) / 2) * rect.height };
  }

  /** Board square under a screen point, or null. */
  pickSquare(clientX: number, clientY: number): { square: number | null; point: THREE.Vector3 | null } {
    if (!this.pick) return { square: null, point: null };
    const rect = this.stage.renderer.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
    this.raycaster.setFromCamera(ndc, this.stage.camera);
    // Intersect an infinite plane so dragging past the edge still tracks.
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const point = this.raycaster.ray.intersectPlane(plane, new THREE.Vector3());
    if (!point) return { square: null, point: null };
    const hit = this.raycaster.intersectObject(this.pick)[0];
    if (!hit) return { square: null, point };
    const x = Math.round(hit.point.x + (this.shape.width - 1) / 2);
    const y = Math.round((this.shape.height - 1) / 2 - hit.point.z);
    const square = y * this.shape.width + x;
    return { square: this.shape.holes?.includes(square) ? null : square, point };
  }

  private tick(dt: number): void {
    this.rig.update(dt);
    this.pieces.update(dt);
    this.highlights.update(dt);
    const canvas = this.stage.renderer.domElement;
    const ctx: FxContext = { camera: this.stage.camera, pixelsPerUnit: canvas.height / (2 * Math.tan((this.stage.camera.fov * Math.PI) / 360)) };
    this.effects.update(dt, ctx);
    if (this.badge) this.badge.position.y += Math.sin(performance.now() / 400) * 0.0008;
    this.stage.render();
  }

  dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.frame);
    this.effects.dispose();
    this.highlights.dispose();
    this.arrows.dispose();
    this.stage.dispose();
  }
}
