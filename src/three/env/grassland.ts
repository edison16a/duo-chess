/**
 * A wide grass battlefield at golden hour: a physical sky, rolling ground,
 * a sea of wind blown grass and warm low sunlight cutting through haze.
 */

import * as THREE from "three";
import { Sky } from "three/examples/jsm/objects/Sky.js";
import type { Stage } from "../core/stage";
import { createGrass } from "./grass";
import type { Environment } from "./types";

/** Gentle hills that stay flat near the middle where the fighting happens. */
export function groundHeight(x: number, z: number): number {
  const r = Math.hypot(x, z);
  const hills = Math.sin(x * 0.11) * Math.cos(z * 0.09) * 1.4 + Math.sin(x * 0.27 + z * 0.19) * 0.4;
  return hills * THREE.MathUtils.smoothstep(r, 9, 22) - 0.02;
}

function groundTexture(): THREE.Texture {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d")!;
  g.fillStyle = "#2e4a1c";
  g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 2600; i++) {
    g.fillStyle = `rgba(${Math.random() < 0.5 ? "90,120,50" : "30,45,18"},${0.15 + Math.random() * 0.25})`;
    g.fillRect(Math.random() * 256, Math.random() * 256, 2 + Math.random() * 4, 2 + Math.random() * 4);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(30, 30);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function grassland(stage: Stage, opts: { blades?: number; clear?: [number, number, number, number]; sun?: [number, number] } = {}): Environment {
  const { scene, key } = stage;
  const sky = new Sky();
  sky.scale.setScalar(4000);
  // Low warm sun off to the side, out of frame, so it rakes across the field without glare.
  const [elevation, azimuth] = opts.sun ?? [86, Math.PI - 1.35];
  const sun = new THREE.Vector3().setFromSphericalCoords(1, THREE.MathUtils.degToRad(elevation), azimuth);
  const u = sky.material.uniforms;
  u.turbidity.value = 9;
  u.rayleigh.value = 3.2;
  u.mieCoefficient.value = 0.008;
  u.mieDirectionalG.value = 0.86;
  u.sunPosition.value.copy(sun);
  scene.add(sky);
  scene.background = null;
  scene.fog = new THREE.Fog(0x7a5a44, 20, 90);
  stage.renderer.toneMappingExposure = 0.55;

  key.color.set(0xffc58a);
  key.intensity = 2.6;
  key.position.copy(sun).multiplyScalar(30);
  key.shadow.camera.left = key.shadow.camera.bottom = -14;
  key.shadow.camera.right = key.shadow.camera.top = 14;
  key.shadow.camera.far = 80;
  key.shadow.camera.updateProjectionMatrix();

  const groundGeo = new THREE.PlaneGeometry(160, 160, 120, 120);
  groundGeo.rotateX(-Math.PI / 2);
  const gp = groundGeo.attributes.position;
  for (let i = 0; i < gp.count; i++) gp.setY(i, groundHeight(gp.getX(i), gp.getZ(i)));
  groundGeo.computeVertexNormals();
  const ground = new THREE.Mesh(groundGeo, new THREE.MeshStandardMaterial({ map: groundTexture(), roughness: 1 }));
  ground.receiveShadow = true;
  scene.add(ground);

  const grass = createGrass({ count: opts.blades ?? 60000, extent: 26, clear: opts.clear, height: groundHeight });
  scene.add(grass.mesh);

  return {
    update: (t) => grass.update(t),
    dispose: () => {
      groundGeo.dispose();
      grass.mesh.geometry.dispose();
      (grass.mesh.material as THREE.Material).dispose();
      sky.geometry.dispose();
      sky.material.dispose();
    },
  };
}
