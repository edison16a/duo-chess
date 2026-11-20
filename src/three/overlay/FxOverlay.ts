/**
 * Plays the 3D effects on top of the flat 2D board. A transparent WebGL
 * canvas sits over the board with an orthographic camera, and each effect
 * is tilted toward the viewer so floor rings and walls read as 3D even
 * though the board itself is flat.
 */

import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import type { Color, GameEvent, Position, RatingId } from "@/engine";
import { eventEffects, GhostAura, Halo, IceEncase, IceWall, Mine, PoisonBubbles, Portal, ratingEffect, ShieldDome, SmokeVeil, type Effect } from "../fx";

/** How far the canvas reaches past the board on each side, in squares, so blasts are not clipped. */
export const OVERLAY_MARGIN = 1;
const TILT = 0.5;
const SCALE = 0.78;

export class FxOverlay {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 50);
  private oneShots: Effect[] = [];
  private lasting = new Map<string, Effect>();
  private size = { width: 8, height: 8 };
  private orientation: Color = "w";
  private frame = 0;
  private last = performance.now();
  private disposed = false;

  constructor(private canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x404050, 1.1));
    const key = new THREE.DirectionalLight(0xffffff, 1.4);
    key.position.set(-2, 4, 6);
    this.scene.add(key);
    this.camera.position.z = 20;
    const loop = () => {
      if (this.disposed) return;
      const now = performance.now();
      this.tick(Math.min(0.05, (now - this.last) / 1000));
      this.last = now;
      this.frame = requestAnimationFrame(loop);
    };
    loop();
  }

  /** Matches the canvas to the board: board squares plus the margin all round. */
  layout(width: number, height: number, orientation: Color): void {
    this.size = { width, height };
    this.orientation = orientation;
    const w = width + OVERLAY_MARGIN * 2, h = height + OVERLAY_MARGIN * 2;
    Object.assign(this.camera, { left: -w / 2, right: w / 2, top: h / 2, bottom: -h / 2 });
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.canvas.clientWidth, this.canvas.clientHeight, false);
  }

  /** Base of the piece standing on a square, in overlay space. */
  private anchor(square: number, out = new THREE.Vector3()): THREE.Vector3 {
    if (square < 0) return out.set(0, -0.3, 0);
    const x = square % this.size.width;
    const y = Math.floor(square / this.size.width);
    const col = this.orientation === "w" ? x : this.size.width - 1 - x;
    const row = this.orientation === "w" ? this.size.height - 1 - y : y;
    return out.set(col + 0.5 - this.size.width / 2, this.size.height / 2 - row - 0.92, 0);
  }

  private place(effect: Effect, square: number): void {
    this.anchor(square, effect.object.position);
    effect.object.rotation.x = TILT;
    effect.object.scale.setScalar(SCALE);
  }

  playEvents(events: GameEvent[], finale = false): void {
    for (const p of eventEffects(events, finale)) {
      this.place(p.effect, p.square);
      this.scene.add(p.effect.object);
      this.oneShots.push(p.effect);
    }
  }

  playRating(id: RatingId, square: number): void {
    const effect = ratingEffect(id, 1.05);
    this.place(effect, square);
    this.scene.add(effect.object);
    this.oneShots.push(effect);
  }

  /** Long lived looks for statuses and square effects, keyed so they come and go with the game. */
  sync(pos: Position, viewer: Color | null): void {
    const want = new Map<string, [number, () => Effect]>();
    pos.board.forEach((p, s) => {
      if (!p?.status) return;
      const add = (k: string, make: () => Effect) => want.set(`${p.id}:${k}:${s}`, [s, make]);
      if (p.status.frozen) add("ice", () => new IceEncase(1.05));
      if (p.status.shielded) add("shield", () => new ShieldDome("#ffd76a", 1.05));
      if (p.status.ghost) add("ghost", () => new GhostAura(1.05));
      if (p.status.poisoned) add("poison", () => new PoisonBubbles(1.05));
      if (p.status.blessed) add("halo", () => new Halo(1.05));
      if (p.status.hidden && p.color === viewer) add("veil", () => new SmokeVeil());
    });
    for (const e of pos.effects) {
      if (e.kind === "mine" && e.owner !== viewer) continue;
      want.set(`fx:${e.id}`, [e.square, e.kind === "wall" ? () => new IceWall() : e.kind === "mine" ? () => new Mine() : () => new Portal()]);
    }
    for (const [key, effect] of this.lasting) {
      if (want.has(key)) continue;
      this.scene.remove(effect.object);
      effect.dispose();
      this.lasting.delete(key);
    }
    for (const [key, [square, make]] of want) {
      if (this.lasting.has(key)) continue;
      const effect = make();
      this.place(effect, square);
      this.scene.add(effect.object);
      this.lasting.set(key, effect);
    }
  }

  private tick(dt: number): void {
    const ctx = { camera: this.camera, pixelsPerUnit: this.canvas.height / (this.camera.top - this.camera.bottom) };
    this.oneShots = this.oneShots.filter((e) => {
      if (e.update(dt, ctx)) return true;
      this.scene.remove(e.object);
      e.dispose();
      return false;
    });
    this.lasting.forEach((e) => e.update(dt, ctx));
    if (this.oneShots.length || this.lasting.size) this.renderer.render(this.scene, this.camera);
    else this.renderer.clear();
  }

  dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.frame);
    [...this.oneShots, ...this.lasting.values()].forEach((e) => e.dispose());
    this.renderer.dispose();
  }
}
