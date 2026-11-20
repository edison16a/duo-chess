import type { Color } from "@/engine";
import { MATE, winChance } from "@/features/analysis";
import styles from "./game.module.css";

/** Vertical evaluation bar. Fills from White's side by win chance, not raw centipawns. */
export function EvalBar({ evalCp, orientation }: { evalCp: number | null; orientation: Color }) {
  const white = evalCp === null ? 50 : winChance(evalCp);
  const label = evalCp === null ? "" : Math.abs(evalCp) >= MATE - 1000 ? "M" : (Math.abs(evalCp) / 100).toFixed(1);
  return (
    <div className={`${styles.evalBar} ${orientation === "b" ? styles.evalFlip : ""}`} title="Evaluation">
      <div className={styles.evalWhite} style={{ height: `${white}%` }} />
      <span className={`${styles.evalLabel} ${white >= 50 ? styles.evalLabelLow : styles.evalLabelHigh}`}>{label}</span>
    </div>
  );
}
