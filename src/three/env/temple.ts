/**
 * Temple: a vast marble hall. A polished floor mirrors two colonnades that
 * recede into warm haze, tall windows high in the walls pour god rays across
 * the aisle, a great arched window glows at the far end and dust hangs in
 * the light.
 */

import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { glowTexture, sparkTexture } from "../core/textures";
import { CLEAR, drift, glow, Kit, mirror, mist, noiseFill, paint, shaft, SHOT_YAW, shotPos, solid, spot, v3 } from "./shared";
import type { EnvironmentBuilder } from "./types";

const AISLE = CLEAR + 0.5;
const HEIGHT = 11;

/** A fluted column with a stepped base and capital, standing on the floor. */
function column(): THREE.BufferGeometry {
  const shaftGeo = new THREE.CylinderGeometry(0.55, 0.62, HEIGHT - 1.6, 48, 1, true);
  const p = shaftGeo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const a = Math.atan2(p.getZ(i), p.getX(i));
    // Twenty four shallow flutes carved around the shaft.
    const k = 1 - 0.035 * Math.pow(Math.abs(Math.sin(a * 12)), 0.6);
    p.setX(i, p.getX(i) * k);
    p.setZ(i, p.getZ(i) * k);
  }
  shaftGeo.translate(0, (HEIGHT - 1.6) / 2 + 0.8, 0);
  const parts: THREE.BufferGeometry[] = [shaftGeo];
  const ring = (rTop: number, rBot: number, h: number, y: number, seg = 48) => {
    const g = new THREE.CylinderGeometry(rTop, rBot, h, seg);
    g.translate(0, y + h / 2, 0);
    parts.push(g);
  };
  const box = (w: number, h: number, y: number) => {
    const g = new THREE.BoxGeometry(w, h, w);
    g.translate(0, y + h / 2, 0);
    parts.push(g);
  };
  box(1.6, 0.3, 0);
  ring(0.7, 0.78, 0.25, 0.3);
  ring(0.62, 0.7, 0.25, 0.55);
  ring(0.75, 0.6, 0.35, HEIGHT - 0.8);
  box(1.7, 0.45, HEIGHT - 0.45);
  return mergeGeometries(parts.map((g) => { g.deleteAttribute("uv"); return g.toNonIndexed(); }))!;
}

/** Polished marble: warm white with soft grey veins and a faint tile grid. */
function marble(kit: Kit, tiles: boolean): THREE.CanvasTexture {
  return paint(kit, 512, (ctx, s) => {
    noiseFill(ctx, s, (n) => {
      const vein = Math.max(0, 1 - Math.abs(n - 0.5) * 22);
      const v = 205 + n * 40 - vein * 70;
      return [v, v * 0.95, v * 0.86];
    }, 4, 21);
    if (!tiles) return;
    ctx.strokeStyle = "rgba(90,70,40,0.35)";
    ctx.lineWidth = 3;
    for (let i = 0; i <= 2; i++) {
      ctx.beginPath(); ctx.moveTo(0, (i * s) / 2); ctx.lineTo(s, (i * s) / 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo((i * s) / 2, 0); ctx.lineTo((i * s) / 2, s); ctx.stroke();
    }
  }, tiles ? 18 : 1);
}

export const temple: EnvironmentBuilder = (stage) => {
  const kit = new Kit(stage);
  kit.sky(0x120c06, new THREE.FogExp2(0x2a1c0e, 0.034));

  // Warm sun through the windows from behind and to the left; a soft spot on the hero.
  kit.key.color.set(0xffe2b0);
  kit.key.intensity = 0.5;
  kit.rim.color.set(0xffc86a);
  kit.rim.intensity = 1.6;
  kit.rim.position.copy(shotPos(-7, 8, 10));
  kit.hemi.color.set(0xffe0b0);
  kit.hemi.groundColor.set(0x3a2814);
  kit.hemi.intensity = 0.15;
  spot(kit, 0xfff0d8, 70, v3(-1.4, 4.6, 3.6), 0.32);

  const floor = solid(new THREE.PlaneGeometry(90, 90), new THREE.MeshStandardMaterial({ color: 0xa89c88, map: marble(kit, true), roughness: 0.22, metalness: 0 }), false);
  floor.rotation.x = -Math.PI / 2;
  kit.add(floor);
  mirror(kit, { strength: 0.42, blur: 0.0025, fade: 40, tint: 0xffe8c8 });

  // Two colonnades along the aisle, plus a row closing the hall behind the camera's side.
  const colMat = new THREE.MeshStandardMaterial({ color: 0xb8ac98, map: marble(kit, false), roughness: 0.35 });
  const geo = column();
  const spots: THREE.Vector3[] = [];
  for (let d = -6; d <= 34; d += 4) for (const side of [-AISLE, AISLE]) spots.push(shotPos(side, d));
  const cols = new THREE.InstancedMesh(geo, colMat, spots.length);
  const m = new THREE.Matrix4();
  spots.forEach((s, i) => cols.setMatrixAt(i, m.makeRotationY(SHOT_YAW).setPosition(s)));
  cols.castShadow = cols.receiveShadow = true;
  kit.add(cols);

  // Side walls with tall bright windows, a coffered dark ceiling and the far wall with its great window.
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x4a3a28, roughness: 0.8 });
  const winMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0xffe2a8).multiplyScalar(0.95), fog: true });
  for (const side of [-1, 1]) {
    const wall = solid(new THREE.BoxGeometry(1, HEIGHT + 4, 60), wallMat, false);
    wall.position.copy(shotPos(side * (AISLE + 4.5), 14, (HEIGHT + 4) / 2));
    wall.rotation.y = SHOT_YAW;
    kit.add(wall);
    for (let d = -2; d <= 30; d += 8) {
      const win = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 5.5), winMat);
      win.position.copy(shotPos(side * (AISLE + 3.9), d + 2, HEIGHT - 2.8));
      win.rotation.y = SHOT_YAW - (side * Math.PI) / 2;
      kit.add(win);
    }
  }
  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), new THREE.MeshStandardMaterial({ color: 0x3a2c1c, roughness: 1 }));
  ceiling.position.y = HEIGHT + 0.6;
  ceiling.rotation.x = Math.PI / 2;
  kit.add(ceiling);
  const apse = new THREE.Mesh(new THREE.PlaneGeometry(9, 14), new THREE.MeshBasicMaterial({ map: glowTexture(), color: new THREE.Color(0xffd890).multiplyScalar(1.3), transparent: true, depthWrite: false, fog: false }));
  apse.position.copy(shotPos(-5, 38, 7));
  apse.rotation.y = SHOT_YAW;
  kit.add(apse);

  // God rays from the left windows slanting down across the aisle.
  for (const [d, w, o] of [[2, 1.6, 0.34], [8, 1.9, 0.3], [14, 2.2, 0.26], [20, 2.4, 0.22]]) {
    shaft(kit, { from: shotPos(-(AISLE + 3.6), d + 2, HEIGHT - 3), to: shotPos(1.5, d + 6.5, -0.5), width: w, color: 0xffcf80, opacity: o, spread: 1.6 });
    // A pool of sunlight where the beam lands on the marble.
    const pool = new THREE.Mesh(new THREE.PlaneGeometry(w * 2.6, w * 1.6), new THREE.MeshBasicMaterial({ map: glowTexture(), color: 0xffd48a, transparent: true, opacity: o * 1.6, depthWrite: false, blending: THREE.AdditiveBlending }));
    pool.position.copy(shotPos(0.6, d + 5.5, 0.01));
    pool.rotation.set(-Math.PI / 2, 0, SHOT_YAW);
    kit.add(pool);
  }
  glow(kit, glowTexture(), 0xffd890, 10, 0.2, shotPos(-4, 30, 5));

  // Haze between the columns and a thin layer over the floor.
  for (let i = 0; i < 3; i++) mist(kit, { color: 0x8a6a40, opacity: 0.16, width: 18, height: 6, position: shotPos((i - 1) * 2, 7 + i * 5, 2.5), scale: 1.2, speed: 0.03 });

  // Dust motes catching the light.
  drift(kit, {
    capacity: 220, texture: sparkTexture(), rate: 40, prewarm: 6, drag: 0.3,
    emit: { position: shotPos(0, 2.5, 1.6), spread: v3(3.5, 1.6, 3.5), velocity: v3(0.02, 0.025, 0.01), velocityJitter: v3(0.04, 0.03, 0.04), life: [3, 6], size: [0.02, 0.05], colors: ["#fff1cc", "#ffd890", "#ffffff"] },
  });

  kit.bake(0.8);
  return kit.done();
};
