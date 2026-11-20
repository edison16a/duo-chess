"use client";

import type { Color } from "@/engine";
import { playerDone, type DraftState } from "@/features/powers";
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
 * The draft screen. Both players draft at the same time: offer styles show
 * each player their own cards, Free Deck lets each build a hand. Both hands
 * sit underneath as full art cards, except an opponent's deck stays hidden
 * until it is locked in.
 */
export function DraftPanel({ draft, me, players, onPick }: Props) {
  const deck = draft.style === "deck";
  const name = (c: Color) => players[c]?.name ?? (c === "w" ? "White" : "Black");
  const opponent = me ? name(me === "w" ? "b" : "w") : "Players";

  return (
    <div className={`${styles.draft} ${deck ? styles.draftWide : ""}`} data-testid="draft">
      {deck ? (
        <DeckBuilder draft={draft} me={me} opponent={opponent} onLock={onPick} />
      ) : (
        <OfferPicker draft={draft} me={me} opponent={opponent} onPick={(id) => onPick([id])} />
      )}
      <div className={styles.hands}>
        {(["w", "b"] as Color[]).map((c) => {
          const hidden = deck && c !== me && !draft.locked[c];
          const finished = playerDone(draft, c);
          return (
            <div key={c} className={styles.hand}>
              <span className={styles.barTitle}>
                {name(c)}
                <span className={finished ? styles.ready : styles.building}>{finished ? "Ready" : deck ? "Building" : "Picking"}</span>
              </span>
              <div className={styles.handCards}>
                {hidden ? null : draft.inventory[c].map((id, i) => <PowerCard key={`${id}${i}`} id={id} size="lg" disabled />)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
