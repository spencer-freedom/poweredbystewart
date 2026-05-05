// Renders a Composer output payload (training brief / coaching prep).
// Both endpoints return the same shape: a leading headline + structured
// sections. Mobile-first single-column stack; on desktop the card sizes
// breathe but layout stays vertical.
//
// Heading-pattern → tone mapping picks a Stewart-voice color treatment
// per section. Falls back to neutral when no pattern matches.

import { StewartCallout } from "./stewart-callout";
import type { ComposerOutputPayload, ComposerSection } from "@/lib/stewart-api";

export function ComposerOutput({
  data,
}: {
  data: ComposerOutputPayload;
}) {
  return (
    <div className="space-y-5">
      <StewartCallout kind="notice">{data.headline}</StewartCallout>
      <div className="space-y-3">
        {data.sections.map((s, i) => (
          <SectionCard key={`${i}-${s.heading}`} section={s} />
        ))}
      </div>
      {(data.model || data.cost_usd != null) && (
        <p className="text-[10px] text-stewart-muted/70 font-mono">
          {data.model ? `composed by ${data.model}` : ""}
          {data.cost_usd != null
            ? ` · $${data.cost_usd.toFixed(4)}`
            : ""}
          {data.elapsed_seconds != null
            ? ` · ${data.elapsed_seconds.toFixed(1)}s`
            : ""}
        </p>
      )}
    </div>
  );
}

type Tone = "neutral" | "win" | "warning" | "action";

function toneFor(heading: string): Tone {
  const h = heading.toLowerCase();
  if (/work(s|ed|ing)|win|strong|success|nailed|solid/.test(h)) return "win";
  if (/needs work|miss|gap|loss|fail|drag|problem|risk/.test(h)) return "warning";
  if (/coach|takeaway|next|practice|do this|action/.test(h)) return "action";
  return "neutral";
}

const TONE_STYLES: Record<Tone, { card: string; heading: string; rule: string }> = {
  neutral: {
    card: "border-stewart-border bg-stewart-card",
    heading: "text-stewart-text",
    rule: "bg-stewart-border",
  },
  win: {
    card: "border-stewart-success/30 bg-stewart-success/5",
    heading: "text-stewart-success",
    rule: "bg-stewart-success/40",
  },
  warning: {
    card: "border-stewart-warning/30 bg-stewart-warning/5",
    heading: "text-stewart-warning",
    rule: "bg-stewart-warning/40",
  },
  action: {
    card: "border-stewart-accent/30 bg-stewart-accent/5",
    heading: "text-stewart-accent",
    rule: "bg-stewart-accent/40",
  },
};

function SectionCard({ section }: { section: ComposerSection }) {
  const tone = toneFor(section.heading);
  const t = TONE_STYLES[tone];
  return (
    <article
      className={`rounded-lg border ${t.card} p-4 sm:p-5 transition-colors`}
    >
      <div className="flex items-baseline gap-2 mb-2">
        <span className={`block w-1 h-4 rounded-sm ${t.rule}`} />
        <h3 className={`text-sm sm:text-base font-semibold ${t.heading}`}>
          {section.heading}
        </h3>
      </div>
      <p className="text-sm text-stewart-text leading-relaxed whitespace-pre-line">
        {section.body}
      </p>
      {section.citation_ids && section.citation_ids.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {section.citation_ids.map((c) => (
            <span
              key={c}
              className="text-[10px] font-mono px-2 py-0.5 rounded border border-stewart-border bg-stewart-bg text-stewart-muted"
            >
              {c}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}
