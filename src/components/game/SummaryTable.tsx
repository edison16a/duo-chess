import type { Color, RatingId } from "@/engine";
import type { GameSummary } from "@/features/analysis";
import { RATINGS } from "@/features/analysis/ratings";
import { RatingGlyph } from "@/components/ui/RatingGlyph";
import styles from "./gameOver.module.css";

/** Best first, like a game review. Legendary only shows up when somebody actually played one. */
const ROWS: RatingId[] = ["legendary", "brilliant", "great", "best", "excellent", "good", "book", "inaccuracy", "mistake", "blunder"];

interface Props {
  summary: GameSummary;
  names: Record<Color, string>;
  me: Color | null;
  winner: Color | null;
}

/**
 * Both players side by side: estimated rating and accuracy up top, then a
 * row per rating with White's count on the left and Black's on the right.
 */
export function SummaryTable({ summary, names, me, winner }: Props) {
  const rows = ROWS.filter((id) => id !== "legendary" || summary.w.counts.legendary + summary.b.counts.legendary > 0);
  const side = (c: Color) => {
    const s = summary[c];
    return (
      <div className={`${styles.player} ${c === "b" ? styles.right : ""}`}>
        <span className={styles.who}>
          <span className={`${styles.dot} ${c === "w" ? styles.white : styles.black}`} />
          <span className={styles.name}>{names[c]}</span>
          {me === c && <span className={styles.you}>You</span>}
        </span>
        <span className={`${styles.elo} ${winner === c ? styles.eloWin : ""}`} data-testid={`elo-${c}`} title="Estimated from accuracy">
          {s.estimatedElo ?? "?"}
        </span>
        <span className={styles.accuracy}>{s.accuracy === null ? "Too short to rate" : `${s.accuracy.toFixed(1)}% accuracy`}</span>
      </div>
    );
  };

  return (
    <div className={styles.summary}>
      <div className={styles.players}>
        {side("w")}
        <span className={styles.vs}>Game rating</span>
        {side("b")}
      </div>
      <div className={styles.rows}>
        {rows.map((id) => {
          const info = RATINGS[id];
          const w = summary.w.counts[id];
          const b = summary.b.counts[id];
          return (
            <div key={id} className={styles.row} data-rating={id}>
              <span className={`${styles.count} ${w ? "" : styles.zero}`} style={{ color: w ? info.color : undefined }}>{w}</span>
              <span className={styles.label}>
                <span className={styles.badge} style={{ background: info.color }}><RatingGlyph id={id} size={11} /></span>
                {info.label}
              </span>
              <span className={`${styles.count} ${b ? "" : styles.zero}`} style={{ color: b ? info.color : undefined }}>{b}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
