"use client";

// A soft mechanical tick for the measuring tape, made with Web Audio (no sound files). Browsers only
// allow sound after a tap or key press, so the ruler calls primeTick() when it's touched. Ticks are
// throttled, so a fast fling purrs instead of buzzing.

let ctx: AudioContext | null = null;
let last = 0;

export function primeTick() {
  if (typeof window === "undefined") return;
  if (!ctx) {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    ctx = new Ctx();
  }
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
}

/** strength: 1 for a centimetre, a little more for every fifth. */
export function tick(strength = 1) {
  if (!ctx || ctx.state !== "running") return;
  const now = ctx.currentTime;
  if (now - last < 0.024) return;
  last = now;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(2300 + Math.random() * 160, now);
  osc.frequency.exponentialRampToValueAtTime(700, now + 0.03);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.05 * strength, now + 0.002);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
  osc.connect(gain).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.05);
}
