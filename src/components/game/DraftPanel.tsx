"use client";

import type { Color } from "@/engine";
import type { DraftState } from "@/features/powers";
import type { Player } from "@/features/room/types";
import { DeckBuilder } from "./DeckBuilder";
import { OfferPicker } from "./OfferPicker";
import { PowerCard } from "./PowerCard";
import styles from "./powers.module.css";

interface Props {
  draft: DraftState;
  me: Color | null;
  players: Record<Color, Player | undefined>;
  onPick: (picks: string[]) => void;
}

/**
 * The draft screen. Offer styles show a few cards per turn, Free Deck lets
 * both players build a hand at once. Either way both hands sit underneath,
 * except an opponent's deck stays hidden until it is locked in.
 */
export function DraftPanel({ draft, me, players, onPick }: Props) {
  const deck = draft.style === "deck";
  const name = (c: Color) => players[c]?.name ?? (c === "w" ? "White" : "Black");

  return (
    <div className={`${styles.draft} ${deck ? styles.draftWide : ""}`} data-testid="draft">
      {deck ? (
        <DeckBuilder draft={draft} me={me} opponent={me ? name(me === "w" ? "b" : "w") : "Players"} onLock={onPick} />
      ) : (
        <OfferPicker draft={draft} me={me} drafter={name(draft.turn)} onPick={(id) => onPick([id])} />
      )}
      <div className={styles.hands}>
        {(["w", "b"] as Color[]).map((c) => {
          const hidden = deck && c !== me && !draft.locked[c];
          return (
            <div key={c} className={styles.hand}>
              <span className={styles.barTitle}>
                {name(c)}
                {deck && <span className={draft.locked[c] ? styles.ready : styles.building}>{draft.locked[c] ? "Ready" : "Building"}</span>}
              </span>
              <div className={styles.grid}>
                {hidden ? null : draft.inventory[c].map((id, i) => <PowerCard key={`${id}${i}`} id={id} size="sm" disabled />)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
