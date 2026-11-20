/**
 * Tunnel: a tube of rushing light. The hero stands on a dark mirror platform
 * while streaks and rings of blue white light pour out of a glowing vanishing
 * point and race past the camera.
 */

import * as THREE from "three";
import { glowTexture, sparkTexture } from "../core/textures";
import { CLEAR, DEPTH, drift, glow, inside, Kit, lamp, mirror, rng, SHOT_YAW, shotPos, solid, spot, v3 } from "./shared";
import type { EnvironmentBuilder } from "./types";

const RADIUS = 9;
const AXIS_Y = 2.2;
const NEAR = -12;
const FAR = 70;

/** Position on the tunnel wall: angle around the axis (0 is straight up), radial distance and depth. */
function onWall(angle: number, radius: number, depth: number): THREE.Vector3 {
  return shotPos(Math.sin(angle) * radius, depth, AXIS_Y + Math.cos(angle) * radius);
}

export const tunnel: EnvironmentBuilder = (stage) => {
  const kit = new Kit(stage);
  const r = rng(113);
  kit.sky(0x01030a, new THREE.FogExp2(0x040a1c, 0.022));

  kit.key.color.set(0xc8dcff);
  kit.key.intensity = 0.3;
  kit.rim.color.set(0x6ac8ff);
  kit.rim.intensity = 2.6;
  kit.rim.position.copy(shotPos(0, 10, 6));
  kit.hemi.color.set(0x2a4a8a);
  kit.hemi.groundColor.set(0x02040a);
  kit.hemi.intensity = 0.3;
  spot(kit, 0xe8f0ff, 60, v3(-1.4, 4.6, 3.6), 0.32);
  const sweep = lamp(kit, 0x7ad0ff, 0, 9, v3());

  // The tube itself: dark, barely visible, so the light reads as speed rather than as a room.
  const tubeGeo = inside(new THREE.CylinderGeometry(RADIUS + 1, RADIUS + 1, FAR - NEAR, 48, 1, true));
  tubeGeo.rotateX(Math.PI / 2);
  const tube = new THREE.Mesh(tubeGeo, new THREE.MeshStandardMaterial({ color: 0x0a1020, roughness: 0.6, metalness: 0.5 }));
  tube.position.copy(shotPos(0, (FAR + NEAR) / 2, AXIS_Y));
  tube.rotation.y = SHOT_YAW;
  kit.add(tube);

  // Glossy black platform with lane lights running along its edges.
  const floor = solid(new THREE.PlaneGeometry(2 * RADIUS, FAR - NEAR), new THREE.MeshStandardMaterial({ color: 0x0a0e16, roughness: 0.18, metalness: 0.6 }), false);
  floor.rotation.set(-Math.PI / 2, 0, SHOT_YAW, "YXZ");
  floor.position.copy(shotPos(0, (FAR + NEAR) / 2));
  kit.add(floor);
  mirror(kit, { strength: 0.9, blur: 0.002, fade: 60, tint: 0xc8e0ff });
  const laneMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: kit.time },
    vertexShader: "varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
    fragmentShader: `uniform float uTime; varying vec2 vUv;
      void main() {
        float dash = smoothstep(0.2, 0.5, fract(vUv.y * 40.0 + uTime * 6.0)) * smoothstep(1.0, 0.7, fract(vUv.y * 40.0 + uTime * 6.0));
        float edge = 1.0 - abs(vUv.x - 0.5) * 2.0;
        gl_FragColor = vec4(vec3(0.5, 0.85, 1.6) * dash * edge * (0.3 + 0.7 * vUv.y), 1.0);
      }`,
  });
  for (const side of [-1, 1]) {
    const lane = new THREE.Mesh(new THREE.PlaneGeometry(0.12, FAR - NEAR), laneMat);
    lane.rotation.set(-Math.PI / 2, 0, SHOT_YAW, "YXZ");
    lane.position.copy(shotPos(side * (CLEAR + 0.4), (FAR + NEAR) / 2, 0.01));
    kit.add(lane);
  }

  // Light streaks on the walls and in the air, recycled from the far end as they pass the camera.
  const count = 320;
  const streakGeo = new THREE.PlaneGeometry(1, 1);
  streakGeo.translate(0, 0.5, 0);
  const streakMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    vertexShader: "varying vec2 vUv; varying vec3 vTint; void main() { vUv = uv; vTint = instanceColor; gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0); }",
    fragmentShader: `varying vec2 vUv; varying vec3 vTint;
      void main() {
        float across = 1.0 - abs(vUv.x - 0.5) * 2.0;
        float head = pow(1.0 - vUv.y, 2.5);
        gl_FragColor = vec4(vTint * across * across * head, 1.0);
      }`,
  });
  const streaks = new THREE.InstancedMesh(streakGeo, streakMat, count);
  streaks.frustumCulled = false;
  const data = Array.from({ length: count }, () => {
    const air = r() < 0.25;
    const angle = air ? (r() - 0.5) * 2.2 : (r() - 0.5) * 3.5;
    const radius = air ? CLEAR + 0.5 + r() * 1.8 : RADIUS - r() * 0.6;
    return { angle, radius, depth: NEAR + r() * (FAR - NEAR), len: 4 + r() * 10, width: 0.03 + r() * 0.08, speed: 28 + r() * 26 };
  });
  const tint = new THREE.Color();
  data.forEach((_d, i) => streaks.setColorAt(i, tint.setHSL(0.55 + r() * 0.08, 0.8, 0.5 + r() * 0.4).multiplyScalar(1.5 + r() * 2.5)));
  kit.add(streaks);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), basis = new THREE.Matrix4();
  const back = DEPTH.clone();
  const place = (t: number) => {
    data.forEach((d, i) => {
      const range = FAR - NEAR;
      const depth = NEAR + ((((d.depth - t * d.speed - NEAR) % range) + range) % range);
      const p = onWall(d.angle, d.radius, depth);
      // Long axis points down the tunnel, the face points at the axis so the camera sees it broadside.
      const toAxis = shotPos(0, depth, AXIS_Y).sub(p).normalize();
      const x = back.clone().cross(toAxis).normalize();
      basis.makeBasis(x, back, toAxis);
      q.setFromRotationMatrix(basis);
      streaks.setMatrixAt(i, m.compose(p, q, v3(d.width, d.len, 1)));
    });
    streaks.instanceMatrix.needsUpdate = true;
  };
  place(0);

  // Rings of light sweeping past, and the blinding source at the end of the tube.
  const rings: THREE.Mesh[] = [];
  const ringMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0x8ad8ff).multiplyScalar(1.6), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
  for (let i = 0; i < 5; i++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(RADIUS - 0.2, 0.035, 6, 96), ringMat);
    ring.rotation.y = SHOT_YAW;
    rings.push(ring);
    kit.add(ring);
  }
  glow(kit, glowTexture(), 0xbfe6ff, 16, 0.9, shotPos(0, FAR - 6, AXIS_Y));
  glow(kit, glowTexture(), 0x4a9aff, 40, 0.45, shotPos(0, FAR - 4, AXIS_Y));

  // Speed dust: sparks flung toward the camera.
  drift(kit, {
    capacity: 160, texture: sparkTexture(), rate: 60, prewarm: 3,
    emit: { position: shotPos(0, 14, 1.8), spread: v3(5, 1.6, 5), velocity: DEPTH.clone().multiplyScalar(-9), velocityJitter: v3(0.4, 0.3, 0.4), life: [0.8, 1.6], size: [0.03, 0.07], colors: ["#cfe8ff", "#7ac8ff", "#ffffff"] },
  });

  kit.tick((t) => {
    place(t);
    rings.forEach((ring, i) => {
      const range = FAR - NEAR;
      const depth = NEAR + ((((i / rings.length) * range - t * 18) % range) + range) % range;
      ring.position.copy(shotPos(0, depth, AXIS_Y));
      // When a ring passes the hero it washes it in cyan light.
      if (Math.abs(depth) < 4) {
        sweep.position.copy(shotPos(0, depth, AXIS_Y + 1));
        sweep.intensity = 14 * (1 - Math.abs(depth) / 4);
      }
    });
    if (!rings.some((ring) => ring.position.distanceTo(v3(0, AXIS_Y, 0)) < 4)) sweep.intensity = 0;
  });

  kit.bake(0.6);
  return kit.done();
};

