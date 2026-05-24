"use client";

import { useState } from "react";

// Shared audio-clip player for the public Ion surfaces (§2 carousel
// walkthrough, brain page detail panel). Renders a play button that
// reveals a native <audio> on click — keeps the network request lazy
// so 7-call carousels don't preload 7 MP3s.
//
// The audio URL points at the existing /api/ion/audio-clip/{call_id}
// endpoint. When no start/end is supplied, the full call MP3 streams.
// When supplied, the endpoint slices a clip.
//
// Per the §2 carousel original wiring: NEXT_PUBLIC_API_BASE_URL gates
// where the backend lives. Empty base = same origin.

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
