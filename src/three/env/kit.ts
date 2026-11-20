/**
 * The Kit every environment builds with, plus the shot layout helpers,
 * lights and materials they share.
 */

import * as THREE from "three";
import type { Reflector } from "three/examples/jsm/objects/Reflector.js";
import type { Stage } from "../core/stage";
import { DEFAULT_SHOT } from "../scenes/cinematic";
import type { Environment } from "./types";

export const v3 = (x = 0, y = 0, z = 0): THREE.Vector3 => new THREE.Vector3(x, y, z);

/** Camera position the shots use, for orienting billboards built once. */
export const SHOT_EYE = v3(...DEFAULT_SHOT.from);

/**
 * Owns everything an environment adds, finds the stage's default lights so
 * they can be recoloured, shares one time uniform with every shader and
 * turns per frame callbacks into the Environment interface.
 */
export class Kit {
  readonly root = new THREE.Group();
  readonly hemi: THREE.HemisphereLight;
  readonly rim: THREE.DirectionalLight;
  readonly key: THREE.DirectionalLight;
  readonly time = { value: 0 };
  private owned: { dispose: () => void }[] = [];
  private ticks: ((t: number, dt: number) => void)[] = [];

  private soft: THREE.Object3D[] | null = null;
  private baking = false;

  constructor(readonly stage: Stage) {
    stage.scene.add(this.root);
    this.key = stage.key;
    this.hemi = stage.scene.children.find((o): o is THREE.HemisphereLight => o instanceof THREE.HemisphereLight)!;
    this.rim = stage.scene.children.find((o): o is THREE.DirectionalLight => o instanceof THREE.DirectionalLight && o !== stage.key)!;
    // The depth of field pass renders the scene with a depth override material. Particles, sprites, mist
    // and light shafts would write depth as solid quads there (and points get an undefined size), so they
    // sit that pass out and the blur follows only the solid set.
    const scene = stage.scene;
    const previous = scene.onBeforeRender;
    scene.onBeforeRender = (...args) => {
      if (!this.baking) {
        this.soft ??= this.collectSoft();
        const show = scene.overrideMaterial === null;
        for (const o of this.soft) o.visible = show;
      }
      previous.apply(scene, args);
    };
    this.own({ dispose: () => { scene.onBeforeRender = previous; } });
  }

  /** Everything see through: points, sprites and transparent meshes. */
  private collectSoft(): THREE.Object3D[] {
    const list: THREE.Object3D[] = [];
    this.root.traverse((o) => {
      const mat = (o as THREE.Mesh).material as THREE.Material | undefined;
      // Reflectors hide themselves while rendering their mirror image, and skip the depth pass on their own.
      if ((o as Reflector).isReflector) return;
      if (o instanceof THREE.Points || o instanceof THREE.Sprite || o instanceof THREE.LineSegments || (o instanceof THREE.Mesh && mat?.transparent)) list.push(o);
    });
    return list;
  }

  own<T extends { dispose: () => void }>(thing: T): T {
    this.owned.push(thing);
    return thing;
  }

  add<T extends THREE.Object3D>(obj: T): T {
    this.root.add(obj);
    return obj;
  }

  tick(fn: (t: number, dt: number) => void): void {
    this.ticks.push(fn);
  }

  /** Screen pixels per world unit at distance 1, which the point sprite shader needs. */
  ppu(): number {
    return this.stage.renderer.domElement.height / (2 * Math.tan((this.stage.camera.fov * Math.PI) / 360));
  }

  sky(color: THREE.ColorRepresentation, fog?: THREE.Fog | THREE.FogExp2): void {
    this.stage.scene.background = new THREE.Color(color);
    this.stage.scene.fog = fog ?? null;
  }

  /**
   * Captures the finished set into the scene's reflection map, so the hero's
   * gloss and every shiny surface reflect this world instead of the default
   * studio room. Call once at the end of a builder, before pieces are added.
   */
  bake(intensity: number, at = v3(0, 0.8, 0)): void {
    const scene = this.stage.scene;
    const previous = scene.environment;
    // Point sprites divide by view depth, which blows up for particles beside a cube face, so they sit the bake out.
    this.baking = true;
    const hidden: THREE.Object3D[] = [];
    scene.traverse((o) => {
      if ((o instanceof THREE.Points || o instanceof THREE.Sprite) && o.visible) {
        o.visible = false;
        hidden.push(o);
      }
    });
    const pmrem = new THREE.PMREMGenerator(this.stage.renderer);
    const target = pmrem.fromScene(scene, 0.02, 0.1, 100, { size: 128, position: at });
    pmrem.dispose();
    hidden.forEach((o) => (o.visible = true));
    this.baking = false;
    scene.environment = target.texture;
    const before = scene.environmentIntensity;
    scene.environmentIntensity = intensity;
    this.own({ dispose: () => { scene.environment = previous; scene.environmentIntensity = before; target.dispose(); } });
  }

  done(): Environment {
    return {
      update: (t, dt) => {
        this.time.value = t;
        for (const fn of this.ticks) fn(t, dt);
      },
      dispose: () => {
        this.root.removeFromParent();
        this.root.traverse((o) => {
          const m = o as THREE.Mesh;
          if (o instanceof THREE.InstancedMesh) o.dispose();
          m.geometry?.dispose();
          const mats = Array.isArray(m.material) ? m.material : m.material ? [m.material] : [];
          mats.forEach((mat) => mat.dispose());
        });
        this.owned.forEach((o) => o.dispose());
        this.stage.scene.fog = null;
      },
    };
  }
}

/** Mesh that casts and receives shadows. */
export function solid(geo: THREE.BufferGeometry, mat: THREE.Material, cast = true): THREE.Mesh {
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = cast;
  m.receiveShadow = true;
  return m;
}

/**
 * Radius around the origin kept flat and empty: the same environments host
 * a full chessboard (about 9 x 9 units) for the game mode cards, so walls,
 * rocks, columns and big props all live beyond it.
 */
export const CLEAR = 6.3;

/** Points on a ring around the origin but kept out of the camera's line of sight. */
export function behind(angle: number, radius: number): [number, number] {
  // Angle 0 is straight behind the hero as seen from the camera.
  const base = Math.atan2(-SHOT_EYE.z, -SHOT_EYE.x);
  return [Math.cos(base + angle) * radius, Math.sin(base + angle) * radius];
}

/** Floor axes of the shot: DEPTH points away from the camera, SIDE to its right. */
export const DEPTH = v3(-SHOT_EYE.x, 0, -SHOT_EYE.z).normalize();
export const SIDE = v3(-DEPTH.z, 0, DEPTH.x);

/** World position from shot relative coordinates, for sets laid out along the view like aisles and rivers. */
export function shotPos(side: number, depth: number, y = 0): THREE.Vector3 {
  return v3(SIDE.x * side + DEPTH.x * depth, y, SIDE.z * side + DEPTH.z * depth);
}

/** Yaw that turns an object's +z toward the camera side of the set, so rows line up with the aisle. */
export const SHOT_YAW = Math.atan2(-DEPTH.x, -DEPTH.z);
