"use client";

import { useState } from "react";
import type { Color } from "@/engine";
import { playerDone, type DraftState } from "@/features/powers";
import { Button } from "@/components/ui/Button";
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
 * their own cards at the same time. In Take & give the card you leave goes
 * to the opponent, so it is tagged as theirs. In Triple draft the cards you
 * leave are simply gone, so they are crossed out.
 */
export function OfferPicker({ draft, me, opponent, onPick }: Props) {
  const [chosen, setChosen] = useState<string | null>(null);
  const split = draft.style === "split";
  const offer = me ? draft.options[me] : [];
  const done = !me || playerDone(draft, me);
  const live = chosen && offer.includes(chosen) ? chosen : null;

  if (done) {
    return (
      <div className={styles.draftHead}>
        <span className={styles.draftRound}>{split ? "Take & give" : "Triple draft"}</span>
        <h2>{me ? `Waiting for ${opponent}` : "Players are drafting"}</h2>
      </div>
    );
  }

  const title = live ? "Ready" : split ? "Take one. They get the other." : "Keep one";

  const tag = (id: string) => {
    if (!live) return undefined;
    if (id === live) return split ? "Yours" : "Keep";
    return split ? "Theirs" : undefined;
  };

  const confirm = () => {
    if (live) onPick(live);
    setChosen(null);
  };

  return (
    <>
      <div className={styles.draftHead}>
        <span className={styles.draftRound}>Pick {draft.picks[me!] + 1} of {draft.rounds}</span>
        <h2>{title}</h2>
      </div>
      <div className={`${styles.options} ${split ? styles.two : ""}`}>
        {offer.map((id) => (
          <PowerCard
            key={id}
            id={id}
            size="lg"
            active={live === id}
            crossed={!split && !!live && live !== id}
            tag={tag(id)}
            onClick={() => setChosen(live === id ? null : id)}
          />
        ))}
      </div>
      <div className={styles.draftActions}>
        <Button variant="primary" onClick={confirm} disabled={!live} data-testid="draft-confirm">Confirm</Button>
      </div>
    </>
  );
}
