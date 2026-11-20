"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { isMuted, setMuted } from "@/features/audio/sounds";
import { BOARD_THEMES, type BoardTheme } from "@/components/board/themes";
import styles from "./game.module.css";

interface Props {
  playing: boolean;
  seated: boolean;
  drawOffered: "mine" | "theirs" | null;
  theme: BoardTheme;
  onTheme: (id: string) => void;
  onFlip: () => void;
  view: "2d" | "3d";
  onView: (view: "2d" | "3d") => void;
  onResign: () => void;
  onDraw: () => void;
  onDrawAnswer: (accept: boolean) => void;
}

export function GameControls(p: Props) {
  const [muted, setMutedState] = useState(isMuted);
  const [confirm, setConfirm] = useState(false);
  const nextTheme = BOARD_THEMES[(BOARD_THEMES.findIndex((t) => t.id === p.theme.id) + 1) % BOARD_THEMES.length];

  return (
    <div className={styles.controls}>
      {p.drawOffered === "theirs" && (
        <div className={styles.offer}>
          <span>Draw offered</span>
          <Button size="sm" variant="primary" onClick={() => p.onDrawAnswer(true)}>Accept</Button>
          <Button size="sm" variant="ghost" onClick={() => p.onDrawAnswer(false)}>Decline</Button>
        </div>
      )}
      <div className={styles.controlRow}>
        <div className={styles.viewToggle} role="group" aria-label="Board view">
          <button type="button" className={p.view === "2d" ? styles.viewOn : ""} onClick={() => p.onView("2d")} data-testid="view-2d">2D</button>
          <button type="button" className={p.view === "3d" ? styles.viewOn : ""} onClick={() => p.onView("3d")} data-testid="view-3d">3D</button>
        </div>
        <Button size="sm" variant="ghost" icon="flip" onClick={p.onFlip} title="Flip board" aria-label="Flip board" />
        <Button size="sm" variant="ghost" icon="palette" onClick={() => p.onTheme(nextTheme.id)} title={`Board: ${p.theme.name}`} aria-label="Board theme" />
        <Button
          size="sm"
          variant="ghost"
          icon={muted ? "soundOff" : "soundOn"}
          onClick={() => { setMuted(!muted); setMutedState(!muted); }}
          title={muted ? "Unmute" : "Mute"}
          aria-label="Toggle sound"
        />
        <span className={styles.spacer} />
        {p.seated && p.playing && (
          <>
            <Button size="sm" variant="ghost" icon="handshake" onClick={p.onDraw} disabled={p.drawOffered === "mine"}>
              {p.drawOffered === "mine" ? "Offered" : "Draw"}
            </Button>
            {confirm ? (
              <Button size="sm" variant="danger" icon="flag" onClick={() => { setConfirm(false); p.onResign(); }} onBlur={() => setConfirm(false)} autoFocus>
                Confirm
              </Button>
            ) : (
              <Button size="sm" variant="ghost" icon="flag" onClick={() => setConfirm(true)}>Resign</Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
