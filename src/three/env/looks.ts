/** Lights, glows, materials and canvas textures the environments dress their sets with. */

import * as THREE from "three";
import { type Kit, v3 } from "./kit";
import { fbm3 } from "./noise";

/** Additive glow sprite for light sources: lava pools, cave mouths, crystals. */
export function glow(kit: Kit, map: THREE.Texture, color: THREE.ColorRepresentation, size: number, opacity: number, at: THREE.Vector3): THREE.Sprite {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map, color, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
  s.scale.setScalar(size);
  s.position.copy(at);
  kit.add(s);
  return s;
}

/** Point light helper: lights the hero and surroundings from inside the set. */
export function lamp(kit: Kit, color: THREE.ColorRepresentation, intensity: number, distance: number, at: THREE.Vector3, decay = 1.6): THREE.PointLight {
  const l = new THREE.PointLight(color, intensity, distance, decay);
  l.position.copy(at);
  kit.add(l);
  return l;
}

/**
 * Adds a fresnel glow to a lit material: edges seen at grazing angles light
 * up, which sells ice and crystal as translucent without paying for
 * transmission.
 */
export function rimGlow<T extends THREE.MeshStandardMaterial>(mat: T, color: THREE.ColorRepresentation, strength: number, power = 2.5, vertexGlow = 0): T {
  const uRim = { value: new THREE.Color(color).multiplyScalar(strength) };
  const uPow = { value: power };
  const uVGlow = { value: vertexGlow };
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uRim = uRim;
    shader.uniforms.uRimPow = uPow;
    shader.uniforms.uVGlow = uVGlow;
    // Vertex colours, when present, also glow: that is how thin ice and lava veins light up.
    shader.fragmentShader = "uniform vec3 uRim;\nuniform float uRimPow;\nuniform float uVGlow;\n" + shader.fragmentShader.replace(
      "#include <emissivemap_fragment>",
      `#include <emissivemap_fragment>
      totalEmissiveRadiance += uRim * pow(max(0.0, 1.0 - abs(dot(normal, normalize(vViewPosition)))), uRimPow);
      #ifdef USE_COLOR
      totalEmissiveRadiance += vColor.rgb * uVGlow;
      #endif`,
    );
  };
  mat.customProgramCacheKey = () => "rimGlow";
  return mat;
}

/** Canvas texture drawn once; the caller owns and disposes it. */
export function paint(kit: Kit, size: number, draw: (ctx: CanvasRenderingContext2D, size: number) => void, repeat = 1): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  draw(canvas.getContext("2d")!, size);
  const t = kit.own(new THREE.CanvasTexture(canvas));
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat, repeat);
  t.anisotropy = 4;
  return t;
}

/** Fills a canvas with tileable fractal noise mapped through a colour ramp. */
export function noiseFill(ctx: CanvasRenderingContext2D, size: number, ramp: (n: number, x: number, y: number) => [number, number, number], freq = 6, seed = 1): void {
  const img = ctx.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // Sampling a torus keeps the texture seamless when it repeats.
      const a = (x / size) * Math.PI * 2, b = (y / size) * Math.PI * 2;
      const k = freq / (Math.PI * 2);
      const n = fbm3(Math.cos(a) * k + seed, Math.sin(a) * k + Math.cos(b) * k, Math.sin(b) * k, 5) * 0.5 + 0.5;
      const [r, g, bl] = ramp(n, x, y);
      const i = (y * size + x) * 4;
      img.data[i] = r; img.data[i + 1] = g; img.data[i + 2] = bl; img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
}

/**
 * A soft spot light aimed at the hero. Environments dim the stage's global
 * key and light the subject with this instead, so the set can fall off into
 * darkness the way a lit film set does.
 */
export function spot(kit: Kit, color: THREE.ColorRepresentation, intensity: number, from: THREE.Vector3, angle = 0.4, shadow = true, to = v3(0, 0.5, 0)): THREE.SpotLight {
  const s = new THREE.SpotLight(color, intensity, 0, angle, 0.65, 2);
  s.position.copy(from);
  s.target.position.copy(to);
  s.castShadow = shadow;
  s.shadow.mapSize.set(1024, 1024);
  s.shadow.bias = -0.0005;
  s.shadow.normalBias = 0.02;
  kit.add(s);
  kit.add(s.target);
  return s;
}
