/**
 * Prism: a crystal cavern. Giant crystals in every colour of the rainbow
 * grow from the walls and floor, each lighting the dark rock around it, a
 * black mirror floor doubles them and sparkles hang in the air.
 */

import * as THREE from "three";
import { glowTexture, sparkTexture } from "../core/textures";
import { behind, CLEAR, crystalCluster, displace, drift, fbm3, glow, inside, Kit, lamp, mirror, mist, rimGlow, rng, solid, spot, v3 } from "./shared";
import type { EnvironmentBuilder } from "./types";

const RADII = v3(12, 8.5, 12);

/** The cavern: an inward facing noisy dome of dark rock flecked with faint mineral colour. */
function cavern(): THREE.BufferGeometry {
  const g = inside(displace(new THREE.SphereGeometry(1, 110, 50, 0, Math.PI * 2, 0, Math.PI * 0.6), 0.14, 2.6, 8, 5));
  g.scale(RADII.x, RADII.y, RADII.z);
  g.translate(-0.8, -0.6, -1.2);
  g.computeVertexNormals();
  const p = g.attributes.position;
  const col: number[] = [];
  const c = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    const n = fbm3(p.getX(i) * 0.3, p.getY(i) * 0.3, p.getZ(i) * 0.3, 4);
    c.setHSL((n * 2 + 1) % 1, 0.6, 0.04 + Math.max(0, n) * 0.12);
    col.push(c.r, c.g, c.b);
  }
  g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  return g;
}

export const prism: EnvironmentBuilder = (stage) => {
  const kit = new Kit(stage);
  const r = rng(131);
  kit.sky(0x040308, new THREE.FogExp2(0x0c0818, 0.035));

  kit.key.color.set(0xf0e8ff);
  kit.key.intensity = 0.35;
  kit.rim.color.set(0xff8ad8);
  kit.rim.intensity = 1.6;
  kit.rim.position.set(-4, 8, -7);
  kit.hemi.color.set(0x4a3a6a);
  kit.hemi.groundColor.set(0x060408);
  kit.hemi.intensity = 0.15;
  spot(kit, 0xfff4ff, 65, v3(-1.4, 4.6, 3.6), 0.32);
  lamp(kit, 0x3ad8ff, 3, 6, v3(2.2, 1.1, 0.2));

  kit.add(solid(cavern(), new THREE.MeshStandardMaterial({ color: 0x5a5068, vertexColors: true, roughness: 0.75, metalness: 0.1 }), false));
  const floor = solid(new THREE.CircleGeometry(16, 64), new THREE.MeshStandardMaterial({ color: 0x0c0a12, roughness: 0.2, metalness: 0.4 }), false);
  floor.rotation.x = -Math.PI / 2;
  kit.add(floor);
  mirror(kit, { strength: 0.55, blur: 0.0025, fade: 15, tint: 0xffffff });

  // Rainbow crystals: hue sweeps across the back of the cave, each cluster with its own light and halo.
  const spots: [number, number, number][] = [[-1.3, 0.8, 2.6], [-0.95, 0.2, 3.6], [-0.6, 1.4, 3.0], [-0.32, 0.1, 4.4], [-0.05, 2.0, 3.2], [0.22, 0.3, 4.8], [0.5, 1.2, 3.4], [0.82, 0.2, 3.8], [1.15, 1.0, 2.8], [1.45, 0.4, 2.2], [-0.15, 3.4, 2.4], [0.35, 3.0, 2.0]];
  const halos: { s: THREE.Sprite; k: number }[] = [];
  spots.forEach(([a, d, h], i) => {
    // Neighbours jump around the colour wheel so every part of the frame gets several hues.
    const hue = (i * 0.37 + 0.55) % 1;
    const color = new THREE.Color().setHSL(hue, 0.85, 0.3);
    const mat = rimGlow(new THREE.MeshStandardMaterial({ color, roughness: 0.35, metalness: 0.2, emissive: color, emissiveIntensity: 0.45 }), new THREE.Color().setHSL(hue, 0.9, 0.65), 0.9, 2.6);
    const [x, z] = behind(a, CLEAR + 0.4 + d);
    const m = solid(crystalCluster(700 + i, 5 + Math.floor(r() * 4), h, 0.1 * h + 0.06), mat);
    m.position.set(x, 0, z);
    m.rotation.y = r() * Math.PI;
    kit.add(m);
    if (i % 3 === 0) lamp(kit, color, 4, 8, v3(x * 0.8, h * 0.5, z * 0.8));
    halos.push({ s: glow(kit, glowTexture(), color, h * 1.8, 0.16, v3(x, h * 0.55, z)), k: r() * 6 });
  });

  const [mx, mz] = behind(0, 8);
  mist(kit, { color: 0x4a2a6a, opacity: 0.25, width: 22, height: 4, position: v3(mx, 1.4, mz), scale: 1.4, speed: 0.04 });

  drift(kit, {
    capacity: 220, texture: sparkTexture(), rate: 45, prewarm: 6, drag: 0.3,
    emit: { position: v3(-1, 1.2, -1.6), spread: v3(4, 1.4, 4), velocity: v3(0, 0.05, 0), velocityJitter: v3(0.06, 0.05, 0.06), life: [2, 4.5], size: [0.03, 0.08], colors: ["#ff7ad9", "#7ae0ff", "#fff27a", "#9aff8a", "#c08aff", "#ffffff"] },
  });

  kit.tick((t) => halos.forEach((h) => (h.s.material.opacity = 0.13 + 0.05 * Math.sin(t * 1.4 + h.k))));

  kit.bake(0.8);
  return kit.done();
};
