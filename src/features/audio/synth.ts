/**
 * Tiny Web Audio building blocks. Every sound in the game is synthesized
 * from these, so there are no audio files to load or license.
 */

let ctx: AudioContext | null = null;

export function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

interface ToneOpts {
  freq: number;
  to?: number;
  type?: OscillatorType;
  start?: number;
  duration: number;
  gain?: number;
  attack?: number;
}

export function tone(ac: AudioContext, out: AudioNode, o: ToneOpts): void {
  const t = ac.currentTime + (o.start ?? 0);
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = o.type ?? "sine";
  osc.frequency.setValueAtTime(o.freq, t);
  if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t + o.duration);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(o.gain ?? 0.2, t + (o.attack ?? 0.005));
  g.gain.exponentialRampToValueAtTime(0.0001, t + o.duration);
  osc.connect(g).connect(out);
  osc.start(t);
  osc.stop(t + o.duration + 0.05);
}

interface NoiseOpts {
  start?: number;
  duration: number;
  gain?: number;
  filter?: BiquadFilterType;
  freq: number;
  freqTo?: number;
  q?: number;
}

export function noise(ac: AudioContext, out: AudioNode, o: NoiseOpts): void {
  const t = ac.currentTime + (o.start ?? 0);
  const length = Math.ceil(ac.sampleRate * o.duration);
  const buffer = ac.createBuffer(1, length, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  const src = ac.createBufferSource();
  src.buffer = buffer;
  const filter = ac.createBiquadFilter();
  filter.type = o.filter ?? "bandpass";
  filter.frequency.setValueAtTime(o.freq, t);
  if (o.freqTo) filter.frequency.exponentialRampToValueAtTime(o.freqTo, t + o.duration);
  filter.Q.value = o.q ?? 1;
  const g = ac.createGain();
  g.gain.setValueAtTime(o.gain ?? 0.3, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + o.duration);
  src.connect(filter).connect(g).connect(out);
  src.start(t);
}
