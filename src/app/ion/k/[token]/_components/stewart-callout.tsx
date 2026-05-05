// Stewart's voice — the canonical persona container for any observation,
// suggestion, or note from "Stewart" the agent. Approved 2026-05-04 by
// Spencer + strategy Claude. New prefixes added ONLY through strategy
// review and update of /Desktop/stewart-voice-phrasings.md.
//
// Voice spec: casual-but-competent. Wise but not preachy. No jargon.
// Confident without arrogance. Third-person everywhere — first-person
// reserved for VOICE output (post-v2 sprint).
//
// NEGATIVE SPACE — never ship in customer copy:
//   • "Our analysis shows…" / "Based on the data…" as a lede
//   • "The algorithm detected…" / "AI analysis indicates…"
//   • "Statistically significant…" / "Per our model…"
//   • "Recommendations:" (cold list-header)
//   • "The system has identified…" (passive + machinery)
//   • "Stewart's machine learning…" (exposes the LLM frame)
//   • "Stewart wants to highlight…" (puffed up — use "Worth a closer look:")
//   • Praise-spam ("Great job!" / "Awesome!")

import { cn } from "@/lib/utils";

export type StewartKind =
  | "notice"     // Stewart noticed [body]
  | "suggest"    // Stewart suggests [body]
  | "read"       // Stewart's read on this: [body]
  | "pattern"    // Pattern Stewart's seeing: [body]
  | "look"       // Worth a closer look: [body]
  | "flag"       // Heads up — [body]
  | "learning"   // Stewart's been chewing on [body]
  | "quick-win"  // Quick win: [body]
  | "quote"      // From the floor: "[body]"
  | "wip";       // Stewart's still working on this part [+ optional body]

const PREFIX: Record<StewartKind, string> = {
  notice: "Stewart noticed",
  suggest: "Stewart suggests",
  read: "Stewart's read on this:",
  pattern: "Pattern Stewart's seeing:",
  look: "Worth a closer look:",
  flag: "Heads up —",
  learning: "Stewart's been chewing on",
  "quick-win": "Quick win:",
  quote: "From the floor:",
  wip: "Stewart's still working on this part.",
};

type Tone = {
  card: string;
  dot: string;
  prefix: string;
};

const TONES: Record<StewartKind, Tone> = {
  notice: {
    card: "border-sky-500/40 bg-sky-500/5",
    dot: "bg-sky-400",
    prefix: "text-sky-300",
  },
  suggest: {
    card: "border-stewart-accent/40 bg-stewart-accent/5",
    dot: "bg-stewart-accent",
    prefix: "text-stewart-accent",
  },
  read: {
    card: "border-sky-500/40 bg-sky-500/5",
    dot: "bg-sky-400",
    prefix: "text-sky-300",
  },
  pattern: {
    card: "border-violet-500/40 bg-violet-500/5",
    dot: "bg-violet-400",
    prefix: "text-violet-300",
  },
  look: {
    card: "border-stewart-warning/40 bg-stewart-warning/5",
    dot: "bg-stewart-warning",
    prefix: "text-stewart-warning",
  },
  flag: {
    card: "border-stewart-warning/40 bg-stewart-warning/5",
    dot: "bg-stewart-warning",
    prefix: "text-stewart-warning",
  },
  learning: {
    card: "border-stewart-border bg-stewart-card",
    dot: "bg-stewart-muted",
    prefix: "text-stewart-muted",
  },
  "quick-win": {
    card: "border-stewart-success/40 bg-stewart-success/5",
    dot: "bg-stewart-success",
    prefix: "text-stewart-success",
  },
  quote: {
    card: "border-stewart-border bg-stewart-card",
    dot: "bg-stewart-muted",
    prefix: "text-stewart-muted",
  },
  wip: {
    card: "border-stewart-border bg-stewart-card",
    dot: "bg-stewart-muted",
    prefix: "text-stewart-text",
  },
};

export function StewartCallout({
  kind,
  children,
  className,
}: {
  kind: StewartKind;
  children?: React.ReactNode;
  className?: string;
}) {
  const tone = TONES[kind];
  const prefix = PREFIX[kind];

  if (kind === "quote") {
    return (
      <div
        className={cn(
          "inline-flex items-start gap-3 rounded-lg border px-4 py-3 max-w-2xl",
          tone.card,
          className
        )}
      >
        <span
          className={cn("relative flex h-2 w-2 mt-1.5 shrink-0", tone.dot)}
        >
          <span className={cn("inline-flex rounded-full h-2 w-2", tone.dot)} />
        </span>
        <p className="text-sm leading-relaxed">
          <span className={cn("font-semibold", tone.prefix)}>{prefix}</span>{" "}
          <span className="text-stewart-text italic">
            &ldquo;{children}&rdquo;
          </span>
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "inline-flex items-start gap-3 rounded-lg border px-4 py-3 max-w-2xl",
        tone.card,
        className
      )}
    >
      <span className="relative flex h-2 w-2 mt-1.5 shrink-0">
        <span className={cn("inline-flex rounded-full h-2 w-2", tone.dot)} />
      </span>
      <p className="text-sm text-stewart-text leading-relaxed">
        <span className={cn("font-semibold", tone.prefix)}>{prefix}</span>
        {children ? <> {children}</> : null}
      </p>
    </div>
  );
}
