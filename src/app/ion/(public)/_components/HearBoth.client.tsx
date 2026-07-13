"use client";

// The "rep said X — imagine if they'd said Y" beat. Two players side by side:
//   ACTUAL       — the real call clip (AudioClip → /api/ion/audio-clip slice)
//   COULD'VE SAID — the coached line in the rep's cloned voice (AltTake)
//
// Drop it into any section with the real moment's coordinates + the coached
// alternative. Both quotes render so the room reads the contrast before hearing it.

import { AudioClip } from "./AudioClip.client";
import { AltTake } from "./AltTake.client";

export function HearBoth({
  rep,
  callId,
  startSec,
  endSec,
  actualQuote,
  altText,
  phone = true,
}: {
  rep: string;
  callId: string;
  startSec: number;
  endSec: number;
  actualQuote: string;
  altText: string;
  phone?: boolean;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 max-w-3xl">
      {/* ACTUAL */}
      <div className="rounded-xl border border-stewart-border bg-stewart-card p-5">
        <p className="text-[10px] uppercase tracking-wider font-mono text-stewart-muted mb-2">
          Actual — {rep}
        </p>
        <blockquote className="text-base text-stewart-text leading-snug border-l-2 border-stewart-border pl-3 mb-4">
          &ldquo;{actualQuote}&rdquo;
        </blockquote>
        <AudioClip callId={callId} startSec={startSec} endSec={endSec} label="Play actual" />
      </div>

      {/* COULD'VE SAID */}
      <div className="rounded-xl border border-stewart-accent/40 bg-stewart-accent/5 p-5">
        <p className="text-[10px] uppercase tracking-wider font-mono text-stewart-accent mb-2">
          Could&apos;ve said — {rep}&apos;s voice
        </p>
        <blockquote className="text-base text-stewart-text leading-snug border-l-2 border-stewart-accent pl-3 mb-4">
          &ldquo;{altText}&rdquo;
        </blockquote>
        <AltTake rep={rep} text={altText} phone={phone} label="Play could've-said" />
      </div>
    </div>
  );
}
