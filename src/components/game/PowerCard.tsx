"use client";

import dynamic from "next/dynamic";
import { POWERS, RARITY_COLOR, RARITY_LABEL } from "@/features/powers";
import { POWER_ICONS } from "@/features/powers/icons";
import { GlyphIcon } from "@/components/ui/icons";
import { useHoverPreview } from "./useHoverPreview";
import styles from "./powers.module.css";

/** The live 3D preview pulls in three.js, so it only loads when someone actually hovers long enough. */
const PowerPreview = dynamic(() => import("./PowerPreview"), { ssr: false });

interface Props {
  id: string;
  size?: "sm" | "md" | "lg";
  active?: boolean;
  disabled?: boolean;
  crossed?: boolean;
  tag?: string;
  onClick?: () => void;
}

/**
 * A power as a card. Large cards are full bleed rendered art of the power in
 * action; compact cards keep a thumbnail. Hovering for a few seconds opens a
 * live 3D preview with how to use it.
 */
export function PowerCard({ id, size = "md", active, disabled, crossed, tag, onClick }: Props) {
  const def = POWERS[id];
  const hover = useHoverPreview();
  if (!def) return null;
  const classes = [styles.card, styles[size], styles[def.rarity], active && styles.active, crossed && styles.crossed].filter(Boolean).join(" ");
  const art = `/media/powers/${id}.webp`;
  return (
    <>
      <button
        ref={hover.ref}
        type="button"
        className={classes}
        style={{ ["--rarity" as string]: RARITY_COLOR[def.rarity], ["--art" as string]: `url(${art})` }}
        // aria-disabled instead of disabled so hover previews still work on locked cards.
        aria-disabled={disabled || undefined}
        onClick={disabled ? undefined : onClick}
        onPointerEnter={hover.enter}
        onPointerLeave={hover.leave}
        data-power={id}
      >
        {size !== "sm" && <span className={styles.art} aria-hidden />}
        <span className={styles.text}>
          <span className={styles.title}>
            <GlyphIcon size={size === "lg" ? 20 : 16}>{POWER_ICONS[id]}</GlyphIcon>
            {def.name}
          </span>
          {size !== "sm" && (
            <span className={styles.rarity}>
              {RARITY_LABEL[def.rarity]}
              {!def.costsMove && <span className={styles.free}>Free</span>}
            </span>
          )}
          {size === "lg" && <span className={styles.blurb}>{def.blurb}</span>}
        </span>
        {tag && <span className={styles.tag}>{tag}</span>}
        {hover.progress && <span className={styles.charge} aria-hidden />}
      </button>
      {hover.open && hover.rect && <PowerPreview id={id} anchor={hover.rect} onClose={hover.close} />}
    </>
  );
}
