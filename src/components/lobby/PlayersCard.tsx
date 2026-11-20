"use client";

import { useState } from "react";
import { savePlayerName } from "@/features/room/identity";
import type { RoomState } from "@/features/room/types";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/icons";
import styles from "./lobby.module.css";

export function PlayersCard({ room, myId, onRename }: { room: RoomState; myId: string; onRename: (name: string) => void }) {
  const me = room.players.find((p) => p.id === myId);
  const [draft, setDraft] = useState<string | null>(null);

  const save = () => {
    if (draft && draft.trim()) {
      savePlayerName(draft.trim());
      onRename(draft.trim());
    }
    setDraft(null);
  };

  return (
    <div className={styles.players} data-testid="players">
      {room.players.map((p, i) => (
        <div key={p.id} className={styles.player}>
          <span className={styles.avatar}>{p.name.replace("Player ", "").slice(0, 2).toUpperCase()}</span>
          {p.id === myId && draft !== null ? (
            <input
              className={styles.nameInput}
              value={draft}
              maxLength={24}
              autoFocus
              onChange={(e) => setDraft(e.target.value)}
              onBlur={save}
              onKeyDown={(e) => e.key === "Enter" && save()}
            />
          ) : (
            <span className={styles.playerName}>{p.name}</span>
          )}
          {p.id === room.hostId && <span className={styles.badge}>Host</span>}
          {i > 1 && <span className={styles.badge}>Watching</span>}
          {p.id === myId && draft === null && (
            <Button size="sm" variant="ghost" icon="edit" aria-label="Rename" onClick={() => setDraft(me?.name ?? "")} />
          )}
          {!p.online && <span className={styles.offline} title="Offline" />}
        </div>
      ))}
      {room.players.length < 2 && (
        <div className={`${styles.player} ${styles.waiting}`}>
          <span className={styles.avatar}><Icon name="users" size={16} /></span>
          <span>Waiting for opponent</span>
        </div>
      )}
    </div>
  );
}
