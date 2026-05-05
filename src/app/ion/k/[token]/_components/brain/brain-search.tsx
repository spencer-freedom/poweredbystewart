"use client";

import { useEffect, useRef, useState } from "react";
import type { BrainGraphPayload } from "./brain-types";

const DEBOUNCE_MS = 300;

// Local-only search until /api/ion/search ships. Substring-matches the
// query against verbatim text on objection / solution nodes; a call
// matches if any of its events match. Returns matching node ids.
function localSearch(data: BrainGraphPayload, q: string): Set<string> {
  if (!q.trim()) return new Set();
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
          placeholder="Search verbatims, objections, rebuttals…"
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
