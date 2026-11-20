/**
 * Ice cave: a frozen cavern with faceted blue walls, icicles hanging from
 * the ceiling, crystal clusters on a frosted mirror floor and a bright cave
 * mouth behind the hero pouring cold light and snow into the dark.
 */

import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { glowTexture, sparkTexture } from "../core/textures";
import { behind, CLEAR, crystalCluster, displace, faceted, fbm3, drift, glow, Kit, lamp, mirror, mist, noiseFill, paint, rimGlow, rng, shaft, solid, spot, v3 } from "./shared";
import type { EnvironmentBuilder } from "./types";

// A tall dome: walls about 9 to 11 units out and a ceiling near 8, so a board fits under it.
const CENTER = v3(-0.6, -0.6, -1.0);
const RADII = v3(10.5, 8.6, 10.5);
const MOUTH = v3(-8.2, 3.3, -5.6);

/**
 * The cavern shell: an inverted noisy dome with a ragged hole cut where the
 * cave mouth is, so the bright outside shows through.
 */
function shell(): THREE.BufferGeometry {
  const unit = displace(new THREE.SphereGeometry(1, 120, 56, 0, Math.PI * 2, 0, Math.PI * 0.62), 0.16, 2.4, 3, 5);
  const mouthDir = MOUTH.clone().sub(CENTER).divide(RADII).normalize();
  const src = unit.toNonIndexed();
  const p = src.attributes.position;
  const keep: number[] = [];
  const c = v3();
  for (let f = 0; f < p.count; f += 3) {
    c.set(0, 0, 0);
    for (let k = 0; k < 3; k++) c.add(v3(p.getX(f + k), p.getY(f + k), p.getZ(f + k)));
    c.normalize();
    // Ragged edge: the cut threshold wobbles with the face direction.
    const edge = 0.974 + Math.sin(c.x * 23) * 0.012 + Math.cos(c.y * 31 + c.z * 17) * 0.012;
    // Winding is reversed so the faces point inward: the depth of field pass only draws front faces.
    if (c.dot(mouthDir) < edge) for (const k of [0, 2, 1]) keep.push(p.getX(f + k) * RADII.x, p.getY(f + k) * RADII.y, p.getZ(f + k) * RADII.z);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(keep, 3));
  g.translate(CENTER.x, CENTER.y, CENTER.z);
  g.computeVertexNormals();
  // Thin ice glows: noise picks bright cyan veins and deep blue pockets, fed to the emissive.
  const col: number[] = [];
  const deep = new THREE.Color(0x01040c), thin = new THREE.Color(0x2a9cff), c2 = new THREE.Color();
  for (let i = 0; i < keep.length; i += 3) {
    const n = fbm3(keep[i] * 0.45, keep[i + 1] * 0.7, keep[i + 2] * 0.45, 4);
    c2.copy(deep).lerp(thin, Math.pow(THREE.MathUtils.smoothstep(n, 0.0, 0.42), 1.6));
    col.push(c2.r, c2.g, c2.b);
  }
  g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  return g;
}

/** Icicles hang where an upward ray meets the ceiling, so they always grow out of the ice. */
function icicles(ceiling: THREE.Mesh, r: () => number): THREE.BufferGeometry {
  const ray = new THREE.Raycaster();
  const parts: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 90; i++) {
    const [x, z] = behind((r() - 0.5) * 2.8, CLEAR + 0.4 + r() * 3.6);
    ray.set(v3(x, 0.5, z), v3(0, 1, 0));
    const hit = ray.intersectObject(ceiling)[0];
    if (!hit) continue;
    // Long spears where the ceiling curves down, never reaching below head height of the scene.
    const len = Math.min(hit.point.y - 2, 0.6 + Math.pow(r(), 1.4) * 3.2);
    if (len < 0.4) continue;
    const g = displace(new THREE.ConeGeometry(0.05 + len * 0.055, len + 0.5, 7, 5), 0.02, 6, i, 2);
    g.rotateX(Math.PI);
    g.translate(x, hit.point.y - len / 2 + 0.25, z);
    parts.push(g);
  }
  return mergeGeometries(parts)!;
}

export const iceCave: EnvironmentBuilder = (stage) => {
  const kit = new Kit(stage);
  const r = rng(11);
  kit.sky(0x02060e, new THREE.FogExp2(0x061528, 0.06));

  // Light: a cold spot on the hero, a strong cyan back light from the mouth and a teal fill; the cave itself stays dark.
  kit.key.color.set(0x9cc4ff);
  kit.key.intensity = 0.35;
  kit.rim.color.set(0x8fe0ff);
  kit.rim.intensity = 1.8;
  // High enough that its glare on the glossy floor lands below the frame.
  kit.rim.position.set(-5, 7.5, -6);
  kit.hemi.color.set(0x4a78b0);
  kit.hemi.groundColor.set(0x050c16);
  kit.hemi.intensity = 0.2;
  spot(kit, 0xe4f0ff, 80, v3(-1.6, 4.2, 3.4), 0.32);
  lamp(kit, 0x2fe0d0, 2, 6, v3(2.2, 1.0, 0.4));
  lamp(kit, 0x63c8ff, 12, 10, MOUTH.clone().lerp(v3(0, 1, 0), 0.3));

  const iceWall = rimGlow(new THREE.MeshStandardMaterial({ color: 0x8fb8e0, roughness: 0.3, metalness: 0.2, vertexColors: true }), 0x3fa8ff, 0.4, 2.2, 0.42);
  const cave = new THREE.Mesh(shell(), iceWall);
  cave.receiveShadow = true;
  kit.add(cave);
  cave.updateMatrixWorld();

  const crystalMat = rimGlow(new THREE.MeshPhysicalMaterial({ color: 0x7fb8e8, roughness: 0.22, metalness: 0.3, clearcoat: 1, clearcoatRoughness: 0.24, emissive: 0x0f4a90, emissiveIntensity: 0.6 }), 0x9fe4ff, 1.4, 2.6);
  kit.add(new THREE.Mesh(faceted(icicles(cave, r)), crystalMat));

  // Frosted floor: pale noisy ice with a soft mirror gloss on top.
  const frost = paint(kit, 256, (ctx, s) => noiseFill(ctx, s, (n) => {
    const v = 30 + n * 160;
    return [v * 0.72, v * 0.88, v];
  }, 7, 4), 6);
  const floor = solid(new THREE.CircleGeometry(16, 64), new THREE.MeshStandardMaterial({ color: 0x2f5880, map: frost, roughness: 0.3, metalness: 0.1 }), false);
  floor.rotation.x = -Math.PI / 2;
  kit.add(floor);
  mirror(kit, { strength: 0.6, blur: 0.0025, fade: 14, tint: 0xbfe6ff });

  // Snow drifts piled against the walls.
  const snow = new THREE.MeshStandardMaterial({ color: 0xa8c8e8, roughness: 0.9, emissive: 0x061a30, emissiveIntensity: 0.6 });
  for (let i = 0; i < 12; i++) {
    const [x, z] = behind((r() - 0.5) * 3.4, CLEAR + 1.4 + r() * 2.2);
    const s = 1.2 + r() * 1.6;
    const mound = solid(displace(new THREE.SphereGeometry(1, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), 0.15, 2, i, 3), snow, false);
    mound.scale.set(s * 1.5, s * 0.5, s);
    mound.position.set(x, -0.05, z);
    kit.add(mound);
  }

  // Crystal clusters ring the clearing: tall ones framing the hero, smaller ones between.
  const spots: [number, number, number][] = [[0.42, 0.2, 3.2], [-0.5, 0.4, 2.8], [0.12, 1.6, 3.8], [-0.2, 2.2, 2.4], [0.8, 0.6, 2.2], [-0.85, 0.3, 2.0], [1.2, 0.2, 2.6], [-1.25, 0.9, 2.4], [0.25, 0.0, 1.3], [-0.05, 0.7, 1.6]];
  spots.forEach(([a, d, h], i) => {
    const [x, z] = behind(a, CLEAR + 0.2 + d);
    const m = solid(crystalCluster(40 + i, 5 + Math.floor(r() * 4), h, 0.1 * h + 0.06), crystalMat);
    m.position.set(x, 0, z);
    m.rotation.y = r() * Math.PI;
    kit.add(m);
  });

  // The cave mouth: a pale glow behind the hole and shafts of light slanting in.
  const outside = new THREE.Mesh(new THREE.PlaneGeometry(16, 16), new THREE.MeshBasicMaterial({ map: glowTexture(), color: new THREE.Color(0xa8dcff).multiplyScalar(1.1), fog: false }));
  outside.position.copy(MOUTH).multiplyScalar(1.4);
  outside.lookAt(0, 1, 0);
  kit.add(outside);
  glow(kit, glowTexture(), 0xbfeaff, 3, 0.45, MOUTH.clone().multiplyScalar(1.15));
  shaft(kit, { from: MOUTH.clone(), to: v3(-1.6, -0.3, -2.4), width: 1.8, color: 0x9fdcff, opacity: 0.22, spread: 2.2 });
  shaft(kit, { from: MOUTH.clone().add(v3(1.2, 0.6, 0)), to: v3(0.4, -0.3, -3.6), width: 1.1, color: 0x7fd0ff, opacity: 0.14, spread: 2.6 });

  // Frost mist hugging the floor and hanging in the depth.
  for (let i = 0; i < 3; i++) {
    const [x, z] = behind((i - 1) * 0.4, 3.8 + i * 2);
    mist(kit, { color: 0x4f7fa8, opacity: 0.2, width: 12, height: 2.6, position: v3(x, 0.9, z), scale: 1.6, speed: 0.06 });
  }
  mist(kit, { color: 0x7fafd8, opacity: 0.2, width: 22, height: 22, position: v3(-1, 0.06, -3), flat: true, scale: 4, speed: 0.04 });

  // Snow blowing in from the mouth, plus a few bright glints.
  drift(kit, {
    capacity: 320, texture: glowTexture(), rate: 70, prewarm: 6, drag: 0.2,
    emit: { position: v3(-1.6, 2.4, -2.4), spread: v3(3.6, 1.6, 3.6), velocity: v3(0.12, -0.16, 0.1), velocityJitter: v3(0.08, 0.05, 0.08), life: [3.5, 5.5], size: [0.018, 0.045], colors: ["#ffffff", "#cfeaff", "#a8d8ff"] },
  });
  drift(kit, {
    capacity: 40, texture: sparkTexture(), rate: 8, prewarm: 4,
    emit: { position: v3(-0.6, 0.9, -1.2), spread: v3(1.8, 0.9, 1.8), velocity: v3(0, 0.02, 0), life: [1.2, 2.4], size: [0.05, 0.12], colors: ["#ffffff", "#bfeaff"] },
  });

  kit.bake(0.9);
  return kit.done();
};
