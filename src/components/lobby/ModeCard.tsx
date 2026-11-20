"use client";

import type { ModeDef } from "@/features/modes";
import { GlyphIcon } from "@/components/ui/icons";
import { MODE_ICONS } from "./modeIcons";
import styles from "./modeCard.module.css";

interface Props {
  mode: ModeDef;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  /** Library cards show the full how to play text under the name. */
  detailed?: boolean;
}

/**
 * A mode as a little movie: a rendered 3D loop of the mode in action with
 * its name laid over the bottom. The poster shows instantly; the clip
 * streams in behind it.
 */
export function ModeCard({ mode, active, disabled, onClick, detailed }: Props) {
  return (
    <button type="button" className={`${styles.card} ${active ? styles.active : ""}`} onClick={onClick} disabled={disabled} data-mode={mode.id}>
      <video
        className={styles.media}
        src={`/media/modes/${mode.id}.webm`}
        poster={`/media/modes/${mode.id}.webp`}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-hidden
      />
      <span className={styles.shade} />
      <span className={styles.meta}>
        <span className={styles.title}>
          <GlyphIcon size={18}>{MODE_ICONS[mode.id]}</GlyphIcon>
          {mode.name}
        </span>
        <span className={styles.blurb}>{detailed ? mode.howTo.join(" ") : mode.blurb}</span>
      </span>
      {active && <span className={styles.check} aria-hidden />}
    </button>
  );
}
