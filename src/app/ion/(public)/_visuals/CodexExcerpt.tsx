// Stylized rendering of a real codex section
// (context.tesla_relationship_clarification). Proves Stewart's codex is
// version-controlled, gets refined based on operator input, and
// reflects an explicit Kenny resolution.
//
// Pure JSX-styled YAML — no syntax highlighter dep. The
// kenny_resolved_2026_05_15 line carries a subtle green glow via a
// motion-safe pulse animation; reduced-motion users see the highlight
// without the pulse.

const YAML_BLOCK: { key: string; value: string; tone?: "highlight" }[] = [
  {
    key: "actual_relationship",
    value:
      "Tesla is a LEAD SOURCE for Ion. Tesla forwards solar-interested customers to Ion as a referral partner. On a Tesla-sourced lead, the setter's job is identical to any other inbound: qualify the lead and schedule the closer.",
  },
  {
    key: "what_ion_can_sell",
    value:
      "Ion-branded solar panels · Tesla Powerwall battery (only battery brand Ion carries) · in-house roofing",
  },
  {
    key: "what_ion_cannot_sell",
    value: "Tesla solar panels · Tesla solar roof tiles",
  },
  {
    key: "kenny_resolved_2026_05_15",
    value:
      "Tesla = lead source. Setter treats it like any inbound. Authority to sell into the lead = Ion product line, not Tesla. Confirmed direct 2026-05-15.",
    tone: "highlight",
  },
];

export function CodexExcerpt() {
  return (
    <figure className="space-y-3">
      <figcaption className="text-xs uppercase tracking-wider text-stewart-muted">
        This codex section didn&apos;t exist four days ago.
      </figcaption>

      <div className="rounded-lg border border-stewart-border bg-slate-950/80 overflow-hidden font-mono text-[12px] sm:text-[13px] leading-relaxed">
        <div className="border-b border-stewart-border px-4 py-2 flex items-center justify-between text-stewart-muted">
          <code className="text-stewart-accent">
            context.tesla_relationship_clarification
          </code>
          <span className="text-[10px] uppercase tracking-wider text-stewart-success">
            CONFIRMED 2026-05-15 by Kenny direct
          </span>
        </div>
        <pre className="px-4 py-4 text-stewart-text/85 overflow-x-auto">
          {YAML_BLOCK.map((entry, i) => (
            <CodexLine key={i} entry={entry} />
          ))}
        </pre>
      </div>

      <figcaption className="text-xs text-stewart-muted leading-relaxed max-w-md">
        Spencer + Kenny resolved a script-vs-reality gap on a 1-hour
        call. Stewart&apos;s reads on every Tesla intro across the
        corpus changed in real time. That&apos;s what
        &ldquo;custom-built&rdquo; means.
      </figcaption>
    </figure>
  );
}

function CodexLine({
  entry,
}: {
  entry: { key: string; value: string; tone?: "highlight" };
}) {
  const highlight = entry.tone === "highlight";
  return (
    <div
      className={
        "block py-1.5 -mx-4 px-4 " +
        (highlight
          ? "bg-stewart-success/10 border-l-2 border-stewart-success shadow-[inset_0_0_24px_rgba(34,197,94,0.08)]"
          : "")
      }
    >
      <span
        className={
          highlight
            ? "text-stewart-success font-semibold"
            : "text-stewart-accent"
        }
      >
        {entry.key}:
      </span>{" "}
      <span className="text-stewart-muted">|</span>
      <div
        className={
          "pl-4 whitespace-normal " +
          (highlight ? "text-stewart-text" : "text-stewart-text/70")
        }
      >
        {entry.value}
      </div>
    </div>
  );
}
