/** The game's sound palette, built from synth.ts. */

import type { RatingId } from "@/engine";
import type { PowerVfx } from "@/features/powers";
import { audio, noise, tone } from "./synth";

let muted = false;
const KEY = "duochess.muted";

try {
  muted = typeof localStorage !== "undefined" && localStorage.getItem(KEY) === "1";
} catch {
  muted = false;
}

export function isMuted(): boolean {
  return muted;
}

export function setMuted(value: boolean): void {
  muted = value;
  try {
    localStorage.setItem(KEY, value ? "1" : "0");
  } catch {
    // Storage can be blocked; the toggle still works for this visit.
  }
}

function play(build: (ac: AudioContext, out: AudioNode) => void, volume = 0.8): void {
  if (muted) return;
  const ac = audio();
  if (!ac) return;
  const master = ac.createGain();
  master.gain.value = volume;
  master.connect(ac.destination);
  build(ac, master);
}

/** A wooden knock: short filtered noise over a low thump. */
const knock = (ac: AudioContext, out: AudioNode, start = 0, pitch = 1) => {
  noise(ac, out, { start, duration: 0.07, freq: 1800 * pitch, q: 2.5, gain: 0.5 });
  tone(ac, out, { start, freq: 180 * pitch, to: 90 * pitch, duration: 0.09, gain: 0.35, type: "triangle" });
};

export const sfx = {
  move: () => play((ac, o) => knock(ac, o)),
  capture: () => play((ac, o) => { knock(ac, o, 0, 0.8); knock(ac, o, 0.045, 1.2); }),
  castle: () => play((ac, o) => { knock(ac, o); knock(ac, o, 0.11, 1.1); }),
  check: () => play((ac, o) => { knock(ac, o); tone(ac, o, { freq: 880, duration: 0.18, gain: 0.12, start: 0.02 }); }),
  start: () => play((ac, o) => [523, 659, 784].forEach((f, i) => tone(ac, o, { freq: f, duration: 0.25, start: i * 0.08, gain: 0.1 }))),
  end: () => play((ac, o) => [784, 659, 523, 392].forEach((f, i) => tone(ac, o, { freq: f, duration: 0.3, start: i * 0.1, gain: 0.1 }))),
  notify: () => play((ac, o) => { tone(ac, o, { freq: 660, duration: 0.12, gain: 0.1 }); tone(ac, o, { freq: 990, duration: 0.16, start: 0.09, gain: 0.1 }); }),
  lowTime: () => play((ac, o) => tone(ac, o, { freq: 1200, duration: 0.05, gain: 0.08, type: "square" }), 0.5),
  explosion: () => play((ac, o) => {
    noise(ac, o, { duration: 0.9, freq: 1200, freqTo: 60, filter: "lowpass", gain: 0.9 });
    tone(ac, o, { freq: 120, to: 35, duration: 0.6, gain: 0.5, type: "sine" });
  }),
  rating: (id: RatingId) => play((ac, o) => {
    if (id === "legendary") {
      [523, 659, 784, 1047, 1319].forEach((f, i) => tone(ac, o, { freq: f, duration: 0.6, start: i * 0.07, gain: 0.09, type: "triangle" }));
      noise(ac, o, { duration: 0.8, freq: 6000, q: 0.7, gain: 0.05, start: 0.2 });
    } else if (id === "brilliant") {
      [784, 988, 1175, 1568].forEach((f, i) => tone(ac, o, { freq: f, duration: 0.45, start: i * 0.06, gain: 0.08, type: "triangle" }));
    } else if (id === "great") {
      [659, 988].forEach((f, i) => tone(ac, o, { freq: f, duration: 0.3, start: i * 0.08, gain: 0.08 }));
    } else if (id === "blunder") {
      tone(ac, o, { freq: 220, to: 110, duration: 0.45, gain: 0.14, type: "sawtooth" });
      tone(ac, o, { freq: 233, to: 116, duration: 0.45, gain: 0.08, type: "square" });
    } else if (id === "mistake") {
      tone(ac, o, { freq: 330, to: 220, duration: 0.3, gain: 0.1, type: "triangle" });
    } else if (id === "inaccuracy") {
      tone(ac, o, { freq: 440, to: 392, duration: 0.2, gain: 0.07, type: "triangle" });
    }
  }),
  power: (vfx: PowerVfx) => play((ac, o) => {
    switch (vfx) {
      case "frost":
        [1568, 2093, 2637].forEach((f, i) => tone(ac, o, { freq: f, duration: 0.5, start: i * 0.05, gain: 0.05 }));
        noise(ac, o, { duration: 0.5, freq: 7000, q: 3, gain: 0.08 });
        break;
      case "fire":
        noise(ac, o, { duration: 0.7, freq: 400, freqTo: 2000, filter: "bandpass", q: 0.8, gain: 0.5 });
        break;
      case "storm":
        noise(ac, o, { duration: 0.35, freq: 3000, q: 0.5, gain: 0.6 });
        tone(ac, o, { freq: 90, to: 40, duration: 0.5, gain: 0.4 });
        break;
      case "void":
        tone(ac, o, { freq: 300, to: 50, duration: 0.8, gain: 0.25, type: "sawtooth" });
        break;
      case "holy":
        [523, 659, 784, 1047].forEach((f) => tone(ac, o, { freq: f, duration: 0.9, gain: 0.05, attack: 0.08 }));
        break;
      case "shield":
        tone(ac, o, { freq: 440, to: 880, duration: 0.35, gain: 0.12, type: "triangle" });
        break;
      case "rainbow":
        [523, 587, 659, 784, 880, 1047, 1175].forEach((f, i) => tone(ac, o, { freq: f, duration: 0.4, start: i * 0.05, gain: 0.06, type: "triangle" }));
        break;
      case "smoke":
        noise(ac, o, { duration: 0.8, freq: 500, filter: "lowpass", gain: 0.3 });
        break;
      case "earth":
        tone(ac, o, { freq: 80, to: 50, duration: 0.5, gain: 0.4 });
        noise(ac, o, { duration: 0.4, freq: 300, filter: "lowpass", gain: 0.4 });
        break;
      default:
        tone(ac, o, { freq: 600, to: 1400, duration: 0.25, gain: 0.1 });
    }
  }),
};
