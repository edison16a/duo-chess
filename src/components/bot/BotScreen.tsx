"use client";

import { useEffect, useState } from "react";
import { DEFAULT_ELO, loadElo, saveElo } from "@/features/bot";
import { useLocalRoom } from "@/features/room/useLocalRoom";
import { GameView } from "@/components/game/GameView";
import { Lobby } from "@/components/lobby/Lobby";
import { Button } from "@/components/ui/Button";
import { TopBar } from "@/components/ui/TopBar";
import { BotPanel } from "./BotPanel";
import styles from "./bot.module.css";

/** A full game against the bot in this tab, using the regular lobby and game screens. */
export function BotScreen() {
  const [elo, setElo] = useState(DEFAULT_ELO);
  const handle = useLocalRoom(elo);
  const { room } = handle;

  // Read storage after mount so the server render and the first client render agree.
  useEffect(() => {
    setElo(loadElo());
  }, []);

  const changeElo = (value: number) => {
    setElo(value);
    saveElo(value);
  };

  let body: React.ReactNode;
  if (!room) {
    body = <div className={styles.loading}><span className={styles.spinner} /></div>;
  } else if (room.phase === "lobby") {
    body = <Lobby handle={handle} side={<BotPanel elo={elo} onChange={changeElo} />} />;
  } else {
    body = <GameView handle={handle} />;
  }

  return (
    <div className={styles.screen}>
      <TopBar>
        {room?.phase === "over" && (
          <Button size="sm" variant="ghost" icon="bot" onClick={handle.newGame} data-testid="bot-new-game">New game</Button>
        )}
      </TopBar>
      {body}
    </div>
  );
}
