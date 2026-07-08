// The Sales Machine workflow chart. Appears twice in the pitch:
//   • Build #2 (variant="capabilities") — clean machine with Stewart's
//     five-word rhythm overlaid across the stages it touches. This is
//     where the rhythm phrase is introduced.
//   • Build #5 (variant="leaks") — same machine shape, now with the four
//     leak categories overlaid on the stages where they happen, plus the
//     Salesforce write-back loop.
//
// Pure CSS/flex, no deps. Horizontally scrollable on small screens so the
// chart keeps its left-to-right shape (this is a desktop-primary pitch).

const STAGES = [
  "Lead",
  "Conversation",
  "Understanding",
  "Classification",
  "Routing",
  "Appointment",
  "Sit",
  "Closer",
  "Install",
  "Future Opportunity",
] as const;

// Stewart's rhythm mapped to the stages each capability is most visible in.
const CAPABILITIES: {
  word: string;
  span: [number, number]; // inclusive stage indices
}[] = [
  { word: "Observe", span: [0, 1] },
  { word: "Understand", span: [2, 2] },
  { word: "Classify", span: [3, 3] },
  { word: "Route", span: [4, 5] },
  { word: "Remember", span: [6, 9] },
];

const LEAKS: {
  label: string;
  stage: number;
  blurb: string;
}[] = [
  { label: "Motivation", stage: 1, blurb: "Bill treated as procedure, not motivation" },
  { label: "Routing", stage: 4, blurb: "Hot lead mishandled, never escalated" },
  { label: "Process", stage: 5, blurb: "Email-quote policy creates dead leads" },
  { label: "Recovery", stage: 9, blurb: "30-day dump resets the lead's context" },
];

export function SalesMachine({
  variant = "capabilities",
}: {
  variant?: "capabilities" | "leaks";
}) {
  return (
    <div className="rounded-xl border border-stewart-border bg-stewart-card p-5 sm:p-6 overflow-x-auto">
      <div className="min-w-[760px]">
        {variant === "capabilities" ? (
          <CapabilityBand />
        ) : (
          <LeakBand />
        )}

        {/* The machine — stage chips left to right. */}
        <div className="grid grid-cols-10 gap-1.5">
          {STAGES.map((stage, i) => (
            <StageChip
              key={stage}
              label={stage}
              dim={variant === "leaks" && !LEAKS.some((l) => l.stage === i)}
              flagged={variant === "leaks" && LEAKS.some((l) => l.stage === i)}
            />
          ))}
        </div>

        {variant === "leaks" && <SalesforceLoop />}
      </div>
    </div>
  );
}

function CapabilityBand() {
  return (
    <div className="grid grid-cols-10 gap-1.5 mb-2">
      {CAPABILITIES.map((cap) => {
        const span = cap.span[1] - cap.span[0] + 1;
        return (
          <div
            key={cap.word}
            className="rounded-md bg-stewart-accent/10 border border-stewart-accent/30 px-2 py-1.5 text-center"
            style={{ gridColumn: `span ${span} / span ${span}` }}
          >
            <span className="text-[11px] sm:text-xs uppercase tracking-[0.15em] font-bold text-stewart-accent">
              {cap.word}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function LeakBand() {
  return (
    <div className="grid grid-cols-10 gap-1.5 mb-2">
      {STAGES.map((_, i) => {
        const leak = LEAKS.find((l) => l.stage === i);
        if (!leak) return <div key={i} />;
        return (
          <div
            key={i}
            className="rounded-md bg-stewart-warning/10 border border-stewart-warning/40 px-2 py-1.5 text-center"
          >
            <span className="block text-[11px] uppercase tracking-wider font-bold text-stewart-warning">
              {leak.label}
            </span>
            <span className="block text-[10px] text-stewart-muted leading-tight mt-0.5">
              {leak.blurb}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function StageChip({
  label,
  dim,
  flagged,
}: {
  label: string;
  dim?: boolean;
  flagged?: boolean;
}) {
  return (
    <div
      className={
        "rounded-md border px-2 py-3 text-center transition-colors " +
        (flagged
          ? "border-stewart-warning/50 bg-stewart-warning/5"
          : dim
          ? "border-stewart-border bg-stewart-bg/30 opacity-60"
          : "border-stewart-border bg-stewart-bg/50")
      }
    >
      <span className="text-[11px] sm:text-xs font-medium text-stewart-text leading-tight">
        {label}
      </span>
    </div>
  );
}

function SalesforceLoop() {
  return (
    <div className="mt-4 flex items-center gap-3 rounded-lg border border-stewart-accent/30 bg-stewart-accent/5 px-4 py-3">
      <span className="text-xs font-mono uppercase tracking-wider text-stewart-accent shrink-0">
        Salesforce write-back
      </span>
      <span className="text-xs text-stewart-muted leading-relaxed">
        Conversation &rarr; Salesforce &rarr; back into the queue with full
        prior context. The lead never disappears &mdash; it gets placed
        where it has the best shot, and every touch carries the whole
        history.
      </span>
    </div>
  );
}
