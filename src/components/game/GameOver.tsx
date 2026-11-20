"use client";

import { useMemo } from "react";
import type { Color, GameResult, HistoryEntry } from "@/engine";
import { summarizeGame } from "@/features/analysis";
import type { Player } from "@/features/room/types";
import { Button } from "@/components/ui/Button";
import { REASONS } from "./reasons";
import { SummaryTable } from "./SummaryTable";
import styles from "./gameOver.module.css";

interface Props {
  result: GameResult;
  me: Color | null;
  players: Record<Color, Player | undefined>;
  history: HistoryEntry[];
  rematchVotes: string[];
  myId: string;
  onRematch: () => void;
  onClose: () => void;
}

/**
 * The end of game screen: who won and how, then each player's estimated
 * rating, accuracy and how many moves of each kind they played. The last
 * move's rating can land a moment after the game ends, and the numbers
 * simply update when it does.
 */
export function GameOver({ result, me, players, history, rematchVotes, myId, onRematch, onClose }: Props) {
  const summary = useMemo(() => summarizeGame(history), [history]);
  const name = (c: Color) => players[c]?.name ?? (c === "w" ? "White" : "Black");
  const title = result.winner === null ? "Draw" : `${name(result.winner)} wins`;
  const reason = REASONS[result.reason];
  const voted = rematchVotes.includes(myId);
  const waitingOn = rematchVotes.length === 1 && !voted;

  return (
    <div className={styles.backdrop} data-testid="result" role="dialog" aria-label={title}>
      <div className={styles.card}>
        <button type="button" className={styles.close} onClick={onClose} aria-label="View board" title="View board">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
        <header className={styles.head}>
          {me && result.winner !== null && (
            <span className={result.winner === me ? styles.won : styles.lost}>{result.winner === me ? "You won" : "You lost"}</span>
          )}
          <h2 data-testid="result-title">{title}</h2>
          <p>{result.winner === null ? reason.replace(/^by /, "By ") : reason}</p>
        </header>
        <SummaryTable summary={summary} names={{ w: name("w"), b: name("b") }} me={me} winner={result.winner} />
        <div className={styles.actions}>
          <Button variant="ghost" onClick={onClose}>View board</Button>
          {me && (
            <Button variant="primary" icon="rematch" onClick={onRematch} disabled={voted} data-testid="rematch">
              {voted ? "Waiting for opponent" : waitingOn ? "Accept rematch" : "Rematch"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
