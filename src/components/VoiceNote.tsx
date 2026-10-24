"use client";

import { useEffect, useRef, useState } from "react";
import type { Language } from "@/lib/schemas";

const MAX_SECONDS = 60;
// ElevenLabs returns ISO 639-3 codes; map the ones we write posts in.
const POST_LANGUAGE: Record<string, Language> = { eng: "en", hin: "hi", mar: "mr", tam: "ta" };

/** Tap to record a voice note in any language; the transcript is added to the seller's note. */
export default function VoiceNote({ onText }: { onText: (text: string, language: Language | null) => void }) {
  const [state, setState] = useState<"idle" | "recording" | "working">("idle");
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => stopTimer(), []);

  function stopTimer() {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
  }

  async function start() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        stopTimer();
        setState("working");
        try {
          const form = new FormData();
          form.append("audio", new Blob(chunks, { type: rec.mimeType || "audio/webm" }));
          const res = await fetch("/api/transcribe", { method: "POST", body: form });
          const json = await res.json();
          if (!res.ok) throw new Error(json.error || "Couldn't transcribe");
          if (json.text) onText(json.text, POST_LANGUAGE[json.languageCode] ?? null);
          else setError("We didn't catch that. Try again a little closer to the phone.");
        } catch (e) {
          setError((e as Error).message);
        } finally {
          setState("idle");
        }
      };
      recorder.current = rec;
      rec.start();
      setSeconds(0);
      setState("recording");
      timer.current = setInterval(() => {
        setSeconds((s) => {
          if (s + 1 >= MAX_SECONDS) recorder.current?.stop();
          return s + 1;
        });
      }, 1000);
    } catch {
      setError("Allow the microphone to record a voice note.");
    }
  }

  return (
    <div className="mt-3">
      {state === "recording" ? (
        <button
          type="button"
          onClick={() => recorder.current?.stop()}
          className="flex w-full items-center justify-between gap-3 rounded-xl bg-pink px-4 py-3 text-left text-white"
        >
          <span className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-white" />
            </span>
            <span className="font-semibold">Recording… speak now</span>
          </span>
          <span className="flex items-center gap-2 text-sm font-semibold tabular-nums">
            0:{String(seconds).padStart(2, "0")} / 1:00 · Tap to stop
          </span>
        </button>
      ) : state === "working" ? (
        <div className="flex w-full items-center gap-3 rounded-xl bg-cream px-4 py-3" role="status">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-line border-t-brand" />
          <span className="text-sm font-semibold">Turning your voice note into text…</span>
        </div>
      ) : (
        <button
          type="button"
          onClick={start}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-line bg-surface px-4 text-sm font-semibold"
        >
          <span className="h-2.5 w-2.5 rounded-full bg-pink" />
          Say it instead (any language)
        </button>
      )}
      {error && <p className="mt-2 text-sm text-error">{error}</p>}
    </div>
  );
}
