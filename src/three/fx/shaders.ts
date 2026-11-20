/** Custom materials for effects that sprites cannot do well: shields, beams, portals and rings. */

import * as THREE from "three";

/** Hex grid energy shield with a bright fresnel rim. */
export function shieldMaterial(color: THREE.ColorRepresentation): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color(color) }, uTime: { value: 0 }, uAlpha: { value: 1 } },
    vertexShader: /* glsl */ `
      varying vec3 vNormal; varying vec3 vView; varying vec2 vUv;
      void main() {
        vUv = uv;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vNormal = normalize(normalMatrix * normal);
        vView = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor; uniform float uTime; uniform float uAlpha;
      varying vec3 vNormal; varying vec3 vView; varying vec2 vUv;
      float hex(vec2 p) {
        p.x *= 1.1547; p.y += mod(floor(p.x), 2.0) * 0.5;
        p = abs(fract(p) - 0.5);
        return abs(max(p.x * 1.5 + p.y, p.y * 2.0) - 1.0);
      }
      void main() {
        float rim = pow(1.0 - abs(dot(vNormal, vView)), 2.2);
        float grid = smoothstep(0.08, 0.0, hex(vUv * vec2(18.0, 9.0)));
        float sweep = smoothstep(0.0, 0.25, sin(vUv.y * 12.0 - uTime * 3.0) * 0.5 + 0.25);
        float a = (rim * 0.9 + grid * (0.25 + 0.35 * sweep)) * uAlpha;
        gl_FragColor = vec4(uColor * (1.2 + rim), a);
      }`,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  });
}

/** Vertical beam that fades toward the top and flickers along its length. */
export function beamMaterial(color: THREE.ColorRepresentation): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color(color) }, uTime: { value: 0 }, uAlpha: { value: 1 } },
    vertexShader: /* glsl */ `
      varying vec2 vUv; varying vec3 vNormal; varying vec3 vView;
      void main() {
        vUv = uv;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vNormal = normalize(normalMatrix * normal); vView = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor; uniform float uTime; uniform float uAlpha;
      varying vec2 vUv; varying vec3 vNormal; varying vec3 vView;
      void main() {
        float core = pow(abs(dot(vNormal, vView)), 1.6);
        float fade = smoothstep(1.0, 0.25, vUv.y) * smoothstep(0.0, 0.05, vUv.y);
        float flicker = 0.75 + 0.25 * sin(vUv.y * 40.0 - uTime * 18.0);
        gl_FragColor = vec4(uColor * 1.3, core * fade * flicker * uAlpha * 0.8);
      }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
}

/** Spiral vortex disc for portals and black holes. `dark` flips it to an absorbing look. */
export function vortexMaterial(color: THREE.ColorRepresentation, dark = false): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color(color) }, uTime: { value: 0 }, uAlpha: { value: 1 } },
    vertexShader: /* glsl */ `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor; uniform float uTime; uniform float uAlpha;
      varying vec2 vUv;
      void main() {
        vec2 p = vUv - 0.5;
        float r = length(p) * 2.0;
        float a = atan(p.y, p.x);
        float arms = sin(a * 4.0 + log(r + 0.001) * 6.0 - uTime * 4.0);
        float ring = smoothstep(1.0, 0.75, r) * smoothstep(0.0, 0.35, r);
        float glow = smoothstep(0.1, 1.0, arms * 0.5 + 0.5) * ring;
        float center = smoothstep(0.45, 0.0, r);
        vec3 col = uColor * (glow * 2.2 + 0.4);
        float alpha = (glow + ring * 0.45) * uAlpha;
        ${"/* dark variant draws an inky core that eats light */"}
        if (${dark ? "true" : "false"}) { col = mix(col, vec3(0.0), center); alpha = max(alpha, center * uAlpha); }
        else { col += uColor * center * 1.2; alpha = max(alpha, center * 0.6 * uAlpha); }
        gl_FragColor = vec4(col, alpha);
      }`,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: dark ? THREE.NormalBlending : THREE.AdditiveBlending,
  });
}
