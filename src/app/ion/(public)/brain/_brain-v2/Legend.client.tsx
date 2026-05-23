"use client";

const DOMAIN_LABEL: Record<string, string> = {
  context: "Context",
  intros: "Intros",
  call_shape: "Call shape",
  verify: "Verify",
  qualifiers: "Qualifiers",
  bill_collection: "Bill collection",
  rebuttals: "Rebuttals",
  protocols: "Protocols",
  coaching_philosophy: "Coaching",
  cross_sell_signals: "Cross-sell",
  outcomes: "Outcomes",
  dq_rules: "DQ rules",
  analysis_directives: "Analysis",
  _unclassified: "Unclassified",
  _unknown: "Unknown",
};

// Legend rendered as a fixed strip over the bottom of the canvas.
// Hovering a swatch sets `hoveredDomain` upstream — the scene tints
// tiles + moons of that domain to highlight in unison.

export function Legend({
  domainColors,
  hoveredDomain,
  onHoverDomain,
}: {
  domainColors: Record<string, string>;
  hoveredDomain: string | null;
  onHoverDomain: (d: string | null) => void;
}) {
  const entries = Object.entries(domainColors).filter(
    ([k]) => k !== "_unknown"
  );
  return (
    <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:max-w-[26rem] z-20 pointer-events-auto">
      <div className="bg-stewart-bg/85 backdrop-blur-sm border border-stewart-border rounded-lg px-3 py-2 flex flex-wrap gap-x-3 gap-y-1.5">
        {entries.map(([domain, color]) => {
          const active = hoveredDomain === domain;
          return (
            <button
              key={domain}
              onMouseEnter={() => onHoverDomain(domain)}
              onMouseLeave={() => onHoverDomain(null)}
              className={
                "inline-flex items-center gap-1.5 text-[10px] font-mono transition-opacity " +
                (active
                  ? "opacity-100 text-stewart-text"
                  : hoveredDomain
                  ? "opacity-40 text-stewart-muted"
                  : "opacity-90 text-stewart-muted hover:text-stewart-text")
              }
            >
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ background: color }}
              />
              {DOMAIN_LABEL[domain] || domain}
            </button>
          );
        })}
      </div>
    </div>
  );
}
