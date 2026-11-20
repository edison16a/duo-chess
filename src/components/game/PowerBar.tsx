"use client";

import type { Color } from "@/engine";
import { POWERS, type SlotView } from "@/features/powers";
import { Button } from "@/components/ui/Button";
import { PowerCard } from "./PowerCard";
import styles from "./powers.module.css";
import cooldown from "./cooldown.module.css";

interface Props {
  mine: SlotView[];
  theirs: SlotView[];
  canUse: boolean;
  aiming: { power: string; step: number } | null;
  onPick: (power: string) => void;
  onCancel: () => void;
  me: Color | null;
}

/**
 * A Random style slot waiting to refill. It hides the spent power on
 * purpose: the slot is empty until the new roll lands.
 */
function Recharging({ left, size }: { left: number; size: "sm" | "md" }) {
  const hint = `Back in ${left} ${left === 1 ? "turn" : "turns"}`;
  return (
    <div className={`${cooldown.slot} ${cooldown[size]}`} title={hint} aria-label={hint} data-cooldown={left}>
      <span className={cooldown.count}>{left}</span>
      {size === "md" && <span className={cooldown.label}>Recharging</span>}
    </div>
  );
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
        me && <div className={styles.barTitle}>Your powers</div>
      )}
      <div className={styles.grid}>
        {mine.map(({ id, left }, i) => left > 0
          ? <Recharging key={`cd${i}`} left={left} size="md" />
          : <PowerCard key={`${id}${i}`} id={id} active={aiming?.power === id} disabled={!canUse || (!!aiming && aiming.power !== id)} onClick={() => onPick(id)} />)}
        {me && mine.length === 0 && <span className={styles.empty}>All used up</span>}
      </div>
      {theirs.length > 0 && (
        <>
          <div className={styles.barTitle}>{me ? "Opponent" : "Black"}</div>
          <div className={styles.grid}>
            {theirs.map(({ id, left }, i) => left > 0
              ? <Recharging key={`cd${i}`} left={left} size="sm" />
              : <PowerCard key={`${id}${i}`} id={id} size="sm" disabled />)}
          </div>
        </>
      )}
    </div>
  );
}
