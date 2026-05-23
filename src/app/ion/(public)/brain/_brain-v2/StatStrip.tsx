import type { BrainV2Payload } from "./types";

export function StatStrip({ payload }: { payload: BrainV2Payload }) {
  const s = payload.stats;
  return (
    <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1 text-sm">
      <span className="text-stewart-text font-semibold text-base">
        Stewart&apos;s brain &mdash;{" "}
        <span className="text-stewart-accent">Ion Solar</span>
      </span>
      <span className="text-stewart-muted">
        <span className="text-stewart-text font-mono">
          {s.calls_total.toLocaleString()}
        </span>{" "}
        calls processed
      </span>
      <span className="text-stewart-muted">
        <span className="text-stewart-text font-mono">{s.sections_lit}</span>{" "}
        codex sections lit ({payload.core.lat_count}&times;
        {payload.core.lon_count} lat/long grid; {s.inactive_tiles}{" "}
        inactive)
      </span>
      <span className="text-stewart-muted">
        <span className="text-stewart-text font-mono">
          {s.cherrypicks_total.toLocaleString()}
        </span>{" "}
        cherry-pick moments
      </span>
      <span className="text-stewart-muted">
        <span className="text-stewart-text font-mono">
          {s.presumptive_gray_matter}
        </span>{" "}
        presumptive gray-matter exemplars
      </span>
      <span className="text-stewart-muted">
        <span className="text-stewart-text font-mono">
          {s.proposed_pending}
        </span>{" "}
        new categories pending Kenny approval
      </span>
    </div>
  );
}
