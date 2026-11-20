/**
 * A giant chessboard of weathered stone slabs set into the grass, with a few
 * tilted, sunken or missing tiles so it reads as an old battleground.
 */

import * as THREE from "three";

export function createPlaza(width: number, height: number, tile = 1.05): THREE.Group {
  const group = new THREE.Group();
  const geo = new THREE.BoxGeometry(tile * 0.96, 0.18, tile * 0.96);
  const light = new THREE.MeshStandardMaterial({ color: 0xcfc5b0, roughness: 0.85 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x5a4c3e, roughness: 0.9 });
  const lights = new THREE.InstancedMesh(geo, light, width * height);
  const darks = new THREE.InstancedMesh(geo, dark, width * height);
  let li = 0, di = 0;
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  let seed = 11;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (rand() < 0.04) continue;
      e.set((rand() - 0.5) * 0.06, (rand() - 0.5) * 0.05, (rand() - 0.5) * 0.06);
      q.setFromEuler(e);
      const p = new THREE.Vector3((x - (width - 1) / 2) * tile, -0.07 + (rand() - 0.5) * 0.05, (y - (height - 1) / 2) * tile);
      m.compose(p, q, new THREE.Vector3(1, 1, 1));
      if ((x + y) % 2) lights.setMatrixAt(li++, m);
      else darks.setMatrixAt(di++, m);
    }
  }
  lights.count = li;
  darks.count = di;
  for (const mesh of [lights, darks]) { mesh.receiveShadow = true; mesh.castShadow = true; group.add(mesh); }
  return group;
}
