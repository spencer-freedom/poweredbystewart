import Link from "next/link";
import { ScrollSection } from "./_components/scroll-section";

export const dynamic = "force-dynamic";

export default function IonScrollPage() {
  return (
    <div className="space-y-0">
      {/* § 1 — Hero / Custom-built */}
      <ScrollSection
        id="custom-built"
        eyebrow="The pitch"
        title="Custom-built FOR Ion — not a plug-and-play AI utility"
        todoNote="Hero. Contrast hook against generic AI utilization. Spencer-embedded contrast. Codex excerpt as proof. Strategy Claude drafts this from content/ion/section-1-custom-built.mdx."
      />

      {/* § 2 — How a call processes */}
      <ScrollSection
        id="how-a-call-processes"
        eyebrow="What it does"
        title="How a call actually gets processed"
        todoNote="Worked example: SESSION10 (Jake/Larry). Three production outputs displayed as cards — 90-sec manager brief, cherry-pick moment cards with timestamps + quotes, handoff brief for the closer. Outputs land in public/ion/session10-*.json from the Stage 3/4 pipeline."
      >
        {/* Card grid placeholder — exact card structure will be wired once
            the SESSION10 outputs land. Shape is fixed at 3 columns on
            desktop so Strategy Claude can drop content without restyle. */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            "90-sec manager brief",
            "Cherry-pick moments",
            "Handoff brief for closer",
          ].map((label) => (
            <div
              key={label}
              className="rounded-lg border border-stewart-border bg-stewart-card p-5 min-h-[180px] flex items-center justify-center"
            >
              <p className="text-sm text-stewart-muted text-center">
                {label}
                <br />
                <span className="text-xs text-stewart-warning">
                  card content TODO
                </span>
              </p>
            </div>
          ))}
        </div>
      </ScrollSection>

      {/* § 3 — Maturation */}
      <ScrollSection
        id="maturation"
        eyebrow="The trajectory"
        title="How Stewart matures with Ion"
        todoNote="6-phase timeline graphic. Embedded → manager-trust → per-rep coaching → rep-facing → new-hire onboarding → ongoing. Graphic spec coming separately from Strategy Claude."
      />

      {/* § 4 — Stewart's brain */}
      <ScrollSection
        id="brain"
        eyebrow="Under the hood"
        title="Stewart's brain"
        todoNote='Embedded preview / link to /ion/brain. Remotion video placeholder (video coming later). Stat footer: "Stewart has already processed 240 calls — production rerun post-contract."'
      >
        <div className="space-y-6">
          {/* Static video placeholder — Remotion render lands later. */}
          <div className="rounded-lg border border-stewart-border bg-stewart-card overflow-hidden">
            <video
              controls
              preload="none"
              poster="/ion/brain-poster.png"
              className="w-full aspect-video bg-black"
            >
              {/* Source added when Remotion render is delivered. */}
              <track kind="captions" />
            </video>
            <div className="px-4 py-3 border-t border-stewart-border flex items-center justify-between text-xs text-stewart-muted">
              <span>Brain walkthrough video — render in progress</span>
              <Link
                href="/ion/brain"
                className="text-stewart-accent hover:underline"
              >
                Open the live brain →
              </Link>
            </div>
          </div>
          <p className="text-xs text-stewart-muted">
            <span className="text-stewart-warning">TODO:</span> stat footer
            copy from Strategy Claude.
          </p>
        </div>
      </ScrollSection>

      {/* § 5 — Thesis */}
      <ScrollSection
        id="thesis"
        eyebrow="The thesis"
        title="Doesn't help you get more leads — helps you get more out of the leads you already have"
        todoNote="Numbers panel — placeholder for Ion's own conversion math. Strategy Claude wires the ROI hammer once Ion's conversion baseline is provided."
      />

      {/* § 6 — What's next CTA */}
      <ScrollSection
        id="next"
        eyebrow="The ask"
        title="What's next"
        todoNote="CTA card framing copy from Strategy Claude. Button below is the locked-in CTA target."
      >
        <div className="rounded-lg border border-stewart-accent/40 bg-stewart-accent/5 p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="text-stewart-text max-w-xl">
            A defined scope of work — what we build, what Ion provides, and
            how the first 90 days look.
          </p>
          <Link
            href="/ion/whats-next"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-stewart-accent text-white text-sm font-semibold hover:bg-stewart-accent/90 transition-colors whitespace-nowrap"
          >
            Defined Scope of Work →
          </Link>
        </div>
      </ScrollSection>
    </div>
  );
}
