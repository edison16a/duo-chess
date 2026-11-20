"use client";

import { useState } from "react";
import type { Color } from "@/engine";
import { playerDone, type DraftState } from "@/features/powers";
import { PowerCard } from "./PowerCard";
import styles from "./powers.module.css";

interface Props {
  draft: DraftState;
  me: Color | null;
  opponent: string;
  onPick: (id: string) => void;
}

/**
 * Your own offer in a Take & give or Triple draft. Both players pick from
 * their own cards at the same time, and clicking a card takes it right away.
 * In Take & give the card you leave goes to the opponent; in Triple draft
 * the cards you leave are simply gone.
 */
export function OfferPicker({ draft, me, opponent, onPick }: Props) {
  // The pick number we already answered. Clicks wait for the next offer, so a double click cannot pick twice.
  const [sentAt, setSentAt] = useState<number | null>(null);
  const split = draft.style === "split";
  const offer = me ? draft.options[me] : [];
  const done = !me || playerDone(draft, me);
  const made = me ? draft.picks[me] : 0;

  if (done) {
    return (
      <div className={styles.draftHead}>
        <span className={styles.draftRound}>{split ? "Take & give" : "Triple draft"}</span>
        <h2>{me ? `Waiting for ${opponent}` : "Players are drafting"}</h2>
      </div>
    );
  }

  const pick = (id: string) => {
    if (sentAt === made) return;
    setSentAt(made);
    onPick(id);
  };

  return (
    <>
      <div className={styles.draftHead}>
        <span className={styles.draftRound}>Pick {made + 1} of {draft.rounds}</span>
        <h2>{split ? "Take one. They get the other." : "Keep one"}</h2>
      </div>
      <div className={`${styles.options} ${split ? styles.two : ""}`} data-testid="draft-offer">
        {offer.map((id) => (
          <PowerCard key={`${made}:${id}`} id={id} size="lg" onClick={() => pick(id)} />
        ))}
      </div>
    </>
  );
}
