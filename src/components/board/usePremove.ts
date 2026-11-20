"use client";

/**
 * One queued premove, chess.com style. While the opponent is thinking you
 * can pick up your own piece and drop it. When your turn comes the move is
 * played at once if it is still legal, and quietly dropped if not.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { clonePosition, matchLegal, positionKey, pseudoMoves, type Color, type Move, type Position } from "@/engine";

/** What the board needs to let you queue a premove. */
export interface PremoveControl {
  /** Moves you could queue, generated as if it were already your turn. */
  moves: Move[];
  queued: Move | null;
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

/**
 * Returns null when premoves are not possible right now: on your own turn,
 * for spectators, after the game, and in duck chess where the extra duck
 * placement makes a queued move ambiguous.
 */
export function usePremove({ pos, me, playing, myTurn, onMove }: Options): PremoveControl | null {
  const [queued, setQueued] = useState<Move | null>(null);
  const allowed = playing && me !== null && !pos.rules.duck;
  const waiting = allowed && pos.turn !== me;
  const key = positionKey(pos);

  // Pseudo moves on a copy where it is our turn. Legality is only checked
  // once the turn really arrives, since the opponent will change the board.
  // Drops are left out on purpose.
  const moves = useMemo(() => {
    if (!waiting || !me) return [];
    const mine: Position = { ...clonePosition(pos), turn: me, ep: null, movesLeft: 1 };
    return pseudoMoves(mine).filter((m) => !m.drop);
  }, [waiting, me, key]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!allowed) setQueued(null);
  }, [allowed]);

  // Our turn just started: play the queued move if the new position allows it.
  useEffect(() => {
    if (!myTurn || !queued) return;
    setQueued(null);
    const move = matchLegal(pos, queued);
    if (move) onMove(move);
  }, [myTurn, key]); // eslint-disable-line react-hooks/exhaustive-deps

  const onCancel = useCallback(() => setQueued(null), []);

  return useMemo(
    () => (waiting ? { moves, queued, onQueue: setQueued, onCancel } : null),
    [waiting, moves, queued, onCancel],
  );
}
