"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import styles from "./home.module.css";

/** three.js is heavy, so the live scene streams in after the page is interactive. */
const SceneView = dynamic(() => import("@/components/three/SceneView").then((m) => m.SceneView), { ssr: false });

/**
 * The 3D war behind the home screen. A rendered still shows instantly; the
 * live scene fades in over it once loaded. People who prefer reduced motion
 * only get the still.
 */
export function Battlefield() {
  const [live, setLive] = useState(false);
  const [ready, setReady] = useState(false);
  const load = useCallback(() => import("@/three/scenes/battlefield").then((m) => m.battlefield), []);

  useEffect(() => {
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (calm) return;
    const id = window.setTimeout(() => setLive(true), 250);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <div className={styles.battlefield} aria-hidden>
      <div className={styles.poster} />
      {live && (
        <div className={`${styles.live} ${ready ? styles.liveOn : ""}`}>
          <SceneView load={load} onReady={() => setReady(true)} />
        </div>
      )}
      <div className={styles.vignette} />
    </div>
  );
}
