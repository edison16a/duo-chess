"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CODE_LENGTH, isValidCode, newRoomCode, normalizeCode } from "@/features/net/roomCode";
import { markHosting, playerName, savePlayerName } from "@/features/room/identity";
import { Button } from "@/components/ui/Button";
import { GitHubButton } from "@/components/ui/GitHubButton";
import { Icon } from "@/components/ui/icons";
import { Logo } from "@/components/ui/Logo";
import styles from "./home.module.css";

export function Home() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    setName(playerName());
  }, []);

  const host = () => {
    const room = newRoomCode();
    markHosting(room);
    router.push(`/room/${room}`);
  };

  const join = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValidCode(code)) router.push(`/room/${code}`);
  };

  return (
    <main className={styles.home}>
      <div className={styles.corner}><GitHubButton /></div>
      <div className={styles.hero}>
        <Logo size={88} />
        <h1>Duo Chess</h1>
        <label className={styles.nameRow}>
          <Icon name="edit" size={15} />
          <input
            value={name}
            maxLength={24}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => name.trim() && savePlayerName(name.trim())}
            aria-label="Your name"
            data-testid="name-input"
          />
        </label>
        <div className={styles.actions}>
          <Button variant="primary" size="lg" icon="plus" onClick={host} data-testid="host">Host game</Button>
          <Button variant="secondary" size="lg" icon="bot" onClick={() => router.push("/bot")} data-testid="play-bot">Play vs bot</Button>
          <form className={styles.join} onSubmit={join}>
            <input
              value={code}
              onChange={(e) => setCode(normalizeCode(e.target.value))}
              placeholder="CODE"
              maxLength={CODE_LENGTH}
              aria-label="Room code"
              data-testid="code-input"
              autoCapitalize="characters"
              spellCheck={false}
            />
            <Button type="submit" size="lg" icon="enter" disabled={!isValidCode(code)} data-testid="join">Join</Button>
          </form>
        </div>
        <nav className={styles.links}>
          <Link href="/library"><Icon name="book" size={16} />Library</Link>
          <Link href="/editor"><Icon name="edit" size={16} />Map editor</Link>
        </nav>
      </div>
    </main>
  );
}
