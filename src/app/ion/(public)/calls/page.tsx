import { promises as fs } from "node:fs";
import path from "node:path";
import Link from "next/link";
import type { CallsIndex } from "./types";
import { CallsBrowser } from "./CallsBrowser.client";

// Server component. Loads the build-time-generated calls-index.json
// (the summary fields for all 332 processed Ion calls) and ships it
// to a client component that handles search + filter + drawer state.
//
// Per-call detail JSONs (manager-brief / cherrypicks / handoff) are
// loaded on-demand by the client when a card is clicked — keeps the
// initial payload at ~150KB instead of ~10MB.

export const dynamic = "force-dynamic";

async function loadIndex(): Promise<CallsIndex> {
  const filePath = path.join(
    process.cwd(),
    "public",
    "ion",
    "calls-index.json"
  );
  const raw = await fs.readFile(filePath, "utf-8");
  return JSON.parse(raw) as CallsIndex;
}

export default async function IonAllCallsPage() {
  const index = await loadIndex();
  return (
    <div className="space-y-8">
      <header>
        <div className="flex items-baseline justify-between gap-3 mb-4">
          <p className="text-xs uppercase tracking-wider font-semibold text-stewart-accent">
            Proof of work
          </p>
          <Link
            href="/ion"
            className="text-sm text-stewart-muted hover:text-stewart-text transition-colors"
          >
            &larr; Back to the demo
          </Link>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-stewart-text leading-tight">
          Stewart on Ion &mdash; every call we processed
        </h1>
        <p className="mt-4 text-lg text-stewart-muted leading-relaxed max-w-3xl">
          <span className="text-stewart-text font-mono">
            {index.total_calls}
          </span>{" "}
          calls processed.{" "}
          <span className="text-stewart-text font-mono">
            {index.hero_count}
          </span>{" "}
          hand-picked as hero examples. The rest populate Stewart&apos;s
          brain. Browse any of them &mdash; no demo-theater, no
          cherry-picking, every read Stewart took on every call.
        </p>
      </header>

      <CallsBrowser index={index} />
    </div>
  );
}
