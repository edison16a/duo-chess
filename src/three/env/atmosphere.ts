/** Sky, reflections, particles, mist and light shafts: the atmosphere layer of every environment. */

import * as THREE from "three";
import { Particles, type EmitOptions, type ParticleConfig } from "../core/particles";
import { inside } from "./geometry";
import { type Kit, SHOT_EYE, v3 } from "./kit";
import { NOISE_GLSL } from "./noise";

export interface SkyOptions {
  top: THREE.ColorRepresentation;
  horizon: THREE.ColorRepresentation;
  bottom?: THREE.ColorRepresentation;
  /** Glow around a direction, for a sun, moon or cave mouth. */
  sun?: { dir: THREE.Vector3; color: THREE.ColorRepresentation; size: number; power?: number };
  /** Rolling cloud cover drawn with noise: amount 0 to 1. */
  clouds?: { amount: number; color: THREE.ColorRepresentation; scale?: number; speed?: number; lit?: THREE.ColorRepresentation };
  radius?: number;
}

/** Large gradient dome with optional sun glow and animated clouds. Returns the flash uniform for lightning. */
export function sky(kit: Kit, o: SkyOptions): { flash: { value: number }; mesh: THREE.Mesh } {
  const flash = { value: 0 };
  const c = (x: THREE.ColorRepresentation | undefined, f: THREE.ColorRepresentation) => ({ value: new THREE.Color(x ?? f) });
  const mat = new THREE.ShaderMaterial({
    depthWrite: false, fog: false,
    uniforms: {
      uTop: c(o.top, 0), uHorizon: c(o.horizon, 0), uBottom: c(o.bottom, o.horizon),
      uSunDir: { value: (o.sun?.dir ?? v3(0, 1, 0)).clone().normalize() }, uSun: c(o.sun?.color, 0), uSunSize: { value: o.sun?.size ?? 0.1 }, uSunPow: { value: o.sun?.power ?? 1 },
      uCloud: { value: o.clouds?.amount ?? 0 }, uCloudColor: c(o.clouds?.color, 0), uCloudLit: c(o.clouds?.lit, o.clouds?.color ?? 0),
      uScale: { value: o.clouds?.scale ?? 2.2 }, uSpeed: { value: o.clouds?.speed ?? 0.02 }, uTime: kit.time, uFlash: flash,
    },
    vertexShader: /* glsl */ `varying vec3 vDir; void main() { vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uTop, uHorizon, uBottom, uSun, uCloudColor, uCloudLit, uSunDir;
      uniform float uSunSize, uSunPow, uCloud, uScale, uSpeed, uTime, uFlash;
      varying vec3 vDir;
      ${NOISE_GLSL}
      void main() {
        vec3 d = normalize(vDir);
        float h = d.y;
        vec3 col = h > 0.0 ? mix(uHorizon, uTop, pow(smoothstep(0.0, 0.85, h), 0.7)) : mix(uHorizon, uBottom, smoothstep(0.0, 0.25, -h));
        float s = max(0.0, dot(d, uSunDir));
        float sun = pow(s, 1.0 / max(0.001, uSunSize)) * uSunPow;
        if (uCloud > 0.0) {
          vec2 p = d.xz / (0.18 + max(h, 0.0)) * uScale;
          float n = fbm(vec3(p + vec2(uTime * uSpeed, uTime * uSpeed * 0.4), uTime * uSpeed * 0.6));
          float cover = smoothstep(0.62 - uCloud * 0.5, 0.95 - uCloud * 0.3, n) * smoothstep(-0.02, 0.12, h);
          vec3 cloud = mix(uCloudColor, uCloudLit, smoothstep(0.45, 0.85, n) + sun * 0.6);
          col = mix(col, cloud * (1.0 + uFlash * 3.0 * n), cover);
          sun *= 1.0 - cover * 0.7;
        }
        col += uSun * sun + uFlash * vec3(0.55, 0.6, 0.8) * smoothstep(-0.1, 0.6, h);
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
  const mesh = new THREE.Mesh(inside(new THREE.SphereGeometry(o.radius ?? 90, 48, 24)), mat);
  mesh.renderOrder = -10;
  kit.add(mesh);
  return { flash, mesh };
}

export interface DriftOptions extends ParticleConfig {
  /** Particles spawned per second. */
  rate: number;
  emit: Omit<EmitOptions, "count">;
  /** Seconds simulated up front so the field is already full on the first frame. */
  prewarm?: number;
  /** Extra per frame motion, for swirling or wind. */
  wind?: (t: number) => THREE.Vector3;
}

/** A steady stream of particles (snow, embers, dust, motes) kept alive by a spawn rate. */
export function drift(kit: Kit, o: DriftOptions): Particles {
  const ps = new Particles(o);
  kit.own(ps);
  kit.add(ps.points);
  let acc = 0;
  const step = (dt: number, t: number) => {
    acc += o.rate * dt;
    const n = Math.floor(acc);
    acc -= n;
    if (n > 0) ps.emit({ ...o.emit, count: n });
    if (o.wind) ps.points.position.addScaledVector(o.wind(t), dt);
    ps.update(dt);
  };
  for (let t = 0; t < (o.prewarm ?? 0); t += 1 / 20) step(1 / 20, t);
  kit.tick((t, dt) => {
    ps.setCamera(kit.stage.camera, kit.ppu());
    step(dt, t);
  });
  return ps;
}

export interface MistOptions {
  color: THREE.ColorRepresentation;
  opacity: number;
  width: number;
  height: number;
  position: THREE.Vector3;
  /** Lie flat on the ground instead of facing the camera. */
  flat?: boolean;
  scale?: number;
  speed?: number;
  additive?: boolean;
}

/** A soft sheet of animated noise: fog banks, ground mist, smoke walls. */
export function mist(kit: Kit, o: MistOptions): THREE.Mesh {
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, fog: false, side: THREE.DoubleSide,
    blending: o.additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    uniforms: { uColor: { value: new THREE.Color(o.color) }, uOpacity: { value: o.opacity }, uScale: { value: o.scale ?? 2 }, uSpeed: { value: o.speed ?? 0.05 }, uTime: kit.time, uSeed: { value: Math.random() * 50 } },
    vertexShader: /* glsl */ `varying vec2 vUv; varying vec3 vWorld; void main() { vUv = uv; vWorld = (modelMatrix * vec4(position, 1.0)).xyz; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor; uniform float uOpacity, uScale, uSpeed, uTime, uSeed;
      varying vec2 vUv; varying vec3 vWorld;
      ${NOISE_GLSL}
      void main() {
        vec2 p = vUv * vec2(${(o.width / o.height).toFixed(3)}, 1.0) * uScale;
        float n = fbm(vec3(p + vec2(uTime * uSpeed, 0.0), uTime * uSpeed * 0.7 + uSeed));
        float edge = smoothstep(0.0, 0.3, vUv.x) * smoothstep(1.0, 0.7, vUv.x) * smoothstep(0.0, 0.35, vUv.y) * smoothstep(1.0, 0.6, vUv.y);
        float a = smoothstep(0.3, 0.8, n) * edge * uOpacity;
        gl_FragColor = vec4(uColor, a);
      }
    `,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(o.width, o.height), mat);
  mesh.position.copy(o.position);
  if (o.flat) mesh.rotation.x = -Math.PI / 2;
  else mesh.lookAt(SHOT_EYE.x, o.position.y, SHOT_EYE.z);
  kit.add(mesh);
  return mesh;
}

export interface ShaftOptions {
  from: THREE.Vector3;
  to: THREE.Vector3;
  width: number;
  color: THREE.ColorRepresentation;
  opacity: number;
  /** How much wider the far end is than the near end. */
  spread?: number;
}

/**
 * A volumetric looking light shaft: a tapered additive quad between two
 * points, turned around its own axis to face the camera so it never shows
 * its edge.
 */
export function shaft(kit: Kit, o: ShaftOptions): THREE.Mesh {
  const axis = o.to.clone().sub(o.from);
  const len = axis.length();
  axis.normalize();
  const mid = o.from.clone().lerp(o.to, 0.5);
  const toEye = SHOT_EYE.clone().sub(mid);
  const n = toEye.sub(axis.clone().multiplyScalar(toEye.dot(axis))).normalize();
  const x = axis.clone().cross(n).normalize();
  const geo = new THREE.PlaneGeometry(1, 1, 1, 1);
  const spread = o.spread ?? 1.6;
  const p = geo.attributes.position;
  // Widen the far (bottom, v = 0) end so the beam fans out from its source.
  for (let i = 0; i < p.count; i++) p.setX(i, p.getX(i) * (p.getY(i) < 0 ? spread : 1));
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, fog: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
    uniforms: { uColor: { value: new THREE.Color(o.color) }, uOpacity: { value: o.opacity }, uTime: kit.time, uSeed: { value: Math.random() * 10 } },
    vertexShader: /* glsl */ `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor; uniform float uOpacity, uTime, uSeed;
      varying vec2 vUv;
      ${NOISE_GLSL}
      void main() {
        float across = 1.0 - abs(vUv.x - 0.5) * 2.0;
        float streak = 0.55 + 0.45 * vnoise(vec3(vUv.x * 9.0 + uSeed, uTime * 0.25, uSeed));
        float a = pow(across, 1.6) * streak * smoothstep(0.0, 0.45, vUv.y) * smoothstep(1.0, 0.85, vUv.y) * uOpacity;
        gl_FragColor = vec4(uColor * a, 1.0);
      }
    `,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.matrixAutoUpdate = false;
  mesh.matrix.makeBasis(x.multiplyScalar(o.width), axis.clone().multiplyScalar(-len), n).setPosition(mid);
  kit.add(mesh);
  return mesh;
}
