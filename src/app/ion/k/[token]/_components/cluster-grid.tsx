"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { Cluster } from "@/lib/ion-api";
import { cn } from "@/lib/utils";

type SortKey = "frequency" | "win_rate" | "name";

export type ClusterCard = {
  cluster: Cluster;
  trackCount: number;
  losingCount: number;
};

export function ClusterGrid({
  cards,
  basePath,
}: {
  cards: ClusterCard[];
  basePath: string;
}) {
  const [sort, setSort] = useState<SortKey>("frequency");

  const sorted = useMemo(() => {
    const arr = [...cards];
    if (sort === "frequency")
      arr.sort((a, b) => b.cluster.frequency - a.cluster.frequency);
    if (sort === "win_rate")
      arr.sort((a, b) => b.cluster.win_rate - a.cluster.win_rate);
    if (sort === "name")
      arr.sort((a, b) => a.cluster.name.localeCompare(b.cluster.name));
    return arr;
  }, [cards, sort]);

  return (
    <>
      <div className="flex items-center gap-2 text-sm">
        <span className="text-stewart-muted">Sort:</span>
        {(
          [
            ["frequency", "Frequency"],
            ["win_rate", "Win rate"],
            ["name", "Name"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setSort(key)}
            className={cn(
              "px-3 py-1 rounded border transition-colors",
              sort === key
                ? "border-stewart-accent text-stewart-accent bg-stewart-accent/10"
                : "border-stewart-border text-stewart-muted hover:text-stewart-text"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {sorted.map(({ cluster: c, trackCount, losingCount }) => (
          <Link
            key={c.id}
            href={`${basePath}/${c.id}`}
            className="block bg-stewart-card border border-stewart-border rounded-lg p-5 hover:border-stewart-accent transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-base font-semibold text-stewart-text">
                {c.name}
              </h3>
              <WinRatePill rate={c.win_rate} />
            </div>
            <p className="text-sm text-stewart-muted mt-2 line-clamp-3">
              {c.description}
            </p>
            <div className="flex items-center gap-4 mt-4 text-xs text-stewart-muted">
              <span>
                <strong className="text-stewart-text">{c.frequency}</strong>{" "}
                calls
              </span>
              <span>
                <strong className="text-stewart-success">{trackCount}</strong>{" "}
                wins
              </span>
              {losingCount > 0 && (
                <span>
                  <strong className="text-stewart-danger">{losingCount}</strong>{" "}
                  losses
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}

function WinRatePill({ rate }: { rate: number }) {
  const pct = Math.round(rate * 100);
  const tone =
    pct >= 70
      ? "bg-stewart-success/15 text-stewart-success border-stewart-success/30"
      : pct >= 40
      ? "bg-stewart-warning/15 text-stewart-warning border-stewart-warning/30"
      : "bg-stewart-danger/15 text-stewart-danger border-stewart-danger/30";
  return (
    <span
      className={cn(
        "px-2 py-1 rounded text-xs font-mono border whitespace-nowrap",
        tone
      )}
    >
      {pct}% win
    </span>
  );
}
