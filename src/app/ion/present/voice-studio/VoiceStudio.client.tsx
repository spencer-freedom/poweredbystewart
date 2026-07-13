"use client";

import { useMemo, useState } from "react";
import { altTakeUrl } from "../../(public)/_components/AltTake.client";

// Author studio for the voice-mirror feature. Type a line, pick the rep,
// hit Generate — the server renders it in the rep's cloned voice and caches
// it (so it's instant during the live pitch). Then copy a <HearBoth> snippet
// pre-filled with your alt line to drop into a section.
//
// Reps here must exist in the server-side REP_VOICES map.
const REPS = ["Joel"];

export function VoiceStudio() {
  const [rep, setRep] = useState(REPS[0]);
  const [text, setText] = useState(
    "Well, that's exactly why most people look into it — it's the money. So what's your electric bill running you a month?"
  );
  const [phone, setPhone] = useState(true);
  const [src, setSrc] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("");

  const [callId, setCallId] = useState("10000138466");
  const [startSec, setStartSec] = useState("256.79");
  const [endSec, setEndSec] = useState("260.41");
  const [actualQuote, setActualQuote] = useState(
    "Well, that's kinda why most people are looking into it is money."
  );

  const generate = () => {
    setStatus("generating…");
    // cache-bust the <audio> element but not the server cache (same params)
    setSrc(altTakeUrl(rep, text, phone) + `&_t=${Date.now()}`);
  };

  const snippet = useMemo(
    () =>
      `<HearBoth\n  rep="${rep}"\n  callId="${callId}"\n  startSec={${startSec}}\n  endSec={${endSec}}\n  phone={${phone}}\n  actualQuote={\`${actualQuote.replace(/`/g, "\\`")}\`}\n  altText={\`${text.replace(/`/g, "\\`")}\`}\n/>`,
    [rep, callId, startSec, endSec, phone, actualQuote, text]
  );

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6 text-stewart-text">
      <div>
        <h1 className="text-2xl font-semibold">Voice Studio</h1>
        <p className="text-sm text-stewart-muted mt-1">
          Generate a &ldquo;could&apos;ve said&rdquo; line in a rep&apos;s cloned voice.
          Generating also caches it for the live pitch.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-[120px_1fr] items-start">
        <label className="text-sm text-stewart-muted pt-2">Rep</label>
        <select
          value={rep}
          onChange={(e) => setRep(e.target.value)}
          className="rounded border border-stewart-border bg-stewart-card px-3 py-2 text-sm"
        >
          {REPS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>

        <label className="text-sm text-stewart-muted pt-2">Line</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          className="rounded border border-stewart-border bg-stewart-card px-3 py-2 text-sm"
        />

        <span />
        <label className="flex items-center gap-2 text-sm text-stewart-muted">
          <input type="checkbox" checked={phone} onChange={(e) => setPhone(e.target.checked)} />
          Phone-match (band-limit to match call audio)
        </label>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={generate}
          className="px-4 py-2 rounded bg-stewart-accent text-black text-sm font-semibold hover:opacity-90"
        >
          Generate &amp; play
        </button>
        {status && <span className="text-xs text-stewart-muted">{status}</span>}
      </div>

      {src && (
        <audio
          key={src}
          src={src}
          controls
          autoPlay
          preload="auto"
          className="h-10 w-full max-w-md"
          onPlaying={() => setStatus("playing")}
          onError={() => setStatus("error — check rep is in REP_VOICES and the key is set")}
        />
      )}

      <hr className="border-stewart-border" />

      <div className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-stewart-muted">
          A/B snippet for the deck
        </h2>
        <p className="text-xs text-stewart-muted">
          Fill the real-clip coordinates, then copy the <code>&lt;HearBoth&gt;</code> tag.
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          <input value={callId} onChange={(e) => setCallId(e.target.value)} placeholder="callId"
            className="rounded border border-stewart-border bg-stewart-card px-2 py-1.5 text-sm" />
          <input value={startSec} onChange={(e) => setStartSec(e.target.value)} placeholder="startSec"
            className="rounded border border-stewart-border bg-stewart-card px-2 py-1.5 text-sm" />
          <input value={endSec} onChange={(e) => setEndSec(e.target.value)} placeholder="endSec"
            className="rounded border border-stewart-border bg-stewart-card px-2 py-1.5 text-sm" />
        </div>
        <textarea value={actualQuote} onChange={(e) => setActualQuote(e.target.value)} rows={2}
          placeholder="actual quote"
          className="w-full rounded border border-stewart-border bg-stewart-card px-3 py-2 text-sm" />
        <pre className="text-xs bg-stewart-card border border-stewart-border rounded p-3 overflow-x-auto whitespace-pre-wrap">
          {snippet}
        </pre>
        <button
          onClick={() => navigator.clipboard?.writeText(snippet)}
          className="px-3 py-1.5 rounded border border-stewart-border text-xs hover:border-stewart-accent/40"
        >
          Copy snippet
        </button>
      </div>
    </div>
  );
}
