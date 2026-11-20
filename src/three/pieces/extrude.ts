/**
 * Turns the 2D piece art into 3D. We load the white SVG for a piece, keep
 * its filled silhouette and extrude it with a bevel. Knights and every
 * fairy piece use this, so the 3D set matches the 2D art people know.
 */

import * as THREE from "three";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

const cache = new Map<string, Promise<THREE.BufferGeometry>>();

function isLightFill(fill: string | undefined): boolean {
  if (!fill) return false;
  const f = fill.toLowerCase().replace(/\s/g, "");
  return f === "#fff" || f === "#ffffff" || f === "white" || f === "rgb(255,255,255)" || f === "#f5c542";
}

async function build(url: string, height: number, depth: number): Promise<THREE.BufferGeometry> {
  const data = await new SVGLoader().loadAsync(url);
  const parts: THREE.BufferGeometry[] = [];
  for (const path of data.paths) {
    const style = path.userData?.style as { fill?: string } | undefined;
    if (!isLightFill(style?.fill)) continue;
    for (const shape of SVGLoader.createShapes(path)) {
      const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: 1.6, bevelSize: 0.9, bevelSegments: 5, curveSegments: 14 });
      parts.push(geo.toNonIndexed());
    }
  }
  if (!parts.length) throw new Error(`No silhouette in ${url}`);
  const merged = mergeGeometries(parts.map((p) => { p.deleteAttribute("uv"); return p; }))!;
  // SVG space is 45 units, y pointing down. Flip, centre and scale to board units.
  merged.computeBoundingBox();
  const box = merged.boundingBox!;
  merged.translate(-(box.min.x + box.max.x) / 2, -box.max.y, -(box.min.z + box.max.z) / 2);
  merged.scale(1, -1, 1);
  const s = height / (box.max.y - box.min.y);
  merged.scale(s, s, s);
  merged.computeVertexNormals();
  return merged;
}

/** Extruded silhouette of `/pieces/w-<kind>.svg`, standing on y = 0. */
export function extrudedSilhouette(kind: string, height = 0.95, depth = 7): Promise<THREE.BufferGeometry> {
  const url = kind === "duck" ? "/pieces/duck.svg" : `/pieces/w-${kind}.svg`;
  const key = `${url}:${height}:${depth}`;
  if (!cache.has(key)) cache.set(key, build(url, height, depth));
  return cache.get(key)!;
}
