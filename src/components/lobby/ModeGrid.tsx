import { MODES, type ModeId } from "@/features/modes";
import { GlyphIcon } from "@/components/ui/icons";
import { MODE_ICONS } from "./modeIcons";
import styles from "./lobby.module.css";

export function ModeGrid({ value, onChange, disabled }: { value: ModeId; onChange: (id: ModeId) => void; disabled: boolean }) {
  return (
    <div className={styles.modes}>
      {MODES.map((m) => (
        <button
          key={m.id}
          type="button"
          className={`${styles.mode} ${value === m.id ? styles.modeActive : ""}`}
          onClick={() => onChange(m.id)}
          disabled={disabled && value !== m.id}
          data-mode={m.id}
        >
          <span className={styles.modeIcon}><GlyphIcon size={22}>{MODE_ICONS[m.id]}</GlyphIcon></span>
          <span className={styles.modeName}>{m.name}</span>
          <span className={styles.modeBlurb}>{m.blurb}</span>
        </button>
      ))}
    </div>
  );
}
