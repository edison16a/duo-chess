"use client";

import { useState, type ReactNode } from "react";
import { MODE_BY_ID } from "@/features/modes";
import { mapProblem } from "@/features/maps";
import { resolveMap } from "@/features/modes";
import type { RoomHandle } from "@/features/room/useRoom";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/icons";
import { MapPicker } from "./MapPicker";
import { ModePicker } from "./ModePicker";
import { ModsPanel } from "./ModsPanel";
import { PlayersCard } from "./PlayersCard";
import styles from "./lobby.module.css";

/** `side` replaces the room code card, e.g. with bot settings in a local game. */
export function Lobby({ handle, side }: { handle: RoomHandle; side?: ReactNode }) {
  const room = handle.room!;
  const [copied, setCopied] = useState<"code" | "link" | null>(null);
  const isHost = room.hostId === handle.myId;
  const mode = MODE_BY_ID[room.config.mode];
  const ready = room.players.length >= 2;
  const problem = mode.usesMap ? mapProblem(resolveMap(room.config)) : null;

  const copy = async (what: "code" | "link") => {
    const text = what === "code" ? room.code : `${window.location.origin}/room/${room.code}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      setCopied(null);
    }
  };

  return (
    <div className={styles.lobby}>
      <aside className={styles.side}>
        {side ?? (
          <div className={styles.codeCard}>
            <span className={styles.label}>Room code</span>
            <span className={styles.bigCode} data-testid="room-code">{room.code}</span>
            <div className={styles.codeActions}>
              <Button size="sm" icon={copied === "code" ? "check" : "copy"} onClick={() => copy("code")}>Code</Button>
              <Button size="sm" icon={copied === "link" ? "check" : "link"} onClick={() => copy("link")}>Invite link</Button>
            </div>
          </div>
        )}
        <PlayersCard room={room} myId={handle.myId} onRename={(name) => handle.send({ type: "rename", name })} />
        <div className={styles.startBox}>
          {isHost ? (
            <Button
              variant="primary"
              size="lg"
              icon="sparkle"
              disabled={!ready || !!problem}
              onClick={() => handle.send({ type: "start" })}
              data-testid="start"
            >
              {ready ? "Start game" : "Waiting for a player"}
            </Button>
          ) : (
            <div className={styles.waitHost}><Icon name="clock" size={16} />Host picks the mode and starts</div>
          )}
          {problem && <span className={styles.problem}>{problem}</span>}
        </div>
      </aside>

      <main className={`${styles.main} scroll-thin`}>
        <section className={styles.section}>
          <h2>Mode</h2>
          <ModePicker value={room.config.mode} disabled={!isHost} onChange={(id) => handle.send({ type: "config", config: { mode: id } })} />
          <ul className={styles.howTo}>
            {mode.howTo.map((line) => <li key={line}>{line}</li>)}
          </ul>
        </section>
        {mode.usesMap && (
          <section className={styles.section}>
            <h2>Map</h2>
            <MapPicker
              mapId={room.config.mapId}
              customMap={room.config.customMap}
              disabled={!isHost}
              onPick={(map) => handle.send({ type: "config", config: { mapId: map.id, customMap: map.custom ? map : null } })}
            />
          </section>
        )}
        <section className={styles.section}>
          <h2>Mods</h2>
          <ModsPanel config={room.config} disabled={!isHost} onChange={(config) => handle.send({ type: "config", config })} />
        </section>
      </main>
    </div>
  );
}
