/**
 * Storm: a wet rocky plain under low rolling clouds, rain slanting through
 * the frame, puddle reflections and lightning forking down in the distance
 * that flashes the whole sky.
 */

import * as THREE from "three";
import { glowTexture, sparkTexture } from "../core/textures";
import { behind, CLEAR, drift, faceted, glow, Kit, mirror, mist, noiseFill, paint, rng, rock, sky, solid, spot, v3 } from "./shared";
import type { EnvironmentBuilder } from "./types";

/** Strike times within the 8 second loop; each strike flickers a few times. */
const STRIKES = [2.62, 6.1];

/** Brightness of the lightning at time t: sharp flickers that decay quickly. */
function flashAt(t: number): number {
  const lt = t % 8;
  let f = 0.0;
  for (const s of STRIKES) {
    for (const [dt, k] of [[0, 1], [0.11, 0.6], [0.24, 0.85]]) {
      const x = lt - s - dt;
      if (x >= 0) f = Math.max(f, k * Math.exp(-x * 9));
    }
  }
  return f;
}

/** A forked bolt as camera facing ribbons, built once and shown only while it flashes. */
function bolt(r: () => number, top: THREE.Vector3, bottomY: number): THREE.BufferGeometry {
  const pos: number[] = [];
  const segment = (a: THREE.Vector3, b: THREE.Vector3, w: number) => {
    // Ribbons lie in the plane facing the camera, which looks roughly along -z here.
    const d = b.clone().sub(a);
    const side = v3(-d.y, d.x, 0).normalize().multiplyScalar(w / 2);
    const q = [a.clone().add(side), a.clone().sub(side), b.clone().add(side), b.clone().sub(side)];
    pos.push(...q[0].toArray(), ...q[1].toArray(), ...q[2].toArray(), ...q[2].toArray(), ...q[1].toArray(), ...q[3].toArray());
  };
  const branch = (from: THREE.Vector3, steps: number, w: number, drop: number) => {
    let p = from.clone();
    for (let i = 0; i < steps && p.y > bottomY; i++) {
      const n = p.clone().add(v3((r() - 0.5) * drop * 0.9, -drop * (0.6 + r() * 0.6), (r() - 0.5) * 0.5));
      segment(p, n, w);
      if (r() < 0.18 && w > 0.12) branch(n, Math.floor(steps / 2), w * 0.55, drop * 0.8);
      p = n;
    }
  };
  branch(top, 26, 0.32, 1.4);
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  return g;
}

/** Slanted rain as line segments, recycled through a box around the hero. */
function rain(kit: Kit, count: number): void {
  const r = rng(5);
  const box = { x: [-7, 3], y: [0, 6], z: [-9, 2] };
  const fall = v3(0.9, -9, 0.5);
  const len = fall.clone().normalize().multiplyScalar(0.32);
  const pos = new Float32Array(count * 6);
  const alpha = new Float32Array(count * 2);
  const heads: THREE.Vector3[] = [];
  for (let i = 0; i < count; i++) {
    heads.push(v3(box.x[0] + r() * 10, r() * 6, box.z[0] + r() * 11));
    alpha[i * 2] = 0.55;
    alpha[i * 2 + 1] = 0;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("alpha", new THREE.BufferAttribute(alpha, 1));
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uColor: { value: new THREE.Color(0x9fb8d8) } },
    vertexShader: "attribute float alpha; varying float vA; void main() { vA = alpha; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
    fragmentShader: "uniform vec3 uColor; varying float vA; void main() { gl_FragColor = vec4(uColor * vA, 1.0); }",
  });
  const lines = new THREE.LineSegments(geo, mat);
  lines.frustumCulled = false;
  kit.add(lines);
  kit.tick((_t, dt) => {
    for (let i = 0; i < count; i++) {
      const h = heads[i].addScaledVector(fall, dt);
      if (h.y < 0) h.set(box.x[0] + r() * 10, 6, box.z[0] + r() * 11);
      pos.set([h.x, h.y, h.z, h.x - len.x, h.y - len.y, h.z - len.z], i * 6);
    }
    geo.attributes.position.needsUpdate = true;
  });
}

export const storm: EnvironmentBuilder = (stage) => {
  const kit = new Kit(stage);
  const r = rng(31);
  kit.sky(0x0b0f16, new THREE.FogExp2(0x1a2230, 0.03));
  const { flash } = sky(kit, {
    top: 0x06080c, horizon: 0x2a3444, bottom: 0x0e1218,
    clouds: { amount: 0.95, color: 0x0d1118, lit: 0x3a4658, scale: 1.3, speed: 0.06 },
  });

  kit.key.color.set(0xbcd0ff);
  kit.key.intensity = 0.4;
  kit.rim.color.set(0x8fb0e8);
  kit.rim.intensity = 1.6;
  kit.rim.position.set(-3, 7, -8);
  kit.hemi.color.set(0x5a6a88);
  kit.hemi.groundColor.set(0x0a0c10);
  kit.hemi.intensity = 0.35;
  spot(kit, 0xdfe8ff, 65, v3(-1.4, 4.4, 3.6), 0.32);
  const strike = new THREE.DirectionalLight(0xcfe0ff, 0);
  strike.position.set(-6, 10, -12);
  kit.add(strike);

  // Wet slate: dark noisy stone, glossy, with a rippled mirror on top for the puddles.
  const slate = paint(kit, 256, (ctx, s) => noiseFill(ctx, s, (n) => {
    const v = 22 + n * 70;
    return [v * 0.92, v * 0.97, v * 1.05];
  }, 8, 9), 10);
  const floor = solid(new THREE.CircleGeometry(70, 64), new THREE.MeshStandardMaterial({ color: 0x8090a0, map: slate, roughness: 0.32, metalness: 0.1, envMapIntensity: 0.6 }), false);
  floor.rotation.x = -Math.PI / 2;
  kit.add(floor);
  mirror(kit, { strength: 0.42, ripple: 0.006, blur: 0.002, fade: 30, tint: 0xc8d8f0 });

  // Rock outcrops beyond the clearing and a ragged ridge far away.
  const rockMat = new THREE.MeshStandardMaterial({ color: 0x3a4048, roughness: 0.45, metalness: 0.1 });
  for (let i = 0; i < 18; i++) {
    const far = i < 7;
    // Keep the sky open straight behind the hero, where the lightning strikes.
    const a = (r() - 0.5) * 3.2;
    const [x, z] = behind(far && Math.abs(a) < 0.5 ? a + Math.sign(a) * 0.6 : a, far ? 16 + r() * 10 : CLEAR + 0.6 + r() * 4.5);
    const h = far ? 3 + r() * 5 : 0.3 + r() * 0.9;
    const w = far ? 2.5 + r() * 3 : 0.7 + r() * 1.2;
    const m = solid(faceted(rock(200 + i, w, h, w * 0.8, 3, 0.35)), rockMat);
    m.position.set(x, h * 0.3, z);
    m.rotation.y = r() * Math.PI;
    kit.add(m);
  }
  const ridge = new THREE.Mesh(rock(9, 60, 9, 12, 4, 0.35), new THREE.MeshStandardMaterial({ color: 0x141820, roughness: 1 }));
  const [rx, rz] = behind(0, 62);
  ridge.position.set(rx, -1, rz);
  ridge.lookAt(0, -1, 0);
  kit.add(ridge);

  // The bolt and its glow sit far behind and to the left so they frame the hero.
  const [bx, bz] = behind(0.2, 44);
  const boltMesh = new THREE.Mesh(bolt(r, v3(bx, 24, bz), 0), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xdfe8ff).multiplyScalar(4), opacity: 0, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, side: THREE.DoubleSide }));
  kit.add(boltMesh);
  const boltGlow = glow(kit, glowTexture(), 0x9fb8ff, 30, 0, v3(bx, 12, bz));

  // Low cloud tatters and ground haze.
  for (let i = 0; i < 3; i++) {
    const [x, z] = behind((i - 1) * 0.5, 7 + i * 3);
    mist(kit, { color: 0x3a4658, opacity: 0.4, width: 18, height: 4, position: v3(x, 1.2 + i * 0.8, z), scale: 1.5, speed: 0.15 });
  }

  rain(kit, 520);
  // Splashes: tiny bright sparks popping off the floor.
  drift(kit, {
    capacity: 120, texture: sparkTexture(), rate: 60, prewarm: 1,
    emit: { position: v3(-1.5, 0.02, -2), spread: v3(4, 0, 4), velocity: v3(0, 0.6, 0), velocityJitter: v3(0.3, 0.2, 0.3), life: [0.12, 0.25], size: [0.03, 0.06], colors: ["#c8d8f0"] },
  });

  const hemiBase = kit.hemi.intensity;
  kit.tick((t) => {
    const f = flashAt(t);
    flash.value = f;
    strike.intensity = f * 2;
    kit.hemi.intensity = hemiBase + f * 0.35;
    // The bolt lingers a little longer than the ambient flash, like an afterimage.
    const lt = t % 8;
    (boltMesh.material as THREE.MeshBasicMaterial).opacity = STRIKES.some((s) => lt > s && lt < s + 0.45) ? Math.max(0.5, f) : 0;
    boltGlow.material.opacity = f * 0.5;
  });

  kit.bake(0.7);
  return kit.done();
};
