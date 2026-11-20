/** A proper round rubber duck built from primitives; flat extrusion would look wrong for it. */

import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { materials } from "../core/materials";

export function createDuck(): THREE.Group {
  const m = materials();
  const group = new THREE.Group();
  const body = new THREE.SphereGeometry(0.3, 40, 28);
  body.scale(1.2, 0.72, 0.92);
  body.translate(0.04, 0.22, 0);
  const tail = new THREE.ConeGeometry(0.1, 0.22, 20);
  tail.rotateZ(-Math.PI / 2.6);
  tail.translate(0.36, 0.36, 0);
  const head = new THREE.SphereGeometry(0.17, 36, 24);
  head.translate(-0.17, 0.56, 0);
  const yellow = new THREE.Mesh(mergeGeometries([body, tail, head])!, m.neutral);
  const beak = new THREE.Mesh(new THREE.SphereGeometry(0.085, 24, 16), m.beak);
  beak.scale.set(1.5, 0.55, 1);
  beak.position.set(-0.33, 0.52, 0);
  group.add(yellow, beak);
  for (const z of [-0.09, 0.09]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.026, 12, 10), m.eye);
    eye.position.set(-0.28, 0.61, z);
    group.add(eye);
  }
  group.traverse((o) => { if ((o as THREE.Mesh).isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return group;
}
