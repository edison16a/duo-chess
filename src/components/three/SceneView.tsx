"use client";

/**
 * Hosts one SceneDef in a canvas. In live mode it runs on the animation
 * clock; in capture mode it exposes window.__renderAt(t) so the media
 * script can step exact frames.
 */

import { useEffect, useRef } from "react";
import { createStage } from "@/three/core/stage";
import type { SceneDef } from "@/three/scenes/types";

interface Props {
  load: () => Promise<SceneDef>;
  capture?: boolean;
  className?: string;
  onReady?: () => void;
}

declare global {
  interface Window {
    __renderAt?: (t: number) => void;
    __sceneReady?: boolean;
    __posterAt?: number;
  }
}

export function SceneView({ load, capture = false, className, onReady }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let disposed = false;
    let frame = 0;
    const canvas = ref.current!;
    let cleanup: (() => void) | null = null;

    (async () => {
      const def = await load();
      if (disposed) return;
      const stage = createStage({ canvas, bloom: def.bloom ?? 0.35, pixelRatio: capture ? 1 : undefined });
      const fit = () => stage.resize(canvas.clientWidth, canvas.clientHeight);
      fit();
      const instance = await def.setup(stage);
      if (disposed) { stage.dispose(); return; }
      const observer = new ResizeObserver(fit);
      observer.observe(canvas);
      let last = 0;
      const renderAt = (t: number) => {
        instance.update(t, Math.min(0.05, Math.max(0, t - last)));
        last = t;
        stage.render();
      };
      if (capture) {
        window.__renderAt = renderAt;
        window.__posterAt = def.poster;
        renderAt(0);
        window.__sceneReady = true;
      } else {
        const start = performance.now();
        const loop = () => {
          renderAt((performance.now() - start) / 1000);
          frame = requestAnimationFrame(loop);
        };
        loop();
      }
      onReady?.();
      cleanup = () => {
        observer.disconnect();
        instance.dispose?.();
        stage.dispose();
      };
    })();

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      cleanup?.();
    };
  }, [load, capture, onReady]);

  return <canvas ref={ref} className={className} style={{ width: "100%", height: "100%", display: "block" }} />;
}
