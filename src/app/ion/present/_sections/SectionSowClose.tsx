import Link from "next/link";
import { SectionFrame } from "../_components/SectionFrame";

// Build #8 — SOW + Close (~2:30). Condensed SOW in-scroll (full terms
// live at /ion/sow, also in the top-nav). Carries the shareable #close
// anchor so /ion/present#close jumps straight to the close.
//
// PRICING FLAG: the canonical build plan (stewart-ion-pitch.md, Build #8)
// specifies Phase 1 = $2k/week + LLM included. The existing /ion/sow page
// and the pivot memo say $1,500/week. Using $2k/week here per the build
// plan — Spencer to reconcile the two surfaces.

export function SectionSowClose() {
  return (
    <SectionFrame
      id="sow"
      index={8}
      eyebrow="Scope of Work & Close"
      title="What it takes to make Stewart yours."
      question="What's the first step? Do we want this?"
      highlight={["Observe", "Understand", "Classify", "Route", "Remember"]}
    >
      <div className="grid md:grid-cols-3 gap-5">
        <PhaseCard
          phase="Phase 1"
          title="Embedded build"
          price="$2k / week · LLM included"
          bullets={[
            "12–16 weeks, Spencer in the building",
            "Schema authorship — your floor's textbook, written with Kenny",
            "Stewart processing your calls in real time",
            "Daily manager briefs as the reads stabilize",
          ]}
          emphasis
        />
        <PhaseCard
          phase="Phase 2"
          title="Per-team-manager subscription"
          price="Once it's trusted"
          bullets={[
            "Stewart access per manager, their reps grouped underneath",
            "Daily briefs + searchable manager wiki",
            "Ongoing schema refinement",
          ]}
        />
        <PhaseCard
          phase="Phase 3"
          title="Per-rep add-on"
          price="When reps self-coach"
          bullets={[
            "Reps open Stewart after their own calls",
            "Per-rep daily training calibrated to their gaps",
            "Stacks on Phase 2",
          ]}
        />
      </div>

      <div className="mt-8">
        <Link
          href="/ion/sow"
          className="text-sm text-stewart-accent hover:underline"
        >
          Full scope of work, pricing &amp; terms &rarr;
        </Link>
      </div>

      {/* Embed-as-product principle */}
      <blockquote className="mt-10 max-w-3xl border-l-2 border-stewart-accent pl-5 text-lg sm:text-xl text-stewart-text leading-snug italic">
        &ldquo;I refuse to do this without being in the building. The schema
        is what makes Stewart yours. If you bought it without me in the
        building, you bought a wrapper &mdash; and I won&apos;t put my name
        on that.&rdquo;
      </blockquote>

      {/* The close — shareable anchor */}
      <div
        id="close"
        className="scroll-mt-20 mt-20 pt-12 border-t border-white/10"
      >
        <p className="text-xs uppercase tracking-[0.2em] font-semibold text-stewart-accent mb-6">
          The close
        </p>
        <div className="max-w-3xl space-y-8">
          <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-stewart-text leading-tight">
            I don&apos;t think Ion has a lead problem. I think Ion has an
            opportunity-visibility problem. I believe Stewart solves that.
          </p>
          <p className="text-xl sm:text-2xl text-stewart-muted leading-snug">
            I built this cup of water. If you want it, let&apos;s partner and
            build something great together &mdash; for both of us.
          </p>
        </div>
      </div>
    </SectionFrame>
  );
}

function PhaseCard({
  phase,
  title,
  price,
  bullets,
  emphasis,
}: {
  phase: string;
  title: string;
  price: string;
  bullets: string[];
  emphasis?: boolean;
}) {
  return (
    <div
      className={
        "rounded-xl border p-5 " +
        (emphasis
          ? "border-stewart-accent/50 bg-stewart-accent/5"
          : "border-stewart-border bg-stewart-bg/40")
      }
    >
      <p className="text-xs uppercase tracking-wider font-semibold text-stewart-accent">
        {phase}
      </p>
      <h4 className="mt-1 text-lg font-bold text-stewart-text">{title}</h4>
      <p className="mt-1 font-mono text-sm text-stewart-muted">{price}</p>
      <ul className="mt-4 space-y-2">
        {bullets.map((b) => (
          <li key={b} className="flex gap-2 text-sm text-stewart-text leading-snug">
            <span className="text-stewart-accent shrink-0">&bull;</span>
            <span>{b}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
