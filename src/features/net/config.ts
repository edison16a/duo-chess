/**
 * Where rooms live. By default we use a free public MQTT broker over secure
 * WebSockets, so the app works on Vercel with zero setup. Point
 * NEXT_PUBLIC_MQTT_URL at your own broker (or ws://localhost:8883 from
 * `npm run broker`) to swap it.
 */
export const BROKER_URL = process.env.NEXT_PUBLIC_MQTT_URL || "wss://broker.emqx.io:8084/mqtt";

export const TOPIC_ROOT = "duochess/v1/room";

/** Retained room snapshots expire on their own, so abandoned games clean themselves up. */
export const ROOM_TTL_SECONDS = 6 * 60 * 60;

export const topics = {
  state: (code: string) => `${TOPIC_ROOT}/${code}/state`,
  action: (code: string) => `${TOPIC_ROOT}/${code}/action`,
  presence: (code: string, id: string) => `${TOPIC_ROOT}/${code}/presence/${id}`,
  presenceAll: (code: string) => `${TOPIC_ROOT}/${code}/presence/+`,
};
