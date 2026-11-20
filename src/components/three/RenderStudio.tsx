"use client";

import { useCallback } from "react";
import { SCENES } from "@/three/scenes/registry";
import { SceneView } from "./SceneView";

export function RenderStudio({ scene, capture }: { scene: string; capture: boolean }) {
  const load = useCallback(() => (SCENES[scene] ?? SCENES.showcase)(), [scene]);
  return (
    <div style={{ position: "fixed", inset: 0, background: "#0f1012" }}>
      <SceneView load={load} capture={capture} />
    </div>
  );
}
