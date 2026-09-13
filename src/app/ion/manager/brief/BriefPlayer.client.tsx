"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// The brief as a playlist: narration (Stewart's voice, ElevenLabs) → the
// actual clip at the flagged moment → next rep. One <audio> element, one
// item at a time, so a manager can press play once in the car. Every
// segment is also a URL the page already serves, so nothing here is new
// audio — it's the brief, read aloud, with the tape spliced in.

export type Segment =
  | { kind: "say"; text: string; label: string }
  | { kind: "clip"; callId: string; start: number; end: number; label: string }
  | { kind: "full"; callId: string; label: string };

function srcFor(seg: Segment): string {
  if (seg.kind === "say") return `/api/ion/narrate?text=${encodeURIComponent(seg.text)}`;
  if (seg.kind === "clip") return `/api/ion/audio-clip/${encodeURIComponent(seg.callId)}?start=${seg.start.toFixed(3)}&end=${seg.end.toFixed(3)}`;
  return `/api/ion/audio-clip/${encodeURIComponent(seg.callId)}`;
}

export function useBriefPlayer() {
  const audio = useRef<HTMLAudioElement | null>(null);
  const [queue, setQueue] = useState<Segment[]>([]);
  const [idx, setIdx] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const a = new Audio();
    a.preload = "auto";
    audio.current = a;
    return () => {
      a.pause();
      audio.current = null;
    };
  }, []);

  const playIndex = useCallback((q: Segment[], i: number) => {
    const a = audio.current;
    if (!a) return;
    if (i >= q.length) {
      setIdx(-1);
      setPlaying(false);
      return;
    }
    setIdx(i);
    setError(null);
    a.src = srcFor(q[i]);
    a.onended = () => playIndex(q, i + 1);
    a.onerror = () => {
      setError(`couldn't play: ${q[i].label}`);
      playIndex(q, i + 1); // skip the bad segment, keep the brief moving
    };
    a.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  }, []);

  const start = useCallback((q: Segment[]) => {
    setQueue(q);
    playIndex(q, 0);
  }, [playIndex]);

  const toggle = useCallback(() => {
    const a = audio.current;
    if (!a || idx < 0) return;
    if (a.paused) a.play().then(() => setPlaying(true)).catch(() => {});
    else {
      a.pause();
      setPlaying(false);
    }
  }, [idx]);

  const skip = useCallback(() => playIndex(queue, idx + 1), [playIndex, queue, idx]);
  const stop = useCallback(() => {
    audio.current?.pause();
    setIdx(-1);
    setPlaying(false);
  }, []);

  return { start, toggle, skip, stop, playing, current: idx >= 0 ? queue[idx] : null, position: idx, total: queue.length, error };
}

// The sticky now-playing bar. Renders nothing until something is queued.
export function NowPlaying({
  player,
}: {
  player: ReturnType<typeof useBriefPlayer>;
}) {
  if (!player.current) return null;
  const c = player.current;
  return (
    <div className="sticky bottom-0 z-30 -mx-4 mt-4 border-t border-stewart-accent/40 bg-stewart-card/95 backdrop-blur px-4 py-2.5">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={player.toggle}
          aria-label={player.playing ? "Pause" : "Play"}
          className="h-9 w-9 shrink-0 rounded-full bg-stewart-accent text-white flex items-center justify-center"
        >
          {player.playing ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h4v14H6zM14 5h4v14h-4z" /></svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
          )}
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-wider text-stewart-muted">
            {c.kind === "say" ? "Stewart" : c.kind === "clip" ? "The tape" : "Full call"} · {player.position + 1}/{player.total}
          </p>
          <p className="text-xs text-stewart-text truncate">{c.label}</p>
          {player.error ? <p className="text-[10px] text-stewart-warning truncate">{player.error}</p> : null}
        </div>
        <button type="button" onClick={player.skip} className="text-[11px] text-stewart-muted hover:text-stewart-text px-2">skip</button>
        <button type="button" onClick={player.stop} className="text-[11px] text-stewart-muted hover:text-stewart-text px-1">✕</button>
      </div>
    </div>
  );
}
