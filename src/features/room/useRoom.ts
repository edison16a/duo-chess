"use client";

/**
 * Connects a tab to a room. The tab that created the code becomes the host
 * (and resumes hosting after a refresh); everyone else is a guest who sends
 * actions and renders whatever the host publishes.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { RoomChannel, type ChannelStatus } from "@/features/net";
import { HostController } from "./host";
import { clientId, isHosting, playerName } from "./identity";
import { createRoom } from "./reducer";
import type { RoomAction, RoomState } from "./types";

/** "taken": this tab meant to host, but someone else's live room already has the code. */
export type RoomStatus = "connecting" | "ready" | "missing" | "closed" | "taken";

/** Actions as the UI sends them; the hook stamps the player id on. */
export type ClientAction = RoomAction extends infer A ? (A extends { id: string } ? Omit<A, "id"> : never) : never;

export interface RoomHandle {
  status: RoomStatus;
  link: ChannelStatus;
  room: RoomState | null;
  myId: string;
  isHost: boolean;
  /** Milliseconds to subtract from Date.now() to get host time. */
  hostOffset: number;
  hostOnline: boolean;
  send: (action: ClientAction) => void;
  closeRoom: () => void;
}

const RETAINED_WAIT_MS = 1500;
const MISSING_AFTER_MS = 6000;

export function useRoom(code: string): RoomHandle {
  const [room, setRoom] = useState<RoomState | null>(null);
  const [status, setStatus] = useState<RoomStatus>("connecting");
  const [link, setLink] = useState<ChannelStatus>("connecting");
  const [isHost, setIsHost] = useState(false);
  const [hostOnline, setHostOnline] = useState(true);
  const [hostOffset, setHostOffset] = useState(0);
  const [myId] = useState(() => (typeof window === "undefined" ? "" : clientId()));
  const channelRef = useRef<RoomChannel | null>(null);
  const hostRef = useRef<HostController | null>(null);
  const roomRef = useRef<RoomState | null>(null);

  useEffect(() => {
    let disposed = false;
    let lastJoin = 0;
    const wantsHost = isHosting(code);
    let retained: RoomState | null = null;

    const becomeHost = (initial: RoomState) => {
      setIsHost(true);
      hostRef.current = new HostController(initial, channel, (s) => {
        roomRef.current = s;
        setRoom(s);
      });
      hostRef.current.dispatch({ type: "join", id: myId, name: playerName() });
      setStatus("ready");
    };

    const channel = new RoomChannel(code, myId, wantsHost, {
      onStatus: setLink,
      onState: (state) => {
        if (disposed) return;
        if (hostRef.current) return;
        if (!state) {
          if (roomRef.current) setStatus("closed");
          retained = null;
          return;
        }
        retained = state;
        if (wantsHost && state.hostId === myId) return;
        // A fresh host never joins a stranger's room that happens to share the code.
        if (wantsHost && state.hostId !== myId) {
          setStatus("taken");
          return;
        }
        roomRef.current = state;
        setRoom(state);
        setHostOffset(Date.now() - state.updatedAt);
        setStatus("ready");
        const seated = state.players.some((p) => p.id === myId);
        if (!seated && Date.now() - lastJoin > 1500) {
          lastJoin = Date.now();
          channel.sendAction({ type: "join", id: myId, name: playerName() });
        }
      },
      onAction: (action) => hostRef.current?.dispatch(action),
      onPresence: (id, online) => {
        if (hostRef.current) hostRef.current.dispatch({ type: "presence", id, online });
        else if (id === roomRef.current?.hostId) setHostOnline(online);
      },
      onSubscribed: () => {
        if (!wantsHost) return;
        // Give the broker a moment to deliver a retained snapshot we can resume from.
        setTimeout(() => {
          if (disposed || hostRef.current) return;
          if (retained && retained.hostId !== myId) { setStatus("taken"); return; }
          becomeHost(retained ?? createRoom(code, myId, playerName(), Date.now()));
        }, RETAINED_WAIT_MS);
      },
    });
    channelRef.current = channel;

    const missing = setTimeout(() => {
      if (!disposed && !roomRef.current) setStatus("missing");
    }, MISSING_AFTER_MS);

    return () => {
      disposed = true;
      clearTimeout(missing);
      hostRef.current?.dispose();
      hostRef.current = null;
      channel.close();
    };
  }, [code, myId]);

  const send = useCallback((action: ClientAction) => {
    const full = { ...action, id: myId } as RoomAction;
    if (hostRef.current) hostRef.current.dispatch(full);
    else channelRef.current?.sendAction(full);
  }, [myId]);

  const closeRoom = useCallback(() => hostRef.current?.closeRoom(), []);

  return { status, link, room, myId, isHost, hostOffset, hostOnline, send, closeRoom };
}
