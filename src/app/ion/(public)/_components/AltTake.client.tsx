"use client";

import { useState } from "react";

// Plays a "could've said" line rendered in a rep's cloned voice via
// /api/ion/alt-take. Same UX as AudioClip: a button that swaps to a native
// <audio> on click. The server caches by content hash, so repeat plays (and
// pre-generated lines) come straight from the Supabase CDN.

export function altTakeUrl(rep: string, text: string, phone = true): string {
  const qs = new URLSearchParams({ rep, text });
  if (!phone) qs.set("phone", "0");
  return `/api/ion/alt-take?${qs.toString()}`;
}

export function AltTake({
  rep,
  text,
  phone = true,
  label,
}: {
  rep: string;
  text: string;
  phone?: boolean;
  label?: string;
}) {
  const [active, setActive] = useState(false);
  const url = altTakeUrl(rep, text, phone);

  if (!active) {
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          setActive(true);
        }}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded border text-xs transition-colors border-stewart-accent/40 bg-stewart-accent/10 text-stewart-accent hover:bg-stewart-accent/20"
      >
        <SparkIcon />
        {label || "Play could've-said"}
      </button>
    );
  }
  return (
    <audio src={url} controls autoPlay preload="auto" className="h-9 w-full max-w-xs" />
  );
}

function SparkIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l1.9 5.6L19.5 9l-4.6 3.3L16.5 18 12 14.6 7.5 18l1.6-5.7L4.5 9l5.6-1.4L12 2z" />
    </svg>
  );
}
