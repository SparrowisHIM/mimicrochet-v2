"use client";

import { AnimatePresence, motion, useMotionTemplate, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { CloseIcon } from "@/components/icons";

export type Voice = { url: string; seconds: number; file: File; levels?: number[] };

// Tap to record, tap ✓ to keep (or ✕ to throw it away). While it records, a waveform scrolls in from
// the right: silence is a dotted line, sound grows bars from the middle, so a muted or covered mic is
// obvious at a glance. Bars show loudness (not pitch: pitch tracking goes blank on soft sounds). The
// kept note turns into a player made of the same waveform: tap or drag it to jump.

const BAR_MS = 70; // a new bar every 70ms
const STEP = 6; // px per bar: 3px bar + 3px gap
const MAX_SECONDS = 120;
const QUIET = 0.06; // below this a bar is drawn as a dot
const HEARD = 0.14; // the first level above this proves the mic works

const rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const STONE_300 = rgb("#d6d3d1");
const STONE_400 = rgb("#a8a29e");
const AMBER_500 = rgb("#f59e0b");
const ROSE_500 = rgb("#f43f5e");
const mix = (a: number[], b: number[], t: number) => {
  const k = Math.min(1, Math.max(0, t));
  return `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * k)).join(" ")})`;
};
const barColour = (l: number) => (l < 0.3 ? mix(STONE_400, AMBER_500, (l - QUIET) / (0.3 - QUIET)) : mix(AMBER_500, ROSE_500, (l - 0.3) / 0.6));
const dotColour = mix(STONE_300, STONE_300, 0); // quiet: a dot on the line

/** Loudness of one buffer, 0 to 1, on a decibel scale so quiet laptop mics still register. The
 *  curve keeps ordinary speech in the middle of the range, so bars rise and fall instead of maxing out. */
function levelOf(buf: Float32Array) {
  let sum = 0;
  for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
  const db = 20 * Math.log10(Math.sqrt(sum / buf.length) || 1e-8);
  return Math.pow(Math.min(1, Math.max(0, (db + 60) / 50)), 1.6);
}

const clock = (n: number) => `${Math.floor(n / 60)}:${String(Math.floor(n % 60)).padStart(2, "0")}`;

type Session = {
  stream: MediaStream;
  rec: MediaRecorder;
  ctx: AudioContext;
  analyser: AnalyserNode;
  started: number;
  levels: number[];
  keep: boolean;
  heard: boolean;
  timer?: ReturnType<typeof setInterval>;
  silence?: ReturnType<typeof setTimeout>;
};

function closeSession(s: Session | null) {
  if (!s) return;
  clearInterval(s.timer);
  clearTimeout(s.silence);
  s.stream.getTracks().forEach((t) => t.stop());
  s.ctx.close().catch(() => {});
}

/* ------------------------------ the live waveform ------------------------------ */

function LiveWave({ session, reduce, onHeard }: { session: Session; reduce: boolean; onHeard: () => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const heard = useRef(onHeard);
  useEffect(() => {
    heard.current = onHeard;
  }, [onHeard]);

  useEffect(() => {
    const el = canvas.current;
    const g = el?.getContext("2d");
    if (!el || !g) return;
    const buf = new Float32Array(session.analyser.fftSize);
    let raf = 0;
    let lastBar = performance.now();
    let peak = 0;

    const frame = (now: number) => {
      session.analyser.getFloatTimeDomainData(buf);
      const level = levelOf(buf);
      peak = Math.max(peak, level);
      if (level > HEARD && !session.heard) {
        session.heard = true;
        heard.current();
      }
      while (now - lastBar >= BAR_MS) {
        session.levels.push(peak);
        peak = 0;
        lastBar += BAR_MS;
      }

      const dpr = window.devicePixelRatio || 1;
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (el.width !== Math.round(w * dpr) || el.height !== Math.round(h * dpr)) {
        el.width = Math.round(w * dpr);
        el.height = Math.round(h * dpr);
      }
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, w, h);

      // Everything slides left between bars, so the line moves continuously instead of ticking.
      const frac = reduce ? 0 : Math.min(1, (now - lastBar) / BAR_MS);
      const mid = h / 2;
      const levels = session.levels;
      for (let i = 0; ; i++) {
        const x = w - 3 - (i + frac) * STEP;
        if (x < -STEP) break;
        const l = levels[levels.length - 1 - i] ?? 0;
        if (l < QUIET) {
          g.fillStyle = dotColour;
          g.beginPath();
          g.arc(x, mid, 1.3, 0, Math.PI * 2);
          g.fill();
          continue;
        }
        // The newest bar grows in rather than popping up.
        const grow = i === 0 && !reduce ? 1 - Math.pow(1 - frac, 3) : 1;
        const bh = Math.max(4, l * (h - 2)) * grow;
        g.fillStyle = barColour(l);
        g.beginPath();
        if (g.roundRect) g.roundRect(x - 1.5, mid - bh / 2, 3, bh, 1.5);
        else g.rect(x - 1.5, mid - bh / 2, 3, bh);
        g.fill();
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [session, reduce]);

  return <canvas ref={canvas} className="h-8 min-w-0 flex-1 [mask-image:linear-gradient(to_right,transparent,black_22%)]" aria-hidden />;
}

/* ------------------------------ the kept note, as a player ------------------------------ */

/** Squeeze the recording's levels into n bars (the loudest moment of each slice). A note recorded on
 *  another phone has no levels here, so it gets a calm, varied shape that's the same on every view. */
function resample(levels: number[], n: number) {
  if (!levels.length) return Array.from({ length: n }, (_, i) => 0.22 + 0.5 * Math.abs(Math.sin(i * 1.7) * Math.cos(i * 0.6)));
  return Array.from({ length: n }, (_, i) => {
    const a = Math.floor((i * levels.length) / n);
    const b = Math.max(a + 1, Math.floor(((i + 1) * levels.length) / n));
    return Math.max(...levels.slice(a, b));
  });
}

/**
 * Plays a voice note: the customer's own recording while they order (with Delete), or, in Mimi's studio,
 * the one they sent (no Delete; its length comes from the file).
 */
export function VoicePlayer({
  url,
  seconds: knownSeconds,
  levels,
  onRemove,
  autoFocus = false,
  whose = "your",
}: {
  url: string;
  seconds?: number;
  levels?: number[];
  onRemove?: () => void;
  autoFocus?: boolean;
  whose?: "your" | "their";
}) {
  const reduce = useReducedMotion();
  const audio = useRef<HTMLAudioElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const play = useRef<HTMLButtonElement>(null);
  const [playing, setPlaying] = useState(false);
  const [now, setNow] = useState(0);
  const [count, setCount] = useState(36);
  const [loadedSeconds, setLoadedSeconds] = useState(0);
  const seconds = knownSeconds ?? loadedSeconds;
  const voice = { seconds: Math.max(1, seconds) };
  const progress = useMotionValue(0);
  const hidden = useTransform(progress, (p) => (1 - p) * 100);
  const clip = useMotionTemplate`inset(0 ${hidden}% 0 0)`;
  const bars = useMemo(() => resample(levels ?? [], count), [levels, count]);

  useEffect(() => {
    if (autoFocus) play.current?.focus();
  }, [autoFocus]);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setCount(Math.max(12, Math.floor(e.contentRect.width / 5))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // While playing, the dark part follows the sound every frame (a motion value, so nothing re-renders).
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    const tick = () => {
      const a = audio.current;
      if (a) {
        progress.set(Math.min(1, a.currentTime / voice.seconds));
        setNow((n) => (Math.floor(a.currentTime) !== n ? Math.floor(a.currentTime) : n));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, progress, voice.seconds]);

  const toggle = () => {
    const a = audio.current;
    if (!a) return;
    if (a.paused) a.play().catch(() => setPlaying(false));
    else a.pause();
  };
  const seekTo = (fraction: number) => {
    const a = audio.current;
    const f = Math.min(1, Math.max(0, fraction));
    progress.set(f);
    setNow(Math.floor(f * voice.seconds));
    if (a) a.currentTime = f * voice.seconds;
  };
  const seekAt = (clientX: number) => {
    const r = track.current?.getBoundingClientRect();
    if (r) seekTo((clientX - r.left) / r.width);
  };

  return (
    <div className="flex min-w-0 flex-1 items-center gap-2.5 rounded-full bg-stone-100 py-1 pr-1 pl-1">
      <audio
        ref={audio}
        src={url}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          progress.set(0);
          setNow(0);
        }}
        onLoadedMetadata={(e) => {
          // Recorded webm has no length until it's been read through once: jump to the end and back.
          const a = e.currentTarget;
          if (a.duration === Infinity) {
            a.currentTime = 1e101;
            a.addEventListener("timeupdate", () => { if (Number.isFinite(a.duration)) setLoadedSeconds(Math.round(a.duration)); a.currentTime = 0; }, { once: true });
          } else if (Number.isFinite(a.duration)) setLoadedSeconds(Math.round(a.duration));
        }}
      />
      <button
        ref={play}
        type="button"
        onClick={toggle}
        aria-label={`${playing ? "Pause" : "Play"} ${whose} voice note`}
        className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-full bg-stone-900 text-orange-50 transition-transform duration-150 active:scale-90"
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.svg
            key={playing ? "pause" : "play"}
            width="14"
            height="14"
            viewBox="0 0 14 14"
            aria-hidden
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.5, filter: "blur(3px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.5, filter: "blur(3px)" }}
            transition={{ type: "spring", duration: 0.3, bounce: 0 }}
          >
            {playing ? (
              <path d="M3.5 2.5v9M10.5 2.5v9" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
            ) : (
              <path d="M4 2.6v8.8a.7.7 0 0 0 1.06.6l7-4.4a.7.7 0 0 0 0-1.2l-7-4.4A.7.7 0 0 0 4 2.6Z" fill="currentColor" />
            )}
          </motion.svg>
        </AnimatePresence>
      </button>

      <div
        ref={track}
        role="slider"
        tabIndex={0}
        aria-label="Voice note position"
        aria-valuemin={0}
        aria-valuemax={voice.seconds}
        aria-valuenow={now}
        aria-valuetext={`${clock(now)} of ${clock(voice.seconds)}`}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          seekAt(e.clientX);
        }}
        onPointerMove={(e) => e.currentTarget.hasPointerCapture(e.pointerId) && seekAt(e.clientX)}
        onKeyDown={(e) => {
          const step = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[e.key];
          if (step) {
            e.preventDefault();
            seekTo((progress.get() * voice.seconds + step) / voice.seconds);
          } else if (e.key === "Home" || e.key === "End") {
            e.preventDefault();
            seekTo(e.key === "Home" ? 0 : 1);
          }
        }}
        className="relative h-7 min-w-0 flex-1 cursor-pointer touch-none rounded-[6px] outline-offset-4"
      >
        {[false, true].map((played) => (
          <motion.div
            key={String(played)}
            className="absolute inset-0 flex items-center justify-between"
            style={played ? { clipPath: clip } : undefined}
            aria-hidden
          >
            {bars.map((l, i) => (
              <span
                key={i}
                className={`voice-bar w-[3px] shrink-0 rounded-full ${played ? "bg-stone-900" : "bg-stone-300"}`}
                style={{ height: `${Math.max(14, l * 100)}%`, animationDelay: `${Math.min(i * 6, 360)}ms` }}
              />
            ))}
          </motion.div>
        ))}
      </div>

      <span className={`w-8 shrink-0 text-right text-[13px] text-stone-500 tabular-nums ${onRemove ? "" : "mr-2.5"}`}>{seconds || playing || now > 0 ? clock(playing || now > 0 ? now : seconds) : ""}</span>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label="Delete your voice note"
          className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-full text-stone-500 transition-colors duration-150 hover:bg-stone-200 hover:text-stone-900"
        >
          <CloseIcon size={16} />
        </button>
      )}
    </div>
  );
}

/* ------------------------------ the control ------------------------------ */

/** The voice icon (a little waveform). On hover its bars ripple, to hint that it listens. */
function VoiceIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      {[
        [3, 8.5, 3],
        [6.5, 5.5, 9],
        [10, 2.5, 15],
        [13.5, 5.5, 9],
        [17, 8.5, 3],
      ].map(([x, y, h], i) => (
        <rect key={x} x={x - 1} y={y} width="2" height={h} rx="1" className="voice-icon-bar" style={{ animationDelay: `${i * 90}ms` }} />
      ))}
    </svg>
  );
}

export function VoiceNote({
  value,
  onChange,
  leading,
  onLiveChange,
}: {
  value?: Voice;
  onChange: (v?: Voice) => void;
  /** What sits at the start of the row when not recording (the add-photo button). */
  leading?: ReactNode;
  /** Tells the composer when the microphone is live, so it can show it. */
  onLiveChange?: (live: boolean) => void;
}) {
  const reduce = Boolean(useReducedMotion());
  const [phase, setPhase] = useState<"idle" | "asking" | "recording">("idle");
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [silent, setSilent] = useState(false);
  const [justKept, setJustKept] = useState(false);
  // The open microphone, kept in a ref for the handlers and in state for rendering the waveform.
  const session = useRef<Session | null>(null);
  const [live, setLive] = useState<Session | null>(null);
  const done = useRef<HTMLButtonElement>(null);

  const teardown = () => {
    closeSession(session.current);
    session.current = null;
    setLive(null);
  };

  useEffect(() => {
    const s = session;
    return () => closeSession(s.current);
  }, []);
  useEffect(() => onLiveChange?.(phase === "recording"), [phase, onLiveChange]);
  useEffect(() => {
    if (phase === "recording") done.current?.focus();
  }, [phase]);

  const finish = (keep: boolean) => {
    const s = session.current;
    if (!s) return;
    s.keep = keep;
    if (s.rec.state !== "inactive") s.rec.stop();
  };

  const start = async () => {
    if (phase !== "idle") return;
    setError(null);
    if (!("MediaRecorder" in window) || !navigator.mediaDevices?.getUserMedia) {
      setError("Voice notes don’t work in this browser. Type it instead.");
      return;
    }
    setPhase("asking");
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
    } catch {
      setPhase("idle");
      setError("Allow the microphone to record a voice note.");
      return;
    }
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    ctx.resume().catch(() => {});
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 1024;
    ctx.createMediaStreamSource(stream).connect(analyser);
    const rec = new MediaRecorder(stream);
    const chunks: Blob[] = [];
    const s: Session = { stream, rec, ctx, analyser, started: performance.now(), levels: [], keep: false, heard: false };
    rec.ondataavailable = (e) => {
      if (e.data.size) chunks.push(e.data);
    };
    rec.onstop = () => {
      const ms = performance.now() - s.started;
      teardown();
      setPhase("idle");
      setSilent(false);
      if (!s.keep) return;
      if (ms < 800) {
        setError("That was too short. Tap and talk, then tap the tick.");
        return;
      }
      const type = rec.mimeType || "audio/webm";
      const blob = new Blob(chunks, { type });
      const file = new File([blob], `voice-note.${type.includes("mp4") ? "m4a" : "webm"}`, { type });
      setJustKept(true);
      onChange({ url: URL.createObjectURL(blob), seconds: Math.max(1, Math.round(ms / 1000)), file, levels: s.levels.slice() });
    };
    session.current = s;
    setLive(s);
    rec.start(250);
    setSeconds(0);
    setSilent(false);
    setPhase("recording");
    s.timer = setInterval(() => {
      const secs = (performance.now() - s.started) / 1000;
      setSeconds(Math.floor(secs));
      if (secs >= MAX_SECONDS) finish(true);
    }, 250);
    s.silence = setTimeout(() => !s.heard && setSilent(true), 3000);
  };

  return (
    <div className="flex flex-col">
      <div className="flex h-10 items-center">
        <AnimatePresence mode="popLayout" initial={false}>
          {phase === "recording" && live ? (
            <motion.div
              key="recording"
              className="flex min-w-0 flex-1 items-center gap-2.5"
              onKeyDown={(e) => e.key === "Escape" && finish(false)}
              initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, scaleX: 0.92, filter: "blur(4px)" }}
              transition={{ type: "spring", duration: 0.35, bounce: 0 }}
            >
              <button
                type="button"
                onClick={() => finish(false)}
                aria-label="Throw this recording away"
                className="grid size-10 shrink-0 cursor-pointer place-items-center rounded-full bg-stone-100 text-stone-700 transition-colors duration-150 hover:bg-stone-200 hover:text-stone-900"
              >
                <CloseIcon size={18} />
              </button>
              <LiveWave
                session={live}
                reduce={reduce}
                onHeard={() => setSilent(false)}
              />
              <span className="w-9 shrink-0 text-right text-[13px] text-stone-500 tabular-nums">{clock(seconds)}</span>
              <button
                ref={done}
                type="button"
                onClick={() => finish(true)}
                aria-label="Stop and keep this voice note"
                className="grid size-10 shrink-0 cursor-pointer place-items-center rounded-full bg-stone-900 text-orange-50 shadow-[0_6px_16px_-8px_rgb(28_25_23/0.6)] transition-transform duration-150 active:scale-90"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
                  <path d="M4 9.5 7.5 13 14 5.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </motion.div>
          ) : value ? (
            <motion.div
              key="kept"
              className="flex min-w-0 flex-1 items-center gap-3"
              initial={reduce ? { opacity: 0 } : { opacity: 0, scaleX: 0.94 }}
              animate={{ opacity: 1, scaleX: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: "spring", duration: 0.4, bounce: 0 }}
            >
              {leading}
              <VoicePlayer
                url={value.url}
                seconds={value.seconds}
                levels={value.levels}
                autoFocus={justKept}
                onRemove={() => {
                  setJustKept(false);
                  onChange(undefined);
                }}
              />
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              className="flex min-w-0 flex-1 items-center justify-between gap-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {leading}
              <div className="flex min-w-0 items-center gap-3">
                <span className={`min-w-0 text-right text-[13px] leading-tight ${error ? "text-red-700" : "text-stone-500"}`} aria-live="polite">
                  {phase === "asking" ? "Allow the microphone…" : (error ?? "Voice note")}
                </span>
                <button
                  type="button"
                  onClick={start}
                  aria-label="Record a voice note"
                  className="group grid size-10 shrink-0 cursor-pointer place-items-center rounded-full bg-stone-900 text-orange-50 shadow-[0_6px_16px_-8px_rgb(28_25_23/0.6)] transition-transform duration-150 hover:scale-105 active:scale-95"
                >
                  <VoiceIcon />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <AnimatePresence initial={false}>
        {phase === "recording" && silent && (
          <motion.p
            className="overflow-hidden text-[13px] text-amber-800"
            role="status"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", duration: 0.3, bounce: 0 }}
          >
            <span className="block pt-2.5">Can’t hear you. Is your mic covered, or switched to a headset?</span>
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
