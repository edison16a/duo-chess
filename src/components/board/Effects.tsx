"use client";

/**
 * Plays one shot animations for the events of the latest action:
 * explosions, power effects, warps, captures. Also fires the matching
 * sounds so sight and sound always line up.
 */

import { useEffect, useRef, useState } from "react";
import type { Color, GameEvent, Position } from "@/engine";
import { playEventSounds as playSounds } from "@/features/audio/eventSounds";
import { POWERS } from "@/features/powers";
import { POWER_ICONS } from "@/features/powers/icons";
import { RARITY_COLOR } from "@/features/powers/rarity";
import { GlyphIcon } from "@/components/ui/icons";
import { cellStyle } from "./layout";
import fx from "./effects.module.css";

interface Burst {
  id: number;
  kind: "explosion" | "blast" | "capture" | "destroy" | "warp" | "mine" | "power" | "check" | "promote";
  square: number;
  vfx?: string;
  power?: string;
  color?: string;
}

const PARTICLES = Array.from({ length: 10 }, (_, i) => i);
let nextId = 1;

function bursts(events: GameEvent[]): Burst[] {
  const out: Burst[] = [];
  for (const e of events) {
    const id = nextId++;
    if (e.type === "explosion") {
      out.push({ id, kind: "explosion", square: e.square });
      e.squares.filter((s) => s !== e.square).forEach((s) => out.push({ id: nextId++, kind: "blast", square: s }));
    } else if (e.type === "capture") out.push({ id, kind: "capture", square: e.square });
    else if (e.type === "destroy") out.push({ id, kind: "destroy", square: e.square });
    else if (e.type === "warp") out.push({ id, kind: "warp", square: e.to }, { id: nextId++, kind: "warp", square: e.from });
    else if (e.type === "mine") out.push({ id, kind: "mine", square: e.square });
    else if (e.type === "check") out.push({ id, kind: "check", square: e.square });
    else if (e.type === "promote") out.push({ id, kind: "promote", square: e.square });
    else if (e.type === "power") {
      const def = POWERS[e.power];
      for (const s of e.squares.length ? e.squares : [-1]) {
        out.push({ id: nextId++, kind: "power", square: s, vfx: def?.vfx, power: e.power, color: def ? RARITY_COLOR[def.rarity] : undefined });
      }
    }
  }
  return out;
}

export function Effects({ pos, orientation, events, seq, onShake }: { pos: Position; orientation: Color; events: GameEvent[]; seq: number; onShake: () => void }) {
  const [active, setActive] = useState<Burst[]>([]);
  const seen = useRef(seq);

  useEffect(() => {
    if (seq === seen.current) return;
    seen.current = seq;
    const fresh = bursts(events);
    playSounds(events);
    if (events.some((e) => e.type === "explosion")) onShake();
    if (!fresh.length) return;
    setActive((list) => [...list, ...fresh]);
    const ids = new Set(fresh.map((b) => b.id));
    // No cleanup on purpose: re-renders must not cancel an animation mid flight.
    setTimeout(() => setActive((list) => list.filter((b) => !ids.has(b.id))), 1600);
  }, [seq, events, onShake]);

  return (
    <div className={fx.layer}>
      {active.map((b) => {
        const style = b.square >= 0 ? cellStyle(pos, b.square, orientation) : { inset: 0, width: "100%", height: "100%" };
        return (
          <div key={b.id} className={`${fx.burst} ${fx[b.kind]} ${b.vfx ? fx[`vfx_${b.vfx}`] : ""}`} style={{ ...style, ["--fx" as string]: b.color }}>
            <span className={fx.ring} />
            {(b.kind === "explosion" || b.kind === "power" || b.kind === "destroy") && PARTICLES.map((i) => (
              <span key={i} className={fx.particle} style={{ ["--a" as string]: `${i * 36}deg`, ["--d" as string]: `${60 + (i % 3) * 25}%` }} />
            ))}
            {b.kind === "power" && b.power && POWER_ICONS[b.power] && (
              <span className={fx.powerIcon}>
                <GlyphIcon size={44}>{POWER_ICONS[b.power]}</GlyphIcon>
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
