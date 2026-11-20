/** Shared materials so hundreds of pieces cost a handful of shader programs. */

import * as THREE from "three";

let cached: Record<string, THREE.Material> | null = null;

function build(): Record<string, THREE.Material> {
  return {
    white: new THREE.MeshPhysicalMaterial({ color: 0xe9dfcd, roughness: 0.38, clearcoat: 0.45, clearcoatRoughness: 0.3 }),
    black: new THREE.MeshPhysicalMaterial({ color: 0x141211, roughness: 0.42, clearcoat: 0.55, clearcoatRoughness: 0.25 }),
    neutral: new THREE.MeshPhysicalMaterial({ color: 0xf5c542, roughness: 0.35, clearcoat: 0.8 }),
    beak: new THREE.MeshStandardMaterial({ color: 0xe8833a, roughness: 0.45 }),
    eye: new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.2 }),
    felt: new THREE.MeshStandardMaterial({ color: 0x2f4a36, roughness: 0.95 }),
    ice: new THREE.MeshPhysicalMaterial({
      color: 0xbfe8ff, roughness: 0.08, metalness: 0, transmission: 0.92, thickness: 0.5, ior: 1.31,
      transparent: true, opacity: 0.92, clearcoat: 1, emissive: 0x4aa8e0, emissiveIntensity: 0.12,
    }),
  };
}

export function materials(): Record<string, THREE.Material> {
  return (cached ??= build());
}

export function pieceMaterial(color: "w" | "b" | "n"): THREE.Material {
  const m = materials();
  return color === "w" ? m.white : color === "b" ? m.black : m.neutral;
}
