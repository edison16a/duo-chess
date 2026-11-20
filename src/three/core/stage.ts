/**
 * Renderer, lights and post processing shared by every 3D view. Keeping it
 * in one place means the game board, the landing page and the rendered
 * mode and power previews all look like the same world.
 */

import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { BokehPass } from "three/examples/jsm/postprocessing/BokehPass.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

export interface StageOptions {
  canvas: HTMLCanvasElement;
  alpha?: boolean;
  bloom?: number;
  shadows?: boolean;
  background?: THREE.ColorRepresentation | null;
  pixelRatio?: number;
  /** Depth of field for cinematic shots: focus distance in world units and blur strength. */
  dof?: { focus: number; aperture: number; maxblur: number };
}

export interface Stage {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  composer: EffectComposer | null;
  key: THREE.DirectionalLight;
  resize: (width: number, height: number) => void;
  /** Moves the depth of field focus, for shots that track a subject. */
  setFocus: (distance: number) => void;
  render: () => void;
  dispose: () => void;
}

export function createStage(o: StageOptions): Stage {
  const renderer = new THREE.WebGLRenderer({ canvas: o.canvas, antialias: true, alpha: o.alpha ?? false, preserveDrawingBuffer: false, powerPreference: "high-performance" });
  renderer.setPixelRatio(o.pixelRatio ?? Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.95;
  renderer.shadowMap.enabled = o.shadows ?? true;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  const scene = new THREE.Scene();
  if (o.background !== null) scene.background = new THREE.Color(o.background ?? 0x0f1012);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.32;

  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 200);

  scene.add(new THREE.HemisphereLight(0xdfe8ff, 0x2a2018, 0.3));
  const key = new THREE.DirectionalLight(0xfff1dc, 1.45);
  key.position.set(-5, 11, 7);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = key.shadow.camera.bottom = -8;
  key.shadow.camera.right = key.shadow.camera.top = 8;
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.02;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x9fc4ff, 0.8);
  rim.position.set(6, 5, -8);
  scene.add(rim);

  let composer: EffectComposer | null = null;
  let bloomPass: UnrealBloomPass | null = null;
  let bokeh: BokehPass | null = null;
  if ((o.bloom || o.dof) && !o.alpha) {
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    if (o.dof) {
      bokeh = new BokehPass(scene, camera, { focus: o.dof.focus, aperture: o.dof.aperture, maxblur: o.dof.maxblur });
      composer.addPass(bokeh);
      hideSoftDuringDepthPass(scene);
    }
    if (o.bloom) {
      bloomPass = new UnrealBloomPass(new THREE.Vector2(256, 256), o.bloom, 0.5, 1.05);
      composer.addPass(bloomPass);
    }
    composer.addPass(new OutputPass());
  }

  return {
    renderer, scene, camera, composer, key,
    resize: (w, h) => {
      renderer.setSize(w, h, false);
      composer?.setSize(w, h);
      bloomPass?.resolution.set(w, h);
      camera.aspect = w / Math.max(1, h);
      camera.updateProjectionMatrix();
    },
    setFocus: (distance) => {
      if (bokeh) (bokeh.uniforms as Record<string, { value: number }>).focus.value = distance;
    },
    render: () => (composer ? composer.render() : renderer.render(scene, camera)),
    dispose: () => {
      composer?.dispose();
      pmrem.dispose();
      renderer.dispose();
      // dispose() keeps the WebGL context alive until garbage collection, and enough of those
      // make the browser kill the oldest live one, which is usually the board. Let it go now.
      renderer.forceContextLoss();
      // A canvas whose context was released cannot host a new one, so callers mounting again need a fresh canvas.
      o.canvas.dataset.released = "1";
    },
  };
}

/**
 * The depth of field pass renders the scene once with a depth material.
 * Glows, particles and decals would write solid depth there and leave dark
 * streaks in the blur, so everything see through sits that pass out.
 */
function hideSoftDuringDepthPass(scene: THREE.Scene): void {
  const hidden: THREE.Object3D[] = [];
  const before = scene.onBeforeRender;
  const after = scene.onAfterRender;
  scene.onBeforeRender = (...args) => {
    before.apply(scene, args);
    if (scene.overrideMaterial === null) return;
    scene.traverseVisible((obj) => {
      const mat = (obj as THREE.Mesh).material as THREE.Material | undefined;
      const soft = obj instanceof THREE.Points || obj instanceof THREE.Sprite || (obj instanceof THREE.Mesh && !!mat?.transparent);
      if (soft) hidden.push(obj);
    });
    hidden.forEach((obj) => { obj.visible = false; });
  };
  scene.onAfterRender = (...args) => {
    hidden.forEach((obj) => { obj.visible = true; });
    hidden.length = 0;
    after.apply(scene, args);
  };
}
