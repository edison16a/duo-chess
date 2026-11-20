"use client";

import { useState } from "react";
import type { Color } from "@/engine";
import type { DraftState } from "@/features/powers";
import { Button } from "@/components/ui/Button";
import { PowerCard } from "./PowerCard";
import styles from "./powers.module.css";

interface Props {
  draft: DraftState;
  me: Color | null;
  drafter: string;
  onPick: (id: string) => void;
}

/**
 * One turn of an offer draft. In Take & give the card you leave goes to the
 * opponent, so it is tagged as theirs. In Triple draft the cards you leave
 * are simply gone, so they are crossed out.
 */
export function OfferPicker({ draft, me, drafter, onPick }: Props) {
  const [chosen, setChosen] = useState<string | null>(null);
  const myTurn = me === draft.turn;
  const split = draft.style === "split";
  const live = chosen && draft.options.includes(chosen) ? chosen : null;

  const title = !myTurn
    ? `${drafter} is choosing`
    : live
      ? "Ready"
      : split ? "Take one. They get the other." : "Keep one";

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
        <span className={styles.draftRound}>Pick {draft.log.length + 1} of {draft.total}</span>
        <h2>{title}</h2>
      </div>
      <div className={`${styles.options} ${split ? styles.two : ""}`}>
        {draft.options.map((id) => (
          <PowerCard
            key={id}
            id={id}
            size="lg"
            active={live === id}
            crossed={!split && !!live && live !== id}
            tag={tag(id)}
            disabled={!myTurn}
            onClick={() => setChosen(live === id ? null : id)}
          />
        ))}
      </div>
      {myTurn && (
        <div className={styles.draftActions}>
          <Button variant="primary" onClick={confirm} disabled={!live} data-testid="draft-confirm">Confirm</Button>
        </div>
      )}
    </>
  );
}
