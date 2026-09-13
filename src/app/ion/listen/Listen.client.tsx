"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AudioClip } from "../(public)/_components/AudioClip.client";

// Parses ?call=…&m=start-end[:label]&m=… and renders one player per moment
// plus the full call. Same audio route the rest of /ion uses, so anything
// in the corpus is one URL away.

type Moment = { start: number; end: number; label: string };

function parseMoments(raw: string[]): Moment[] {
  const out: Moment[] = [];
  for (const m of raw) {
    const [range, ...rest] = m.split(":");
    const [a, b] = range.split("-").map((x) => parseFloat(x));
    if (!isFinite(a) || !isFinite(b) || b <= a) continue;
    out.push({ start: a, end: b, label: rest.join(":") || `${fmt(a)}–${fmt(b)}` });
  }
  return out;
}

const fmt = (sec: number) => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, "0")}`;

export function Listen() {
  const sp = useSearchParams();
  const call = sp.get("call") ?? "";
  const moments = parseMoments(sp.getAll("m"));
  const title = sp.get("t");

  if (!call) {
    return (
      <main className="min-h-screen bg-stewart-bg text-stewart-text px-6 py-12 max-w-xl mx-auto">
        <h1 className="text-xl font-bold">Listen</h1>
        <p className="mt-3 text-sm text-stewart-muted leading-relaxed">
          Add <span className="font-mono">?call=&lt;id&gt;</span> and one or more{" "}
          <span className="font-mono">&amp;m=start-end:label</span> (seconds). Example:{" "}
          <Link
            href="/ion/listen?call=20000555055&m=64-80:Title%20question&m=130-150:Credit%20question"
            className="text-stewart-accent hover:underline break-all"
          >
            /ion/listen?call=20000555055&amp;m=64-80:Title question&amp;m=130-150:Credit question
          </Link>
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-stewart-bg text-stewart-text px-6 py-10 max-w-xl mx-auto">
      <p className="text-xs uppercase tracking-wider text-stewart-muted">Listen</p>
      <h1 className="mt-1 text-xl font-bold">{title || `Call ${call}`}</h1>
      {title ? <p className="text-xs font-mono text-stewart-muted mt-1">{call}</p> : null}

      <ul className="mt-6 space-y-4">
        {moments.map((m, i) => (
          <li key={i} className="rounded-lg border border-stewart-border bg-stewart-card p-4">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-sm font-semibold">{m.label}</p>
              <span className="text-xs font-mono text-stewart-muted">
                {fmt(m.start)} – {fmt(m.end)}
              </span>
            </div>
            <div className="mt-3">
              <AudioClip callId={call} startSec={m.start} endSec={m.end} label="Play" />
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-8 pt-6 border-t border-stewart-border flex items-center gap-3">
        <AudioClip callId={call} variant="full" label="Play the full call" />
        <span className="text-xs text-stewart-muted">start to finish</span>
      </div>
    </main>
  );
}
