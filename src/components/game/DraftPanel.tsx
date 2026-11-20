"use client";

import { useState } from "react";
import type { Color } from "@/engine";
import type { DraftState } from "@/features/powers";
import type { Player } from "@/features/room/types";
import { Button } from "@/components/ui/Button";
import { PowerCard } from "./PowerCard";
import styles from "./powers.module.css";

interface Props {
  draft: DraftState;
  me: Color | null;
  players: Record<Color, Player | undefined>;
  onPick: (keep: string, give: string) => void;
}

/** Keep one, give one, the third is crossed out. */
export function DraftPanel({ draft, me, players, onPick }: Props) {
  const [keep, setKeep] = useState<string | null>(null);
  const [give, setGive] = useState<string | null>(null);
  const myTurn = me === draft.turn;
  const round = draft.log.length + 1;

  const choose = (id: string) => {
    if (!myTurn) return;
    if (keep === id) setKeep(null);
    else if (give === id) setGive(null);
    else if (!keep) setKeep(id);
    else if (!give) setGive(id);
  };

  const confirm = () => {
    if (keep && give) onPick(keep, give);
    setKeep(null);
    setGive(null);
  };

  const crossed = keep && give ? draft.options.find((o) => o !== keep && o !== give) : null;
  const drafter = players[draft.turn]?.name ?? "Opponent";

  return (
    <div className={styles.draft} data-testid="draft">
      <div className={styles.draftHead}>
        <span className={styles.draftRound}>Pick {round} of {draft.total}</span>
        <h2>{myTurn ? (keep ? (give ? "Ready" : "Now pick one to give away") : "Pick one to keep") : `${drafter} is drafting`}</h2>
      </div>
      <div className={styles.options}>
        {draft.options.map((id) => (
          <PowerCard
            key={id}
            id={id}
            size="lg"
            active={keep === id || give === id}
            crossed={crossed === id}
            tag={keep === id ? "Keep" : give === id ? "Give" : undefined}
            disabled={!myTurn}
            onClick={() => choose(id)}
          />
        ))}
      </div>
      {myTurn && (
        <div className={styles.draftActions}>
          <Button variant="ghost" onClick={() => { setKeep(null); setGive(null); }} disabled={!keep}>Reset</Button>
          <Button variant="primary" onClick={confirm} disabled={!keep || !give} data-testid="draft-confirm">Confirm</Button>
        </div>
      )}
      <div className={styles.hands}>
        {(["w", "b"] as Color[]).map((c) => (
          <div key={c} className={styles.hand}>
            <span className={styles.barTitle}>{players[c]?.name ?? (c === "w" ? "White" : "Black")}</span>
            <div className={styles.grid}>
              {draft.inventory[c].map((id, i) => <PowerCard key={`${id}${i}`} id={id} size="sm" disabled />)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
