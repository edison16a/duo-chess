/**
 * Arcane: a round stone wizard's chamber. Rune circles burn violet and cyan
 * in the floor, crystals float and turn in the air, bookshelves fill the
 * alcoves in shadow and sparks of magic drift upward.
 */

import * as THREE from "three";
import { glowTexture, runeTexture, sparkTexture } from "../core/textures";
import { behind, CLEAR, crystalGeo, drift, faceted, glow, inside, Kit, lamp, mirror, mist, paint, rimGlow, rng, solid, spot, v3 } from "./shared";
import type { EnvironmentBuilder } from "./types";

const WALL = CLEAR + 4.5;

/** Rough stone blocks in staggered courses, drawn once and tiled around the wall. */
function bricks(kit: Kit, repeat: number): THREE.CanvasTexture {
  const r = rng(77);
  return paint(kit, 256, (ctx, s) => {
    ctx.fillStyle = "#1a1620";
    ctx.fillRect(0, 0, s, s);
    const rows = 8, h = s / rows;
    for (let y = 0; y < rows; y++) {
      const w = s / 4;
      for (let x = -1; x < 5; x++) {
        const v = 52 + r() * 34;
        ctx.fillStyle = `rgb(${v},${v * 0.92},${v * 1.08})`;
        ctx.fillRect(x * w + (y % 2) * w * 0.5 + 2, y * h + 2, w - 4, h - 4);
      }
    }
  }, repeat);
}

/** A floor decal of runes, additive and tinted, that the update loop turns. */
function runeRing(kit: Kit, size: number, color: THREE.ColorRepresentation, y: number): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshBasicMaterial({ map: runeTexture(), color: new THREE.Color(color).multiplyScalar(1.7), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  m.rotation.x = -Math.PI / 2;
  m.position.y = y;
  kit.add(m);
  return m;
}

export const arcane: EnvironmentBuilder = (stage) => {
  const kit = new Kit(stage);
  const r = rng(61);
  kit.sky(0x050308, new THREE.FogExp2(0x120a1e, 0.05));

  kit.key.color.set(0xc8c0ff);
  kit.key.intensity = 0.3;
  kit.rim.color.set(0x9a5aff);
  kit.rim.intensity = 1.8;
  kit.rim.position.set(-4, 8, -7);
  kit.hemi.color.set(0x3a2a5a);
  kit.hemi.groundColor.set(0x08060c);
  kit.hemi.intensity = 0.25;
  spot(kit, 0xe8e0ff, 65, v3(-1.4, 4.6, 3.6), 0.32);
  lamp(kit, 0x8a4aff, 5, 7, v3(-1.6, 0.3, -2.2));
  lamp(kit, 0x2ad8ff, 3, 6, v3(2.0, 1.2, 0.3));

  // Worn flagstones with a little polish, and the rune circles burning in them.
  const floor = solid(new THREE.CircleGeometry(WALL + 1, 64), new THREE.MeshStandardMaterial({ color: 0x6a6280, map: bricks(kit, 10), roughness: 0.45 }), false);
  floor.rotation.x = -Math.PI / 2;
  kit.add(floor);
  mirror(kit, { strength: 0.3, blur: 0.003, fade: 14, tint: 0xd8c8ff });
  const inner = runeRing(kit, 3.4, 0xa060ff, 0.01);
  const outer = runeRing(kit, 7.5, 0x3ac8ff, 0.008);

  // The chamber: a stone drum with a dark vaulted ceiling high above.
  const wall = solid(inside(new THREE.CylinderGeometry(WALL, WALL, 14, 64, 1, true)), new THREE.MeshStandardMaterial({ color: 0x6a6078, map: bricks(kit, 1), roughness: 0.9 }), false);
  (wall.material as THREE.MeshStandardMaterial).map!.repeat.set(10, 3);
  wall.position.y = 7;
  kit.add(wall);
  const roof = new THREE.Mesh(inside(new THREE.SphereGeometry(WALL, 48, 16, 0, Math.PI * 2, 0, Math.PI / 2)), new THREE.MeshStandardMaterial({ color: 0x141018, roughness: 1 }));
  roof.position.y = 14;
  roof.scale.y = 0.5;
  kit.add(roof);

  // Bookshelves in alcoves around the back of the room, books instanced in random colours.
  const wood = new THREE.MeshStandardMaterial({ color: 0x2a1a12, roughness: 0.8 });
  const bookGeo = new THREE.BoxGeometry(1, 1, 1);
  const books = new THREE.InstancedMesh(bookGeo, new THREE.MeshStandardMaterial({ roughness: 0.7 }), 360);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), c = new THREE.Color();
  let n = 0;
  for (let a = -1.25; a <= 1.26; a += 0.5) {
    const [x, z] = behind(a, WALL - 0.5);
    const yaw = Math.atan2(-x, -z);
    const shelf = solid(new THREE.BoxGeometry(2.6, 5, 0.7), wood);
    shelf.position.set(x, 2.5, z);
    shelf.rotation.y = yaw;
    kit.add(shelf);
    const face = v3(-x, 0, -z).normalize();
    const along = v3(face.z, 0, -face.x);
    for (let row = 0; row < 4 && n < 360; row++) {
      let u = -1.15;
      while (u < 1.1 && n < 360) {
        const w = 0.07 + r() * 0.08, h = 0.55 + r() * 0.35;
        const p = v3(x, 0.45 + row * 1.15 + h / 2, z).addScaledVector(along, u + w / 2).addScaledVector(face, 0.3);
        q.setFromAxisAngle(v3(0, 1, 0), yaw).multiply(new THREE.Quaternion().setFromAxisAngle(face, r() < 0.1 ? 0.25 : 0));
        books.setMatrixAt(n, m.compose(p, q, v3(w, h, 0.42)));
        books.setColorAt(n++, c.setHSL([0, 0.02, 0.58, 0.72, 0.3][Math.floor(r() * 5)], 0.5, 0.12 + r() * 0.14));
        u += w + 0.01;
      }
    }
  }
  books.count = n;
  books.castShadow = books.receiveShadow = true;
  kit.add(books);

  // Floating crystals ringing the room, each turning and bobbing on its own rhythm.
  const crystalMat = rimGlow(new THREE.MeshStandardMaterial({ color: 0x8a5aff, roughness: 0.25, metalness: 0.3, emissive: 0x7a3aff, emissiveIntensity: 1.4 }), 0xd0a0ff, 0.5, 1.5);
  const floaters: { m: THREE.Mesh; y: number; k: number }[] = [];
  for (let i = 0; i < 9; i++) {
    const [x, z] = behind((r() - 0.5) * 2.6, CLEAR + 0.6 + r() * 2.8);
    const g = faceted(crystalGeo(0.8 + r() * 1.2, 0.18 + r() * 0.14, r));
    g.translate(0, -0.6, 0);
    const mesh = new THREE.Mesh(g, i % 3 === 0 ? crystalMat.clone() : crystalMat);
    if (i % 3 === 0) (mesh.material as THREE.MeshStandardMaterial).emissive.set(0x1aa8ff);
    const y = 1.4 + r() * 2.6;
    mesh.position.set(x, y, z);
    floaters.push({ m: mesh, y, k: r() * 10 });
    kit.add(mesh);
    glow(kit, glowTexture(), i % 3 === 0 ? 0x3ac8ff : 0xa060ff, 1.8, 0.35, v3(x, y, z));
  }

  const [mx, mz] = behind(0, 7.5);
  mist(kit, { color: 0x3a2060, opacity: 0.3, width: 18, height: 4, position: v3(mx, 1.6, mz), scale: 1.4, speed: 0.04 });
  mist(kit, { color: 0x5a3a9a, opacity: 0.18, width: 20, height: 20, position: v3(0, 0.05, 0), flat: true, scale: 3, speed: 0.03 });

  drift(kit, {
    capacity: 200, texture: sparkTexture(), rate: 40, prewarm: 6, drag: 0.4,
    emit: { position: v3(-1, 0.4, -1.4), spread: v3(3, 0.4, 3), velocity: v3(0, 0.25, 0), velocityJitter: v3(0.08, 0.1, 0.08), life: [2, 4], size: [0.03, 0.07], colors: ["#c08aff", "#7ae0ff", "#ffffff"] },
  });

  kit.tick((t) => {
    inner.rotation.z = t * 0.12;
    outer.rotation.z = -t * 0.05;
    (inner.material as THREE.MeshBasicMaterial).opacity = 0.8 + 0.2 * Math.sin(t * 2.1);
    for (const f of floaters) {
      f.m.rotation.set(Math.sin(t * 0.3 + f.k) * 0.25, t * 0.4 + f.k, 0);
      f.m.position.y = f.y + Math.sin(t * 0.9 + f.k) * 0.12;
    }
  });

  kit.bake(0.8);
  return kit.done();
};
