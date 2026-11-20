"use client";

/**
 * A room that lives entirely in this tab. The player hosts, the bot takes
 * the second seat and nothing touches the network. It returns the same
 * handle as useRoom, so the lobby and game screens work unchanged.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { BOT_ID, BotBrain, BotEngines, BotPlayer, botName } from "@/features/bot";
import { MODE_BY_ID, type GameConfig } from "@/features/modes";
import { HostController, LOCAL_CHANNEL } from "./host";
import { clientId, playerName } from "./identity";
import { createRoom } from "./reducer";
import type { RoomAction, RoomState } from "./types";
import type { ClientAction, RoomHandle } from "./useRoom";

/** Shown where an online room shows its code. */
export const LOCAL_CODE = "BOT";

export interface LocalRoomHandle extends RoomHandle {
  /** Drops the current game and returns to the lobby with the same settings. */
  newGame: () => void;
}

export function useLocalRoom(elo: number): LocalRoomHandle {
  const [room, setRoom] = useState<RoomState | null>(null);
  const [myId] = useState(() => (typeof window === "undefined" ? "" : clientId()));
  const [generation, setGeneration] = useState(0);
  const hostRef = useRef<HostController | null>(null);
  const botRef = useRef<BotPlayer | null>(null);
  const eloRef = useRef(elo);
  // Survives newGame so the mode and mods the player picked stay put.
  const configRef = useRef<GameConfig | null>(null);

  useEffect(() => {
    if (!myId) return;
    const engines = new BotEngines();
    let bot: BotPlayer | null = null;
    const base = createRoom(LOCAL_CODE, myId, playerName(), Date.now());
    const initial = configRef.current ? { ...base, config: configRef.current } : base;
    const host = new HostController(initial, LOCAL_CHANNEL, (state) => {
      configRef.current = state.config;
      setRoom(state);
      engines.warm(MODE_BY_ID[state.config.mode].analysis);
      bot?.observe(state);
    });
    bot = new BotPlayer(
      { state: () => host.current, dispatch: (action) => host.dispatch(action) },
      { elo: eloRef.current, brain: new BotBrain(engines) },
    );
    host.dispatch({ type: "join", id: BOT_ID, name: botName(eloRef.current) });
    hostRef.current = host;
    botRef.current = bot;
    return () => {
      bot?.dispose();
      host.dispose();
      engines.dispose();
      hostRef.current = null;
      botRef.current = null;
    };
  }, [myId, generation]);

  useEffect(() => {
    eloRef.current = elo;
    botRef.current?.setElo(elo);
    hostRef.current?.dispatch({ type: "rename", id: BOT_ID, name: botName(elo) });
  }, [elo]);

  const send = useCallback((action: ClientAction) => {
    hostRef.current?.dispatch({ ...action, id: myId } as RoomAction);
  }, [myId]);

  const closeRoom = useCallback(() => hostRef.current?.closeRoom(), []);
  const newGame = useCallback(() => setGeneration((g) => g + 1), []);

  return {
    status: room ? "ready" : "connecting",
    link: "online",
    room,
    myId,
    isHost: true,
    hostOffset: 0,
    hostOnline: true,
    send,
    closeRoom,
    newGame,
  };
}
