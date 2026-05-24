"use client";

import { useEffect, useRef, useState } from "react";

// Shared audio-clip player for the public Ion surfaces (§2 carousel
// walkthrough, brain page detail panel, /ion/calls drawer).
//
// V2.1.2 — the /api/ion/audio-clip endpoint accepts start/end query
// params but currently returns the full MP3 regardless (server-side
// ffmpeg slicing is a TODO). Client compensates: seek to start on
// metadata-loaded, pause + reset to start when currentTime >= end.
// Native HTML5 audio handles this fine; no server change needed.

export function AudioClip({
  callId,
  startSec,
  endSec,
  label,
  variant = "clip",
}: {
  callId: string;
  startSec?: number;
  endSec?: number;
  label?: string;
  variant?: "clip" | "full";
}) {
  const [active, setActive] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const baseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    "";
  const qs = new URLSearchParams();
  if (typeof startSec === "number") qs.set("start", startSec.toFixed(3));
  if (typeof endSec === "number") qs.set("end", endSec.toFixed(3));
  const url =
    `${baseUrl}/api/ion/audio-clip/${encodeURIComponent(callId)}` +
    (qs.toString() ? `?${qs.toString()}` : "");

  // Client-side trimming. Only kicks in when both start and end are
  // provided (clip mode) — full-call mode lets the audio play through.
  useEffect(() => {
    if (!active) return;
    if (typeof startSec !== "number" || typeof endSec !== "number") return;
    const el = audioRef.current;
    if (!el) return;

    const seekToStart = () => {
      try {
        el.currentTime = startSec;
      } catch {
        // Some browsers throw if duration isn't ready yet; the
        // canplay handler will retry.
      }
    };

    const onLoaded = () => {
      seekToStart();
      el.play().catch(() => {});
    };

    const onCanPlay = () => {
      // Safari sometimes ignores currentTime set before canplay.
      if (Math.abs(el.currentTime - startSec) > 0.5) seekToStart();
    };

    const onTime = () => {
      if (el.currentTime >= endSec) {
        el.pause();
        el.currentTime = startSec;
      }
    };

    el.addEventListener("loadedmetadata", onLoaded);
    el.addEventListener("canplay", onCanPlay);
    el.addEventListener("timeupdate", onTime);
    // If metadata already loaded (cached), prime it directly.
    if (el.readyState >= 1) seekToStart();
    return () => {
      el.removeEventListener("loadedmetadata", onLoaded);
      el.removeEventListener("canplay", onCanPlay);
      el.removeEventListener("timeupdate", onTime);
    };
  }, [active, startSec, endSec]);

  const fallbackLabel =
    variant === "full"
      ? "Play full call audio"
      : typeof startSec === "number" && typeof endSec === "number"
      ? `Play clip (${Math.max(0, endSec - startSec).toFixed(0)}s)`
      : "Play";

  if (!active) {
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          setActive(true);
        }}
        className={
          "inline-flex items-center gap-2 px-3 py-1.5 rounded border text-xs transition-colors " +
          (variant === "full"
            ? "border-stewart-accent/40 bg-stewart-accent/10 text-stewart-accent hover:bg-stewart-accent/20"
            : "border-stewart-border bg-stewart-card text-stewart-muted hover:text-stewart-text hover:border-stewart-accent/40")
        }
      >
        <PlayIcon />
        {label || fallbackLabel}
      </button>
    );
  }
  return (
    <audio
      ref={audioRef}
      src={url}
      controls
      autoPlay
      preload="auto"
      className="h-9 w-full max-w-xs"
    />
  );
}

function PlayIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

// Helpers for callers who have an MM:SS timestamp string.
export function tsToSeconds(ts: string): number {
  const parts = ts.split(":");
  if (parts.length !== 2) return 0;
  const m = parseInt(parts[0], 10) || 0;
  const s = parseInt(parts[1], 10) || 0;
  return m * 60 + s;
}
