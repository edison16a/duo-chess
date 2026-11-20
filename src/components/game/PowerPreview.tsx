"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { POWERS, RARITY_COLOR, RARITY_LABEL } from "@/features/powers";
import { POWER_ICONS } from "@/features/powers/icons";
import { GlyphIcon } from "@/components/ui/icons";
import { SceneView } from "@/components/three/SceneView";
import { powerScene } from "@/three/scenes/powers";
import styles from "./powerPreview.module.css";

/** Gap between the card and the popup, and the minimum margin to the window edge. */
const GAP = 12;

/**
 * Where the popup goes: to the right of the card, or to its left when the
 * right side has no room (the power bar sits on the right edge in game).
 * Vertically centered on the card but kept inside the window.
 */
function place(anchor: DOMRect, width: number, height: number) {
  const right = anchor.right + GAP;
  const left = right + width <= window.innerWidth - GAP ? right : Math.max(GAP, anchor.left - GAP - width);
  const ideal = anchor.top + anchor.height / 2 - height / 2;
  const top = Math.min(Math.max(GAP, ideal), window.innerHeight - height - GAP);
  return { left, top, side: left === right ? "right" : "left" };
}

/**
 * Small popup beside a power card with the power playing live in 3D and how
 * to use it. It ignores the pointer, so the hover stays on the card and
 * moving off the card closes it.
 */
export default function PowerPreview({ id, anchor }: { id: string; anchor: DOMRect; onClose: () => void }) {
  const def = POWERS[id];
  const load = useCallback(async () => powerScene(id), [id]);
  const ref = useRef<HTMLDivElement>(null);
  const [spot, setSpot] = useState<ReturnType<typeof place> | null>(null);
  const steps = def.targets.map((t) => t.label);

  // Measured before paint so the popup never flashes in the wrong place.
  useLayoutEffect(() => {
    const el = ref.current;
    if (el) setSpot(place(anchor, el.offsetWidth, el.offsetHeight));
  }, [anchor]);

  return createPortal(
    <div
      ref={ref}
      className={`${styles.pop} ${spot?.side === "left" ? styles.fromLeft : ""}`}
      style={{ ["--rarity" as string]: RARITY_COLOR[def.rarity], left: spot?.left ?? -9999, top: spot?.top ?? 0, visibility: spot ? "visible" : "hidden" }}
      role="tooltip"
      aria-label={def.name}
      data-testid="power-preview"
    >
      <div className={styles.stage}>
        <SceneView load={load} />
      </div>
      <div className={styles.body}>
        <div className={styles.head}>
          <GlyphIcon size={16}>{POWER_ICONS[id]}</GlyphIcon>
          <span className={styles.name}>{def.name}</span>
          <span className={styles.rarity}>{RARITY_LABEL[def.rarity]}</span>
        </div>
        <p className={styles.blurb}>{def.blurb}</p>
        <ol className={styles.steps}>
          <li>Click the card on your turn.</li>
          {steps.map((s) => <li key={s}>{s}.</li>)}
          <li>{def.costsMove ? "It uses your move for the turn." : "It is free, so you still move after."}</li>
        </ol>
      </div>
    </div>,
    document.body,
  );
}
