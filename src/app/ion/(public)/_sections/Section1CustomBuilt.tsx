import Image from "next/image";
import { ScrollSection } from "./ScrollSection";

const CONTRAST_ROWS = [
  {
    generic: "Same closed-taxonomy classification across all customers",
    stewart:
      "Your codex IS the classification — Ion's intros, your protocols, Kenny's coaching philosophy, the Tesla relationship truth",
  },
  {
    generic:
      "Findings like “reps say ‘um’ too much” — anyone with ears could spot those",
    stewart:
      "Findings like “the bill-as-villain inversion was executed zero times across 332 of your calls” — Stewart finds what nobody has time to count",
  },
  {
    generic:
      "~12-week utilization curve drops below 30%. Managers stop trusting the briefings.",
    stewart:
      "Stewart's reads improve every week as the codex matures + Kenny validates exemplars",
  },
];

export function Section1CustomBuilt() {
  return (
    <ScrollSection id="custom-built">
      <p className="text-xs uppercase tracking-wider font-semibold text-stewart-accent mb-3">
        The pitch
      </p>
      <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-stewart-text leading-tight max-w-4xl">
        Stewart isn&apos;t a generic AI sales tool. It&apos;s a custom system
        built FOR your floor &mdash; using your calls, your scripts, your
        coaching philosophy.
      </h1>

      <div className="mt-8 grid lg:grid-cols-2 gap-10 items-start">
        <div className="space-y-6 text-stewart-muted text-lg leading-relaxed">
          <p>
            Generic call-analysis platforms ship with one definition of
            &ldquo;good&rdquo; that&apos;s supposed to fit every floor in
            every industry. Ion isn&apos;t a generic floor. Your reps
            don&apos;t sound like Gong&apos;s training data. Your customers
            don&apos;t object like the benchmark dataset. Stewart is built
            to fit the floor it&apos;s deployed on &mdash; not the other
            way around.
          </p>
        </div>

        <ProofPanel />
      </div>

      <div className="mt-12 rounded-lg border border-stewart-border overflow-hidden">
        <div className="hidden md:grid md:grid-cols-2 bg-stewart-card/60 border-b border-stewart-border">
          <div className="px-5 py-3 text-xs uppercase tracking-wider font-semibold text-stewart-muted border-r border-stewart-border">
            Generic AI sales tools
          </div>
          <div className="px-5 py-3 text-xs uppercase tracking-wider font-semibold text-stewart-accent">
            Stewart for Ion
          </div>
        </div>
        <div className="divide-y divide-stewart-border">
          {CONTRAST_ROWS.map((row, i) => (
            <div
              key={i}
              className="grid grid-cols-1 md:grid-cols-2 bg-stewart-card"
            >
              <div className="px-5 py-4 text-sm text-stewart-muted md:border-r md:border-stewart-border">
                <p className="text-xs uppercase tracking-wider text-stewart-muted/70 md:hidden mb-1">
                  Generic
                </p>
                {row.generic}
              </div>
              <div className="px-5 py-4 text-sm text-stewart-text">
                <p className="text-xs uppercase tracking-wider text-stewart-accent md:hidden mb-1">
                  Stewart for Ion
                </p>
                {row.stewart}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Stat number="1,153" label="lines of Ion-specific codex" />
        <Stat
          number="101"
          label="codex sections actively lit across your corpus"
        />
        <Stat number="332" label="of your calls processed" />
      </div>

      <p className="mt-12 text-xl sm:text-2xl text-stewart-text font-medium leading-snug max-w-3xl">
        Stewart is built <em className="not-italic text-stewart-accent">with</em>{" "}
        you. Not bought from a shelf.
      </p>
    </ScrollSection>
  );
}

function ProofPanel() {
  return (
    <div className="space-y-3">
      <p className="text-xs uppercase tracking-wider text-stewart-muted">
        This codex section didn&apos;t exist four days ago.
      </p>

      <div className="rounded-lg border border-stewart-border bg-stewart-card overflow-hidden">
        {/*
          Visual asset (public/ion/codex-excerpt-tesla.png) is being
          delivered separately by the visual-specs brief. When the file
          lands the placeholder block below collapses into the Image.
        */}
        <CodexExcerptVisual />
      </div>

      <p className="text-xs text-stewart-muted leading-relaxed">
        Spencer + Kenny resolved a script-vs-reality gap on a 1-hour call.
        Stewart&apos;s reads on every Tesla intro across the corpus
        changed in real time. That&apos;s what &ldquo;custom-built&rdquo;
        means.
      </p>
    </div>
  );
}

function CodexExcerptVisual() {
  return (
    <div className="relative aspect-[4/3] bg-stewart-bg">
      {/*
        Real artwork ships at public/ion/codex-excerpt-tesla.png per the
        visual-specs brief. Until then we render a styled inline preview
        of the actual codex section so the section never looks empty in
        a demo.
      */}
      <Image
        src="/ion/codex-excerpt-tesla.png"
        alt="Stylized codex excerpt: context.tesla_relationship_clarification, CONFIRMED 2026-05-15 by Kenny direct."
        fill
        className="object-cover"
        // Image won't 500 if the file is missing — it just renders nothing.
        // The fallback below shows the inline preview underneath until then.
      />
      <div className="absolute inset-0 p-6 flex flex-col gap-4 font-mono text-xs text-stewart-text bg-stewart-bg/95">
        <div className="flex items-baseline justify-between text-stewart-muted">
          <span className="text-stewart-accent">
            context.tesla_relationship_clarification
          </span>
          <span className="text-[10px] uppercase tracking-wider text-stewart-success">
            CONFIRMED 2026-05-15 by Kenny direct
          </span>
        </div>
        <pre className="whitespace-pre-wrap text-stewart-text/80 leading-relaxed text-[11px]">
{`when:
  - intro_includes_phrase: "Tesla partner"
  - intro_includes_phrase: "through Tesla"

resolution: |
  Ion is NOT a Tesla referral partner. The phrasing is a
  legacy script artifact. Reps using it are creating an
  expectation Stewart cannot fulfill on the back end.

  Correct framing: "We're an Ion Solar consultant — Tesla
  doesn't refer to us, we serve the same homeowners."

confirmed_by: kenny
confirmed_at: 2026-05-15
source: 1:1 call with spencer`}
        </pre>
        <p className="text-[10px] text-stewart-warning mt-auto">
          Placeholder rendering &mdash; final stylized PNG ships from
          visual-specs brief.
        </p>
      </div>
    </div>
  );
}

function Stat({ number, label }: { number: string; label: string }) {
  return (
    <div className="rounded-lg border border-stewart-border bg-stewart-card p-4">
      <div className="text-2xl font-bold text-stewart-accent">{number}</div>
      <div className="text-xs text-stewart-muted mt-1">{label}</div>
    </div>
  );
}
