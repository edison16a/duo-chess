"use client";

import { canConfigure } from "@/features/room/reducer/lobby";
import { useState, type ReactNode } from "react";
import { MODE_BY_ID, STANDARD_MAP, activeMap } from "@/features/modes";
import { mapProblem } from "@/features/maps";
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
  const canEdit = canConfigure(room, handle.myId);
  const mode = MODE_BY_ID[room.config.mode];
  const ready = room.players.length >= 2;
  const map = activeMap(room.config);
  const problem = map ? mapProblem(map) : null;

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
            <div className={styles.waitHost}><Icon name="clock" size={16} />Host starts the game</div>
          )}
          {problem && <span className={styles.problem}>{problem}</span>}
        </div>
      </aside>

      <main className={`${styles.main} scroll-thin`}>
        <section className={styles.section}>
          <h2>Mode</h2>
          <ModePicker value={room.config.mode} disabled={!canEdit} onChange={(id) => handle.send({ type: "config", config: { mode: id } })} />
          <ul className={styles.howTo}>
            {mode.howTo.map((line) => <li key={line}>{line}</li>)}
          </ul>
        </section>
        {/* Every mode can be played on a map; the mode's own rules apply on top of it. */}
        <section className={styles.section}>
          <h2>Map</h2>
          <MapPicker
            mapId={map?.id ?? STANDARD_MAP}
            customMap={room.config.customMap}
            disabled={!canEdit}
            standard={!mode.usesMap}
            onPick={(picked) => handle.send({ type: "config", config: picked ? { mapId: picked.id, customMap: picked.custom ? picked : null } : { mapId: STANDARD_MAP, customMap: null } })}
          />
        </section>
        <section className={styles.section}>
          <h2>Mods</h2>
          <ModsPanel config={room.config} disabled={!canEdit} onChange={(config) => handle.send({ type: "config", config })} />
        </section>
      </main>
    </div>
  );
}
