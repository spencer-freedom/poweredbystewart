"use client";

import { useState, useRef } from "react";
import { audioClipUrl } from "@/lib/ion-api";

export function AudioClip({
  token,
  callId,
  startSec,
  endSec,
}: {
  token: string;
  callId: string;
  startSec: number;
  endSec: number;
}) {
  const [active, setActive] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const dur = Math.max(0, endSec - startSec);

  const url = audioClipUrl(token, callId, startSec, endSec);

  if (!active) {
    return (
      <button
        onClick={() => setActive(true)}
        className="inline-flex items-center gap-2 px-3 py-2 rounded border border-stewart-accent/40 bg-stewart-accent/10 text-stewart-accent text-sm hover:bg-stewart-accent/20 transition-colors"
      >
        <PlayIcon /> Play clip ({dur.toFixed(1)}s)
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <audio
        ref={audioRef}
        src={url}
        controls
        autoPlay
        preload="auto"
        className="h-10"
      />
      <span className="text-xs text-stewart-muted font-mono">
        {fmt(startSec)} → {fmt(endSec)}
      </span>
    </div>
  );
}

function fmt(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

function PlayIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}
