"use client";

import type { Color } from "@/engine";
import { POWERS } from "@/features/powers";
import { Button } from "@/components/ui/Button";
import { PowerCard } from "./PowerCard";
import styles from "./powers.module.css";

interface Props {
  mine: string[];
  theirs: string[];
  canUse: boolean;
  aiming: { power: string; step: number } | null;
  onPick: (power: string) => void;
  onCancel: () => void;
  me: Color | null;
}

/** Your powers (clickable on your turn) and a compact row of what your opponent still holds. */
export function PowerBar({ mine, theirs, canUse, aiming, onPick, onCancel, me }: Props) {
  const aimDef = aiming ? POWERS[aiming.power] : null;
  return (
    <div className={styles.bar}>
      {aimDef ? (
        <div className={styles.aiming}>
          <span>{aimDef.targets[aiming!.step]?.label ?? "Pick a target"}</span>
          <Button size="sm" variant="ghost" icon="close" onClick={onCancel}>Cancel</Button>
        </div>
      ) : (
        me && <div className={styles.barTitle}>{canUse ? "Your powers" : "Your powers (on your turn)"}</div>
      )}
      <div className={styles.grid}>
        {mine.map((id, i) => (
          <PowerCard key={`${id}${i}`} id={id} active={aiming?.power === id} disabled={!canUse || (!!aiming && aiming.power !== id)} onClick={() => onPick(id)} />
        ))}
        {me && mine.length === 0 && <span className={styles.empty}>All used up</span>}
      </div>
      {theirs.length > 0 && (
        <>
          <div className={styles.barTitle}>{me ? "Opponent" : "Black"}</div>
          <div className={styles.grid}>
            {theirs.map((id, i) => <PowerCard key={`${id}${i}`} id={id} size="sm" disabled />)}
          </div>
        </>
      )}
    </div>
  );
}
