"use client";

import { ELO_PRESETS, ELO_STEP, MAX_ELO, MIN_ELO, botName, clampElo, levelLabel } from "@/features/bot";
import { Icon } from "@/components/ui/icons";
import styles from "./bot.module.css";

interface Props {
  elo: number;
  onChange: (elo: number) => void;
}

/** Sits where an online lobby shows the room code: who you play and how strong. */
export function BotPanel({ elo, onChange }: Props) {
  const value = clampElo(elo);
  const fill = ((value - MIN_ELO) / (MAX_ELO - MIN_ELO)) * 100;

  return (
    <div className={styles.card} data-testid="bot-panel">
      <span className={styles.label}>Opponent</span>
      <div className={styles.identity}>
        <span className={styles.avatar}><Icon name="bot" size={26} /></span>
        <div className={styles.names}>
          <span className={styles.name} data-testid="bot-name">{botName(value)}</span>
          <span className={styles.level}>{levelLabel(value)}</span>
        </div>
      </div>
      <input
        type="range"
        className={styles.slider}
        min={MIN_ELO}
        max={MAX_ELO}
        step={ELO_STEP}
        value={value}
        onChange={(e) => onChange(clampElo(Number(e.target.value)))}
        style={{ ["--fill" as string]: `${fill}%` }}
        aria-label="Bot rating"
        data-testid="bot-elo"
      />
      <div className={styles.range}><span>{MIN_ELO}</span><span>{MAX_ELO}</span></div>
      <div className={styles.presets}>
        {ELO_PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            className={p.elo === value ? styles.presetActive : ""}
            onClick={() => onChange(p.elo)}
          >
            <strong>{p.elo}</strong>
            <span>{p.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
