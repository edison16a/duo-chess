"use client";

import { useCallback, useEffect, useState } from "react";
import { SceneView } from "@/components/three/SceneView";
import { powerScene } from "@/three/scenes/powers";
import styles from "./powers.module.css";

/**
 * A power's scene playing live as a card's art: the same shot as its
 * rendered still and its hover preview, but drawn in real time at screen
 * resolution. The still stays underneath until the first frame is ready,
 * so the card never flashes empty.
 */
export default function LiveArt({ id }: { id: string }) {
  const [ready, setReady] = useState(false);
  // People who asked their system for less motion keep the still art.
  const [calm, setCalm] = useState(true);
  useEffect(() => setCalm(window.matchMedia("(prefers-reduced-motion: reduce)").matches), []);
  const load = useCallback(async () => powerScene(id), [id]);
  const onReady = useCallback(() => setReady(true), []);
  if (calm) return null;
  return (
    <span className={`${styles.live} ${ready ? styles.liveReady : ""}`} aria-hidden data-live-art={id}>
      <SceneView load={load} onReady={onReady} maxPixelRatio={1.5} optional />
    </span>
  );
}
