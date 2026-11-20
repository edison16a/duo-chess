"use client";

import { RatingGlyph } from "@/components/ui/RatingGlyph";
import { useEffect, useRef } from "react";
import type { Color, HistoryEntry } from "@/engine";
import { RATINGS } from "@/features/analysis";
import { POWERS } from "@/features/powers";
import { POWER_ICONS } from "@/features/powers/icons";
import { RARITY_COLOR } from "@/features/powers/rarity";
import { GlyphIcon } from "@/components/ui/icons";
import { PieceImage } from "@/components/board/PieceImage";
import styles from "./game.module.css";

function Entry({ entry, showRatings, hidden }: { entry: HistoryEntry; showRatings: boolean; hidden: boolean }) {
  if (hidden) return <span className={styles.hiddenMove}>Hidden</span>;
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
      {rating && <span className={styles.rateGlyph} style={{ color: rating.color }} title={rating.label}><RatingGlyph id={rating.id} size={11} /></span>}
    </span>
  );
}

interface Props {
  history: HistoryEntry[];
  showRatings: boolean;
  hideFor?: Color | null;
  /** History length on the board right now, used to mark the shown move. */
  current: number;
  canOpen: (length: number) => boolean;
  onOpen: (length: number) => void;
}

/**
 * Moves grouped by turn. Multi move turns and powers simply stack inside the
 * same row. `hideFor` masks the opponent's moves in Fog of War. Clicking an
 * entry shows the board right after it, when we hold a snapshot for it.
 */
export function MoveList({ history, showRatings, hideFor = null, current, canOpen, onOpen }: Props) {
  const list = useRef<HTMLDivElement>(null);
  const end = useRef<HTMLDivElement>(null);
  const live = current === history.length;
  useEffect(() => {
    if (live) end.current?.scrollIntoView({ block: "nearest" });
    else list.current?.querySelector("[data-current]")?.scrollIntoView({ block: "nearest" });
  }, [history.length, current, live]);

  const rows: { n: number; w: HistoryEntry[]; b: HistoryEntry[] }[] = [];
  for (const entry of history) {
    let row = rows[rows.length - 1];
    if (!row || (entry.color === "w" && row.b.length > 0)) {
      row = { n: rows.length + 1, w: [], b: [] };
      rows.push(row);
    }
    row[entry.color].push(entry);
  }

  const cell = (entries: HistoryEntry[]) => entries.map((e) => {
    const hidden = !!hideFor && e.color !== hideFor;
    const shown = e.ply + 1 === current;
    return (
      <button
        key={e.ply}
        type="button"
        className={`${styles.moveBtn} ${shown ? styles.moveCurrent : ""}`}
        disabled={hidden || !canOpen(e.ply + 1)}
        // Mouse clicks should not leave a focus ring behind; arrow keys move the view anyway.
        onMouseDown={(ev) => ev.preventDefault()}
        onClick={() => onOpen(e.ply + 1)}
        data-current={shown || undefined}
        data-ply={e.ply}
      >
        <Entry entry={e} showRatings={showRatings} hidden={hidden} />
      </button>
    );
  });

  return (
    <div ref={list} className={`${styles.moves} scroll-thin`} data-testid="move-list">
      {rows.map((row) => (
        <div key={row.n} className={styles.moveRow}>
          <span className={styles.moveNo}>{row.n}</span>
          <span className={styles.moveCell}>{cell(row.w)}</span>
          <span className={styles.moveCell}>{cell(row.b)}</span>
        </div>
      ))}
      <div ref={end} />
    </div>
  );
}
