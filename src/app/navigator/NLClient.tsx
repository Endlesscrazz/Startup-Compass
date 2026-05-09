"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

// Web Speech API — not in all TS DOM libs, declared locally
interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((e: { results: { [i: number]: { [i: number]: { transcript: string } } } }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
}
interface ISpeechRecognitionConstructor {
  new (): ISpeechRecognition;
}
declare global {
  interface Window {
    SpeechRecognition?: ISpeechRecognitionConstructor;
    webkitSpeechRecognition?: ISpeechRecognitionConstructor;
  }
}

const MAX_CHARS = 500;

const PLACEHOLDER =
  "e.g. I'm a veteran starting a manufacturing company in Ogden. " +
  "I'm looking for grants and resources to get my first workshop off the ground.";

// Mic SVG — inline to avoid icon lib dependency
function MicIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}

function StopIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <rect x="6" y="6" width="12" height="12" rx="2" />
    </svg>
  );
}

export function NLClient() {
  const router = useRouter();
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [speechAvailable, setSpeechAvailable] = useState(false);
  const recognitionRef = useRef<ISpeechRecognition | null>(null);

  useEffect(() => {
    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    setSpeechAvailable(!!SR);
  }, []);

  function toggleRecording() {
    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SR) return;

    if (isRecording) {
      recognitionRef.current?.stop();
      return;
    }

    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setDescription((prev) => {
        const joined = prev ? `${prev.trim()} ${transcript}` : transcript;
        return joined.slice(0, MAX_CHARS);
      });
    };

    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => setIsRecording(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  }

  function handleSubmit() {
    if (!description.trim() || !city.trim()) return;
    sessionStorage.setItem(
      "sc_quiz",
      JSON.stringify({ description: description.trim(), city: city.trim() })
    );
    router.push("/results");
  }

  const canSubmit = description.trim().length >= 10 && city.trim().length >= 2;
  const charsLeft = MAX_CHARS - description.length;

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-8">
      <div className="mb-6">
        <h2 className="font-display text-2xl font-semibold text-ink">
          Describe your situation
        </h2>
        <p className="mt-1.5 text-sm text-ink-mute">
          Tell us about your business and what you&apos;re looking for. Plain English works great.
        </p>
      </div>

      {/* Description textarea */}
      <div className="relative">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value.slice(0, MAX_CHARS))}
          placeholder={PLACEHOLDER}
          rows={5}
          className="w-full resize-none rounded-xl border border-rule bg-surface-elev px-4 py-3 pr-12 text-[14px] leading-relaxed text-ink placeholder:text-ink-mute focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
        />

        {/* Mic button — inside textarea, bottom-right */}
        {speechAvailable && (
          <button
            type="button"
            onClick={toggleRecording}
            title={isRecording ? "Stop recording" : "Speak your situation"}
            className={cn(
              "absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-full transition-colors",
              isRecording
                ? "bg-red-500 text-white animate-pulse"
                : "bg-surface-tint text-ink-mute hover:bg-accent hover:text-[#fbf7f0]"
            )}
          >
            {isRecording ? <StopIcon className="h-3.5 w-3.5" /> : <MicIcon className="h-4 w-4" />}
          </button>
        )}
      </div>

      {/* Char counter + recording hint */}
      <div className="mt-1.5 flex items-center justify-between">
        {isRecording ? (
          <span className="text-[12px] font-medium text-red-500">
            Recording… click stop when done
          </span>
        ) : (
          <span className="text-[12px] text-ink-mute">
            {speechAvailable ? "Or click the mic to speak" : ""}
          </span>
        )}
        <span className={cn("text-[12px]", charsLeft < 50 ? "text-accent" : "text-ink-mute")}>
          {charsLeft} chars left
        </span>
      </div>

      {/* City input */}
      <div className="mt-5">
        <label className="block text-[13px] font-medium text-ink-soft" htmlFor="nl-city">
          Your city or county
        </label>
        <input
          id="nl-city"
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="e.g. Salt Lake City, Provo, Ogden…"
          className="mt-1.5 w-full rounded-xl border border-rule bg-surface-elev px-4 py-3 text-[14px] text-ink placeholder:text-ink-mute focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
        />
        <p className="mt-1 text-[12px] text-ink-mute">
          Needed to filter resources to your area.
        </p>
      </div>

      {/* Submit */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!canSubmit}
        className={cn(
          "mt-6 inline-flex h-10 w-full items-center justify-center rounded-full text-[14px] font-semibold transition-all",
          canSubmit
            ? "bg-ink text-[#fbf7f0] hover:bg-ink-soft"
            : "cursor-not-allowed bg-rule text-ink-mute"
        )}
      >
        Find my resources →
      </button>
    </div>
  );
}
