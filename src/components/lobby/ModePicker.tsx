"use client";

import { useEffect, useMemo, useState } from "react";
import { MODES, type ModeId } from "@/features/modes";
import { Icon } from "@/components/ui/icons";
import { ModeCard } from "./ModeCard";
import styles from "./modePicker.module.css";

const PER_PAGE = 4;

/** Search plus a paged row of animated mode cards, four at a time. */
export function ModePicker({ value, onChange, disabled }: { value: ModeId; onChange: (id: ModeId) => void; disabled: boolean }) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return MODES;
    return MODES.filter((m) => `${m.name} ${m.blurb} ${m.howTo.join(" ")}`.toLowerCase().includes(q));
  }, [query]);
  const pages = Math.max(1, Math.ceil(list.length / PER_PAGE));
  const shown = list.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE);

  // Keep the chosen mode in view, which matters for guests watching the host pick.
  useEffect(() => {
    if (query) return;
    const i = MODES.findIndex((m) => m.id === value);
    if (i >= 0) setPage(Math.floor(i / PER_PAGE));
  }, [value, query]);

  useEffect(() => {
    if (page >= pages) setPage(0);
  }, [page, pages]);

  return (
    <div className={styles.picker}>
      <div className={styles.bar}>
        <label className={styles.search}>
          <Icon name="search" size={16} />
          <input value={query} onChange={(e) => { setQuery(e.target.value); setPage(0); }} placeholder="Search modes" aria-label="Search modes" data-testid="mode-search" />
        </label>
        <div className={styles.nav}>
          <span className={styles.count}>{page + 1} / {pages}</span>
          <button type="button" onClick={() => setPage((p) => (p - 1 + pages) % pages)} aria-label="Previous modes" disabled={pages < 2}><Icon name="arrowLeft" size={18} /></button>
          <button type="button" onClick={() => setPage((p) => (p + 1) % pages)} aria-label="Next modes" disabled={pages < 2} data-testid="modes-next"><Icon name="arrowRight" size={18} /></button>
        </div>
      </div>
      <div className={styles.row} key={`${page}:${query}`}>
        {shown.map((m) => (
          <ModeCard key={m.id} mode={m} active={m.id === value} disabled={disabled && m.id !== value} onClick={() => onChange(m.id)} />
        ))}
        {shown.length === 0 && <div className={styles.empty}>No mode matches that</div>}
      </div>
      <div className={styles.dots}>
        {Array.from({ length: pages }, (_, i) => (
          <button key={i} type="button" className={i === page ? styles.dotOn : ""} onClick={() => setPage(i)} aria-label={`Page ${i + 1}`} />
        ))}
      </div>
    </div>
  );
}
