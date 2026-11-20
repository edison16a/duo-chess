/** Materials for the few parts that are not in the piece colour. Created once, on first use. */

import * as THREE from "three";

let spark: THREE.Material | null = null;

/** Hot glowing fuse spark; bright enough for the bloom pass to pick up. */
export function sparkMaterial(): THREE.Material {
  return (spark ??= new THREE.MeshStandardMaterial({ color: 0xffd27a, emissive: 0xff8a1c, emissiveIntensity: 2.6, roughness: 0.4 }));
}
