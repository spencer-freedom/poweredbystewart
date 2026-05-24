"use client";

import { useEffect, useRef, useState } from "react";

// Shared audio-clip player for the public Ion surfaces.
//
// V2.1.10 — the /api/ion/audio-clip endpoint accepts start/end query
// params but returns the full MP3 (server-side slicing is a TODO).
// Client compensates: seek on `canplay`, pause + reset on `timeupdate`
// when end is reached. canplay is more reliable than loadedmetadata
// across browsers because it fires once the element has buffered
// enough to actually start playback — so setting currentTime sticks.
//
// We DON'T use the `autoPlay` attribute. autoPlay racing with our
// imperative play() was the V2.1.3 → V2.1.6 regression that broke
// playback entirely. The user-gesture (button click flipping
// `active` to true) propagates through the React commit; calling
// .play() inside the `canplay` listener is still treated as a
// user-initiated action by Chrome/Safari.

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
  // Media Fragment URI hint — browsers that honor this seek natively
  // before our useEffect runs. The JS seek below is the fallback.
  const fragment =
    typeof startSec === "number"
      ? `#t=${startSec.toFixed(1)}${
          typeof endSec === "number" ? "," + endSec.toFixed(1) : ""
        }`
      : "";
  const url =
    `${baseUrl}/api/ion/audio-clip/${encodeURIComponent(callId)}` +
    (qs.toString() ? `?${qs.toString()}` : "") +
    fragment;

  useEffect(() => {
    if (!active) return;
    const el = audioRef.current;
    if (!el) return;

    const start = typeof startSec === "number" ? startSec : 0;
    const end = typeof endSec === "number" ? endSec : null;

    const seek = () => {
      if (start > 0 && Math.abs(el.currentTime - start) > 0.5) {
        try {
          el.currentTime = start;
        } catch {
          // Some browsers throw if duration isn't ready; we'll
          // retry via the next canplay tick.
        }
      }
    };

    const tryPlay = () => {
      el.play().catch(() => {
        // Autoplay blocked or unsupported — user can hit the
        // play icon on the visible controls instead.
      });
    };

    const onCanPlay = () => {
      seek();
      tryPlay();
    };

    const onTime = () => {
      if (end !== null && el.currentTime >= end) {
        el.pause();
        try {
          el.currentTime = start;
        } catch {
          // ignore
        }
      }
    };

    el.addEventListener("canplay", onCanPlay);
    el.addEventListener("timeupdate", onTime);
    // If already buffered, fire immediately.
    if (el.readyState >= 3) onCanPlay();
    return () => {
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
