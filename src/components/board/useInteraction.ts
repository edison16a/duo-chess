"use client";

/**
 * Click and drag handling for the board. Holds the selection, pending
 * promotion and pending duck placement, and turns them into a final move.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { makeMove, positionKey, type Move, type PieceKind, type Position } from "@/engine";

export interface Targeting {
  valid: (square: number) => boolean;
  onPick: (square: number) => void;
}

interface Options {
  pos: Position;
  legal: Move[];
  onMove: (move: Move) => void;
  targeting: Targeting | null;
  dropKind: PieceKind | null;
  /** Premoves skip the promotion picker and always promote to a queen. */
  autoQueen?: boolean;
}

export interface Interaction {
  selected: number | null;
  targets: Map<number, Move[]>;
  promotion: { square: number; moves: Move[] } | null;
  duckFor: Move | null;
  duckSquares: Set<number>;
  pressSquare: (square: number) => boolean;
  releaseSquare: (square: number | null, dragged: boolean) => void;
  choosePromotion: (move: Move | null) => void;
}

/** Group legal moves by destination; castling is also reachable by clicking the rook. */
function targetMap(moves: Move[]): Map<number, Move[]> {
  const map = new Map<number, Move[]>();
  const add = (square: number, move: Move) => map.set(square, [...(map.get(square) ?? []), move]);
  for (const m of moves) {
    add(m.to, m);
    if (m.castle && m.castle.rookFrom !== m.to) add(m.castle.rookFrom, m);
  }
  return map;
}

export function useInteraction({ pos, legal, onMove, targeting, dropKind, autoQueen = false }: Options): Interaction {
  const [selected, setSelected] = useState<number | null>(null);
  const [promotion, setPromotion] = useState<Interaction["promotion"]>(null);
  const [duckFor, setDuckFor] = useState<Move | null>(null);

  // A new position or a new input mode clears half finished input. We key on
  // the position hash, not the object, because every network update is a
  // fresh object even when nothing on the board moved. A selected piece that
  // is still standing on its square stays selected, so the opponent moving
  // (or a queued premove playing) never knocks you out of a premove chain.
  const key = positionKey(pos);
  const aiming = targeting !== null;
  const selectedId = selected !== null ? pos.board[selected]?.id ?? null : null;
  const [heldId, setHeldId] = useState<number | null>(null);
  useEffect(() => setHeldId(selectedId), [selected]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    setPromotion(null);
    setDuckFor(null);
    if (selected !== null && heldId !== null && pos.board[selected]?.id === heldId) return;
    setSelected(null);
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    setSelected(null);
    setPromotion(null);
    setDuckFor(null);
  }, [aiming, dropKind]);

  const targets = useMemo(() => {
    if (dropKind) return targetMap(legal.filter((m) => m.drop === dropKind));
    if (selected === null) return new Map<number, Move[]>();
    return targetMap(legal.filter((m) => m.from === selected && !m.drop));
  }, [legal, selected, dropKind]);

  const duckSquares = useMemo(() => {
    if (!duckFor) return new Set<number>();
    const after = makeMove(pos, duckFor).pos;
    const current = pos.board.findIndex((p) => p?.kind === "duck");
    const out = new Set<number>();
    after.board.forEach((p, i) => { if (!p && i !== current && !pos.holes.includes(i)) out.add(i); });
    return out;
  }, [duckFor, pos]);

  const commit = useCallback((move: Move) => {
    setSelected(null);
    setPromotion(null);
    if (pos.rules.duck) setDuckFor(move);
    else onMove(move);
  }, [onMove, pos.rules.duck]);

  const tryTarget = useCallback((square: number): boolean => {
    const moves = targets.get(square);
    if (!moves?.length) return false;
    const promoting = moves.length > 1 && moves.every((m) => m.promotion);
    if (promoting && autoQueen) commit(moves.find((m) => m.promotion === "queen") ?? moves[0]);
    else if (promoting) setPromotion({ square, moves });
    else commit(moves.find((m) => m.castle) ?? moves[0]);
    return true;
  }, [targets, commit, autoQueen]);

  /** Pointer down. Returns true when a drag may start from this square. */
  const pressSquare = useCallback((square: number): boolean => {
    if (targeting) {
      if (targeting.valid(square)) targeting.onPick(square);
      return false;
    }
    if (duckFor) {
      if (duckSquares.has(square)) {
        onMove({ ...duckFor, duckTo: square });
        setDuckFor(null);
      }
      return false;
    }
    if (promotion) return false;
    if (selected !== null && selected !== square && tryTarget(square)) return false;
    if (dropKind && tryTarget(square)) return false;
    if (legal.some((m) => m.from === square && !m.drop)) {
      setSelected(square);
      return true;
    }
    setSelected(null);
    return false;
  }, [targeting, duckFor, duckSquares, onMove, promotion, selected, tryTarget, dropKind, legal]);

  /** Pointer up after a drag (or a click on the same square, which keeps the selection). */
  const releaseSquare = useCallback((square: number | null, dragged: boolean) => {
    if (!dragged || square === null || square === selected) return;
    if (!tryTarget(square)) setSelected(null);
  }, [selected, tryTarget]);

  const choosePromotion = useCallback((move: Move | null) => {
    setPromotion(null);
    if (move) commit(move);
  }, [commit]);

  return { selected, targets, promotion, duckFor, duckSquares, pressSquare, releaseSquare, choosePromotion };
}
