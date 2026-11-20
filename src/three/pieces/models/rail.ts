/** Rail: a little steam locomotive on a length of track, chimney forward. */

import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { ball, lathe, merge, onPedestal, place, type V3 } from "./shared";

function box(size: V3, at: V3, radius = 0.012): THREE.BufferGeometry {
  return new RoundedBoxGeometry(size[0], size[1], size[2], 1, Math.min(radius, Math.min(...size) / 2 - 0.001)).translate(...at);
}

/** A turned part laid along x, so lathe profiles can make boilers, buffers and lamps. */
function along(points: [number, number][], at: V3, segments = 24): THREE.BufferGeometry {
  return lathe(points, segments).rotateZ(-Math.PI / 2).translate(...at);
}

/** Spoked driving wheel facing along z: tyre, flange, hub and crank pin. */
function wheel(r: number, at: V3, side: number): THREE.BufferGeometry {
  const parts = [
    new THREE.CylinderGeometry(r, r, 0.035, 18).rotateX(Math.PI / 2),
    new THREE.TorusGeometry(r * 0.97, 0.008, 5, 18).translate(0, 0, side * 0.018),
    new THREE.CylinderGeometry(r * 0.3, r * 0.3, 0.05, 12).rotateX(Math.PI / 2),
    new THREE.CylinderGeometry(0.008, 0.008, 0.07, 6).rotateX(Math.PI / 2).translate(r * 0.55, 0, 0),
  ];
  return merge(parts).translate(...at);
}

export function rail(): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  // Track: two rails on three sleepers.
  for (const x of [-0.2, 0, 0.2]) parts.push(box([0.06, 0.022, 0.3], [x, 0.011, 0], 0.006));
  for (const z of [-0.1, 0.1]) parts.push(box([0.6, 0.026, 0.024], [0, 0.035, z], 0.006));
  // Wheels, coupling rods and the frame they hang from.
  const r = 0.07;
  for (const side of [1, -1]) {
    for (const x of [-0.13, 0.0, 0.13]) parts.push(wheel(r, [x, 0.048 + r, side * 0.1], side));
    parts.push(box([0.3, 0.014, 0.012], [0, 0.048 + r, side * 0.137], 0.005));
  }
  parts.push(box([0.5, 0.05, 0.2], [0.0, 0.16, 0], 0.012));
  parts.push(box([0.52, 0.018, 0.26], [0.0, 0.195, 0], 0.008));
  // Boiler with banded rings, smokebox and its round door.
  parts.push(along([[0, 0], [0.088, 0], [0.09, 0.3], [0, 0.3]], [-0.07, 0.29, 0], 28));
  for (const x of [-0.02, 0.07, 0.15]) parts.push(new THREE.TorusGeometry(0.09, 0.007, 6, 28).rotateY(Math.PI / 2).translate(x, 0.29, 0));
  parts.push(along([[0, 0], [0.097, 0], [0.1, 0.012], [0.1, 0.07], [0.09, 0.08], [0.06, 0.095], [0, 0.1]], [0.18, 0.29, 0], 28));
  parts.push(ball(0.016, [0.285, 0.29, 0], [8, 6]));
  // Flared chimney, steam dome and sand dome.
  parts.push(lathe([[0, 0], [0.034, 0], [0.032, 0.07], [0.05, 0.13], [0.056, 0.15], [0.05, 0.16], [0.03, 0.16], [0, 0.14]], 20).translate(0.2, 0.36, 0));
  parts.push(lathe([[0, 0], [0.05, 0], [0.05, 0.03], [0.04, 0.06], [0.0, 0.075]], 20).translate(0.06, 0.36, 0));
  parts.push(lathe([[0, 0], [0.035, 0], [0.035, 0.02], [0.025, 0.04], [0.0, 0.048]], 16).translate(-0.03, 0.365, 0));
  // Headlamp on the smokebox and a buffer beam with buffers.
  parts.push(along([[0, 0], [0.026, 0], [0.03, 0.04], [0.02, 0.05], [0, 0.05]], [0.2, 0.4, 0], 14).translate(0.03, 0, 0));
  parts.push(box([0.03, 0.05, 0.26], [0.265, 0.17, 0], 0.01));
  for (const z of [-0.08, 0.08]) parts.push(along([[0, 0], [0.016, 0], [0.016, 0.03], [0.026, 0.035], [0.026, 0.045], [0, 0.048]], [0.28, 0.175, z], 12));
  // Cowcatcher: a raked wedge below the buffer beam.
  const wedge = new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(0.075, 0), new THREE.Vector2(0, 0.08)]);
  parts.push(new THREE.ExtrudeGeometry(wedge, { depth: 0.2, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.008, bevelSegments: 2 }).translate(0.27, 0.06, -0.1));
  // Cab with a rounded roof and window frames.
  parts.push(box([0.17, 0.26, 0.22], [-0.17, 0.33, 0], 0.016));
  parts.push(place(lathe([[0, 0], [0.15, 0], [0.155, 0.01], [0.13, 0.03], [0, 0.04]], 20), [-0.17, 0.46, 0], [0, 0, 0], [1.25, 1, 1]));
  for (const side of [1, -1]) parts.push(new THREE.TorusGeometry(0.035, 0.008, 6, 4).rotateZ(Math.PI / 4).scale(1, 1.2, 1).translate(-0.17, 0.37, side * 0.112));
  parts.push(new THREE.TorusGeometry(0.03, 0.007, 6, 4).rotateZ(Math.PI / 4).rotateY(Math.PI / 2).translate(-0.083, 0.38, 0.05));
  parts.push(new THREE.TorusGeometry(0.03, 0.007, 6, 4).rotateZ(Math.PI / 4).rotateY(Math.PI / 2).translate(-0.083, 0.38, -0.05));
  // Scaled up a touch so the engine stands as tall as its neighbours.
  return onPedestal([merge(parts).scale(1.08, 1.12, 1.08)]);
}
