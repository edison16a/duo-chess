import { CLOCK_PRESETS, MODE_BY_ID, MOVE_TIMER_PRESETS, type GameConfig, type Mods } from "@/features/modes";
import { DRAFT_STYLES } from "@/features/powers/draft";
import { Segmented, Toggle } from "@/components/ui/Controls";
import { Icon, type IconName } from "@/components/ui/icons";
import styles from "./lobby.module.css";

interface Props {
  config: GameConfig;
  disabled: boolean;
  onChange: (patch: Partial<GameConfig>) => void;
}

function Row({ icon, label, children }: { icon: IconName; label: string; children: React.ReactNode }) {
  return (
    <div className={styles.modRow}>
      <span className={styles.modLabel}><Icon name={icon} size={16} />{label}</span>
      {children}
    </div>
  );
}

export function ModsPanel({ config, disabled, onChange }: Props) {
  const mods = config.mods;
  const set = (patch: Partial<Mods>) => onChange({ mods: { ...mods, ...patch } });
  const mode = MODE_BY_ID[config.mode];
  return (
    <div className={styles.mods}>
      <Row icon="clock" label="Time">
        <Segmented options={CLOCK_PRESETS} value={mods.clock} onChange={(clock) => set({ clock })} disabled={disabled} />
      </Row>
      {!mode.moveTimer && (
        <Row icon="timer" label="Per move">
          <Segmented
            options={MOVE_TIMER_PRESETS.map((s) => ({ label: s === 0 ? "Off" : `${s}s`, value: s }))}
            value={mods.moveTimer}
            onChange={(moveTimer) => set({ moveTimer })}
            disabled={disabled}
          />
        </Row>
      )}
      <Row icon="cube" label="Board">
        <Segmented
          options={[{ label: "2D", value: "2d" as const }, { label: "3D", value: "3d" as const }]}
          value={mods.view ?? "2d"}
          onChange={(view) => set({ view })}
          disabled={disabled}
          testId="board-view"
        />
      </Row>
      <Row icon="crown" label="Host plays">
        <Segmented
          options={[{ label: "White", value: "w" as const }, { label: "Black", value: "b" as const }, { label: "Random", value: "random" as const }]}
          value={config.hostColor}
          onChange={(hostColor) => onChange({ hostColor })}
          disabled={disabled}
          testId="host-color"
        />
      </Row>
      {mode.powers && (
        <>
          <Row icon="sparkle" label="Draft">
            <Segmented
              options={DRAFT_STYLES.map((s) => ({ label: s.label, value: s.id }))}
              value={config.draftStyle ?? "split"}
              onChange={(draftStyle) => onChange({ draftStyle })}
              disabled={disabled}
              testId="draft-style"
            />
          </Row>
          <Row icon="sparkle" label="Powers each">
            <Segmented
              options={[2, 4, 6, 8].map((n) => ({ label: `${n}`, value: n }))}
              value={config.powersEach ?? 4}
              onChange={(powersEach) => onChange({ powersEach })}
              disabled={disabled}
            />
          </Row>
        </>
      )}
      <div className={styles.toggles}>
        <label className={styles.toggleRow}>
          <span><Icon name="sparkle" size={16} />Show ratings</span>
          <Toggle label="Show ratings" checked={mods.ratings} onChange={(ratings) => set({ ratings })} disabled={disabled} />
        </label>
        <label className={styles.toggleRow}>
          <span><Icon name="chart" size={16} />Eval bar</span>
          <Toggle label="Eval bar" checked={mods.evalBar} onChange={(evalBar) => set({ evalBar })} disabled={disabled} />
        </label>
        <label className={styles.toggleRow}>
          <span><Icon name="eyeOff" size={16} />Blindfold</span>
          <Toggle label="Blindfold" checked={mods.blindfold} onChange={(blindfold) => set({ blindfold })} disabled={disabled} />
        </label>
      </div>
    </div>
  );
}
