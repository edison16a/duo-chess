import { POWERS, RARITY_COLOR, RARITY_LABEL } from "@/features/powers";
import { POWER_ICONS } from "@/features/powers/icons";
import { GlyphIcon } from "@/components/ui/icons";
import styles from "./powers.module.css";

interface Props {
  id: string;
  size?: "sm" | "md" | "lg";
  active?: boolean;
  disabled?: boolean;
  crossed?: boolean;
  tag?: string;
  onClick?: () => void;
}

/** A power as a card: icon, name, rarity and what it does. Chromatic cards cycle their hue. */
export function PowerCard({ id, size = "md", active, disabled, crossed, tag, onClick }: Props) {
  const def = POWERS[id];
  if (!def) return null;
  const classes = [styles.card, styles[size], styles[def.rarity], active && styles.active, crossed && styles.crossed].filter(Boolean).join(" ");
  return (
    <button type="button" className={classes} style={{ ["--rarity" as string]: RARITY_COLOR[def.rarity] }} disabled={disabled} onClick={onClick} data-power={id}>
      <span className={styles.icon}>
        <GlyphIcon size={size === "lg" ? 34 : size === "sm" ? 18 : 24}>{POWER_ICONS[id]}</GlyphIcon>
      </span>
      <span className={styles.text}>
        <span className={styles.title}>{def.name}</span>
        {size !== "sm" && (
          <span className={styles.rarity}>
            {RARITY_LABEL[def.rarity]}
            {!def.costsMove && <span className={styles.free}>Free</span>}
          </span>
        )}
        {size === "lg" && <span className={styles.blurb}>{def.blurb}</span>}
      </span>
      {tag && <span className={styles.tag}>{tag}</span>}
    </button>
  );
}
