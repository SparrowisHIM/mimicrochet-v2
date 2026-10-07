"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

export type Voice = { url: string; seconds: number; file: File };

/** Hold to record a voice note (real recording with the microphone), the way WhatsApp customers explain things. */
export function VoiceNote({ value, onChange }: { value?: Voice; onChange: (v?: Voice) => void }) {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [tip, setTip] = useState<string | null>(null);
  const rec = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const started = useRef(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  // True only while the button is held. The first press opens the microphone prompt, and the
  // finger usually lifts before it's answered, so nothing may start recording after release.
  const holding = useRef(false);

  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);

  const start = async () => {
    if (holding.current) return;
    holding.current = true;
    setError(null);
    setTip(null);
    if (typeof window === "undefined" || !("MediaRecorder" in window) || !navigator.mediaDevices?.getUserMedia) {
      setError("Voice notes don’t work in this browser. Type it instead.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!holding.current) {
        stream.getTracks().forEach((t) => t.stop());
        setTip("Microphone ready. Hold the button while you talk.");
        return;
      }
      const r = new MediaRecorder(stream);
      chunks.current = [];
      r.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
      r.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const secs = Math.round((Date.now() - started.current) / 1000);
        if (secs < 1) {
          setTip("Hold the button while you talk, then let go.");
          return;
        }
        const type = r.mimeType || "audio/webm";
        const blob = new Blob(chunks.current, { type });
        const file = new File([blob], `voice-note.${type.includes("mp4") ? "m4a" : "webm"}`, { type });
        onChange({ url: URL.createObjectURL(blob), seconds: secs, file });
      };
      rec.current = r;
      started.current = Date.now();
      r.start();
      setRecording(true);
      setSeconds(0);
      timer.current = setInterval(() => setSeconds(Math.round((Date.now() - started.current) / 1000)), 250);
    } catch {
      holding.current = false;
      setError("Allow the microphone to record a voice note.");
    }
  };

  const stop = () => {
    holding.current = false;
    if (timer.current) clearInterval(timer.current);
    if (rec.current?.state === "recording") rec.current.stop();
    setRecording(false);
  };

  const t = (n: number) => `${Math.floor(n / 60)}:${String(n % 60).padStart(2, "0")}`;

  if (value)
    return (
      <div className="flex items-center gap-2">
        <audio src={value.url} controls className="h-9 max-w-[180px]" aria-label="Your voice note" />
        <span className="text-[13px] text-stone-500">{t(value.seconds)}</span>
        <button type="button" onClick={() => onChange(undefined)} className="text-[13px] underline underline-offset-2">
          Remove
        </button>
      </div>
    );

  return (
    <div className="flex items-center gap-3">
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={recording ? "rec" : error ?? tip ?? "idle"}
          initial={{ opacity: 0, x: 6 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -6 }}
          className={`text-[13px] ${error ? "text-red-700" : recording ? "font-semibold text-red-700 tabular-nums" : tip ? "font-medium text-stone-700" : "text-stone-500"}`}
          aria-live="polite"
        >
          {error ?? (recording ? `Recording ${t(seconds)}` : tip ?? "Hold for a voice note")}
        </motion.span>
      </AnimatePresence>
      <motion.button
        type="button"
        aria-label={recording ? "Release to stop recording" : "Hold to record a voice note"}
        onPointerDown={(e) => { e.preventDefault(); start(); }}
        onPointerUp={stop}
        onPointerLeave={() => recording && stop()}
        onKeyDown={(e) => { if ((e.key === " " || e.key === "Enter") && !recording) { e.preventDefault(); start(); } }}
        onKeyUp={(e) => { if (e.key === " " || e.key === "Enter") stop(); }}
        onContextMenu={(e) => e.preventDefault()}
        animate={{ scale: recording ? 1.18 : 1 }}
        className={`relative grid size-10 touch-none place-items-center rounded-full text-white select-none ${recording ? "bg-red-600" : "bg-stone-900"}`}
      >
        {recording && <motion.span className="absolute inset-0 rounded-full bg-red-500" animate={{ scale: [1, 1.7], opacity: [0.5, 0] }} transition={{ repeat: Infinity, duration: 1.1 }} />}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="relative" aria-hidden>
          <rect x="9" y="3" width="6" height="12" rx="3" fill="currentColor" />
          <path d="M5 11a7 7 0 0 0 14 0M12 18v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </motion.button>
    </div>
  );
}
