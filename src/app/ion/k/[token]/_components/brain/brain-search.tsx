"use client";

import { useEffect, useRef, useState } from "react";
import type { BrainGraphPayload } from "./brain-types";

const DEBOUNCE_MS = 300;

// Outcome-filter mode — operator surface: "show me wins / losses / partials"
// pops the matching cohort. Reps can scan their floor's bleed at a glance.
function outcomeFilterFor(q: string): "worked" | "partial" | "failed" | null {
  const needle = q.trim().toLowerCase();
  if (!needle) return null;
  if (/\b(wins?|won|worked|what works|closes?)\b/.test(needle)) return "worked";
  if (/\b(losses?|losing|lost|failed?|where we bleed|bleeding)\b/.test(needle))
    return "failed";
  if (/\b(partials?|partial|halfway|tentative)\b/.test(needle)) return "partial";
  return null;
}

// Rep-name mode — case-insensitive substring match against setter_name
// or setter_id. All calls + their events from that rep light up.
function repFilterMatches(data: BrainGraphPayload, q: string): Set<string> {
  const needle = q.trim().toLowerCase();
  if (!needle) return new Set();
  const matchedCallIds = new Set<string>();
  for (const n of data.nodes) {
    if (n.type !== "call") continue;
    const name = (n.setter_name ?? "").toLowerCase();
    const id = (n.setter_id ?? "").toLowerCase();
    if (name.includes(needle) || id.includes(needle)) {
      matchedCallIds.add(n.id);
    }
  }
  if (matchedCallIds.size === 0) return new Set();
  const matched = new Set<string>(matchedCallIds);
  for (const n of data.nodes) {
    if (n.type !== "call" && matchedCallIds.has(n.call_id)) matched.add(n.id);
  }
  return matched;
}

// Local-only search dispatcher. Modes (in priority order):
//   • outcome bucket   — "wins", "losses", "partials" → highlight by outcome
//   • rep / setter     — exact substring of setter name/id
//   • verbatim text    — substring match against objection/solution text
function localSearch(data: BrainGraphPayload, q: string): Set<string> {
  if (!q.trim()) return new Set();

  // Mode B — outcome filter
  const outcome = outcomeFilterFor(q);
  if (outcome) {
    const matched = new Set<string>();
    const matchedCallIds = new Set<string>();
    for (const n of data.nodes) {
      if (
        (n.type === "objection" || n.type === "solution") &&
        n.effective_outcome === outcome
      ) {
        matched.add(n.id);
        matchedCallIds.add(n.call_id);
      }
      if (n.type === "call" && n.effective_outcome === outcome) {
        matched.add(n.id);
      }
    }
    for (const n of data.nodes) {
      if (n.type === "call" && matchedCallIds.has(n.id)) matched.add(n.id);
    }
    return matched;
  }

  // Mode C — rep filter
  const repMatches = repFilterMatches(data, q);
  if (repMatches.size > 0) return repMatches;

  // Default — verbatim text match
  const needle = q.trim().toLowerCase();
  const matched = new Set<string>();
  const matchedCallIds = new Set<string>();
  for (const n of data.nodes) {
    if (n.type === "objection" || n.type === "solution") {
      if (n.verbatim.toLowerCase().includes(needle)) {
        matched.add(n.id);
        matchedCallIds.add(n.call_id);
      }
    }
  }
  for (const n of data.nodes) {
    if (n.type === "call" && matchedCallIds.has(n.id)) matched.add(n.id);
  }
  return matched;
}

export function BrainSearch({
  data,
  onChange,
  totalNodes,
}: {
  data: BrainGraphPayload;
  onChange: (matchedIds: ReadonlySet<string>) => void;
  totalNodes: number;
}) {
  const [query, setQuery] = useState("");
  const [matchCount, setMatchCount] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const matched = localSearch(data, query);
      setMatchCount(matched.size);
      onChange(matched);
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, data, onChange]);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-[280px] max-w-md">
        <input
          type="search"
          placeholder="Search verbatims · or try: wins / losses / partials / rep name"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-stewart-card border border-stewart-border rounded-md px-3 py-2 text-sm text-stewart-text placeholder:text-stewart-muted focus:outline-none focus:ring-2 focus:ring-stewart-accent/40 focus:border-stewart-accent/60"
        />
      </div>
      {query.trim() && (
        <span className="text-xs text-stewart-muted font-mono">
          <span className="text-stewart-text">{matchCount}</span> match
          {matchCount === 1 ? "" : "es"} of {totalNodes}
        </span>
      )}
      {query.trim() && (
        <button
          onClick={() => setQuery("")}
          className="text-xs text-stewart-muted hover:text-stewart-text"
        >
          clear
        </button>
      )}
    </div>
  );
}
