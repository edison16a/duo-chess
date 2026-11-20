/**
 * One MQTT connection per room. The host publishes the room as a retained
 * message (the "database": it sits on the broker until the room closes or
 * expires) and listens for actions; everyone tracks presence with retained
 * flags plus a last will so a closed tab shows up as offline.
 */

import mqtt, { type MqttClient } from "mqtt";
import type { RoomAction, RoomState } from "@/features/room/types";
import { BROKER_URL, ROOM_TTL_SECONDS, topics } from "./config";

export type ChannelStatus = "connecting" | "online" | "offline";

export interface ChannelHandlers {
  onState: (state: RoomState | null) => void;
  onAction?: (action: RoomAction) => void;
  onPresence: (id: string, online: boolean) => void;
  onStatus: (status: ChannelStatus) => void;
  /** Fires once the subscriptions are acknowledged, so retained messages have had a chance to arrive. */
  onSubscribed?: () => void;
}

export class RoomChannel {
  private client: MqttClient;

  constructor(private code: string, private clientId: string, listenForActions: boolean, handlers: ChannelHandlers) {
    const presenceTopic = topics.presence(code, clientId);
    this.client = mqtt.connect(BROKER_URL, {
      protocolVersion: 5,
      clientId: `dc_${clientId}_${Math.random().toString(36).slice(2, 8)}`,
      clean: true,
      reconnectPeriod: 2000,
      connectTimeout: 10_000,
      will: { topic: presenceTopic, payload: "", retain: true, qos: 1 },
    });

    this.client.on("connect", () => {
      handlers.onStatus("online");
      const subs = [topics.state(code), topics.presenceAll(code)];
      if (listenForActions) subs.push(topics.action(code));
      this.client.subscribe(subs, { qos: 1 }, () => handlers.onSubscribed?.());
      this.client.publish(presenceTopic, "1", { retain: true, qos: 1, properties: { messageExpiryInterval: ROOM_TTL_SECONDS } });
    });
    this.client.on("reconnect", () => handlers.onStatus("connecting"));
    this.client.on("offline", () => handlers.onStatus("offline"));
    this.client.on("message", (topic, payload) => {
      const text = payload.toString();
      if (topic === topics.state(code)) {
        handlers.onState(text ? (JSON.parse(text) as RoomState) : null);
      } else if (topic === topics.action(code) && text) {
        handlers.onAction?.(JSON.parse(text) as RoomAction);
      } else if (topic.startsWith(topics.presence(code, ""))) {
        handlers.onPresence(topic.slice(topics.presence(code, "").length), text === "1");
      }
    });
  }

  publishState(state: RoomState): void {
    this.client.publish(topics.state(this.code), JSON.stringify(state), {
      retain: true,
      qos: 1,
      properties: { messageExpiryInterval: ROOM_TTL_SECONDS },
    });
  }

  /** An empty retained message deletes the room from the broker. */
  clearState(): void {
    this.client.publish(topics.state(this.code), "", { retain: true, qos: 1 });
  }

  sendAction(action: RoomAction): void {
    this.client.publish(topics.action(this.code), JSON.stringify(action), { qos: 1 });
  }

  close(): void {
    this.client.publish(topics.presence(this.code, this.clientId), "", { retain: true, qos: 1 }, () => this.client.end());
  }
}
