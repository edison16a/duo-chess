"use client";

import { useEffect, useRef } from "react";
import type { HistoryEntry } from "@/engine";
import { RATINGS } from "@/features/analysis";
import { POWERS } from "@/features/powers";
import { POWER_ICONS } from "@/features/powers/icons";
import { RARITY_COLOR } from "@/features/powers/rarity";
import { GlyphIcon } from "@/components/ui/icons";
import { PieceImage } from "@/components/board/PieceImage";
import styles from "./game.module.css";

function Entry({ entry, showRatings }: { entry: HistoryEntry; showRatings: boolean }) {
  if (entry.power) {
    const def = POWERS[entry.power];
    return (
      <span className={styles.powerMove} style={{ color: def ? RARITY_COLOR[def.rarity] : undefined }}>
        <GlyphIcon size={14}>{POWER_ICONS[entry.power]}</GlyphIcon>
        {entry.san}
      </span>
    );
  }
  const rating = showRatings && entry.rating ? RATINGS[entry.rating] : null;
  const letter = /^[A-Z]/.test(entry.san) && !entry.san.startsWith("O-O") && !entry.move.drop;
  return (
    <span className={styles.san}>
      {letter && <PieceImage kind={entry.kind} color={entry.color} className={styles.figurine} />}
      {letter ? entry.san.slice(1) : entry.san}
      {rating && <span className={styles.rateGlyph} style={{ color: rating.color }} title={rating.label}>{rating.glyph}</span>}
    </span>
  );
}

/** Moves grouped by turn. Multi move turns and powers simply stack inside the same row. */
export function MoveList({ history, showRatings }: { history: HistoryEntry[]; showRatings: boolean }) {
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    end.current?.scrollIntoView({ block: "nearest" });
  }, [history.length]);

  const rows: { n: number; w: HistoryEntry[]; b: HistoryEntry[] }[] = [];
  for (const entry of history) {
    let row = rows[rows.length - 1];
    if (!row || (entry.color === "w" && row.b.length > 0)) {
      row = { n: rows.length + 1, w: [], b: [] };
      rows.push(row);
    }
    row[entry.color].push(entry);
  }

  return (
    <div className={`${styles.moves} scroll-thin`} data-testid="move-list">
      {rows.map((row) => (
        <div key={row.n} className={styles.moveRow}>
          <span className={styles.moveNo}>{row.n}</span>
          <span className={styles.moveCell}>{row.w.map((e) => <Entry key={e.ply} entry={e} showRatings={showRatings} />)}</span>
          <span className={styles.moveCell}>{row.b.map((e) => <Entry key={e.ply} entry={e} showRatings={showRatings} />)}</span>
        </div>
      ))}
      <div ref={end} />
    </div>
  );
}
