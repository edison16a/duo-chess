"use client";

import { useMemo, useState } from "react";
import type { Color } from "@/engine";
import { ALL_POWERS, RARITIES, RARITY_COST, RARITY_LABEL, deckBudget, deckCost, type DraftState, type Rarity } from "@/features/powers";
import { Button } from "@/components/ui/Button";
import { PowerCard } from "./PowerCard";
import styles from "./powers.module.css";

interface Props {
  draft: DraftState;
  me: Color | null;
  opponent: string;
  onLock: (deck: string[]) => void;
}

/**
 * Free Deck: the whole catalog, priced by rarity. You fill your hand within
 * the point budget and lock it in; the game starts once both hands are in.
 */
export function DeckBuilder({ draft, me, opponent, onLock }: Props) {
  const [deck, setDeck] = useState<string[]>([]);
  const [filter, setFilter] = useState<Rarity | "all">("all");
  const budget = deckBudget(draft.size);
  const left = budget - deckCost(deck);
  const locked = me ? draft.locked[me] : true;
  const full = deck.length === draft.size;

  const shown = useMemo(() => ALL_POWERS.filter((p) => filter === "all" || p.rarity === filter), [filter]);

  const toggle = (id: string) => {
    setDeck((d) => (d.includes(id) ? d.filter((x) => x !== id) : [...d, id]));
  };

  // A card is off limits when it would not fit, unless it is already in the deck and can be taken back out.
  const blocked = (id: string, rarity: Rarity) => !deck.includes(id) && (full || RARITY_COST[rarity] > left);

  if (!me || locked) {
    return (
      <div className={styles.draftHead}>
        <span className={styles.draftRound}>Free deck</span>
        <h2>{me ? `Waiting for ${opponent}` : "Players are building decks"}</h2>
      </div>
    );
  }

  return (
    <>
      <div className={styles.draftHead}>
        <span className={styles.draftRound}>Free deck</span>
        <h2>Build your deck</h2>
        <div className={styles.deckMeter}>
          <span data-testid="deck-count"><strong>{deck.length}</strong> of {draft.size} picked</span>
          <span><strong>{left}</strong> of {budget} points left</span>
        </div>
      </div>
      <div className={styles.deckFilters} role="tablist">
        {(["all", ...RARITIES] as const).map((r) => (
          <button key={r} type="button" role="tab" aria-selected={filter === r} className={filter === r ? styles.filterOn : ""} onClick={() => setFilter(r)}>
            {r === "all" ? "All" : `${RARITY_LABEL[r]} ${RARITY_COST[r]}`}
          </button>
        ))}
      </div>
      <div className={styles.deckGrid}>
        {shown.map((p) => (
          <PowerCard
            key={p.id}
            id={p.id}
            size="md"
            active={deck.includes(p.id)}
            disabled={blocked(p.id, p.rarity)}
            tag={`${RARITY_COST[p.rarity]}`}
            onClick={() => toggle(p.id)}
          />
        ))}
      </div>
      <div className={styles.draftActions}>
        <Button variant="ghost" onClick={() => setDeck([])} disabled={!deck.length}>Clear</Button>
        <Button variant="primary" onClick={() => onLock(deck)} disabled={!full} data-testid="draft-confirm">Lock in</Button>
      </div>
    </>
  );
}
