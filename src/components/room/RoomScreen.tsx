"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { newRoomCode } from "@/features/net/roomCode";
import { markHosting } from "@/features/room/identity";
import { useRoom } from "@/features/room/useRoom";
import { sfx } from "@/features/audio/sounds";
import { GameView } from "@/components/game/GameView";
import { Lobby } from "@/components/lobby/Lobby";
import { Button } from "@/components/ui/Button";
import { TopBar } from "@/components/ui/TopBar";
import styles from "./room.module.css";

function Status({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className={styles.status}>
      <h1>{title}</h1>
      {children}
    </div>
  );
}

export function RoomScreen({ code }: { code: string }) {
  const handle = useRoom(code);
  const { room, status } = handle;
  const count = room?.players.length ?? 0;

  // Someone else's room already holds the code we rolled, so roll a new one.
  const router = useRouter();
  useEffect(() => {
    if (status !== "taken") return;
    const next = newRoomCode();
    markHosting(next);
    router.replace(`/room/${next}`);
  }, [status, router]);

  // Chime when someone joins the room.
  useEffect(() => {
    if (count > 1) sfx.notify();
  }, [count]);

  let body: React.ReactNode;
  if (status === "missing") {
    body = (
      <Status title="Room not found">
        <p>The code may be wrong or the host closed the game.</p>
        <Link href="/"><Button variant="primary" icon="home">Back home</Button></Link>
      </Status>
    );
  } else if (status === "closed") {
    body = (
      <Status title="Room closed">
        <Link href="/"><Button variant="primary" icon="home">Back home</Button></Link>
      </Status>
    );
  } else if (!room) {
    body = <Status title="Connecting"><span className={styles.spinner} /></Status>;
  } else if (room.phase === "lobby") {
    body = <Lobby handle={handle} />;
  } else {
    body = <GameView handle={handle} />;
  }

  return (
    <div className={styles.screen}>
      <TopBar>
        {handle.link !== "online" && room && <span className={styles.link}>Reconnecting</span>}
        {!handle.isHost && room && !handle.hostOnline && <span className={styles.link}>Host offline</span>}
      </TopBar>
      {body}
    </div>
  );
}
