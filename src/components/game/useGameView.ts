"use client";

/**
 * All the derived state behind the game screen: whose view it is, legal
 * moves, optimistic moves, power aiming, ratings and the sounds tied to
 * them. GameView itself just lays things out.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  PIECES, inCheck, legalMoves, opposite, playMove, positionKey, royalSquares,
  type Color, type GameState, type Move, type PieceKind,
} from "@/engine";
import { sfx } from "@/features/audio/sounds";
import { POWERS, RARITY_COLOR, canUsePowerNow } from "@/features/powers";
import { colorOf } from "@/features/room/reducer";
import type { RoomHandle } from "@/features/room/useRoom";
import { loadTheme, saveTheme, BOARD_THEMES, type BoardTheme } from "@/components/board/themes";

export function useGameView(handle: RoomHandle) {
  const room = handle.room!;
  const me = colorOf(room, handle.myId);
  const [flipped, setFlipped] = useState(false);
  const [theme, setTheme] = useState<BoardTheme>(BOARD_THEMES[0]);
  const [pending, setPending] = useState<GameState | null>(null);
  const [aiming, setAiming] = useState<{ power: string; squares: number[] } | null>(null);
  const [dropKind, setDropKind] = useState<PieceKind | null>(null);

  useEffect(() => {
    setTheme(loadTheme());
  }, []);

  const serverGame = room.game!;
  // Drop the optimistic copy as soon as the host confirms anything.
  useEffect(() => {
    setPending(null);
  }, [serverGame.eventSeq]);
  const game = pending ?? serverGame;
  const pos = game.pos;
  const key = positionKey(pos);
  const playing = room.phase === "playing" && !game.result;
  const myTurn = playing && me !== null && pos.turn === me;

  const legal = useMemo(() => (myTurn && !aiming ? legalMoves(pos) : []), [myTurn, aiming, key]); // eslint-disable-line react-hooks/exhaustive-deps

  const onMove = useCallback((move: Move) => {
    const next = playMove(serverGame, move);
    if (next) setPending(next);
    setDropKind(null);
    handle.send({ type: "move", move });
  }, [serverGame, handle]);

  const firePower = useCallback((power: string, squares: number[]) => {
    setAiming(null);
    handle.send({ type: "power", power, squares });
  }, [handle]);

  const pickPower = useCallback((power: string) => {
    if (aiming?.power === power) return setAiming(null);
    const def = POWERS[power];
    if (!def) return;
    if (def.targets.length === 0) firePower(power, []);
    else setAiming({ power, squares: [] });
  }, [aiming, firePower]);

  const targeting = useMemo(() => {
    if (!aiming || !me) return null;
    const def = POWERS[aiming.power];
    const step = def.targets[aiming.squares.length];
    if (!step) return null;
    const ctx = { pos, color: me, enemy: opposite(me), lost: game.lost, squares: aiming.squares };
    return {
      color: RARITY_COLOR[def.rarity],
      valid: (s: number) => !aiming.squares.includes(s) && step.valid(ctx, s),
      onPick: (s: number) => {
        const squares = [...aiming.squares, s];
        if (squares.length === def.targets.length) firePower(aiming.power, squares);
        else setAiming({ ...aiming, squares });
      },
    };
  }, [aiming, me, pos, game.lost, firePower]);

  const checkSquares = pos.rules.checkRules && inCheck(pos, pos.turn) ? royalSquares(pos, pos.turn) : [];

  const last = game.history[game.history.length - 1];
  const rating = room.config.mods.ratings && last?.rating && !last.power
    ? { square: last.move.to, id: last.rating, key: `${last.ply}` }
    : null;

  // Sounds for ratings, game start and game end, each played once.
  const rated = useRef(new Set<number>());
  useEffect(() => {
    if (rating && !rated.current.has(last.ply)) {
      rated.current.add(last.ply);
      sfx.rating(rating.id);
    }
  }, [rating, last]);
  const phaseRef = useRef(room.phase);
  useEffect(() => {
    if (phaseRef.current !== room.phase) {
      if (room.phase === "playing") sfx.start();
      if (room.phase === "over") sfx.end();
      phaseRef.current = room.phase;
    }
  }, [room.phase]);

  const material = (c: Color) => pos.board.reduce((sum, p) => sum + (p && p.color === c ? PIECES[p.kind].value : 0), 0);
  const notice = room.notice && room.notice.to === handle.myId ? room.notice : null;

  return {
    room, game, pos, me, playing, myTurn, legal, onMove, theme,
    setTheme: (id: string) => { const t = BOARD_THEMES.find((b) => b.id === id)!; saveTheme(id); setTheme(t); },
    orientation: ((me ?? "w") === "w") !== flipped ? ("w" as Color) : ("b" as Color),
    flip: () => setFlipped((f) => !f),
    aiming: aiming ? { power: aiming.power, step: aiming.squares.length } : null,
    pickPower, cancelAim: () => setAiming(null), targeting,
    canUsePower: me !== null && canUsePowerNow(game, me) && playing,
    dropKind, setDropKind, checkSquares, rating, material, notice,
  };
}
