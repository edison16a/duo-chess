/**
 * Sanctum: a royal throne hall in gold and deep red. A golden sigil glows
 * in the polished floor, crimson banners hang in a ring of gilded arches,
 * a throne waits on its dais under a rose window and braziers flicker.
 */

import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { flameTexture, glowTexture, runeTexture, sparkTexture } from "../core/textures";
import { behind, CLEAR, drift, glow, inside, Kit, lamp, mirror, mist, noiseFill, paint, shotPos, SHOT_YAW, solid, spot, v3 } from "./shared";
import type { EnvironmentBuilder } from "./types";

const RING = CLEAR + 3;

/** Crimson banner cloth with a gold border and a crown, cut into a swallowtail. */
function bannerTexture(kit: Kit): THREE.CanvasTexture {
  const t = paint(kit, 256, (ctx, s) => {
    const w = s * 0.5;
    ctx.translate(s * 0.25, 0);
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(w, 0); ctx.lineTo(w, s); ctx.lineTo(w / 2, s * 0.86); ctx.lineTo(0, s); ctx.closePath();
    ctx.fillStyle = "#6a0c12";
    ctx.fill();
    ctx.lineWidth = 7;
    ctx.strokeStyle = "#d8a640";
    ctx.stroke();
    ctx.fillStyle = "#e6b84a";
    ctx.beginPath();
    const cx = w / 2, cy = s * 0.35;
    ctx.moveTo(cx - 30, cy + 18); ctx.lineTo(cx - 34, cy - 16); ctx.lineTo(cx - 16, cy); ctx.lineTo(cx, cy - 26);
    ctx.lineTo(cx + 16, cy); ctx.lineTo(cx + 34, cy - 16); ctx.lineTo(cx + 30, cy + 18); ctx.closePath();
    ctx.fill();
  });
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
}

/** A floor sigil: rune rings, a star and fine spokes, drawn in white for tinting. */
function sigilTexture(kit: Kit): THREE.CanvasTexture {
  const t = paint(kit, 1024, (ctx, s) => {
    const c = s / 2;
    ctx.strokeStyle = "rgba(255,255,255,0.95)";
    ctx.drawImage(runeTexture().image as HTMLCanvasElement, s * 0.12, s * 0.12, s * 0.76, s * 0.76);
    ctx.lineWidth = 5;
    for (const r of [0.49, 0.47, 0.2]) { ctx.beginPath(); ctx.arc(c, c, s * r, 0, Math.PI * 2); ctx.stroke(); }
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = 0; i <= 8; i++) {
      const a = (i * 3 * Math.PI * 2) / 8;
      const x = c + Math.cos(a) * s * 0.36, y = c + Math.sin(a) * s * 0.36;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    for (let i = 0; i < 48; i++) {
      const a = (i / 48) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(c + Math.cos(a) * s * 0.47, c + Math.sin(a) * s * 0.47);
      ctx.lineTo(c + Math.cos(a) * s * (i % 4 ? 0.45 : 0.43), c + Math.sin(a) * s * (i % 4 ? 0.45 : 0.43));
      ctx.stroke();
    }
  });
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
}

export const sanctum: EnvironmentBuilder = (stage) => {
  const kit = new Kit(stage);
  kit.sky(0x0c0504, new THREE.FogExp2(0x2a0e08, 0.05));

  kit.key.color.set(0xffd8a0);
  kit.key.intensity = 0.35;
  kit.rim.color.set(0xffb648);
  kit.rim.intensity = 2.4;
  kit.rim.position.set(-4, 8, -7);
  kit.hemi.color.set(0x8a4a2a);
  kit.hemi.groundColor.set(0x1a0606);
  kit.hemi.intensity = 0.3;
  spot(kit, 0xfff0d0, 75, v3(-1.4, 4.6, 3.6), 0.32);

  // Dark red stone floor polished to a mirror, with the sigil burning in it.
  const stoneTex = paint(kit, 256, (ctx, s) => noiseFill(ctx, s, (n) => [40 + n * 60, 12 + n * 18, 12 + n * 14], 6, 31), 12);
  const floor = solid(new THREE.CircleGeometry(40, 64), new THREE.MeshStandardMaterial({ color: 0x9a6a5a, map: stoneTex, roughness: 0.25, metalness: 0.2 }), false);
  floor.rotation.x = -Math.PI / 2;
  kit.add(floor);
  mirror(kit, { strength: 0.5, blur: 0.0025, fade: 26, tint: 0xffd8b0 });
  const sigil = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 4.2), new THREE.MeshBasicMaterial({ map: sigilTexture(kit), color: new THREE.Color(0xffc040).multiplyScalar(1.6), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  sigil.rotation.x = -Math.PI / 2;
  sigil.position.y = 0.008;
  kit.add(sigil);

  // A ring of gilded arches with banners hanging inside them, open toward the camera.
  const gold = new THREE.MeshStandardMaterial({ color: 0xd8a040, roughness: 0.3, metalness: 1 });
  const darkStone = new THREE.MeshStandardMaterial({ color: 0x2a1410, roughness: 0.7 });
  const pillars: THREE.BufferGeometry[] = [], trims: THREE.BufferGeometry[] = [];
  const angles: number[] = [];
  for (let a = -1.5; a <= 1.51; a += 0.375) angles.push(a);
  for (const a of angles) {
    const [x, z] = behind(a, RING);
    const p = new THREE.BoxGeometry(0.9, 7, 0.9);
    p.translate(x, 3.5, z);
    pillars.push(p);
    const cap = new THREE.BoxGeometry(1.1, 0.3, 1.1);
    cap.translate(x, 5.2, z);
    trims.push(cap);
  }
  for (let i = 0; i < angles.length - 1; i++) {
    const [ax, az] = behind(angles[i], RING), [bx, bz] = behind(angles[i + 1], RING);
    const half = Math.hypot(bx - ax, bz - az) / 2;
    const arch = new THREE.TorusGeometry(half, 0.16, 8, 24, Math.PI);
    arch.rotateY(-Math.atan2(bz - az, bx - ax));
    arch.translate((ax + bx) / 2, 5.35, (az + bz) / 2);
    trims.push(arch);
  }
  const wall = inside(new THREE.CylinderGeometry(RING + 0.3, RING + 0.3, 4, 48, 1, true, 0, Math.PI * 2));
  wall.translate(0, 9, 0);
  pillars.push(wall);
  kit.add(solid(mergeGeometries(pillars.map((g) => g.toNonIndexed()))!, darkStone));
  kit.add(solid(mergeGeometries(trims.map((g) => { g.deleteAttribute("uv"); return g.toNonIndexed(); }))!, gold));

  const bannerMat = new THREE.MeshStandardMaterial({ map: bannerTexture(kit), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.8, emissive: 0x2a0204 });
  const banners: THREE.Mesh[] = [];
  for (let i = 0; i < angles.length - 1; i++) {
    const [x, z] = behind((angles[i] + angles[i + 1]) / 2, RING - 0.2);
    const b = solid(new THREE.PlaneGeometry(2.6, 4.6, 6, 16), bannerMat);
    b.position.set(x, 2.9, z);
    b.lookAt(0, 2.9, 0);
    banners.push(b);
    kit.add(b);
  }
  // Cloth sways: each banner's vertices ripple more toward the hem.
  const rest = banners.map((b) => Float32Array.from(b.geometry.attributes.position.array));
  kit.tick((t) => banners.forEach((b, k) => {
    const p = b.geometry.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const y = rest[k][i * 3 + 1];
      p.setZ(i, Math.sin(t * 1.2 + y * 1.3 + k) * 0.06 * (2.3 - y));
    }
    p.needsUpdate = true;
  }));

  // The throne on its dais under a glowing rose window, far down the axis.
  const throne: THREE.BufferGeometry[] = [];
  const block = (w: number, h: number, d: number, side: number, depth: number, y: number) => {
    const g = new THREE.BoxGeometry(w, h, d);
    g.rotateY(SHOT_YAW);
    g.translate(...shotPos(side, depth, y).toArray());
    throne.push(g);
  };
  for (let s = 0; s < 3; s++) block(5 - s * 1.1, 0.3, 2.4 - s * 0.5, -1.2, 8.0 + s * 0.2, 0.15 + s * 0.3);
  block(1.6, 0.5, 1.2, -1.2, 8.3, 1.1);
  block(1.6, 3.4, 0.3, -1.2, 8.8, 2.7);
  kit.add(solid(mergeGeometries(throne.map((g) => g.toNonIndexed()))!, gold));
  const rose = new THREE.Mesh(new THREE.CircleGeometry(1.7, 48), new THREE.MeshBasicMaterial({ map: sigilTexture(kit), color: new THREE.Color(0xffd890).multiplyScalar(1.2), transparent: true, fog: false }));
  rose.position.copy(shotPos(-1.2, RING + 0.6, 3.5));
  rose.rotation.y = SHOT_YAW;
  kit.add(rose);
  glow(kit, glowTexture(), 0xffc060, 7, 0.3, shotPos(-1.2, RING + 0.4, 3.5));

  // Braziers between the arches: flame sprites, a flickering light and embers.
  const flames: { s: THREE.Sprite; l: THREE.PointLight; k: number }[] = [];
  for (const a of [-0.56, 0.56]) {
    const [x, z] = behind(a, RING - 1.2);
    const bowl = solid(new THREE.CylinderGeometry(0.45, 0.2, 0.4, 16), gold);
    bowl.position.set(x, 1.4, z);
    const stand = solid(new THREE.CylinderGeometry(0.08, 0.2, 1.2, 8), gold);
    stand.position.set(x, 0.6, z);
    kit.add(bowl);
    kit.add(stand);
    const s = glow(kit, flameTexture(), 0xffa040, 1.3, 1, v3(x, 2.1, z));
    s.material.color.multiplyScalar(2.2);
    flames.push({ s, l: lamp(kit, 0xff9a40, 8, 10, v3(x, 2.2, z)), k: flames.length });
  }
  kit.tick((t) => {
    for (const f of flames) {
      const n = 0.85 + 0.15 * Math.sin(t * 11 + f.k * 3) * Math.sin(t * 7.3 + f.k);
      f.l.intensity = 8 * n;
      f.s.scale.set(1.0 * n, 1.4 * (0.9 + 0.2 * n), 1);
    }
    sigil.rotation.z = t * 0.05;
    (sigil.material as THREE.MeshBasicMaterial).opacity = 0.75 + 0.25 * Math.sin(t * 1.6);
  });

  mist(kit, { color: 0x6a3018, opacity: 0.25, width: 20, height: 5, position: shotPos(0, 8, 2), scale: 1.3, speed: 0.03 });

  drift(kit, {
    capacity: 160, texture: sparkTexture(), rate: 30, prewarm: 6, drag: 0.3,
    emit: { position: shotPos(0, 2, 1.3), spread: v3(3.5, 1.3, 3.5), velocity: v3(0, 0.05, 0), velocityJitter: v3(0.04, 0.03, 0.04), life: [3, 6], size: [0.025, 0.06], colors: ["#ffd76a", "#ffb040", "#fff0c0"] },
  });

  kit.bake(0.9);
  return kit.done();
};
