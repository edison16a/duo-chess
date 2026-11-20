"use client";

/**
 * Chained premoves, chess.com style. While the opponent is thinking you can
 * queue several moves in a row: each one is shown on your board straight
 * away, so a pawn premoved twice really stands two squares up, and the next
 * premove starts from there. When your turn comes the first queued move is
 * played if it is still legal; the rest wait for your following turns. If a
 * queued move has become illegal the whole queue is dropped. Escape, a right
 * click or a click on an empty square cancels them all.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { clonePosition, makeMove, matchLegal, positionKey, pseudoMoves, type Color, type Move, type Position } from "@/engine";

/** Long enough to walk a pawn up the board, short enough that a stray click spree stays harmless. */
const MAX_QUEUE = 12;

/** What the board needs to let you queue premoves. */
export interface PremoveControl {
  /** Moves you could queue next, from the board as it will look after the queue. */
  moves: Move[];
  queue: Move[];
  /** The board with every queued move already played, which is what you see. */
  preview: Position | null;
  onQueue: (move: Move) => void;
  onCancel: () => void;
}

interface Options {
  pos: Position;
  me: Color | null;
  playing: boolean;
  myTurn: boolean;
  onMove: (move: Move) => void;
}

/** Plays the queue on a copy where it is always our turn. The opponent's replies are unknown, so they are left out. */
function playQueue(pos: Position, me: Color, queue: Move[]): Position {
  let board: Position = { ...clonePosition(pos), turn: me, ep: null, movesLeft: 1 };
  for (const move of queue) {
    board = { ...makeMove(board, move).pos, turn: me, ep: null, movesLeft: 1 };
  }
  return board;
}

/**
 * Returns null when premoves are not possible right now: on your own turn
 * with nothing queued, for spectators, after the game, and in duck chess
 * where the extra duck placement makes a queued move ambiguous.
 */
export function usePremove({ pos, me, playing, myTurn, onMove }: Options): PremoveControl | null {
  const [queue, setQueue] = useState<Move[]>([]);
  const allowed = playing && me !== null && !pos.rules.duck;
  const waiting = allowed && pos.turn !== me;
  const key = positionKey(pos);

  const preview = useMemo(
    () => (allowed && me && queue.length ? playQueue(pos, me, queue) : null),
    [allowed, me, key, queue], // eslint-disable-line react-hooks/exhaustive-deps
  );

  // Pseudo moves from the previewed board. Legality is only checked once the
  // turn really arrives, since the opponent will change the board. Drops are left out.
  const moves = useMemo(() => {
    if (!waiting || !me || queue.length >= MAX_QUEUE) return [];
    const from: Position = preview ?? { ...clonePosition(pos), turn: me, ep: null, movesLeft: 1 };
    return pseudoMoves(from).filter((m) => !m.drop);
  }, [waiting, me, key, preview, queue.length]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!allowed) setQueue([]);
  }, [allowed]);

  // Our turn just started: play the first queued move if the real board allows it.
  useEffect(() => {
    if (!myTurn || !queue.length) return;
    const [next, ...rest] = queue;
    const move = matchLegal(pos, next);
    setQueue(move ? rest : []);
    if (move) onMove(move);
  }, [myTurn, key]); // eslint-disable-line react-hooks/exhaustive-deps

  // Escape throws away every queued premove, wherever the pointer is.
  const queued = queue.length > 0;
  useEffect(() => {
    if (!queued) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setQueue([]);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [queued]);

  const onQueue = useCallback((move: Move) => setQueue((q) => (q.length < MAX_QUEUE ? [...q, move] : q)), []);
  const onCancel = useCallback(() => setQueue([]), []);

  return useMemo(
    () => (waiting ? { moves, queue, preview, onQueue, onCancel } : null),
    [waiting, moves, queue, preview, onQueue, onCancel],
  );
}
