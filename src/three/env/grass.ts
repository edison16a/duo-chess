/**
 * A field of individual grass blades drawn in one instanced draw call. The
 * vertex shader bends each blade in the wind and the fragment shader shades
 * it from dark roots to sunlit tips, with fog so the field fades into haze.
 */

import * as THREE from "three";

const vertex = /* glsl */ `
  #include <common>
  #include <fog_pars_vertex>
  uniform float uTime;
  attribute float aShade;
  varying float vHeight;
  varying float vShade;
  void main() {
    vHeight = position.y;
    vShade = aShade;
    vec4 world = modelMatrix * instanceMatrix * vec4(position, 1.0);
    // Wind: a slow rolling wave plus quick flutter, stronger toward the tip.
    float wave = sin(world.x * 0.35 + uTime * 1.3) * 0.5 + sin(world.z * 0.6 + uTime * 2.1) * 0.25;
    float bend = position.y * position.y;
    world.x += wave * 0.32 * bend;
    world.z += wave * 0.12 * bend;
    vec4 mvPosition = viewMatrix * world;
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }
`;

const fragment = /* glsl */ `
  #include <common>
  #include <fog_pars_fragment>
  uniform vec3 uRoot;
  uniform vec3 uTip;
  uniform vec3 uSun;
  varying float vHeight;
  varying float vShade;
  void main() {
    vec3 col = mix(uRoot, uTip, smoothstep(0.0, 1.0, vHeight));
    col *= 0.8 + vShade * 0.4;
    col += uSun * pow(vHeight, 3.0) * 0.35;
    gl_FragColor = vec4(col, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    #include <fog_fragment>
  }
`;

export interface GrassOptions {
  count: number;
  /** Half size of the square patch the blades cover. */
  extent: number;
  /** Keep this rectangle clear (for the board); [minX, maxX, minZ, maxZ]. */
  clear?: [number, number, number, number];
  height?: (x: number, z: number) => number;
}

export function createGrass(o: GrassOptions): { mesh: THREE.InstancedMesh; update: (t: number) => void } {
  // Tapered blade: five segments up a slightly curved strip.
  const blade = new THREE.PlaneGeometry(0.06, 1, 1, 5);
  blade.translate(0, 0.5, 0);
  const pos = blade.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    pos.setX(i, pos.getX(i) * (1 - y * 0.92));
    pos.setZ(i, y * y * 0.12);
  }
  const material = new THREE.ShaderMaterial({
    vertexShader: vertex,
    fragmentShader: fragment,
    side: THREE.DoubleSide,
    fog: true,
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {
      uTime: { value: 0 },
      uRoot: { value: new THREE.Color(0x1d3a12) },
      uTip: { value: new THREE.Color(0x8fbf4a) },
      uSun: { value: new THREE.Color(0xffc27a) },
    }]),
  });
  const mesh = new THREE.InstancedMesh(blade, material, o.count);
  const shade = new Float32Array(o.count);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3();
  let placed = 0;
  while (placed < o.count) {
    const x = (Math.random() * 2 - 1) * o.extent;
    const z = (Math.random() * 2 - 1) * o.extent;
    if (o.clear && x > o.clear[0] && x < o.clear[1] && z > o.clear[2] && z < o.clear[3]) continue;
    p.set(x, o.height?.(x, z) ?? 0, z);
    q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.random() * Math.PI);
    const h = 0.25 + Math.random() * 0.45;
    s.set(1 + Math.random(), h, 1);
    mesh.setMatrixAt(placed, m.compose(p, q, s));
    shade[placed] = Math.random();
    placed++;
  }
  blade.setAttribute("aShade", new THREE.InstancedBufferAttribute(shade, 1));
  mesh.frustumCulled = false;
  return { mesh, update: (t) => { material.uniforms.uTime.value = t; } };
}
