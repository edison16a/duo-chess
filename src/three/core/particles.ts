/**
 * A small CPU particle system drawn as one THREE.Points object. Every
 * effect (fire, sparks, snow, smoke, dust) is a configured instance of it,
 * which keeps draw calls low even when several effects overlap.
 */

import * as THREE from "three";

export interface EmitOptions {
  count: number;
  position: THREE.Vector3;
  /** Random offset added to the spawn position on each axis. */
  spread?: THREE.Vector3;
  velocity?: THREE.Vector3;
  /** Random velocity added on each axis (symmetric). */
  velocityJitter?: THREE.Vector3;
  /** Push particles outward from the spawn point at this speed. */
  radial?: number;
  life: [number, number];
  size: [number, number];
  colors: THREE.ColorRepresentation[];
}

export interface ParticleConfig {
  capacity: number;
  texture: THREE.Texture;
  blending?: THREE.Blending;
  gravity?: number;
  drag?: number;
  /** Size multiplier at end of life relative to start. */
  grow?: number;
  /** Pixels per world unit at distance 1 (perspective) or zoom (ortho). */
  scale?: number;
}

const vertex = /* glsl */ `
  attribute float aSize;
  attribute vec4 aColor;
  uniform float uScale;
  uniform float uOrtho;
  varying vec4 vColor;
  void main() {
    vColor = aColor;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aSize * uScale / mix(-mv.z, 1.0, uOrtho);
  }
`;

const fragment = /* glsl */ `
  uniform sampler2D uMap;
  varying vec4 vColor;
  void main() {
    vec4 tex = texture2D(uMap, gl_PointCoord);
    gl_FragColor = vec4(vColor.rgb * tex.rgb, vColor.a * tex.a);
    if (gl_FragColor.a < 0.004) discard;
  }
`;

export class Particles {
  readonly points: THREE.Points;
  private pos: Float32Array;
  private vel: Float32Array;
  private life: Float32Array;
  private maxLife: Float32Array;
  private size0: Float32Array;
  private sizes: Float32Array;
  private rgba: Float32Array;
  private base: Float32Array;
  private cursor = 0;
  private material: THREE.ShaderMaterial;

  constructor(private cfg: ParticleConfig) {
    const n = cfg.capacity;
    this.pos = new Float32Array(n * 3);
    this.vel = new Float32Array(n * 3);
    this.life = new Float32Array(n);
    this.maxLife = new Float32Array(n);
    this.size0 = new Float32Array(n);
    this.sizes = new Float32Array(n);
    this.rgba = new Float32Array(n * 4);
    this.base = new Float32Array(n * 3);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(this.pos, 3));
    geo.setAttribute("aSize", new THREE.BufferAttribute(this.sizes, 1));
    geo.setAttribute("aColor", new THREE.BufferAttribute(this.rgba, 4));
    this.material = new THREE.ShaderMaterial({
      vertexShader: vertex,
      fragmentShader: fragment,
      uniforms: { uMap: { value: cfg.texture }, uScale: { value: cfg.scale ?? 300 }, uOrtho: { value: 0 } },
      transparent: true,
      depthWrite: false,
      blending: cfg.blending ?? THREE.AdditiveBlending,
    });
    this.points = new THREE.Points(geo, this.material);
    this.points.frustumCulled = false;
  }

  /** Orthographic cameras do not shrink with distance, so the shader needs to know. */
  setCamera(camera: THREE.Camera, pixelsPerUnit: number): void {
    const ortho = (camera as THREE.OrthographicCamera).isOrthographicCamera;
    this.material.uniforms.uOrtho.value = ortho ? 1 : 0;
    this.material.uniforms.uScale.value = pixelsPerUnit;
  }

  emit(o: EmitOptions): void {
    const colors = o.colors.map((c) => new THREE.Color(c));
    for (let k = 0; k < o.count; k++) {
      const i = this.cursor;
      this.cursor = (this.cursor + 1) % this.cfg.capacity;
      const s = o.spread ?? new THREE.Vector3();
      const px = o.position.x + (Math.random() - 0.5) * 2 * s.x;
      const py = o.position.y + (Math.random() - 0.5) * 2 * s.y;
      const pz = o.position.z + (Math.random() - 0.5) * 2 * s.z;
      this.pos.set([px, py, pz], i * 3);
      const j = o.velocityJitter ?? new THREE.Vector3();
      const v = o.velocity ?? new THREE.Vector3();
      let vx = v.x + (Math.random() - 0.5) * 2 * j.x;
      let vy = v.y + (Math.random() - 0.5) * 2 * j.y;
      let vz = v.z + (Math.random() - 0.5) * 2 * j.z;
      if (o.radial) {
        const dir = new THREE.Vector3(px - o.position.x, py - o.position.y, pz - o.position.z);
        if (dir.lengthSq() < 1e-6) dir.randomDirection();
        dir.normalize().multiplyScalar(o.radial * (0.5 + Math.random()));
        vx += dir.x; vy += dir.y; vz += dir.z;
      }
      this.vel.set([vx, vy, vz], i * 3);
      const life = o.life[0] + Math.random() * (o.life[1] - o.life[0]);
      this.life[i] = life;
      this.maxLife[i] = life;
      this.size0[i] = o.size[0] + Math.random() * (o.size[1] - o.size[0]);
      const c = colors[Math.floor(Math.random() * colors.length)];
      this.base.set([c.r, c.g, c.b], i * 3);
    }
  }

  /** Steps the simulation. Returns how many particles are still alive. */
  update(dt: number): number {
    const g = this.cfg.gravity ?? 0;
    const drag = Math.exp(-(this.cfg.drag ?? 0) * dt);
    const grow = this.cfg.grow ?? 1;
    let alive = 0;
    for (let i = 0; i < this.cfg.capacity; i++) {
      if (this.life[i] <= 0) { this.rgba[i * 4 + 3] = 0; this.sizes[i] = 0; continue; }
      alive++;
      this.life[i] -= dt;
      const t = 1 - Math.max(0, this.life[i]) / this.maxLife[i];
      this.vel[i * 3 + 1] -= g * dt;
      for (let a = 0; a < 3; a++) {
        this.vel[i * 3 + a] *= drag;
        this.pos[i * 3 + a] += this.vel[i * 3 + a] * dt;
      }
      this.sizes[i] = this.size0[i] * (1 + (grow - 1) * t);
      const fade = t < 0.1 ? t / 0.1 : 1 - (t - 0.1) / 0.9;
      this.rgba.set([this.base[i * 3], this.base[i * 3 + 1], this.base[i * 3 + 2], Math.max(0, fade)], i * 4);
    }
    const geo = this.points.geometry;
    geo.attributes.position.needsUpdate = true;
    geo.attributes.aSize.needsUpdate = true;
    geo.attributes.aColor.needsUpdate = true;
    return alive;
  }

  dispose(): void {
    this.points.geometry.dispose();
    this.material.dispose();
  }
}
