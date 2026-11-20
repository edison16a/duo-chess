"use client";

import { useCallback } from "react";
import { createPortal } from "react-dom";
import { POWERS, RARITY_COLOR, RARITY_LABEL } from "@/features/powers";
import { POWER_ICONS } from "@/features/powers/icons";
import { GlyphIcon } from "@/components/ui/icons";
import { SceneView } from "@/components/three/SceneView";
import { powerScene } from "@/three/scenes/powers";
import styles from "./powerPreview.module.css";

const WIDTH = 380;

/** Floating card with the power playing live in 3D and how to use it. */
export default function PowerPreview({ id, anchor, onClose }: { id: string; anchor: DOMRect; onClose: () => void }) {
  const def = POWERS[id];
  const load = useCallback(async () => powerScene(id), [id]);
  const left = Math.min(Math.max(12, anchor.left + anchor.width / 2 - WIDTH / 2), window.innerWidth - WIDTH - 12);
  const below = anchor.top < 420;
  const style = below ? { left, top: anchor.bottom + 10 } : { left, bottom: window.innerHeight - anchor.top + 10 };
  const steps = def.targets.map((t) => t.label);

  return createPortal(
    <div className={styles.pop} style={{ ...style, width: WIDTH, ["--rarity" as string]: RARITY_COLOR[def.rarity] }} onPointerLeave={onClose} role="dialog" aria-label={def.name} data-testid="power-preview">
      <div className={styles.stage}>
        <SceneView load={load} />
      </div>
      <div className={styles.body}>
        <div className={styles.head}>
          <GlyphIcon size={20}>{POWER_ICONS[id]}</GlyphIcon>
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
