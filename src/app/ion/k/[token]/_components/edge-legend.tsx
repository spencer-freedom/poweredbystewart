// Small persistent legend explaining the edge styles in the graph. Renders
// inside <GraphCanvas> via the `legend` slot. Shown on the cluster tree
// AND wiki so users always have a key to the graph vocabulary even when
// edges are too thin to read at fit-view zoom.

type LegendItem = {
  label: string;
  // SVG path stroke style: solid / dashed / animated.
  variant: "solid" | "dashed" | "animated";
  color: string;
};

export function EdgeLegend({ items }: { items: ReadonlyArray<LegendItem> }) {
  return (
    <div className="space-y-1.5 text-[10px]">
      {items.map((it) => (
        <div key={it.label} className="flex items-center gap-2 text-stewart-text">
          <svg width={28} height={4} className="shrink-0">
            <line
              x1={0}
              y1={2}
              x2={28}
              y2={2}
              stroke={it.color}
              strokeWidth={2}
              strokeDasharray={it.variant === "dashed" ? "4 3" : undefined}
              strokeOpacity={it.variant === "dashed" ? 0.7 : 1}
            >
              {it.variant === "animated" && (
                <animate
                  attributeName="stroke-dashoffset"
                  from="0"
                  to="-7"
                  dur="0.6s"
                  repeatCount="indefinite"
                />
              )}
            </line>
          </svg>
          <span className="text-stewart-muted">{it.label}</span>
        </div>
      ))}
    </div>
  );
}

// Standard legend items for the cluster tree + wiki. Centralized so the
// vocabulary stays consistent.
export const TREE_LEGEND: ReadonlyArray<LegendItem> = [
  { label: "winning chain", variant: "solid", color: "#bae6fd" },
  { label: "follow-up worked", variant: "animated", color: "#22c55e" },
  { label: "follow-up partial / failed", variant: "dashed", color: "#f59e0b" },
  { label: "losing variant", variant: "solid", color: "#ef4444" },
];

export const WIKI_LEGEND: ReadonlyArray<LegendItem> = [
  { label: "cluster → track", variant: "solid", color: "#bae6fd" },
  { label: "same-call link", variant: "dashed", color: "#a78bfa" },
  { label: "losing variant", variant: "solid", color: "#ef4444" },
];
