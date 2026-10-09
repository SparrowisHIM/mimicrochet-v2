"use client";

import { useAnimationFrame, useMotionValue, type MotionValue } from "motion/react";

// A value that chases another one at a speed you can see. However fast the target jumps (a hard
// flick of the scroll wheel), the chaser never goes faster than `max` per second, picks up speed
// smoothly (`grip`) and eases into place as it arrives (`rate`), so a quick scroll still plays out
// as motion instead of a jump. A long way behind, it may go faster than `max`, just enough to arrive
// within `within` seconds, so it never trails off screen. `speed` is how fast it's moving right now.
// Off: it just copies.

export function useChase(
  target: MotionValue<number>,
  { rate = 3, max = 1000, grip = 5, within = Infinity, on = true }: { rate?: number; max?: number; grip?: number; within?: number; on?: boolean } = {},
) {
  const value = useMotionValue(target.get());
  const speed = useMotionValue(0);

  useAnimationFrame((_, delta) => {
    const to = target.get();
    const at = value.get();
    const v0 = speed.get();
    if (!on || (Math.abs(to - at) < 0.3 && Math.abs(v0) < 2)) {
      if (at !== to) value.set(to);
      if (v0 !== 0) speed.set(0);
      return;
    }
    const dt = Math.min(delta, 50) / 1000;
    const cap = Math.max(max, Math.abs(to - at) / within);
    const want = Math.max(-cap, Math.min(cap, (to - at) * rate));
    const v = v0 + (want - v0) * Math.min(1, dt * grip);
    const step = v * dt;
    // Never step past the target (moving away from it, after the target turned round, is momentum).
    const next = Math.sign(step) === Math.sign(to - at) && Math.abs(step) >= Math.abs(to - at) ? to : at + step;
    speed.set(next === to ? 0 : v);
    value.set(next);
  });

  return { value, speed };
}
