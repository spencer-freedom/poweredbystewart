import { ScrollSection } from "./ScrollSection";

// § 2 content (the worked SESSION10 example: 90-sec manager brief,
// cherry-pick moment cards, handoff brief for closer) is delivered by
// the session10-cards brief — JSON files in public/ion/ that this
// component will consume. Until then we keep the locked-in 3-card grid
// so layout doesn't shift when the data lands.

const CARD_LABELS = [
  "90-second manager brief",
  "Cherry-pick moments",
  "Handoff brief for the closer",
] as const;

export function Section2CallWalkthrough() {
  return (
    <ScrollSection id="how-a-call-processes">
      <p className="text-xs uppercase tracking-wider font-semibold text-stewart-accent mb-3">
        What it does
      </p>
      <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-stewart-text leading-tight max-w-4xl">
        How a call actually gets processed
      </h2>

      <p className="mt-6 text-lg text-stewart-muted leading-relaxed max-w-3xl">
        A worked example from one real Ion call: Jake on the phone with
        Larry, mid-cycle, mixed signals. Stewart turns it into three
        artifacts in three different shapes &mdash; one for the manager
        prepping a 1-on-1, one for cherry-picking the moments worth
        teaching, one for the closer about to take the next call.
      </p>

      <div className="mt-10 rounded-lg border border-dashed border-stewart-warning/50 bg-stewart-warning/5 p-4">
        <p className="text-xs uppercase tracking-wider font-semibold text-stewart-warning mb-1">
          TODO &middot; SESSION10 demo cards
        </p>
        <p className="text-sm text-stewart-muted leading-relaxed">
          Card internals (manager brief, cherry-picks, handoff) land via
          the session10-cards brief from Strategy Claude. JSON files drop
          into <code>public/ion/</code>; this section reads them.
        </p>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {CARD_LABELS.map((label) => (
          <div
            key={label}
            className="rounded-lg border border-stewart-border bg-stewart-card p-5 min-h-[200px] flex items-center justify-center"
          >
            <p className="text-sm text-stewart-muted text-center">
              {label}
              <br />
              <span className="text-xs text-stewart-warning">
                content TODO
              </span>
            </p>
          </div>
        ))}
      </div>
    </ScrollSection>
  );
}
